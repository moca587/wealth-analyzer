// ─────────────────────────────────────────────────────────────────
// Pure financial math — no DOM, no side effects. Safe to use from
// both client (React components) and server (Next.js API routes).
// Ported from the wealth-analyzer.html script block.
// ─────────────────────────────────────────────────────────────────

import {
  IRS_UNIFORM_LIFETIME,
  ASSET_CLASS_CMA,
  assetCorrelation,
  TAX_BRACKETS,
  RRIF_RATES,
  US_STATE_TAX_RATES,
} from "./constants";
import type { AssetClass } from "./types";

/**
 * Box-Muller transform — draws a sample from N(0,1).
 * Used by the Monte Carlo engine for random returns. Accepts an optional
 * uniform-[0,1) source so callers can substitute a seeded PRNG for
 * deterministic/reproducible runs (tests, cached-result invalidation).
 */
export function boxMuller(rng: () => number = Math.random): number {
  let u = 0;
  let v = 0;

  while (u === 0) u = rng();
  while (v === 0) v = rng();

  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/**
 * Deterministic PRNG (mulberry32) seeded from a single integer. Not
 * cryptographically secure — only used so a Monte Carlo run can be repeated
 * byte-for-byte in tests instead of depending on Math.random().
 */
export function createSeededRandom(seed: number): () => number {
  let s = seed | 0;
  return function () {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Standard amortization: monthly payment on a loan.
 * @param principal  loan amount
 * @param annualRatePct  annual interest rate as a percentage (e.g. 6.5 = 6.5%)
 * @param years  loan term in years
 */
export function calcMortgagePayment(
  principal: number,
  annualRatePct: number,
  years: number,
): number {
  if (principal <= 0 || years <= 0) return 0;

  const m = annualRatePct / 100 / 12;
  const n = years * 12;
  if (m === 0) return principal / n;
  return (principal * (m * Math.pow(1 + m, n))) / (Math.pow(1 + m, n) - 1);
}

/** Present value of a future cashflow */
export function presentValue(
  futureValue: number,
  ratePct: number,
  periods: number,
): number {
  return futureValue / Math.pow(1 + ratePct / 100, periods);
}

/** Future value compounded annually */
export function futureValue(
  presentValue: number,
  ratePct: number,
  periods: number,
): number {
  return presentValue * Math.pow(1 + ratePct / 100, periods);
}

/** Present value of an annuity (ordinary, end-of-period payments) */
export function annuityPV(
  payment: number,
  ratePct: number,
  periods: number,
): number {
  const r = ratePct / 100;
  if (Math.abs(r) < 1e-10) return payment * periods;
  return (payment * (1 - Math.pow(1 + r, -periods))) / r;
}

/** Geometric mean adjustment: log-normal mean from arithmetic μ, σ (both decimal) */
export function geometricMean(arithMean: number, vol: number): number {
  return arithMean - 0.5 * vol * vol;
}

/**
 * Derive a portfolio's expected return (mean) and volatility (sigma) from its
 * actual allocation, using per-asset-class capital-market assumptions and the
 * correlation matrix. Portfolio σ is the covariance sum
 *   σ_p = sqrt( ΣΣ wᵢ wⱼ σᵢ σⱼ ρᵢⱼ )
 * so lowly-correlated sleeves correctly reduce risk (diversification).
 *
 * Weights are by value, aggregated per class. Assets with no class fall back
 * to "mixed". If the holdings carry no value, returns `fallback` (typically the
 * blended risk-profile assumption) so empty/cash-only-zero plans still run.
 * Both returned figures are decimals.
 */
export function portfolioReturnParams(
  holdings: Array<{ cls?: AssetClass; value: number }>,
  fallback: { mean: number; sigma: number },
): { mean: number; sigma: number } {
  const byClass = new Map<AssetClass, number>();
  let total = 0;

  for (const h of holdings) {
    const v = h.value || 0;
    if (v <= 0) continue;
    const cls: AssetClass = h.cls && ASSET_CLASS_CMA[h.cls] ? h.cls : "mixed";
    byClass.set(cls, (byClass.get(cls) || 0) + v);
    total += v;
  }
  if (total <= 0) return fallback;

  const classes = Array.from(byClass.keys());
  const weight = (c: AssetClass) => (byClass.get(c) || 0) / total;

  let mean = 0;
  for (const c of classes) mean += weight(c) * ASSET_CLASS_CMA[c].mean;

  let variance = 0;
  for (const a of classes) {
    for (const b of classes) {
      variance +=
        weight(a) *
        weight(b) *
        ASSET_CLASS_CMA[a].sigma *
        ASSET_CLASS_CMA[b].sigma *
        assetCorrelation(a, b);
    }
  }
  return { mean, sigma: Math.sqrt(Math.max(0, variance)) };
}

/**
 * Estimate annual income tax on `taxableIncome` using progressive marginal
 * brackets for the given country (falls back to a generic table). Simplified,
 * federal-level only — excludes state/provincial/local layers and credits.
 * Returns the tax amount in the same units as the income.
 */
export function estimateIncomeTax(
  taxableIncome: number,
  country = "US",
): number {
  if (!(taxableIncome > 0)) return 0;
  const brackets = TAX_BRACKETS[country] ?? TAX_BRACKETS.default;
  let tax = 0,
    prev = 0;
  for (const b of brackets) {
    const slice = Math.min(taxableIncome, b.upTo) - prev;
    if (slice > 0) tax += slice * b.rate;
    prev = b.upTo;
    if (taxableIncome <= b.upTo) break;
  }
  return Math.max(0, tax);
}

/**
 * Retirement-account mandatory or modeled withdrawals by country.
 * Uses the legacy Wealth Analyzer rules for US, Canada, Australia,
 * Europe, Switzerland, supported Asian countries, and fallback regions.
 */
export function calcRMD(balance: number, age: number, country: string): number {
  if (balance <= 0) return 0;

  if (country === "US") {
    if (age < 73) return 0;

    const factor = IRS_UNIFORM_LIFETIME[Math.min(age, 120)] ?? 2.0;

    return balance / factor;
  }

  if (country === "CA") {
    if (age < 71) return 0;

    const rate = (RRIF_RATES[Math.min(age, 94)] ?? 20) / 100;

    return balance * rate;
  }

  if (country === "AU") {
    if (age < 60) return 0;
    return (balance * auSuperRate(age)) / 100;
  }

  if (country === "GB" || country === "EU" || country === "CH") {
    return age >= 57 ? balance * 0.04 : 0;
  }

  if (
    country === "JP" ||
    country === "SG" ||
    country === "HK" ||
    country === "KR" ||
    country === "TW"
  ) {
    return age >= 60 ? balance * 0.04 : 0;
  }

  return age >= 72 ? balance * 0.04 : 0;
}

/**
 * Compute the retirement "number" — the lump sum needed at retirement
 * to fund the remaining lifetime of spending.
 */
export interface RetirementNumberResult {
  pvAtRet: number;
  pvToday: number;
  yearsToRet: number;
  yearsInRet: number;
  annualSpend: number;
  discountRate: number;
  inf: number;
  planAge: number;
}

export function calcRetirementNumber(
  currentAge: number,
  retirementAge: number,
  annualSpend: number,
  inflation: number,
  lifeExpectancy: number,
  discountRate = 0.068,
): RetirementNumberResult {
  const yearsToRet = Math.max(0, retirementAge - currentAge);

  const effectiveLifeExpectancy =
    Number.isFinite(lifeExpectancy) && lifeExpectancy > 0 ? lifeExpectancy : 80;

  const planAge = Math.max(98, Math.round(effectiveLifeExpectancy) + 15);

  const yearsInRet = Math.max(0, planAge - retirementAge);

  const realRate = (discountRate - inflation) / (1 + inflation);

  const nominalSpend = annualSpend * Math.pow(1 + inflation, yearsToRet);

  let pvAtRet: number;

  if (Math.abs(realRate) < 0.0001 || yearsInRet <= 0) {
    pvAtRet = nominalSpend * yearsInRet;
  } else {
    pvAtRet =
      (nominalSpend * (1 - Math.pow(1 + realRate, -yearsInRet))) / realRate;
  }

  const pvToday = pvAtRet / Math.pow(1 + discountRate, yearsToRet);

  return {
    pvAtRet,
    pvToday,
    yearsToRet,
    yearsInRet,
    annualSpend,
    discountRate,
    inf: inflation,
    planAge,
  };
}

/**
 * Calculate a person's age in years given their date of birth (ISO string)
 * and an as-of date (defaults to today).
 */
export function ageFromDOB(
  dobIso: string,
  asOf: Date = new Date(),
): number | null {
  if (!dobIso) return null;

  const dob = new Date(dobIso);

  if (Number.isNaN(dob.getTime())) {
    return null;
  }

  let age = asOf.getFullYear() - dob.getFullYear();
  const m = asOf.getMonth() - dob.getMonth();

  if (m < 0 || (m === 0 && asOf.getDate() < dob.getDate())) {
    age--;
  }

  return age;
}

export function computeStateTax(
  income: number,
  country: string,
  stateCode?: string,
): number {
  if (income <= 0 || country !== "US" || !stateCode) return 0;
  const rate = US_STATE_TAX_RATES[stateCode] ?? 0;
  return income * (rate / 100);
}

/** Format a number as a currency string with the given ISO currency code */
export function formatMoney(
  amount: number,
  currency = "USD",
  locale = "en-US",
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: amount >= 1000 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

// ─────────────────────────────────────────────
// Compact money formatting
//
// Examples:
//
// 10000  → $10k
// 267000 → $267k
// 1780000 → $1.78M
// ─────────────────────────────────────────────

export function formatCompactMoney(value: number, currency: string): string {
  const symbol =
    currency === "USD"
      ? "$"
      : currency === "EUR"
        ? "€"
        : currency === "GBP"
          ? "£"
          : currency === "CHF"
            ? "CHF "
            : `${currency} `;

  const abs = Math.abs(value);

  if (abs >= 1_000_000) {
    return `${symbol}${(abs / 1_000_000).toFixed(2)}M`;
  }

  if (abs >= 1_000) {
    return `${symbol}${(abs / 1_000).toFixed(0)}k`;
  }

  return `${symbol}${abs.toFixed(0)}`;
}

// Functions used by the legacy wealth analyzer
export function auSuperRate(age: number): number {
  if (age < 60) return 0;
  if (age < 65) return 4;
  if (age < 75) return 5;
  if (age < 80) return 6;
  if (age < 85) return 7;
  if (age < 90) return 9;
  if (age < 95) return 11;
  return 14;
}

export function getRMDStartAge(country: string): number {
  if (country === "US") return 73;
  if (country === "CA") return 71;
  if (country === "AU") return 60;

  if (country === "GB" || country === "EU" || country === "CH") {
    return 57;
  }

  if (
    country === "JP" ||
    country === "SG" ||
    country === "HK" ||
    country === "KR" ||
    country === "TW"
  ) {
    return 60;
  }

  return 72;
}

export interface PortfolioClassWeight {
  cls: string;
  weight: number;
}

export interface CapitalMarketAssumption {
  arith: number;
  sigma: number;
}

export const CMA: Record<string, CapitalMarketAssumption> = {
  equity: {
    arith: 8.58,
    sigma: 15.93,
  },

  fixed_income: {
    arith: 4.01,
    sigma: 6.28,
  },

  cash: {
    arith: 2.54,
    sigma: 2.47,
  },

  real_estate: {
    arith: 4.57,
    sigma: 10.3,
  },

  commodity: {
    arith: 4.57,
    sigma: 10.3,
  },

  alternative: {
    arith: 7,
    sigma: 10,
  },

  hedge_fund: {
    arith: 6.5,
    sigma: 7,
  },

  private_equity: {
    arith: 11.03,
    sigma: 23.05,
  },

  structured: {
    arith: 5.5,
    sigma: 8,
  },

  mixed: {
    arith: 6,
    sigma: 9,
  },

  crypto: {
    arith: 20,
    sigma: 65,
  },

  other: {
    arith: 6,
    sigma: 12,
  },
};

export const CMA_CORR: Record<string, Record<string, number>> = {
  equity: {
    equity: 1.0,
    fixed_income: 0.019,
    cash: 0.286,
    real_estate: 0.128,
    commodity: 0.128,
    alternative: 0.636,
    private_equity: 0.696,
    crypto: 0.5,
  },

  fixed_income: {
    equity: 0.019,
    fixed_income: 1.0,
    cash: 0.281,
    real_estate: -0.153,
    commodity: -0.153,
    alternative: 0.038,
    private_equity: 0.001,
    crypto: 0.1,
  },

  cash: {
    equity: 0.286,
    fixed_income: 0.281,
    cash: 1.0,
    real_estate: 0.25,
    commodity: 0.25,
    alternative: 0.281,
    private_equity: 0.06,
    crypto: 0.05,
  },

  real_estate: {
    equity: 0.128,
    fixed_income: -0.153,
    cash: 0.25,
    real_estate: 1.0,
    commodity: 0.6,
    alternative: 0.144,
    private_equity: 0.079,
    crypto: 0.2,
  },

  commodity: {
    equity: 0.128,
    fixed_income: -0.153,
    cash: 0.25,
    real_estate: 0.6,
    commodity: 1.0,
    alternative: 0.144,
    private_equity: 0.079,
    crypto: 0.3,
  },

  alternative: {
    equity: 0.636,
    fixed_income: 0.038,
    cash: 0.281,
    real_estate: 0.144,
    commodity: 0.144,
    alternative: 1.0,
    private_equity: 0.613,
    crypto: 0.4,
  },

  private_equity: {
    equity: 0.696,
    fixed_income: 0.001,
    cash: 0.06,
    real_estate: 0.079,
    commodity: 0.079,
    alternative: 0.613,
    private_equity: 1.0,
    crypto: 0.45,
  },

  crypto: {
    equity: 0.5,
    fixed_income: 0.1,
    cash: 0.05,
    real_estate: 0.2,
    commodity: 0.3,
    alternative: 0.4,
    private_equity: 0.45,
    crypto: 1.0,
  },

  structured: {
    equity: 0.45,
    fixed_income: 0.5,
    cash: 0.3,
    real_estate: 0.25,
    commodity: 0.2,
    alternative: 0.4,
    private_equity: 0.35,
    crypto: 0.15,
    structured: 1.0,
  },

  hedge_fund: {
    equity: 0.55,
    fixed_income: 0.15,
    cash: 0.1,
    real_estate: 0.25,
    commodity: 0.3,
    alternative: 0.55,
    private_equity: 0.5,
    structured: 0.35,
    crypto: 0.3,
    hedge_fund: 1.0,
  },
};

export function cmaCorrelation(classA: string, classB: string): number {
  if (classA === classB) {
    return 1;
  }

  const direct = CMA_CORR[classA]?.[classB];

  if (direct != null) {
    return direct;
  }

  const reverse = CMA_CORR[classB]?.[classA];

  if (reverse != null) {
    return reverse;
  }

  return 0.3;
}

export function gbPortfolioRisk(holdings: PortfolioClassWeight[]): number {
  let variance = 0;

  for (const holdingA of holdings) {
    const cmaA = CMA[holdingA.cls] ?? CMA.mixed;

    const sigmaA = (cmaA.sigma ?? 12) / 100;

    for (const holdingB of holdings) {
      const cmaB = CMA[holdingB.cls] ?? CMA.mixed;

      const sigmaB = (cmaB.sigma ?? 12) / 100;

      variance +=
        holdingA.weight *
        holdingB.weight *
        sigmaA *
        sigmaB *
        cmaCorrelation(holdingA.cls, holdingB.cls);
    }
  }

  return Math.sqrt(Math.max(0, variance));
}

export interface EffectiveReturnParams {
  mu: number;
  sig: number;
}

export function getEffectiveReturnParamsGross(
  investments: Array<{
    cls?: string;
    val: number;
  }>,
): EffectiveReturnParams | null {
  // only non-cash holdings determine invested return parameters.
  const nonCashHoldings = investments.filter(
    (investment) => investment.cls !== "cash" && Number(investment.val) > 0,
  );

  const totalValue = nonCashHoldings.reduce(
    (sum, investment) => sum + Number(investment.val),
    0,
  );

  if (totalValue <= 0) {
    return null;
  }

  const weights: PortfolioClassWeight[] = nonCashHoldings.map((investment) => {
    const assetClass =
      investment.cls && CMA[investment.cls] ? investment.cls : "mixed";

    return {
      cls: assetClass,
      weight: Number(investment.val) / totalValue,
    };
  });

  const mu = weights.reduce((sum, holding) => {
    const assumption = CMA[holding.cls] ?? CMA.mixed;

    return sum + holding.weight * ((assumption.arith ?? 7) / 100);
  }, 0);

  return {
    mu,
    sig: gbPortfolioRisk(weights),
  };
}

export function calculatePercentile(
  sortedValues: readonly number[],
  percentile: number,
): number {
  if (sortedValues.length === 0) {
    return 0;
  }

  const index = (percentile / 100) * (sortedValues.length - 1);

  const lowerIndex = Math.floor(index);
  const upperIndex = Math.ceil(index);

  if (lowerIndex === upperIndex) {
    return sortedValues[lowerIndex];
  }

  const weight = index - lowerIndex;

  return (
    sortedValues[lowerIndex] +
    (sortedValues[upperIndex] - sortedValues[lowerIndex]) * weight
  );
}

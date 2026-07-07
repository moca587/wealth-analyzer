// ─────────────────────────────────────────────────────────────────
// Pure financial math — no DOM, no side effects. Safe to use from
// both client (React components) and server (Next.js API routes).
// Ported from the wealth-analyzer.html script block.
// ─────────────────────────────────────────────────────────────────

import { IRS_UNIFORM_LIFETIME } from "./constants";

/**
 * Box-Muller transform — draws a sample from N(0,1).
 * Used by the Monte Carlo engine for random returns. Accepts an optional
 * uniform-[0,1) source so callers can substitute a seeded PRNG for
 * deterministic/reproducible runs (tests, cached-result invalidation).
 */
export function boxMuller(rng: () => number = Math.random): number {
  const u = Math.max(1e-12, rng());
  const v = rng();
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
export function calcMortgagePayment(principal: number, annualRatePct: number, years: number): number {
  const m = annualRatePct / 100 / 12;
  const n = years * 12;
  if (m === 0) return principal / n;
  return principal * (m * Math.pow(1 + m, n)) / (Math.pow(1 + m, n) - 1);
}

/** Present value of a future cashflow */
export function presentValue(futureValue: number, ratePct: number, periods: number): number {
  return futureValue / Math.pow(1 + ratePct / 100, periods);
}

/** Future value compounded annually */
export function futureValue(presentValue: number, ratePct: number, periods: number): number {
  return presentValue * Math.pow(1 + ratePct / 100, periods);
}

/** Present value of an annuity (ordinary, end-of-period payments) */
export function annuityPV(payment: number, ratePct: number, periods: number): number {
  const r = ratePct / 100;
  if (Math.abs(r) < 1e-10) return payment * periods;
  return payment * (1 - Math.pow(1 + r, -periods)) / r;
}

/** Geometric mean adjustment: log-normal mean from arithmetic μ, σ (both decimal) */
export function geometricMean(arithMean: number, vol: number): number {
  return arithMean - 0.5 * vol * vol;
}

/**
 * Required Minimum Distribution (US IRS, 401k/IRA after age 73).
 * Returns 0 if balance ≤ 0 or age < 73.
 */
export function calcRMD(balance: number, age: number): number {
  if (balance <= 0 || age < 73) return 0;
  const factor =
    IRS_UNIFORM_LIFETIME[age] ||
    IRS_UNIFORM_LIFETIME[Math.max(73, Math.min(100, Math.round(age / 5) * 5))] ||
    7.3;
  return balance / factor;
}

/**
 * Compute the retirement "number" — the lump sum needed at retirement
 * to fund the remaining lifetime of spending.
 */
export function calcRetirementNumber(
  currentAge: number,
  retirementAge: number,
  annualSpend: number,
  inflation: number,    // decimal
  discountRate: number  // decimal, default 0.068
): { pvAtRet: number; pvToday: number; yToRet: number; yIn: number } {
  const yToRet = Math.max(0, retirementAge - currentAge);
  const yIn = Math.max(0, 98 - retirementAge);
  const realRate = (discountRate - inflation) / (1 + inflation);
  const nomSpend = annualSpend * Math.pow(1 + inflation, yToRet);
  let pvAtRet: number;
  if (Math.abs(realRate) < 1e-10 || yIn <= 0) {
    pvAtRet = nomSpend * yIn;
  } else {
    pvAtRet = (nomSpend * (1 - Math.pow(1 + realRate, -yIn))) / realRate;
  }
  return { pvAtRet, pvToday: pvAtRet / Math.pow(1 + discountRate, yToRet), yToRet, yIn };
}

/**
 * Calculate a person's age in years given their date of birth (ISO string)
 * and an as-of date (defaults to today).
 */
export function ageFromDOB(dobIso: string, asOf: Date = new Date()): number {
  const dob = new Date(dobIso);
  let age = asOf.getFullYear() - dob.getFullYear();
  const m = asOf.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && asOf.getDate() < dob.getDate())) age--;
  return Math.max(0, age);
}

/** Format a number as a currency string with the given ISO currency code */
export function formatMoney(amount: number, currency = "USD", locale = "en-US"): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      maximumFractionDigits: amount >= 1000 ? 0 : 2
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

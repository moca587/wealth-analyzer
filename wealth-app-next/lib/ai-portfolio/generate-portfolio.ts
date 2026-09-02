import { FUND_UNIVERSE } from "@/lib/data/fund-universe";

import {
  enrichFundUniverse,
  type EnrichedFund,
} from "@/lib/ai-portfolio/enrich-fund-universe";

import { calculatePortfolioResult } from "@/lib/ai-portfolio/calculate-portfolio-result";

import {
  fundBucketKeys,
  getTopThemes,
  stanceScore,
  type ResearchSignals,
} from "@/lib/ai-portfolio/research";

import type {
  AiPortfolioResult,
  AiPortfolioPreferences,
} from "@/lib/ai-portfolio/types";

type Input = AiPortfolioPreferences & {
  country?: string;
  researchSignals?: ResearchSignals;
}; // generator receives this

type AssetClass =
  | "equity"
  | "fixed_income"
  | "real_estate"
  | "commodity"
  | "cash"
  | "alternative";

type Allocation = Record<AssetClass, number>;

type CandidateFund = EnrichedFund & {
  dom?: string;
  ucits?: boolean;
  esg?: boolean;
  family?: string;
  ccy?: string;
  hedged?: boolean;
};

type SelectedFund = {
  ticker: string;
  weightPct: number;
  reasoning?: string;
};

// ─────────────────────────────────────────────────────────────
// Legacy baseline allocation by risk profile
// ─────────────────────────────────────────────────────────────

const RISK_TO_ALLOC: Record<string, Allocation> = {
  very_conservative: {
    equity: 20,
    fixed_income: 60,
    real_estate: 5,
    commodity: 5,
    cash: 10,
    alternative: 0,
  },

  conservative: {
    equity: 30,
    fixed_income: 55,
    real_estate: 5,
    commodity: 3,
    cash: 5,
    alternative: 2,
  },

  moderately_conservative: {
    equity: 40,
    fixed_income: 45,
    real_estate: 5,
    commodity: 3,
    cash: 3,
    alternative: 4,
  },

  moderate: {
    equity: 55,
    fixed_income: 30,
    real_estate: 7,
    commodity: 3,
    cash: 0,
    alternative: 5,
  },

  moderately_aggressive: {
    equity: 65,
    fixed_income: 20,
    real_estate: 7,
    commodity: 3,
    cash: 0,
    alternative: 5,
  },

  aggressive: {
    equity: 75,
    fixed_income: 10,
    real_estate: 8,
    commodity: 2,
    cash: 0,
    alternative: 5,
  },

  very_aggressive: {
    equity: 85,
    fixed_income: 5,
    real_estate: 5,
    commodity: 0,
    cash: 0,
    alternative: 5,
  },
};

// ─────────────────────────────────────────────────────────────
// Main generator
// ─────────────────────────────────────────────────────────────

export function generateAiPortfolio({
  investmentAmount,
  riskProfile,
  timeHorizon,
  sustainability,
  country = "US",
  researchSignals,
}: Input): AiPortfolioResult {
  if (!Number.isFinite(investmentAmount) || investmentAmount <= 0) {
    throw new Error("Investment amount must be greater than zero.");
  }

  // 1. Convert UI risk names into the names used by
  //    the legacy allocation table.
  // ex. balanced -> moderate
  const normalizedRisk = normalizeRisk(riskProfile);

  // 2. Get the client's starting asset allocation.
  const baseAllocation: Allocation = {
    ...(RISK_TO_ALLOC[normalizedRisk] ?? RISK_TO_ALLOC.moderate),
  };

  const allocation = researchSignals
    ? applyResearchTilts(baseAllocation, researchSignals)
    : baseAllocation;

  // 3. Add mu, sigma, Sharpe, returns, AUM, etc.
  //    to every fund.
  const enrichedUniverse = enrichFundUniverse(FUND_UNIVERSE) as CandidateFund[];

  // 4. Restrict universe based on country.
  let eligibleUniverse = enrichedUniverse.filter((fund) =>
    isFundEligibleForCountry(fund, country),
  );

  let esgUnmet = false;

  // 5. Sustainable-only means only ESG funds,
  //    but legacy only applies the hard filter if
  //    enough funds remain for diversification.
  if (isStrictEsg(sustainability)) {
    const esgFunds = eligibleUniverse.filter((fund) => Boolean(fund.esg));

    if (esgFunds.length >= 6) {
      eligibleUniverse = esgFunds;
    } else {
      esgUnmet = true;
    }
  }

  // 6. If an asset class has no eligible funds,
  //    move its allocation elsewhere.
  const unavailableSleeves = redistributeUnavailableSleeves(
    allocation,
    eligibleUniverse,
  );

  // 7. Pick actual funds for each asset-class sleeve.
  const selectedFunds: SelectedFund[] = selectFunds({
    allocation,
    universe: eligibleUniverse,
    risk: normalizedRisk,
    esg: sustainability,
    researchSignals,
  });

  const risks: string[] = [];

  if (esgUnmet) {
    risks.push(
      "Sustainable-only preference could not be fully applied because too few eligible ESG funds were available.",
    );
  }

  for (const sleeve of unavailableSleeves) {
    risks.push(
      `${prettyClass(
        sleeve.cls,
      )} had no eligible fund, so its ${sleeve.weight.toFixed(
        1,
      )}% allocation was redistributed.`,
    );
  }

  if (allocation.equity > 75) {
    risks.push(
      `High equity concentration (${allocation.equity.toFixed(
        0,
      )}%) may lead to larger market drawdowns.`,
    );
  }

  if (!researchSignals || researchSignals.totalItems === 0) {
    risks.push(
      "No institutional research was available, so the recommendation uses the baseline deterministic allocation.",
    );
  }

  // 8. The generator chooses the investments.
  //    calculatePortfolioResult does the shared math.
  return calculatePortfolioResult({
    amount: investmentAmount,

    selectedFunds,

    universe: enrichedUniverse,

    summary: `Portfolio generated for a ${prettyRisk(
      normalizedRisk,
    )} risk profile with a ${prettyHorizon(timeHorizon)} horizon.`,

    risks,

    eligibleFundCount: eligibleUniverse.length,

    totalFundCount: enrichedUniverse.length,

    researchItemCount: researchSignals?.totalItems ?? 0,

    institutionalSourceCount: researchSignals?.providerCount ?? 0,

    themes: researchSignals ? getTopThemes(researchSignals) : [],

    feePct: 1,
  });
}

// ─────────────────────────────────────────────────────────────
// Select funds for every asset-class sleeve
// ─────────────────────────────────────────────────────────────

function selectFunds({
  allocation,
  universe,
  risk,
  esg,
  researchSignals,
}: {
  allocation: Allocation;
  universe: CandidateFund[];
  risk: string;
  esg: string;
  researchSignals?: ResearchSignals;
}): SelectedFund[] {
  const selected: SelectedFund[] = []; // chosen funds will go here

  const usedSponsors = new Set<string>();

  // loop through each sleeve
  for (const [assetClass, sleeveWeight] of Object.entries(allocation) as [
    AssetClass,
    number,
  ][]) {
    // Legacy skips tiny sleeves.
    if (sleeveWeight < 2) {
      continue;
    }

    const candidates = universe
      .filter((fund) => fund.cls === assetClass)
      .map((fund) => ({
        fund,

        score: scoreFund({
          fund,
          risk,
          esg,
          usedSponsors,
          researchSignals,
        }),
      }))
      .sort((a, b) => b.score - a.score);

    if (candidates.length === 0) {
      continue;
    }

    // Legacy behavior:
    //
    // 25%+ sleeve → 3 funds
    // 12%+ sleeve → 2 funds
    // otherwise   → 1 fund
    const desiredCount = sleeveWeight >= 25 ? 3 : sleeveWeight >= 12 ? 2 : 1;

    const picks: CandidateFund[] = [];

    const usedFamilies = new Set<string>();

    // pick the top funds
    for (const candidate of candidates) {
      if (picks.length >= desiredCount) {
        break;
      }

      const fund = candidate.fund;

      // Do not take two share classes
      // of the same underlying strategy.
      if (fund.family) {
        if (usedFamilies.has(fund.family)) {
          continue;
        }

        usedFamilies.add(fund.family);
      }

      picks.push(fund);
    }

    if (picks.length === 0) {
      continue;
    }

    const weightPerFund = sleeveWeight / picks.length;

    // add funds to selected
    for (const fund of picks) {
      selected.push({
        ticker: fund.tkr,

        weightPct: round1(weightPerFund),

        reasoning: buildReasoning(fund),
      });

      usedSponsors.add(fund.sponsor);
    }
  }

  return selected;
}

// ─────────────────────────────────────────────────────────────
// Fund scoring
// ─────────────────────────────────────────────────────────────

function scoreFund({
  fund,
  risk,
  esg,
  usedSponsors,
  researchSignals,
}: {
  fund: CandidateFund;
  risk: string;
  esg: string;
  usedSponsors: Set<string>;
  researchSignals?: ResearchSignals;
}) {
  const er = fund.er ?? 0;

  // Lower expense ratio = better.
  const erScore = 1 - Math.min(er, 1);

  // Higher Sharpe = better.
  const sharpeScore = Math.max(0, Math.min(2, fund.sharpe * 1.5));

  // Legacy uses 5Y performance as one
  // of the long-term quality signals.
  const longReturn = Math.max(-1, Math.min(2, (fund.r5y ?? 0) / 10));

  // Larger AUM gives a modest liquidity /
  // institutional-quality advantage.
  const aumScore = Math.min(1.5, Math.log10(Math.max(0.1, fund.aum)) / 2);

  // More underlying holdings gives a
  // modest diversification benefit.
  const diversificationScore = Math.min(
    1,
    Math.log10(Math.max(1, fund.holdings)) / 4,
  );

  // Penalize especially deep drawdowns.
  const drawdownPenalty = Math.max(0, (Math.abs(fund.maxDD) - 25) / 50);

  let score =
    erScore * 1 +
    sharpeScore * 1.8 +
    longReturn * 1 +
    aumScore * 0.6 +
    diversificationScore * 0.4 -
    drawdownPenalty * 0.8;

  // ESG preference is a bonus when ESG
  // is preferred but not mandatory.
  if (isPreferEsg(esg) && fund.esg) {
    score += 1.2;
  }

  // Slight penalty to avoid selecting
  // every position from one sponsor.
  if (usedSponsors.has(fund.sponsor)) {
    score -= 0.3;
  }

  // Risk-profile fit.
  if (risk === "very_conservative" && fund.sigma > 10) {
    score -= 0.5;
  }

  if (risk === "conservative" && fund.sigma > 14) {
    score -= 0.3;
  }

  if ((risk === "aggressive" || risk === "very_aggressive") && fund.sigma < 8) {
    score -= 0.4;
  }

  // ─────────────────────────────────────────────────────────
  // Institutional research alignment
  // ─────────────────────────────────────────────────────────

  if (researchSignals) {
    // 1. Strong bonus if institutional research
    //    explicitly mentions this ticker.
    const tickerSignal = researchSignals.tickers[fund.tkr.toUpperCase()];

    if (tickerSignal) {
      score += 2 + tickerSignal.count * 0.3;
    }

    // 2. Figure out what regions, sectors and themes
    //    this fund belongs to.
    const buckets = fundBucketKeys(fund);

    let alignment = 0;

    // Region research
    for (const region of buckets.regions) {
      alignment += stanceScore(researchSignals, "regions", region) * 0.8;
    }

    // Sector research
    for (const sector of buckets.sectors) {
      alignment += stanceScore(researchSignals, "sectors", sector) * 0.6;
    }

    // Theme research
    for (const theme of buckets.themes) {
      alignment += stanceScore(researchSignals, "themes", theme) * 0.5;
    }

    // Do not let research alignment overpower
    // all of the quantitative fund metrics.
    score += Math.max(-2, Math.min(2, alignment));
  }

  return round3(score);
}

// ─────────────────────────────────────────────────────────────
// Handle missing asset classes
// ─────────────────────────────────────────────────────────────

function redistributeUnavailableSleeves(
  allocation: Allocation,
  universe: CandidateFund[],
) {
  const unavailable: Array<{
    cls: AssetClass;
    weight: number;
  }> = [];

  for (const [assetClass, weight] of Object.entries(allocation) as [
    AssetClass,
    number,
  ][]) {
    if (weight < 2) {
      continue;
    }

    const hasEligibleFund = universe.some((fund) => fund.cls === assetClass);

    if (!hasEligibleFund) {
      unavailable.push({
        cls: assetClass,
        weight,
      });

      allocation[assetClass] = 0;
    }
  }

  for (const missing of unavailable) {
    // Legacy specially redirects unavailable
    // cash into fixed income.
    if (missing.cls === "cash" && allocation.fixed_income > 0) {
      allocation.fixed_income += missing.weight;

      continue;
    }

    const remaining = (
      Object.entries(allocation) as [AssetClass, number][]
    ).filter(([, weight]) => weight > 0);

    const total = remaining.reduce((sum, [, weight]) => sum + weight, 0);

    if (total <= 0) {
      continue;
    }

    // Redistribute proportionally.
    for (const [assetClass, weight] of remaining) {
      allocation[assetClass] += missing.weight * (weight / total);
    }
  }

  return unavailable;
}

// ─────────────────────────────────────────────────────────────
// Country / domicile
// ─────────────────────────────────────────────────────────────

function isFundEligibleForCountry(fund: CandidateFund, country: string) {
  const normalized = country.toUpperCase();

  // Legacy treats US/Canada as
  // US-listed universe.
  if (normalized === "US" || normalized === "CA") {
    return !fund.ucits && (!fund.dom || fund.dom === "US");
  }

  // Other countries use UCITS /
  // non-US domiciled vehicles.
  return fund.ucits === true || Boolean(fund.dom && fund.dom !== "US");
}

// ─────────────────────────────────────────────────────────────
// Simple fallback rationale
// ─────────────────────────────────────────────────────────────

function buildReasoning(fund: CandidateFund) {
  const r5y = fund.r5y == null ? "n/a" : `${fund.r5y.toFixed(1)}%`;

  return (
    `Sharpe ${fund.sharpe.toFixed(2)} · ` +
    `5y ${r5y} · ` +
    `ER ${(fund.er ?? 0).toFixed(2)}% · ` +
    `AUM $${fund.aum.toFixed(1)}B`
  );
}

// ─────────────────────────────────────────────────────────────
// Normalize UI values
// ─────────────────────────────────────────────────────────────

function normalizeRisk(risk: string) {
  const aliases: Record<string, string> = {
    "very-safe": "very_conservative",

    "balanced-safe": "moderately_conservative",

    balanced: "moderate",

    growth: "moderately_aggressive",

    "maximum-growth": "very_aggressive",
  };

  return aliases[risk] ?? risk;
}

function isPreferEsg(esg: string) {
  return esg === "prefer" || esg === "prefer-esg";
}

function isStrictEsg(esg: string) {
  return esg === "strict" || esg === "esg-only";
}

function prettyRisk(risk: string) {
  return risk.replace(/_/g, " ");
}

function prettyHorizon(horizon: string) {
  const labels: Record<string, string> = {
    "1_5": "1–5 year",
    "5_10": "5–10 year",
    "10_15": "10–15 year",
    "15_plus": "15+ year",

    "1-5": "1–5 year",
    "5-10": "5–10 year",
    "10-15": "10–15 year",
    "15+": "15+ year",
  };

  return labels[horizon] ?? horizon;
}

function prettyClass(cls: AssetClass) {
  const labels: Record<AssetClass, string> = {
    equity: "Equity",
    fixed_income: "Fixed income",
    real_estate: "Real estate",
    commodity: "Commodities",
    cash: "Cash",
    alternative: "Alternatives",
  };

  return labels[cls];
}

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function round3(value: number) {
  return Math.round(value * 1000) / 1000;
}

function applyResearchTilts(
  baseAllocation: Allocation,
  signals: ResearchSignals,
): Allocation {
  const allocation = {
    ...baseAllocation,
  };

  const maxTilt = 8;

  for (const [cls, data] of Object.entries(signals.classes)) {
    if (!(cls in allocation)) {
      continue;
    }

    const tilt = Math.max(-maxTilt, Math.min(maxTilt, data.votes / 4));

    allocation[cls as AssetClass] += tilt;
  }

  const total = Object.values(allocation).reduce(
    (sum, weight) => sum + weight,
    0,
  );

  if (total > 0) {
    for (const cls of Object.keys(allocation) as AssetClass[]) {
      allocation[cls] = Math.max(0, allocation[cls] * (100 / total));
    }
  }

  return allocation;
}

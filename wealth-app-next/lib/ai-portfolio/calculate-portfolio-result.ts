import { portfolioReturnParams } from "@/lib/engine/financial-math";

import type { AssetClass } from "@/lib/engine/types";

import type {
  AiAssetMix,
  AiPortfolioFund,
  AiPortfolioResult,
} from "@/lib/ai-portfolio/types";

import type { EnrichedFund } from "@/lib/ai-portfolio/enrich-fund-universe";

type SelectedFund = {
  ticker: string;
  weightPct: number;
  reasoning?: string;
};

type Input = {
  amount: number;

  selectedFunds: SelectedFund[];

  universe: EnrichedFund[];

  summary: string;

  risks?: string[];

  eligibleFundCount: number;

  totalFundCount: number;

  researchItemCount?: number;

  institutionalSourceCount?: number;

  themes?: string[];

  feePct?: number;
};

// Take selected tickers + weights and turn them into a full AiPortfolioResult
export function calculatePortfolioResult({
  amount,
  selectedFunds,
  universe,
  summary,
  risks = [],
  eligibleFundCount,
  totalFundCount,
  researchItemCount = 0,
  institutionalSourceCount = 0,
  themes = [],
  feePct = 1,
}: Input): AiPortfolioResult {
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("Investment amount must be greater than zero.");
  }

  if (selectedFunds.length === 0) {
    throw new Error("No funds were selected.");
  }

  // Fast ticker lookup so we do not repeatedly scan the whole universe.
  const byTicker = new Map(
    universe.map((fund) => [fund.tkr.toUpperCase(), fund]),
  );

  // ------------------------------------------------------------
  // 1. Normalize selected weights to exactly 100%
  // ------------------------------------------------------------

  const normalizedSelections = normalizeSelectedWeights(selectedFunds);

  // ------------------------------------------------------------
  // 2. Convert selected tickers into full AiPortfolioFund objects
  // ------------------------------------------------------------

  const funds: AiPortfolioFund[] = normalizedSelections.map((selection) => {
    const fund = byTicker.get(selection.ticker.toUpperCase());

    if (!fund) {
      throw new Error(
        `Selected fund ${selection.ticker} was not found in the fund universe.`,
      );
    }

    return {
      ticker: fund.tkr,

      name: fund.name,

      provider: fund.sponsor,

      weightPct: selection.weightPct,

      amount: amount * (selection.weightPct / 100),

      category: fund.cls,

      reasoning: selection.reasoning ?? buildDefaultReasoning(fund),

      esg: Boolean(fund.esg),
    };
  });

  // ------------------------------------------------------------
  // 3. Calculate asset mix
  // ------------------------------------------------------------

  const assetMix = calculateAssetMix(funds);

  // ------------------------------------------------------------
  // 4. Portfolio return + volatility
  //
  // Same shared helper used by Monte Carlo.
  // ------------------------------------------------------------

  const metricHoldings = funds.map((fund) => ({
    cls: fund.category as AssetClass,
    value: fund.amount,
  }));

  const portfolioParams = portfolioReturnParams(metricHoldings, {
    mean: 0.07,
    sigma: 0.12,
  });

  const expectedReturnGross = round2(portfolioParams.mean * 100);

  const expectedVolatility = round2(portfolioParams.sigma * 100);

  const expectedReturnNet = round2(Math.max(0, expectedReturnGross - feePct));

  // ------------------------------------------------------------
  // 5. Return the object your frontend expects
  // ------------------------------------------------------------

  return {
    summary,

    expectedReturnGross,

    expectedReturnNet,

    expectedVolatility,

    feePct,

    assetMix,

    funds,

    risks,

    eligibleFundCount,

    totalFundCount,

    researchItemCount,

    institutionalSourceCount,

    themes,
  };
}

// ============================================================
// NORMALIZE WEIGHTS
// ============================================================

function normalizeSelectedWeights(funds: SelectedFund[]): SelectedFund[] {
  const total = funds.reduce((sum, fund) => sum + fund.weightPct, 0);

  if (total <= 0) {
    throw new Error("Selected fund weights must total more than zero.");
  }

  const normalized = funds.map((fund) => ({
    ...fund,

    weightPct: round1(fund.weightPct * (100 / total)),
  }));

  // Rounding can produce 99.9 or 100.1.
  // Absorb the residual into the largest position.

  const roundedTotal = normalized.reduce(
    (sum, fund) => sum + fund.weightPct,
    0,
  );

  const drift = round1(100 - roundedTotal);

  if (Math.abs(drift) >= 0.1 && normalized.length > 0) {
    const largest = normalized.reduce((a, b) =>
      a.weightPct >= b.weightPct ? a : b,
    );

    largest.weightPct = round1(largest.weightPct + drift);
  }

  return normalized;
}

// ============================================================
// ASSET MIX
// ============================================================

function calculateAssetMix(funds: AiPortfolioFund[]): AiAssetMix {
  const mix: AiAssetMix = {
    stocks: 0,
    bonds: 0,
    realEstate: 0,
    alternatives: 0,
    commodities: 0,
    cash: 0,
  };

  for (const fund of funds) {
    switch (fund.category) {
      case "equity":
        mix.stocks += fund.weightPct;
        break;

      case "fixed_income":
        mix.bonds += fund.weightPct;
        break;

      case "real_estate":
        mix.realEstate += fund.weightPct;
        break;

      case "alternative":
        mix.alternatives += fund.weightPct;
        break;

      case "commodity":
        mix.commodities += fund.weightPct;
        break;

      case "cash":
        mix.cash += fund.weightPct;
        break;
    }
  }

  return {
    stocks: round1(mix.stocks),

    bonds: round1(mix.bonds),

    realEstate: round1(mix.realEstate),

    alternatives: round1(mix.alternatives),

    commodities: round1(mix.commodities),

    cash: round1(mix.cash),
  };
}

// ============================================================
// DEFAULT FUND REASONING
// ============================================================

function buildDefaultReasoning(fund: EnrichedFund) {
  const r5y = fund.r5y == null ? "n/a" : `${fund.r5y.toFixed(1)}%`;

  const r10y = fund.r10y == null ? "n/a" : `${fund.r10y.toFixed(1)}%`;

  return (
    `Sharpe ${fund.sharpe.toFixed(2)} · ` +
    `5y ${r5y} · ` +
    `10y ${r10y} · ` +
    `ER ${(fund.er ?? 0).toFixed(2)}% · ` +
    `σ ${fund.sigma.toFixed(1)}%`
  );
}

// ============================================================
// NUMBER HELPERS
// ============================================================

function round1(value: number) {
  return Math.round(value * 10) / 10;
}

function round2(value: number) {
  return Math.round(value * 100) / 100;
}

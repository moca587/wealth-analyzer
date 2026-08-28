import type { Holding, ReturnRiskMetrics } from "@/lib/engine/types";
import { CLASS_LABEL, type AssetClass } from "@/lib/portfolio/asset-class";
import { portfolioReturnParams } from "@/lib/engine/financial-math";
import type { Proposal } from "@/lib/orders/proposal";
import { ASSET_CLASS_CMA } from "@/lib/engine/constants";

const RISK_BY_CLASS: Record<string, number> = {
  equity: 8,
  fixed_income: 3,
  real_estate: 6,
  commodity: 7,
  cash: 1,
  mixed: 5,
  alternative: 9,
  private_equity: 9,
  hedge_fund: 6,
  structured: 6,
};

export function calcPortfolioTotal(holdings: Holding[]): number {
  return holdings.reduce(
    (sum, holding) =>
      sum + (Number.isFinite(holding.value) ? holding.value : 0),
    0,
  );
}

export function calcTopHolding(holdings: Holding[]): Holding | undefined {
  if (holdings.length === 0) {
    return undefined;
  }

  return [...holdings].sort((a, b) => b.value - a.value)[0];
}

export function calcTopHoldingPct(holdings: Holding[]): number {
  const total = calcPortfolioTotal(holdings);

  if (total <= 0) {
    return 0;
  }

  const top = calcTopHolding(holdings);

  if (!top) {
    return 0;
  }

  return (top.value / total) * 100;
}

export function calcHHI(holdings: Holding[]): number {
  const total = calcPortfolioTotal(holdings);

  if (total <= 0) {
    return 0;
  }

  return holdings.reduce((sum, holding) => {
    const weightPct = (holding.value / total) * 100;

    return sum + Math.pow(weightPct, 2);
  }, 0);
}

export function getDiversificationLabel(hhi: number): string {
  if (hhi < 1500) {
    return "Well diversified";
  }

  if (hhi < 2500) {
    return "Moderately diversified";
  }

  return "High concentration";
}

function weightedMean(
  holdings: Holding[],
  pick: (holding: Holding) => number | undefined,
): number | null {
  let numerator = 0;
  let denominator = 0;

  for (const holding of holdings) {
    const value = pick(holding);

    if (value == null || !Number.isFinite(value) || holding.value <= 0) {
      continue;
    }

    numerator += value * holding.value;

    denominator += holding.value;
  }

  return denominator > 0 ? numerator / denominator : null;
}

export function calcWeightedYield(holdings: Holding[]): number | null {
  return weightedMean(holdings, (holding) => holding.yld);
}

export function calcWeightedExpenseRatio(holdings: Holding[]): number | null {
  return weightedMean(holdings, (holding) => holding.er);
}

export function calcPortfolioRiskScore(holdings: Holding[]): number | null {
  const total = calcPortfolioTotal(holdings);

  if (total <= 0) {
    return null;
  }

  const weightedRisk = holdings.reduce((sum, holding) => {
    const risk = RISK_BY_CLASS[holding.cls ?? ""] ?? 5;

    return sum + risk * holding.value;
  }, 0);

  return weightedRisk / total;
}

// Helper functions for Portfolio donut charts
export type AllocationItem = {
  key: string;
  name: string;
  value: number;
  pct: number;
};

function groupHoldings(
  holdings: Holding[],
  getGroup: (holding: Holding) => {
    key: string;
    name: string;
  },
): AllocationItem[] {
  const total = calcPortfolioTotal(holdings);

  if (total <= 0) {
    return [];
  }

  const groups = new Map<
    string,
    {
      name: string;
      value: number;
    }
  >();

  for (const holding of holdings) {
    const { key, name } = getGroup(holding);

    const current = groups.get(key);

    groups.set(key, {
      name,
      value: (current?.value ?? 0) + holding.value,
    });
  }

  return Array.from(groups.entries()).map(([key, group]) => ({
    key,
    name: group.name,
    value: group.value,
    pct: (group.value / total) * 100,
  }));
}

export function calcAllocationByClass(holdings: Holding[]): AllocationItem[] {
  return groupHoldings(holdings, (holding) => {
    const cls = holding.cls ?? "alternative";

    return {
      key: cls,
      name: CLASS_LABEL[cls as AssetClass] ?? cls,
    };
  });
}

export function calcAllocationByInstrumentType(
  holdings: Holding[],
): AllocationItem[] {
  return groupHoldings(holdings, (holding) => {
    const type = holding.instrumentType ?? "Other";

    return {
      key: type,
      name: type,
    };
  });
}

export function calcAllocationByRegion(holdings: Holding[]): AllocationItem[] {
  return groupHoldings(holdings, (holding) => {
    const region = holding.region ?? "Other";

    return {
      key: region,
      name: region,
    };
  });
}

// Calculate return and risk profile metrics
export function calcReturnRiskMetrics(
  holdings: Holding[],
  advisoryFee = 0,
): ReturnRiskMetrics | null {
  if (holdings.length === 0) {
    return null;
  }

  const total = calcPortfolioTotal(holdings);

  if (total <= 0) {
    return null;
  }

  const params = portfolioReturnParams(
    holdings.map((holding) => ({
      cls: holding.cls,
      value: holding.value,
    })),
    {
      mean: 0,
      sigma: 0,
    },
  );

  // portfolioReturnParams returns decimals:
  // 0.0744 -> 7.44%
  // 0.1208 -> 12.08%
  const grossReturn = params.mean * 100;

  const volatility = params.sigma * 100;

  const netReturn = grossReturn - advisoryFee;

  return {
    grossReturn,
    advisoryFee,
    netReturn,
    volatility,
  };
}

export function calcProposalReturnRiskMetrics(
  proposal: Proposal,
  advisoryFee = 0,
): ReturnRiskMetrics | null {
  if (proposal.positions.length === 0) {
    return null;
  }

  const positions = proposal.positions
    .map((position) => {
      const cls = normalizeProposalAssetClass(position.cls);

      if (!cls) {
        return null;
      }

      return {
        cls,
        value: position.weightPct,
      };
    })
    .filter(
      (
        item,
      ): item is {
        cls: AssetClass;
        value: number;
      } => item !== null,
    );

  if (positions.length === 0) {
    return null;
  }

  const params = portfolioReturnParams(positions, {
    mean: 0,
    sigma: 0,
  });

  const grossReturn = params.mean * 100;
  const volatility = params.sigma * 100;
  const netReturn = grossReturn - advisoryFee;

  return {
    grossReturn,
    advisoryFee,
    netReturn,
    volatility,
  };
}

function normalizeProposalAssetClass(
  cls: string | undefined,
): AssetClass | null {
  if (!cls) {
    return null;
  }

  const normalized = cls.trim().toLowerCase().replace(/\s+/g, "_");

  if (normalized in ASSET_CLASS_CMA) {
    return normalized as AssetClass;
  }

  return null;
}

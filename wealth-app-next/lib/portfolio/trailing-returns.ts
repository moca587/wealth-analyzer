import type { FundPerformance } from "./fund-performance";

export type TrailingReturns = {
  oneYear?: number;
  threeYear?: number;
  fiveYear?: number;
  tenYear?: number;
};

type WeightedFundPerformance = {
  weight: number;
  performance: FundPerformance;
};

export function blendFundPerformance(
  items: WeightedFundPerformance[],
): TrailingReturns {
  return {
    oneYear: blend(items, "r1y"),
    threeYear: blend(items, "r3y"),
    fiveYear: blend(items, "r5y"),
    tenYear: blend(items, "r10y"),
  };
}

function blend(
  items: WeightedFundPerformance[],
  field: "r1y" | "r3y" | "r5y" | "r10y",
) {
  let weightedTotal = 0;
  let coveredWeight = 0;

  for (const item of items) {
    const value = item.performance[field];

    if (value == null || item.weight <= 0) {
      continue;
    }

    weightedTotal += value * item.weight;
    coveredWeight += item.weight;
  }

  if (coveredWeight <= 0) {
    return undefined;
  }

  return weightedTotal / coveredWeight;
}

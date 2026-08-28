import type { AssetClass, RiskProfile } from "@/lib/engine/types";

import {
  portfolioReturnParams,
  geometricMean,
} from "@/lib/engine/financial-math";

const IPS_SAA: Record<RiskProfile, Record<AssetClass, number>> = {
  very_conservative: {
    equity: 15,
    fixed_income: 58,
    real_estate: 4,
    commodity: 0,
    cash: 20,
    mixed: 0,
    alternative: 3,
    crypto: 0,
  },

  conservative: {
    equity: 28,
    fixed_income: 54,
    real_estate: 5,
    commodity: 0,
    cash: 8,
    mixed: 0,
    alternative: 5,
    crypto: 0,
  },

  moderately_conservative: {
    equity: 40,
    fixed_income: 45,
    real_estate: 6,
    commodity: 0,
    cash: 4,
    mixed: 0,
    alternative: 5,
    crypto: 0,
  },

  moderate: {
    equity: 55,
    fixed_income: 30,
    real_estate: 7,
    commodity: 0,
    cash: 2,
    mixed: 0,
    alternative: 6,
    crypto: 0,
  },

  moderately_aggressive: {
    equity: 68,
    fixed_income: 18,
    real_estate: 7,
    commodity: 0,
    cash: 2,
    mixed: 0,
    alternative: 5,
    crypto: 0,
  },

  aggressive: {
    equity: 80,
    fixed_income: 9,
    real_estate: 6,
    commodity: 0,
    cash: 1,
    mixed: 0,
    alternative: 4,
    crypto: 0,
  },

  very_aggressive: {
    equity: 90,
    fixed_income: 3,
    real_estate: 3,
    commodity: 0,
    cash: 1,
    mixed: 0,
    alternative: 3,
    crypto: 0,
  },
};

export function calcIpsPortfolioMetrics(risk: RiskProfile) {
  const allocation = IPS_SAA[risk] ?? IPS_SAA.moderate;

  const holdings = Object.entries(allocation)
    .filter(([, weight]) => weight > 0)
    .map(([cls, weight]) => ({
      cls: cls as AssetClass,

      // portfolioReturnParams only cares
      // about relative values.
      value: weight,
    }));

  const { mean, sigma } = portfolioReturnParams(holdings, {
    mean: 0.07,
    sigma: 0.12,
  });

  const geometricReturn = geometricMean(mean, sigma);

  return {
    arithmeticReturn: mean,

    geometricReturn,

    volatility: sigma,

    allocation,
  };
}

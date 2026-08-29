import { FUND_UNIVERSE } from "@/lib/data/fund-universe";

import type {
  AiPortfolioFund,
  AiPortfolioResult,
} from "@/lib/ai-portfolio/types";

type Input = {
  amount: number;
  risk: string;
  horizon: string;
  esg: string;
};

export function generateAiPortfolio({
  amount,
  risk,
  horizon,
  esg,
}: Input): AiPortfolioResult {
  const eligible = FUND_UNIVERSE.filter((fund) => fund.vehicle === "etf");

  const selected = eligible.slice(0, 5);

  const weightPct = selected.length > 0 ? 100 / selected.length : 0;

  const funds: AiPortfolioFund[] = selected.map((fund) => ({
    ticker: fund.tkr,
    name: fund.name,
    provider: fund.sponsor,

    weightPct,

    amount: amount * (weightPct / 100),

    category: fund.cls,

    reasoning: "Selected from the curated fund universe.",

    esg: false,
  }));

  return {
    summary: `Generated for risk=${risk}, horizon=${horizon}, esg=${esg}.`,

    expectedReturnGross: 0,
    expectedReturnNet: 0,
    expectedVolatility: 0,

    feePct: 1,

    assetMix: {
      stocks: 0,
      bonds: 0,
      realEstate: 0,
      alternatives: 0,
      commodities: 0,
      cash: 0,
    },

    funds,

    risks: [],

    eligibleFundCount: eligible.length,
    totalFundCount: FUND_UNIVERSE.length,

    researchItemCount: 0,
    institutionalSourceCount: 0,

    themes: [],
  };
}

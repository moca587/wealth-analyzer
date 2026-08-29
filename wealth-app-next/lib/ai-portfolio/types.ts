export type AiRiskProfile =
  | "very-safe"
  | "conservative"
  | "balanced-safe"
  | "balanced"
  | "growth"
  | "aggressive"
  | "maximum-growth";

export type AiTimeHorizon = "1-5" | "5-10" | "10-15" | "15+";

export type AiSustainability = "none" | "prefer-esg" | "esg-only";

export type AiPortfolioPreferences = {
  investmentAmount: number;
  riskProfile: AiRiskProfile;
  timeHorizon: AiTimeHorizon;
  sustainability: AiSustainability;
};

export type AiPortfolioFund = {
  ticker: string;
  name: string;
  provider: string;

  weightPct: number;
  amount: number;

  category: string;
  reasoning: string;

  esg?: boolean;
};

export type AiAssetMix = {
  stocks: number;
  bonds: number;
  realEstate: number;
  alternatives: number;
  commodities: number;
  cash: number;
};

export type AiPortfolioResult = {
  summary: string;

  expectedReturnGross: number;
  expectedReturnNet: number;
  expectedVolatility: number;

  feePct: number;

  assetMix: AiAssetMix;

  funds: AiPortfolioFund[];

  risks: string[];

  eligibleFundCount: number;
  totalFundCount: number;

  researchItemCount: number;
  institutionalSourceCount: number;

  themes: string[];
};

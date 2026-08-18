export interface AiPortfolioPosition {
  ticker: string;
  weight: number;
  rationale?: string;
}

export interface AiPortfolioRecommendation {
  summary: string;
  expectedReturn: number;
  expectedVolatility: number;
  positions: AiPortfolioPosition[];
}
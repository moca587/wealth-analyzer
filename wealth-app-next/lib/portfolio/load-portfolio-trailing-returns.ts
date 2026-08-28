import type { FundPerformance } from "./fund-performance";

import { blendFundPerformance, type TrailingReturns } from "./trailing-returns";

export async function loadPortfolioTrailingReturns(
  holdings: Array<{
    ticker?: string;
    value: number;
  }>,
): Promise<TrailingReturns> {
  const validHoldings = holdings.filter(
    (holding) => holding.ticker?.trim() && (holding.value || 0) > 0,
  );

  const items = await Promise.all(
    validHoldings.map(async (holding) => {
      const ticker = holding.ticker?.trim();

      if (!ticker) {
        return null;
      }

      const response = await fetch(
        `/api/fund-performance/${encodeURIComponent(ticker)}`,
      );

      if (!response.ok) {
        return null;
      }

      const performance = (await response.json()) as FundPerformance;

      return {
        weight: holding.value || 0,
        performance,
      };
    }),
  );

  const validItems = items.filter(
    (
      item,
    ): item is {
      weight: number;
      performance: FundPerformance;
    } => item !== null,
  );

  return blendFundPerformance(validItems);
}

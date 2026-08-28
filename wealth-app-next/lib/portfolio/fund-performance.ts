export type FundPerformance = {
  r1y: number | null;
  r3y: number | null;
  r5y: number | null;
  r10y: number | null;
  asOf: string;
};

type YahooChartResponse = {
  chart?: {
    result?: Array<{
      timestamp?: number[];
      indicators?: {
        adjclose?: Array<{
          adjclose?: Array<number | null>;
        }>;
        quote?: Array<{
          close?: Array<number | null>;
        }>;
      };
    }>;
  };
};

export async function fetchFundPerformance(
  symbol: string,
): Promise<FundPerformance | null> {
  if (!symbol.trim()) {
    return null;
  }

  const ticker = symbol.trim().toUpperCase();

  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/` +
    `${encodeURIComponent(ticker)}?interval=1mo&range=max`;

  const response = await fetch(url, {
    cache: "no-store",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as YahooChartResponse;

  const result = data.chart?.result?.[0];

  if (!result) {
    return null;
  }

  const timestamps = result.timestamp ?? [];

  const prices =
    result.indicators?.adjclose?.[0]?.adjclose ??
    result.indicators?.quote?.[0]?.close ??
    [];

  const points: Array<{
    date: Date;
    price: number;
  }> = []; // store cleaned historical observations

  for (let i = 0; i < timestamps.length; i++) {
    const price = prices[i];

    if (price == null || !Number.isFinite(price) || price <= 0) {
      continue;
    }

    points.push({
      date: new Date(timestamps[i] * 1000),
      price,
    });
  }

  if (points.length < 2) {
    return null;
  }

  const last = points[points.length - 1];

  function priceYearsAgo(years: number) {
    const target = new Date(last.date);

    target.setFullYear(target.getFullYear() - years);

    let best: number | null = null;

    for (const point of points) {
      if (point.date <= target) {
        best = point.price;
      } else {
        break;
      }
    }

    return best;
  }

  function simpleReturn(start: number, end: number) {
    return (end / start - 1) * 100;
  }

  function cagr(start: number, end: number, years: number) {
    return (Math.pow(end / start, 1 / years) - 1) * 100;
  }

  const p1 = priceYearsAgo(1);

  const p3 = priceYearsAgo(3);

  const p5 = priceYearsAgo(5);

  const p10 = priceYearsAgo(10);

  return {
    r1y: p1 != null ? round2(simpleReturn(p1, last.price)) : null,

    r3y: p3 != null ? round2(cagr(p3, last.price, 3)) : null,

    r5y: p5 != null ? round2(cagr(p5, last.price, 5)) : null,

    r10y: p10 != null ? round2(cagr(p10, last.price, 10)) : null,

    asOf: last.date.toISOString().slice(0, 10),
  };
}

function round2(value: number) {
  return Number(value.toFixed(2));
}

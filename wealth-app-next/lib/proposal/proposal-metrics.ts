import type { ProposalPosition } from "@/lib/orders/proposal";

const RISK_BY_CLASS: Record<string, number> = {
  Equity: 8,
  "Fixed income": 3,
  "Real estate": 6,
  Commodity: 7,
  "Cash / MM": 1,
  Mixed: 5,
  "Hedge funds": 6,
  "Private equity": 9,
  "Structured products / notes": 6,
  "Alternatives (other)": 9,

  // Also support normalized values if some imported proposals use these.
  equity: 8,
  fixed_income: 3,
  real_estate: 6,
  commodity: 7,
  cash: 1,
  mixed: 5,
  hedge_fund: 6,
  private_equity: 9,
  structured: 6,
  alternative: 9,
};

function weightedMetric(
  positions: ProposalPosition[],
  getValue: (position: ProposalPosition) => number | undefined,
): number | null {
  let numerator = 0;
  let denominator = 0;

  for (const position of positions) {
    const value = getValue(position);

    if (value == null || !Number.isFinite(value) || position.weightPct <= 0) {
      continue;
    }

    numerator += value * position.weightPct;
    denominator += position.weightPct;
  }

  return denominator > 0 ? numerator / denominator : null;
}

export function calcProposalGrossReturn(
  positions: ProposalPosition[],
): number | null {
  return weightedMetric(positions, (position) => position.expectedReturn);
}

export function calcProposalWeightedExpenseRatio(
  positions: ProposalPosition[],
): number | null {
  return weightedMetric(positions, (position) => position.er);
}

export function calcProposalWeightedYield(
  positions: ProposalPosition[],
): number | null {
  return weightedMetric(positions, (position) => position.yld);
}

export function calcProposalRiskScore(
  positions: ProposalPosition[],
): number | null {
  return weightedMetric(
    positions,
    (position) => RISK_BY_CLASS[position.cls ?? ""],
  );
}

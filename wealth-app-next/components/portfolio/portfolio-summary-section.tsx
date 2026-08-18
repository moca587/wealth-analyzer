import type { WealthPlan } from "@/lib/engine/types";

import { formatMoney } from "@/lib/engine/financial-math";

import {
  calcPortfolioTotal,
  calcTopHolding,
  calcTopHoldingPct,
  calcHHI,
  getDiversificationLabel,
  calcWeightedYield,
  calcWeightedExpenseRatio,
  calcPortfolioRiskScore,
} from "@/lib/portfolio/portfolio-metrics";

type Props = {
  plan: WealthPlan;
};

export function PortfolioSummarySection({
  plan,
}: Props) {
  const holdings = plan.holdings ?? [];

  const total =
    calcPortfolioTotal(holdings);

  const topHolding =
    calcTopHolding(holdings);

  const topHoldingPct =
    calcTopHoldingPct(holdings);

  const hhi =
    calcHHI(holdings);

  const diversification =
    total > 0
      ? getDiversificationLabel(hhi)
      : "—";

  const weightedYield =
    calcWeightedYield(holdings);

  const weightedExpenseRatio =
    calcWeightedExpenseRatio(
      holdings
    );

  const riskScore =
    calcPortfolioRiskScore(
      holdings
    );

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Current Portfolio Summary
      </h2>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Total value"
          value={formatMoney(
            total,
            plan.currency
          )}
        />

        <Metric
          label="Holdings"
          value={String(
            holdings.length
          )}
        />

        <Metric
          label="Top holding"
          value={
            topHolding
              ? `${
                  topHolding.ticker ??
                  topHolding.name
                } (${topHoldingPct.toFixed(
                  1
                )}%)`
              : "—"
          }
        />

        <Metric
          label="Concentration (HHI)"
          value={
            total > 0
              ? hhi.toFixed(0)
              : "—"
          }
        />

        <Metric
          label="Diversification"
          value={diversification}
        />

        <Metric
          label="Wtd yield"
          value={
            weightedYield != null
              ? `${weightedYield.toFixed(
                  2
                )}%`
              : "—"
          }
        />

        <Metric
          label="Wtd expense ratio"
          value={
            weightedExpenseRatio != null
              ? `${weightedExpenseRatio.toFixed(
                  2
                )}%`
              : "—"
          }
        />

        <Metric
          label="Risk score"
          value={
            riskScore != null
              ? `${riskScore.toFixed(
                  1
                )}/10`
              : "—"
          }
        />
      </div>

      <p className="mt-4 text-[11px] leading-5 text-[#9ca3af]">
        When the portfolio has holdings, its
        total is added to the simulation&apos;s
        investment seed and the asset-class mix
        overrides the risk-profile return
        assumptions. Avoid double-counting
        positions you&apos;ve already entered as
        Investment account values on the Assets
        tab.
      </p>
    </section>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]">
        {label}
      </div>

      <div className="mt-1 text-[18px] font-extrabold text-[#16213e]">
        {value}
      </div>
    </div>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "mb-4 text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";
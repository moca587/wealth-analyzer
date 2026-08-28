"use client";

import type { WealthPlan, SimulationResult } from "@/lib/engine/types";

import { ReportPage } from "../../report-page";
import { SimChart } from "@/components/sim/sim-chart";

import { calcReturnRiskMetrics } from "@/lib/portfolio/portfolio-metrics";

type Props = {
  plan: WealthPlan;
  result: SimulationResult;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function WealthProjectionPage({
  plan,
  result,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const inflation = (plan.inflationRate ?? 0.038) * 100;

  const planToAge = plan.retirement?.planToAge ?? null;

  const retirementAge = plan.retirement?.retirementAge ?? null;

  const holdings = plan.holdings ?? [];

  const currentMetrics = calcReturnRiskMetrics(holdings, 0);

  const meanReturn = currentMetrics?.netReturn ?? 0;
  const volatility = currentMetrics?.volatility ?? 0;

  return (
    <ReportPage
      clientName={clientName}
      title="What Could Your Wealth Look Like"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <div className="mt-3 border-l-[4px] border-[#0867b9] bg-[#dceaf7] px-3 py-2 text-[10px] font-bold text-[#173d60]">
        Wealth Projection
      </div>

      <p className="mt-3 text-[8px] italic leading-[1.55] text-[#6b7280]">
        In plain terms: We replayed your financial life{" "}
        {result.sims.toLocaleString()} times with different market ups and
        downs. These pages show the range of where you could end up — not one
        prediction, but the realistic spread.
      </p>

      {/* Summary table */}
      <div className="mt-5">
        <div className="grid grid-cols-[45%_55%] bg-[#0867b9] px-3 py-2 text-[8px] font-bold text-white">
          <span>Item</span>
          <span>Value</span>
        </div>

        <SummaryRow
          label="Simulation count"
          value={result.sims.toLocaleString()}
        />

        <SummaryRow
          label="Projection horizon"
          value={`${result.years} years`}
        />

        {planToAge != null && (
          <SummaryRow label="Plan through age" value={String(planToAge)} />
        )}

        {retirementAge != null && (
          <SummaryRow
            label="Planned retirement age"
            value={String(retirementAge)}
          />
        )}

        <SummaryRow
          label="Portfolio mean return"
          value={`${meanReturn.toFixed(1)}% / yr`}
        />

        <SummaryRow
          label="Volatility (sigma)"
          value={`${volatility.toFixed(1)}% / yr`}
        />

        <SummaryRow
          label="Inflation assumption"
          value={`${inflation.toFixed(1)}% / yr`}
        />
      </div>

      <p className="mt-4 text-[8px] leading-[1.55] text-[#4f565e]">
        The fan chart below runs randomized market scenarios and plots the range
        of outcomes over the full planning horizon. The dark line is the median
        result; the shaded bands show the spread of simulated outcomes over
        time. A wider fan means more uncertainty the further out you look.
      </p>

      {/* Fan chart */}
      <div className="mt-3 h-[220px]">
        <SimChart result={result} currency={plan.currency} />
      </div>
    </ReportPage>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[45%_55%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px]">
      <span className="font-semibold text-[#30343b]">{label}</span>

      <span className="text-[#30343b]">{value}</span>
    </div>
  );
}

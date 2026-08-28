"use client";

import type { WealthPlan, SimulationResult } from "@/lib/engine/types";

import { ReportPage } from "../../report-page";

type Props = {
  plan: WealthPlan;
  result: SimulationResult;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function WealthOutcomesPage({
  plan,
  result,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const startYear = new Date().getFullYear();
  const endYear = startYear + result.years;

  const currency = plan.currency || "USD";

  // Use real inflation-adjusted final percentiles from the simulation.
  const realFinal = result.realFinal;

  const conservative = realFinal.p25 ?? 0;

  // 60% chance of reaching at least this value corresponds roughly
  // to the 40th percentile. If your simulation does not store p40,
  // temporarily use p50.
  const expected = realFinal.p50 ?? 0;

  // 40% chance of reaching at least this value corresponds roughly
  // to the 60th percentile. If p60 is unavailable, use p50 for now.
  const optimistic = realFinal.p75 ?? 0;

  const todayNetWorth =
    plan.assets.reduce((sum, asset) => sum + (asset.value || 0), 0) -
    plan.loans.reduce((sum, loan) => sum + (loan.bal || 0), 0);

  const moneyLastProbability =
    result.retirement?.successProbability != null
      ? result.retirement.successProbability * 100
      : result.depletionProbability != null
        ? (1 - result.depletionProbability) * 100
        : null;

  const depletionProbability =
    result.retirement?.depletionProbability != null
      ? result.retirement.depletionProbability * 100
      : result.depletionProbability != null
        ? result.depletionProbability * 100
        : null;

  const percentileRows = [
    {
      label: "25th",
      nominal: result.final.p25,
      real: result.realFinal.p25,
    },
    {
      label: "30th",
      nominal: result.final.p30,
      real: result.realFinal.p30,
    },
    {
      label: "50th",
      nominal: result.final.p50,
      real: result.realFinal.p50,
    },
    {
      label: "75th",
      nominal: result.final.p75,
      real: result.realFinal.p75,
    },
    {
      label: "80th",
      nominal: result.final.p80,
      real: result.realFinal.p80,
    },
  ].filter(
    (row) => typeof row.nominal === "number" && typeof row.real === "number",
  );

  const medianReal = result.realFinal.p50 ?? 0;

  return (
    <ReportPage
      clientName={clientName}
      title="What Could Your Wealth Look Like"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <div className="mt-3 border-l-[4px] border-[#0867b9] bg-[#dceaf7] px-3 py-2 text-[10px] font-bold text-[#173d60]">
        What Your Wealth Could Look Like in {endYear}
      </div>

      <p className="mt-3 text-[8px] leading-[1.5] text-[#5f666d]">
        Projected net worth at the end of the {result.years}-year horizon, in
        today&apos;s money. Higher confidence means more scenarios reach at
        least that level — so the conservative figure is the floor, not the
        worst case.
      </p>

      {/* Three scenarios */}
      <div className="mt-5 grid grid-cols-3 gap-4">
        <OutcomeCard
          label="Conservative"
          probability="75% likely"
          value={formatMoney(conservative, currency)}
          change={formatSignedMoney(conservative - todayNetWorth, currency)}
          note="9 in 10 scenarios reach at least this. The floor for essential planning."
        />

        <OutcomeCard
          label="Expected"
          probability="50% likely"
          value={formatMoney(expected, currency)}
          change={formatSignedMoney(expected - todayNetWorth, currency)}
          note="6 in 10 scenarios reach at least this. The realistic planning target."
        />

        <OutcomeCard
          label="Optimistic"
          probability="25% likely"
          value={formatMoney(optimistic, currency)}
          change={formatSignedMoney(optimistic - todayNetWorth, currency)}
          note="Only 4 in 10 scenarios reach this. Upside, not a plan."
        />
      </div>

      {/* Will money last */}
      <div className="mt-6">
        <div className="border-l-[4px] border-[#0867b9] bg-[#dceaf7] px-3 py-2 text-[10px] font-bold text-[#173d60]">
          Will the Money Last?
        </div>

        <p className="mt-3 text-[8px] text-[#5f666d]">
          Futures where liquid assets last through the full projection
        </p>

        <div className="mt-2 text-[28px] font-bold text-[#30343b]">
          {moneyLastProbability != null
            ? `${moneyLastProbability.toFixed(0)}%`
            : "—"}
        </div>
      </div>

      {/* Interpretation */}
      <div className="mt-5 border border-[#d8dde3] bg-[#f8f9fb] px-4 py-3">
        <div className="text-[8px] font-bold uppercase tracking-[0.08em] text-[#6b7280]">
          What this means for you
        </div>

        <p className="mt-2 text-[8px] leading-[1.55] text-[#4f565e]">
          {depletionProbability != null && depletionProbability >= 99.5
            ? "In nearly all simulated futures, liquid assets are depleted before the end of the projection. That does not make the plan hopeless — it means spending, savings, retirement timing, or investment assumptions need attention. Small changes made early can have an outsized effect."
            : depletionProbability != null
              ? `In approximately ${depletionProbability.toFixed(
                  0,
                )}% of simulated futures, liquid assets are depleted before the end of the projection. The result suggests reviewing spending, savings, retirement timing, and portfolio assumptions.`
              : "Review the simulation results alongside your spending, savings, retirement timing, and portfolio assumptions."}
        </p>
      </div>

      {/* Percentile table */}
      <div className="mt-5">
        <div className="grid grid-cols-[18%_28%_30%_24%] bg-[#0867b9] px-3 py-2 text-[8px] font-bold text-white">
          <span>Percentile</span>
          <span>Nominal wealth</span>
          <span>Real (inflation-adj.)</span>
          <span>vs Median</span>
        </div>

        {percentileRows.map((row) => {
          const vsMedian =
            medianReal !== 0
              ? ((row.real - medianReal) / Math.abs(medianReal)) * 100
              : 0;

          return (
            <div
              key={row.label}
              className="grid grid-cols-[18%_28%_30%_24%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px] text-[#30343b]"
            >
              <span>{row.label}</span>

              <span>{formatMoney(row.nominal, currency)}</span>

              <span>{formatMoney(row.real, currency)}</span>

              <span>
                {row.label === "50th"
                  ? "—"
                  : `${vsMedian >= 0 ? "+" : ""}${vsMedian.toFixed(0)}%`}
              </span>
            </div>
          );
        })}
      </div>
    </ReportPage>
  );
}

function OutcomeCard({
  label,
  probability,
  value,
  change,
  note,
}: {
  label: string;
  probability: string;
  value: string;
  change: string;
  note: string;
}) {
  return (
    <div className="border border-[#d8dde3] bg-[#fafbfc] p-4">
      <div className="text-[8px] font-bold uppercase text-[#173d60]">
        {label}
      </div>

      <div className="mt-1 text-[8px] text-[#6b7280]">{probability}</div>

      <div className="mt-3 text-[16px] font-bold text-[#30343b]">{value}</div>

      <div className="mt-1 text-[8px] text-[#6b7280]">{change} vs today</div>

      <p className="mt-3 text-[8px] leading-[1.45] text-[#5f666d]">{note}</p>
    </div>
  );
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatSignedMoney(value: number, currency: string) {
  const amount = formatMoney(Math.abs(value), currency);

  return value >= 0 ? `+${amount}` : `-${amount}`;
}

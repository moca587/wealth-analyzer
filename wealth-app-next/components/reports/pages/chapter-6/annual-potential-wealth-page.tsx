"use client";

import type { WealthPlan, SimulationResult } from "@/lib/engine/types";

import { ReportPage } from "../../report-page";
import { AnnualPotentialWealthChart } from "../../charts/annual-potential-wealth-chart";

type Props = {
  plan: WealthPlan;
  result: SimulationResult;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export type AnnualWealthRow = {
  year: number;
  age: number | null;
  conservative: number;
  expected: number;
  optimistic: number;
};

export function AnnualPotentialWealthPage({
  plan,
  result,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const rows = buildAnnualWealthRows(plan, result);

  const pageOneRows = rows.slice(0, 7);

  const chartRows = rows;

  return (
    <ReportPage
      clientName={clientName}
      title="Annual Potential Wealth"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <p className="mt-4 text-[8px] leading-[1.55] text-[#4f565e]">
        Projected portfolio value each year over the full planning horizon, in
        today&apos;s money, at three likelihood levels — 80% is a conservative
        floor, 50% is the expected path and 30% is an optimistic outcome. The
        shaded cone spans the conservative-to-optimistic range.
      </p>

      <div className="mt-4 h-[265px]">
        <AnnualPotentialWealthChart
          rows={chartRows}
          currency={plan.currency}
          retirementAge={plan.retirement?.retirementAge}
        />
      </div>

      <div className="mt-5">
        <TableHeader />

        {pageOneRows.map((row) => (
          <WealthRow key={row.year} row={row} currency={plan.currency} />
        ))}
      </div>
    </ReportPage>
  );
}

export function buildAnnualWealthRows(
  plan: WealthPlan,
  result: SimulationResult,
): AnnualWealthRow[] {
  const realPercentiles = result.realPercentiles;

  const conservativeSeries = realPercentiles.p20 ?? realPercentiles.p25 ?? [];

  const expectedSeries = realPercentiles.p50 ?? [];

  const optimisticSeries = realPercentiles.p70 ?? realPercentiles.p75 ?? [];

  const startYear = new Date().getFullYear();

  const firstDob = plan.clients[0]?.dob;

  const startAge = firstDob ? ageAtYear(firstDob, startYear) : null;

  const rows: AnnualWealthRow[] = [];

  for (let i = 0; i <= result.years; i += 5) {
    rows.push({
      year: startYear + i,

      age: startAge != null ? startAge + i : null,

      conservative: Math.max(0, conservativeSeries[i] ?? 0),

      expected: Math.max(0, expectedSeries[i] ?? 0),

      optimistic: Math.max(0, optimisticSeries[i] ?? 0),
    });
  }

  // Ensure the final simulation year is included
  // even when it isn't divisible by 5.
  const finalIndex = result.years;

  if (
    rows.length === 0 ||
    rows[rows.length - 1].year !== startYear + finalIndex
  ) {
    rows.push({
      year: startYear + finalIndex,

      age: startAge != null ? startAge + finalIndex : null,

      conservative: Math.max(0, conservativeSeries[finalIndex] ?? 0),

      expected: Math.max(0, expectedSeries[finalIndex] ?? 0),

      optimistic: Math.max(0, optimisticSeries[finalIndex] ?? 0),
    });
  }

  return rows;
}

function TableHeader() {
  return (
    <div className="grid grid-cols-[11%_10%_26%_26%_27%] bg-[#0867b9] px-3 py-2 text-[8px] font-bold text-white">
      <span>Year</span>
      <span>Age</span>
      <span>Conservative (80%)</span>
      <span>Expected (50%)</span>
      <span>Optimistic (30%)</span>
    </div>
  );
}

export function WealthRow({
  row,
  currency,
}: {
  row: AnnualWealthRow;
  currency: string;
}) {
  return (
    <div className="grid grid-cols-[11%_10%_26%_26%_27%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px] text-[#30343b]">
      <span>{row.year}</span>

      <span>{row.age ?? "—"}</span>

      <span>{formatMoney(row.conservative, currency)}</span>

      <span>{formatMoney(row.expected, currency)}</span>

      <span>{formatMoney(row.optimistic, currency)}</span>
    </div>
  );
}

function ageAtYear(dob: string, year: number) {
  const birthYear = new Date(dob).getFullYear();

  return year - birthYear;
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

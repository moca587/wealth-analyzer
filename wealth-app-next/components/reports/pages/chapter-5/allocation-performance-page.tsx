"use client";

import { useMemo } from "react";

import type { WealthPlan } from "@/lib/engine/types";

import { ReportPage } from "../../report-page";
import { AllocationPerformanceChart } from "../../charts/allocation-performance-chart";

import { calcIpsPortfolioMetrics } from "@/lib/portfolio/ips-metrics";
import { ASSET_CLASS_CMA } from "@/lib/engine/constants";

type Props = {
  plan: WealthPlan;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

const YEARS = 20;

export function AllocationPerformancePage({
  plan,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const startYear = new Date().getFullYear();

  const startingValue =
    (plan.holdings ?? []).reduce(
      (sum, holding) => sum + Math.max(0, holding.value || 0),
      0,
    ) || 150000;

  const risk = plan.clients[0]?.risk ?? "moderate";

  const targetMetrics = calcIpsPortfolioMetrics(risk);

  const targetReturn = targetMetrics.geometricReturn * 100;
  const targetVolatility = targetMetrics.volatility * 100;

  const equityReturn = ASSET_CLASS_CMA.equity.mean * 100;
  const equityVolatility = ASSET_CLASS_CMA.equity.sigma * 100;

  const fixedReturn = ASSET_CLASS_CMA.fixed_income.mean * 100;
  const fixedVolatility = ASSET_CLASS_CMA.fixed_income.sigma * 100;

  const cashReturn = ASSET_CLASS_CMA.cash.mean * 100;
  const cashVolatility = ASSET_CLASS_CMA.cash.sigma * 100;

  const inflation = (plan.inflationRate ?? 0.038) * 100;

  const series = useMemo(
    () => [
      {
        label: "Your target allocation",
        values: growthSeries(startingValue, targetReturn, YEARS),
        color: "#202938",
      },
      {
        label: "Global equities",
        values: growthSeries(startingValue, equityReturn, YEARS),
        color: "#0867b9",
      },
      {
        label: "Fixed income",
        values: growthSeries(startingValue, fixedReturn, YEARS),
        color: "#a84f22",
      },
      {
        label: "Cash",
        values: growthSeries(startingValue, cashReturn, YEARS),
        color: "#759a3d",
      },
      {
        label: "Inflation (CPI assumption)",
        values: growthSeries(startingValue, inflation, YEARS),
        color: "#9ca3af",
      },
    ],
    [inflation],
  );

  const rows = [
    {
      label: "Your target allocation",
      volatility: targetVolatility,
      returnPct: targetReturn,
      finalValue: compound(startingValue, targetReturn, YEARS),
    },
    {
      label: "Global equities",
      volatility: equityVolatility,
      returnPct: equityReturn,
      finalValue: compound(startingValue, equityReturn, YEARS),
    },
    {
      label: "Fixed income",
      volatility: fixedVolatility,
      returnPct: fixedReturn,
      finalValue: compound(startingValue, fixedReturn, YEARS),
    },
    {
      label: "Cash",
      volatility: cashVolatility,
      returnPct: cashReturn,
      finalValue: compound(startingValue, cashReturn, YEARS),
    },
  ];

  return (
    <ReportPage
      clientName={clientName}
      title="Asset Class & Allocation Performance"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <p className="mt-4 text-[8px] leading-[1.55] text-[#4f565e]">
        Hypothetical growth of{" "}
        <strong>{formatMoney(startingValue, plan.currency)}</strong> over{" "}
        {YEARS} years under this plan&apos;s forward-looking capital market
        assumptions (NOT historical index returns — see the Capital Market
        Assumptions section for the inputs). The consumer-price line shows the
        same amount adjusted only for assumed inflation.
      </p>

      {/* Growth chart */}
      <div className="mt-5 h-[275px]">
        <AllocationPerformanceChart
          startYear={startYear}
          years={YEARS}
          series={series}
        />
      </div>

      {/* Summary */}
      <div className="mt-5 border-l-[4px] border-[#0867b9] bg-[#dceaf7] px-3 py-2 text-[10px] font-bold text-[#173d60]">
        Summary of Results
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-[30%_17%_23%_30%] bg-[#0867b9] px-3 py-2 text-[8px] font-bold text-white">
          <span>Series</span>
          <span>Volatility (sigma)</span>
          <span>Avg annual return</span>
          <span>
            Growth of {formatMoney(startingValue, plan.currency)} ({YEARS} yrs)
          </span>
        </div>

        {rows.map((row) => (
          <ResultRow
            key={row.label}
            label={row.label}
            volatility={`${row.volatility.toFixed(2)}%`}
            returnPct={`${row.returnPct.toFixed(2)}%`}
            growth={formatMoney(row.finalValue, plan.currency)}
          />
        ))}

        <ResultRow
          label="Inflation (CPI assumption)"
          volatility="—"
          returnPct={`${inflation.toFixed(2)}%`}
          growth={formatMoney(
            compound(startingValue, inflation, YEARS),
            plan.currency,
          )}
        />
      </div>

      <p className="mt-4 text-[7.5px] leading-[1.5] text-[#6b7280]">
        Results are illustrative, based on the plan&apos;s capital market
        assumptions compounded deterministically; they do not reflect any actual
        portfolio, trading costs or taxes, and past performance does not
        guarantee future results.
      </p>
    </ReportPage>
  );
}

function ResultRow({
  label,
  volatility,
  returnPct,
  growth,
}: {
  label: string;
  volatility: string;
  returnPct: string;
  growth: string;
}) {
  return (
    <div className="grid grid-cols-[30%_17%_23%_30%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px] text-[#30343b]">
      <span>{label}</span>
      <span>{volatility}</span>
      <span>{returnPct}</span>
      <span>{growth}</span>
    </div>
  );
}

function growthSeries(
  startingValue: number,
  annualReturnPct: number,
  years: number,
) {
  return Array.from({ length: years + 1 }, (_, year) =>
    compound(startingValue, annualReturnPct, year),
  );
}

function compound(
  startingValue: number,
  annualReturnPct: number,
  years: number,
) {
  return startingValue * Math.pow(1 + annualReturnPct / 100, years);
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

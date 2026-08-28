"use client";

import type { WealthPlan } from "@/lib/engine/types";

import { formatMoney } from "@/lib/engine/financial-math";

import { ReportPage } from "../../report-page";
import { AssetBreakdownChart } from "../../charts/asset-breakdown-chart";

type Props = {
  plan: WealthPlan;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

type BreakdownRow = {
  label: string;
  value: number;
};

type ChartItem = {
  label: string;
  value: number;
  color: string;
};

const CHART_COLORS = [
  "#0867b9",
  "#12a7a5",
  "#7037e8",
  "#df8b17",
  "#7c8795",
  "#10b981",
];

export function PortfolioAllocationPage({
  plan,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const holdings = plan.holdings ?? [];

  // -------------------------------------------------------
  // Total portfolio value
  // -------------------------------------------------------

  const totalPortfolioValue = holdings.reduce(
    (sum, holding) => sum + (holding.value || 0),
    0,
  );

  // -------------------------------------------------------
  // Group holdings
  // -------------------------------------------------------

  const byAssetClass = groupHoldings(holdings, (holding) =>
    formatAssetClass(holding.cls),
  );

  const byType = groupHoldings(holdings, (holding) =>
    formatLabel(holding.instrumentType || "Other"),
  );

  const byRegion = groupHoldings(holdings, (holding) =>
    formatLabel(holding.region || "Other"),
  );

  // -------------------------------------------------------
  // Convert breakdowns into chart data
  // -------------------------------------------------------

  const assetClassChartItems = makeChartItems(byAssetClass);

  const typeChartItems = makeChartItems(byType);

  const regionChartItems = makeChartItems(byRegion);

  return (
    <ReportPage
      clientName={clientName}
      title="Portfolio Analysis"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <SectionTitle>Current Portfolio Allocation</SectionTitle>

      <p className="mt-3 text-[9px] leading-[1.55] text-[#6b7280]">
        How your current holdings are divided — by asset class, and where
        recorded, by instrument type and region.
      </p>

      {/* ------------------------------------------------ */}
      {/* Three allocation breakdowns                      */}
      {/* ------------------------------------------------ */}

      <div className="mt-6 grid grid-cols-3 gap-7">
        <BreakdownSection
          title="By asset class"
          rows={byAssetClass}
          chartItems={assetClassChartItems}
          total={totalPortfolioValue}
          currency={plan.currency}
        />

        <BreakdownSection
          title="By type"
          rows={byType}
          chartItems={typeChartItems}
          total={totalPortfolioValue}
          currency={plan.currency}
        />

        <BreakdownSection
          title="By region"
          rows={byRegion}
          chartItems={regionChartItems}
          total={totalPortfolioValue}
          currency={plan.currency}
        />
      </div>
    </ReportPage>
  );
}

// =======================================================
// Breakdown section
// Pie chart + table
// =======================================================

function BreakdownSection({
  title,
  rows,
  chartItems,
  total,
  currency,
}: {
  title: string;
  rows: BreakdownRow[];
  chartItems: ChartItem[];
  total: number;
  currency: string;
}) {
  return (
    <div>
      <div className="mb-3 text-[10px] font-bold text-[#173d60]">{title}</div>

      {/* Pie chart */}
      <div className="mx-auto h-[125px] w-[125px]">
        <AssetBreakdownChart items={chartItems} />
      </div>

      {/* Amount / percentage table */}
      <div className="mt-4">
        <BreakdownTable rows={rows} total={total} currency={currency} />
      </div>
    </div>
  );
}

// =======================================================
// Breakdown table
// =======================================================

function BreakdownTable({
  rows,
  total,
  currency,
}: {
  rows: BreakdownRow[];
  total: number;
  currency: string;
}) {
  return (
    <div>
      {/* Header */}
      <div className="grid grid-cols-[1fr_80px_45px] border-b border-[#d8dde3] pb-2 text-[8px] font-semibold text-[#6b7280]">
        <span />

        <span className="text-right">Amount</span>

        <span className="text-right">%</span>
      </div>

      {/* Rows */}
      <div className="mt-2">
        {rows.map((row) => {
          const pct = total > 0 ? (row.value / total) * 100 : 0;

          return (
            <div
              key={row.label}
              className="grid grid-cols-[1fr_80px_45px] py-1.5 text-[9px]"
            >
              <span className="font-medium text-[#30343b]">{row.label}</span>

              <span className="text-right text-[#30343b]">
                {formatMoney(row.value, currency)}
              </span>

              <span className="text-right text-[#6b7280]">
                {pct.toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =======================================================
// Group holdings
// =======================================================

function groupHoldings(
  holdings: NonNullable<WealthPlan["holdings"]>,
  getKey: (holding: NonNullable<WealthPlan["holdings"]>[number]) => string,
): BreakdownRow[] {
  const groups = holdings.reduce<Record<string, number>>((acc, holding) => {
    const key = getKey(holding);

    acc[key] = (acc[key] ?? 0) + (holding.value || 0);

    return acc;
  }, {});

  return Object.entries(groups)
    .map(([label, value]) => ({
      label,
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

// =======================================================
// Convert rows into AssetBreakdownChart items
// =======================================================

function makeChartItems(rows: BreakdownRow[]): ChartItem[] {
  return rows.map((row, index) => ({
    label: row.label,
    value: row.value,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));
}

// =======================================================
// Display asset class names
// =======================================================

function formatAssetClass(cls?: string) {
  switch (cls) {
    case "equity":
      return "Equity";

    case "fixed_income":
      return "Fixed";

    case "real_estate":
      return "Real Estate";

    case "alternative":
      return "Alternatives";

    case "cash":
      return "Cash";

    case "commodity":
      return "Commodity";

    case "crypto":
      return "Crypto";

    case "mixed":
      return "Mixed";

    default:
      return "Other";
  }
}

// =======================================================
// Convert values like "fixed_income" → "Fixed Income"
// and "etf" → "Etf"
// =======================================================

function formatLabel(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

// =======================================================
// Section heading
// =======================================================

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-[3px] border-[#0867b9] bg-[#e7eff8] px-3 py-2 text-[10px] font-bold text-[#173d60]">
      {children}
    </div>
  );
}

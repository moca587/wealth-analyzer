"use client";

import type { WealthPlan } from "@/lib/engine/types";

import { ReportPage } from "../../report-page";
import { AssetBreakdownChart } from "../../charts/asset-breakdown-chart";

type Props = {
  plan: WealthPlan;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

type AllocationRow = {
  label: string;
  value: number;
  color: string;
};

const COLORS = ["#0867b9", "#12a7a5", "#7037e8", "#df8b17", "#7c8795"];

export function TotalPortfolioPage({
  plan,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const holdings = plan.holdings ?? [];

  // Group current holdings by asset class.
  const grouped = new Map<string, number>();

  for (const holding of holdings) {
    const value = Math.max(0, holding.value || 0);

    if (value <= 0) {
      continue;
    }

    const label = formatAssetClass(holding.cls);

    grouped.set(label, (grouped.get(label) ?? 0) + value);
  }

  const rows: AllocationRow[] = Array.from(grouped.entries())
    .map(([label, value], index) => ({
      label,
      value,
      color: COLORS[index % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  const total = rows.reduce((sum, row) => sum + row.value, 0);

  const risk = formatRisk(plan.clients[0]?.risk ?? "moderate");

  const chartItems = rows.map((row) => ({
    label: row.label,
    value: row.value,
    color: row.color,
  }));

  return (
    <ReportPage
      clientName={clientName}
      title="A View of Your Total Portfolio"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      {/* Intro */}
      <p className="mt-4 text-[9px] text-[#4f565e]">
        Your current investable portfolio ({risk}), valued at{" "}
        <strong>{formatCurrency(total, plan.currency)}</strong>.
      </p>

      {/* Chart + legend */}
      <div className="mt-7 grid grid-cols-[48%_52%] items-center">
        <div className="flex justify-center">
          <div className="h-[180px] w-[180px]">
            <AssetBreakdownChart items={chartItems} />
          </div>
        </div>

        <div>
          {/* Legend header */}
          <div className="grid grid-cols-[1fr_90px_50px] border-b border-[#d8dde3] pb-2 text-[8px] text-[#70777e]">
            <span />
            <span className="text-right">Amount</span>
            <span className="text-right">%</span>
          </div>

          {rows.map((row) => {
            const pct = total > 0 ? (row.value / total) * 100 : 0;

            return (
              <div
                key={row.label}
                className="grid grid-cols-[1fr_90px_50px] items-center py-1.5 text-[8px]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 shrink-0"
                    style={{
                      backgroundColor: row.color,
                    }}
                  />

                  <span>{row.label}</span>
                </div>

                <span className="text-right">
                  {formatCurrency(row.value, plan.currency)}
                </span>

                <span className="text-right">{pct.toFixed(0)}%</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Totals heading */}
      <div className="mt-7 border-l-[4px] border-[#0867b9] bg-[#dceaf7] px-3 py-2 text-[10px] font-bold text-[#173d60]">
        Totals
      </div>

      {/* Table */}
      <div className="mt-4">
        <div className="grid grid-cols-[43%_27%_30%] bg-[#0867b9] px-3 py-2 text-[8px] font-bold text-white">
          <span>Asset class</span>
          <span>Amount</span>
          <span>Allocation</span>
        </div>

        {rows.map((row) => {
          const pct = total > 0 ? (row.value / total) * 100 : 0;

          return (
            <div
              key={row.label}
              className="grid grid-cols-[43%_27%_30%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px]"
            >
              <span>{row.label}</span>

              <span>{formatCurrency(row.value, plan.currency)}</span>

              <span>{pct.toFixed(2)}%</span>
            </div>
          );
        })}

        {/* Total */}
        <div className="grid grid-cols-[43%_27%_30%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px] font-semibold">
          <span>Total</span>

          <span>{formatCurrency(total, plan.currency)}</span>

          <span>100%</span>
        </div>
      </div>
    </ReportPage>
  );
}

function formatAssetClass(cls?: string) {
  switch (cls) {
    case "equity":
      return "Equities (EQ)";

    case "fixed_income":
      return "Fixed Income (FI)";

    case "real_estate":
      return "Real Assets (RA)";

    case "cash":
      return "Cash & Equivalents (CA)";

    case "alternative":
      return "Alternatives (AL)";

    case "commodity":
      return "Commodities";

    case "crypto":
      return "Crypto";

    case "mixed":
      return "Mixed";

    default:
      return "Other";
  }
}

function formatRisk(risk: string) {
  return risk
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function formatCurrency(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

"use client";

import type { WealthPlan } from "@/lib/engine/types";
import type { Proposal } from "@/lib/orders/proposal";

import { formatMoney } from "@/lib/engine/financial-math";

import { ReportPage } from "../../report-page";
import { AssetBreakdownChart } from "../../charts/asset-breakdown-chart";

import {
  calcReturnRiskMetrics,
  calcProposalReturnRiskMetrics,
} from "@/lib/portfolio/portfolio-metrics";

import { calcAdvisoryFeePct } from "@/lib/proposal/advisory-fee";

type Props = {
  plan: WealthPlan;
  proposal: Proposal;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

type BreakdownRow = {
  label: string;
  value: number;
};

const CHART_COLORS = ["#0867b9", "#12a7a5", "#7037e8", "#df8b17", "#7c8795"];

export function CurrentVsProposedPage({
  plan,
  proposal,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const holdings = plan.holdings ?? [];
  const positions = proposal.positions ?? [];

  // -------------------------------------------------------
  // Current portfolio
  // -------------------------------------------------------

  const currentTotal = holdings.reduce(
    (sum, holding) => sum + (holding.value || 0),
    0,
  );

  const currentRows = groupCurrentHoldings(holdings);

  const currentChartItems = currentRows.map((row, index) => ({
    label: row.label,
    value: row.value,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  // -------------------------------------------------------
  // Proposed portfolio
  // -------------------------------------------------------

  const proposedRows = groupProposedPositions(positions, proposal.targetAmount);

  const proposedTotal = proposedRows.reduce((sum, row) => sum + row.value, 0);

  const proposedChartItems = proposedRows.map((row, index) => ({
    label: row.label,
    value: row.value,
    color: CHART_COLORS[index % CHART_COLORS.length],
  }));

  // -------------------------------------------------------
  // Metrics
  // -------------------------------------------------------

  const currentMetrics = calcReturnRiskMetrics(holdings, 0);

  const currentExpectedReturn = currentMetrics?.netReturn ?? null;

  const proposedAdvisoryFee = calcAdvisoryFeePct(
    proposal.feeType ?? "none",
    proposal.feeRate ?? 0,
    proposal.targetAmount,
  );

  const proposedMetrics = calcProposalReturnRiskMetrics(
    proposal,
    proposedAdvisoryFee,
  );

  const proposedExpectedReturn = proposedMetrics?.netReturn ?? null;

  const currentYield = weightedCurrentMetric(holdings, "yld");

  const proposedYield = weightedProposedMetric(positions, "yld");

  const currentCost = weightedCurrentMetric(holdings, "er");

  const proposedCost = weightedProposedMetric(positions, "er");

  return (
    <ReportPage
      clientName={clientName}
      title="Proposed Portfolio"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <SectionTitle>Current vs Proposed</SectionTitle>

      <p className="mt-3 text-[9px] leading-[1.55] text-[#6b7280]">
        Your current asset-class mix beside the proposed mix, so the changes the
        proposal would make are easy to see.
      </p>

      {/* Current + proposed pies */}
      <div className="mt-5 grid grid-cols-2 gap-10">
        <AllocationBlock
          title="Current"
          rows={currentRows}
          chartItems={currentChartItems}
          total={currentTotal}
          currency={plan.currency}
        />

        <AllocationBlock
          title="Proposed"
          rows={proposedRows}
          chartItems={proposedChartItems}
          total={proposedTotal}
          currency={proposal.currency}
        />
      </div>

      {/* Comparison metrics */}
      <div className="mt-7">
        <div className="grid grid-cols-[44%_28%_28%] bg-[#0867b9] px-3 py-2 text-[8px] font-bold text-white">
          <span>Metric</span>
          <span>Current</span>
          <span>Proposed</span>
        </div>

        <MetricRow
          label="Expected return (per year)"
          current={formatPercent(currentExpectedReturn, 1)}
          proposed={formatPercent(proposedExpectedReturn, 1)}
        />

        <MetricRow
          label="Income yield"
          current={formatPercent(currentYield, 2)}
          proposed={formatPercent(proposedYield, 2)}
        />

        <MetricRow
          label="Cost (weighted expense ratio)"
          current={formatPercent(currentCost, 2)}
          proposed={formatPercent(proposedCost, 2)}
        />

        <MetricRow
          label="Number of holdings"
          current={String(holdings.length)}
          proposed={String(positions.length)}
        />
      </div>
    </ReportPage>
  );
}

function AllocationBlock({
  title,
  rows,
  chartItems,
  total,
  currency,
}: {
  title: string;
  rows: BreakdownRow[];
  chartItems: Array<{
    label: string;
    value: number;
    color: string;
  }>;
  total: number;
  currency: string;
}) {
  return (
    <div>
      <div className="text-[10px] font-bold text-[#173d60]">{title}</div>

      <div className="mt-3 grid grid-cols-[120px_1fr] items-center gap-5">
        {/* Reuses your existing pie chart */}
        <div className="h-[110px] w-[110px]">
          <AssetBreakdownChart items={chartItems} />
        </div>

        <div>
          <div className="grid grid-cols-[1fr_80px_40px] border-b border-[#d8dde3] pb-1 text-[7px] text-[#70777e]">
            <span />
            <span className="text-right">Amount</span>
            <span className="text-right">%</span>
          </div>

          <div className="mt-2 space-y-2">
            {rows.map((row, index) => {
              const pct = total > 0 ? (row.value / total) * 100 : 0;

              return (
                <div
                  key={row.label}
                  className="grid grid-cols-[1fr_80px_40px] items-center text-[8px]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 shrink-0"
                      style={{
                        backgroundColor:
                          CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />

                    <span className="text-[#30343b]">{row.label}</span>
                  </div>

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
      </div>
    </div>
  );
}

function MetricRow({
  label,
  current,
  proposed,
}: {
  label: string;
  current: string;
  proposed: string;
}) {
  return (
    <div className="grid grid-cols-[44%_28%_28%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px]">
      <span className="font-semibold text-[#30343b]">{label}</span>

      <span className="text-[#30343b]">{current}</span>

      <span className="text-[#30343b]">{proposed}</span>
    </div>
  );
}

function groupCurrentHoldings(
  holdings: NonNullable<WealthPlan["holdings"]>,
): BreakdownRow[] {
  const groups: Record<string, number> = {};

  for (const holding of holdings) {
    const label = formatAssetClass(holding.cls);

    groups[label] = (groups[label] ?? 0) + (holding.value || 0);
  }

  return Object.entries(groups)
    .map(([label, value]) => ({
      label,
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

function groupProposedPositions(
  positions: Proposal["positions"],
  targetAmount: number,
): BreakdownRow[] {
  const groups: Record<string, number> = {};

  for (const position of positions) {
    const label = formatAssetClass(position.cls);

    const amount = targetAmount * ((Number(position.weightPct) || 0) / 100);

    groups[label] = (groups[label] ?? 0) + amount;
  }

  return Object.entries(groups)
    .map(([label, value]) => ({
      label,
      value,
    }))
    .sort((a, b) => b.value - a.value);
}

function weightedCurrentMetric(
  holdings: NonNullable<WealthPlan["holdings"]>,
  field: "yld" | "er",
) {
  const total = holdings.reduce(
    (sum, holding) => sum + (holding.value || 0),
    0,
  );

  if (total <= 0) {
    return null;
  }

  let weighted = 0;
  let covered = 0;

  for (const holding of holdings) {
    const metric = Number(holding[field]);

    if (!Number.isFinite(metric)) {
      continue;
    }

    const value = holding.value || 0;

    weighted += metric * value;
    covered += value;
  }

  return covered > 0 ? weighted / covered : null;
}

function weightedProposedMetric(
  positions: Proposal["positions"],
  field: "yld" | "er",
) {
  const totalWeight = positions.reduce(
    (sum, position) => sum + (Number(position.weightPct) || 0),
    0,
  );

  if (totalWeight <= 0) {
    return null;
  }

  let weighted = 0;
  let coveredWeight = 0;

  for (const position of positions) {
    const metric = Number(position[field]);

    if (!Number.isFinite(metric)) {
      continue;
    }

    const weight = Number(position.weightPct) || 0;

    weighted += metric * weight;
    coveredWeight += weight;
  }

  return coveredWeight > 0 ? weighted / coveredWeight : null;
}

function formatPercent(value: number | null, decimals: number) {
  return value == null ? "—" : `${value.toFixed(decimals)}%`;
}

function formatAssetClass(cls?: string) {
  switch (cls) {
    case "equity":
      return "Equity";

    case "fixed_income":
      return "Fixed income";

    case "real_estate":
      return "Real estate";

    case "cash":
      return "Cash";

    case "alternative":
      return "Alternatives";

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

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-[3px] border-[#0867b9] bg-[#e7eff8] px-3 py-2 text-[10px] font-bold text-[#173d60]">
      {children}
    </div>
  );
}

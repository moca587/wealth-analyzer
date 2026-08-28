"use client";

import type { AssetClass, WealthPlan } from "@/lib/engine/types";

import { calcIpsPortfolioMetrics } from "@/lib/portfolio/ips-metrics";

import { ReportPage } from "../../report-page";

import { IpsAllocationChart } from "../../charts/ips-allocation-chart";

type Props = {
  plan: WealthPlan;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

type PolicyRow = {
  label: string;
  cls: AssetClass;
  policy: number;
  current: number;
  drift: number;
  min: number;
  max: number;
  status: "Within band" | "Rebalance";
};

export function InvestmentPolicyStatementRebalancingPage({
  plan,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const risk = plan.clients[0]?.risk ?? "moderate";

  const ipsMetrics = calcIpsPortfolioMetrics(risk);

  const currentAllocation = calculateCurrentAllocation(plan);

  const rows: PolicyRow[] = [
    makePolicyRow(
      "Global Equity",
      "equity",
      ipsMetrics.allocation.equity,
      currentAllocation.equity,
    ),

    makePolicyRow(
      "Fixed Income",
      "fixed_income",
      ipsMetrics.allocation.fixed_income,
      currentAllocation.fixed_income,
    ),

    makePolicyRow(
      "Real Assets / REITs",
      "real_estate",
      ipsMetrics.allocation.real_estate,
      currentAllocation.real_estate,
    ),

    makePolicyRow(
      "Alternatives",
      "alternative",
      ipsMetrics.allocation.alternative,
      currentAllocation.alternative,
    ),

    makePolicyRow(
      "Cash & Equivalents",
      "cash",
      ipsMetrics.allocation.cash,
      currentAllocation.cash,
    ),
  ];

  const rebalanceNeeded = rows.some((row) => row.status === "Rebalance");

  return (
    <ReportPage
      clientName={clientName}
      title="Investment Policy Statement"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      {/* ------------------------------------------------ */}
      {/* 5. Current allocation & rebalancing              */}
      {/* ------------------------------------------------ */}

      <div className="mt-3">
        <SectionTitle>5. Current allocation & rebalancing</SectionTitle>

        <div className="mt-4">
          <div className="grid grid-cols-[32%_15%_17%_16%_20%] bg-[#0867b9] px-3 py-2 text-[8px] font-bold text-white">
            <span>Asset class</span>

            <span>Policy</span>

            <span>Current</span>

            <span>Drift</span>

            <span>Status</span>
          </div>

          {rows.map((row) => (
            <div
              key={row.cls}
              className="grid grid-cols-[32%_15%_17%_16%_20%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px] text-[#30343b]"
            >
              <span>{row.label}</span>

              <span>{row.policy.toFixed(0)}%</span>

              <span>{row.current.toFixed(0)}%</span>

              <span>{formatDrift(row.drift)}</span>

              <span
                className={
                  row.status === "Rebalance"
                    ? "font-semibold text-[#a83232]"
                    : "text-[#3f6b55]"
                }
              >
                {row.status}
              </span>
            </div>
          ))}
        </div>

        <p className="mt-4 text-[9px] leading-[1.55] text-[#4f565e]">
          {rebalanceNeeded
            ? "One or more classes are outside their policy band — rebalancing is indicated."
            : "All classes are within their policy bands — no rebalancing is currently indicated."}
        </p>

        <p className="mt-3 text-[8px] leading-[1.6] text-[#5f666d]">
          <strong>Rebalancing policy:</strong> rebalance when any class deviates
          from target by more than 5 percentage points or 25% (relative),
          whichever is greater; otherwise review at least annually. Direct new
          cash flows to underweight classes to limit turnover.
        </p>
      </div>

      {/* ------------------------------------------------ */}
      {/* 6. Monitoring & review                           */}
      {/* ------------------------------------------------ */}

      <div className="mt-7">
        <SectionTitle>6. Monitoring & review</SectionTitle>

        <p className="mt-4 text-[9px] leading-[1.6] text-[#4f565e]">
          Monitoring is continuous; formal review is scheduled. Between reviews
          the portfolio is watched for drift away from the policy weights and
          for any breach of the ranges set in section 4. Performance is judged
          over a full market cycle (3–5 years) rather than on short-term moves —
          a strategy that fits your goals can still lag in any single year, and
          reacting to noise can erode long-run returns.
        </p>

        <p className="mt-3 text-[9px] leading-[1.6] text-[#6b7280]">
          Results are measured against a blended benchmark built from your own
          policy weights, so the portfolio is compared with its target mix
          rather than any single headline index.
        </p>

        <div className="mt-5 grid grid-cols-[180px_1fr] items-center gap-8">
          <div className="h-[150px] w-[150px]">
            <IpsAllocationChart allocation={ipsMetrics.allocation} />
          </div>

          <div>
            <div className="grid grid-cols-[1fr_70px] border-b border-[#d8dde3] pb-2 text-[8px] font-semibold text-[#6b7280]">
              <span>Asset class</span>

              <span className="text-right">Target</span>
            </div>

            <div className="mt-2">
              <AllocationLegendRow
                label="Global Equity"
                value={ipsMetrics.allocation.equity}
              />

              <AllocationLegendRow
                label="Fixed Income"
                value={ipsMetrics.allocation.fixed_income}
              />

              <AllocationLegendRow
                label="Real Assets / REITs"
                value={ipsMetrics.allocation.real_estate}
              />

              <AllocationLegendRow
                label="Alternatives"
                value={ipsMetrics.allocation.alternative}
              />

              <AllocationLegendRow
                label="Cash & Equivalents"
                value={ipsMetrics.allocation.cash}
              />
            </div>
          </div>
        </div>
      </div>
    </ReportPage>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-[3px] border-[#0867b9] bg-[#e7eff8] px-3 py-2 text-[10px] font-bold text-[#173d60]">
      {children}
    </div>
  );
}

function AllocationLegendRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="grid grid-cols-[1fr_70px] py-1.5 text-[9px] text-[#30343b]">
      <span>{label}</span>

      <span className="text-right font-semibold">{value}%</span>
    </div>
  );
}

function makePolicyRow(
  label: string,
  cls: AssetClass,
  policy: number,
  current: number,
): PolicyRow {
  const { min, max } = calculatePolicyRange(policy);

  const drift = current - policy;

  const status = current < min || current > max ? "Rebalance" : "Within band";

  return {
    label,
    cls,
    policy,
    current,
    drift,
    min,
    max,
    status,
  };
}

function calculatePolicyRange(target: number) {
  const tolerance = Math.max(5, target * 0.25);

  return {
    min: Math.max(0, target - tolerance),

    max: Math.min(100, target + tolerance),
  };
}

function calculateCurrentAllocation(
  plan: WealthPlan,
): Record<AssetClass, number> {
  const result: Record<AssetClass, number> = {
    equity: 0,
    fixed_income: 0,
    real_estate: 0,
    commodity: 0,
    cash: 0,
    mixed: 0,
    alternative: 0,
    crypto: 0,
  };

  const holdings = plan.holdings ?? [];

  const total = holdings.reduce(
    (sum, holding) => sum + Math.max(0, holding.value || 0),
    0,
  );

  if (total <= 0) {
    return result;
  }

  for (const holding of holdings) {
    const value = Math.max(0, holding.value || 0);

    if (value <= 0) {
      continue;
    }

    const cls = holding.cls ?? "mixed";

    result[cls] += (value / total) * 100;
  }

  return result;
}

function formatDrift(drift: number) {
  const rounded = Math.round(drift);

  return `${rounded > 0 ? "+" : ""}${rounded} pts`;
}

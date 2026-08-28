"use client";

import type { WealthPlan } from "@/lib/engine/types";

import { ReportPage } from "../../report-page";

import { calcIpsPortfolioMetrics } from "@/lib/portfolio/ips-metrics";
import { calculateGoalFundingMetrics } from "@/lib/engine/goal-funding";

type Props = {
  plan: WealthPlan;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function InvestmentPolicyStatementMonitoringPage({
  plan,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const risk = plan.clients[0]?.risk ?? "moderate";

  const ipsMetrics = calcIpsPortfolioMetrics(risk);

  // -------------------------------------------------------
  // Current allocation + rebalance status
  // -------------------------------------------------------

  const currentAllocation = calculateCurrentAllocation(plan);

  const policyRows = [
    {
      policy: ipsMetrics.allocation.equity,
      current: currentAllocation.equity,
    },
    {
      policy: ipsMetrics.allocation.fixed_income,
      current: currentAllocation.fixed_income,
    },
    {
      policy: ipsMetrics.allocation.real_estate,
      current: currentAllocation.real_estate,
    },
    {
      policy: ipsMetrics.allocation.alternative,
      current: currentAllocation.alternative,
    },
    {
      policy: ipsMetrics.allocation.cash,
      current: currentAllocation.cash,
    },
  ];

  const rebalanceNeeded = policyRows.some((row) => {
    const tolerance = Math.max(5, row.policy * 0.25);

    const min = Math.max(0, row.policy - tolerance);

    const max = Math.min(100, row.policy + tolerance);

    return row.current < min || row.current > max;
  });

  // -------------------------------------------------------
  // Holdings
  // -------------------------------------------------------

  const holdings = plan.holdings ?? [];

  const totalHoldings = holdings.reduce(
    (sum, holding) => sum + Math.max(0, holding.value || 0),
    0,
  );

  const largestHoldingPct =
    totalHoldings > 0
      ? Math.max(
          ...holdings.map(
            (holding) => ((holding.value || 0) / totalHoldings) * 100,
          ),
        )
      : 0;

  // -------------------------------------------------------
  // Liquidity — legacy IPS behavior
  // -------------------------------------------------------

  // Legacy numerator:
  // Sum every asset marked liquid.
  const liquidAssets = plan.assets
    .filter((asset) => asset.liquid)
    .reduce((sum, asset) => sum + (asset.value || 0), 0);

  /*
   * Holdings can point to the account they belong to using accountRef.
   *
   * When detailed holdings represent an account, the legacy app excludes
   * that linked account from totalAccountValue() so the portfolio is not
   * counted twice.
   */
  const linkedAccountRefs = new Set(
    holdings
      .map((holding) => holding.accountRef)
      .filter(
        (ref): ref is string => typeof ref === "string" && ref.length > 0,
      ),
  );

  const totalAccountValue = plan.assets.reduce((sum, asset) => {
    const isLinkedPortfolioAccount =
      asset.feedRef != null &&
      linkedAccountRefs.has(asset.feedRef) &&
      holdings.length > 0;

    if (isLinkedPortfolioAccount) {
      return sum;
    }

    return sum + (asset.value || 0);
  }, 0);

  const liquidityPct =
    totalAccountValue > 0 ? (liquidAssets / totalAccountValue) * 100 : 0;

  // -------------------------------------------------------
  // Goal funding — present-value basis
  // -------------------------------------------------------

  const goalFundingMetrics = calculateGoalFundingMetrics(plan);

  const averageFundingRatio =
    goalFundingMetrics.length > 0
      ? goalFundingMetrics.reduce((sum, goal) => sum + goal.fundingRatio, 0) /
        goalFundingMetrics.length
      : undefined;

  return (
    <ReportPage
      clientName={clientName}
      title="Investment Policy Statement"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      {/* Monitoring framework */}
      <div className="mt-3">
        <div className="grid grid-cols-[26%_38%_36%] bg-[#0867b9] px-3 py-2 text-[8px] font-bold text-white">
          <span>Focus area</span>

          <span>How it is measured</span>

          <span>Threshold / cadence</span>
        </div>

        <MonitoringRow
          focus="Allocation drift"
          measured="Each class weight vs its policy target"
          threshold="Rebalance at ±5 pts or ±25% (relative)"
        />

        <MonitoringRow
          focus="Performance"
          measured="Total return vs the blended policy benchmark"
          threshold="Judged over a full cycle (3–5 yrs)"
        />

        <MonitoringRow
          focus="Risk"
          measured="Portfolio volatility vs your profile's band"
          threshold="Flag if sustained outside the band"
        />

        <MonitoringRow
          focus="Goal funding"
          measured="Present-value funding ratio of stated goals"
          threshold="Reviewed at least annually"
        />

        <MonitoringRow
          focus="Costs"
          measured="Fund + advisory costs vs value added"
          threshold="Reviewed annually"
        />

        <MonitoringRow
          focus="Concentration"
          measured="Largest single-holding weight"
          threshold="Flag any position above 20%"
        />
      </div>

      {/* Summary cards */}
      <div className="mt-6 grid grid-cols-4 gap-3">
        <StatusCard
          label="Allocation"
          value={rebalanceNeeded ? "Rebalance" : "Within band"}
          note="vs policy bands"
        />

        <StatusCard
          label="Goals funded"
          value={
            averageFundingRatio != null
              ? `${(averageFundingRatio * 100).toFixed(0)}%`
              : "—"
          }
          note="present-value basis"
        />
        <StatusCard
          label="Liquidity"
          value={`${liquidityPct.toFixed(0)}%`}
          note="of investable"
        />

        <StatusCard
          label="Largest holding"
          value={`${largestHoldingPct.toFixed(0)}%`}
          note="single-position weight"
        />
      </div>

      {/* Review triggers */}
      <p className="mt-5 text-[9px] leading-[1.6] text-[#4f565e]">
        A review is also triggered off-cycle by: a change in your goals or time
        horizon; a material change in income, wealth or family circumstances; a
        shift in market regime or in the long-term capital-market assumptions;
        or any policy breach flagged above.
      </p>

      <p className="mt-3 text-[9px] leading-[1.6] text-[#4f565e]">
        At each review the objectives, risk tolerance, allocation and
        constraints are re-confirmed and the policy updated where needed.
      </p>

      {/* Roles */}
      <div className="mt-7">
        <SectionTitle>7. Roles & responsibilities</SectionTitle>

        <div className="mt-3">
          <div className="grid grid-cols-[25%_75%] bg-[#e7eff8] px-3 py-2 text-[8px] font-bold text-[#173d60]">
            <span>Party</span>

            <span>Responsibilities</span>
          </div>

          <RoleRow
            party="Client(s)"
            responsibilities="Provide complete, accurate information; fund the plan; approve the policy and changes; give timely notice of material changes."
          />

          <RoleRow
            party="Adviser/preparer"
            responsibilities="Implement and monitor within policy; report results; recommend changes; disclose material conflicts of interest."
          />
        </div>
      </div>

      <p className="mt-5 text-[8px] leading-[1.55] text-[#6b7280]">
        This IPS is a planning framework generated from client-supplied data and
        long-term capital market assumptions. It is not investment, tax, or
        legal advice. Expected returns are estimates, not guarantees; actual
        results will differ.
      </p>
    </ReportPage>
  );
}

function MonitoringRow({
  focus,
  measured,
  threshold,
}: {
  focus: string;
  measured: string;
  threshold: string;
}) {
  return (
    <div className="grid grid-cols-[26%_38%_36%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px] leading-[1.45]">
      <span className="font-semibold text-[#30343b]">{focus}</span>

      <span className="text-[#5f666d]">{measured}</span>

      <span className="text-[#5f666d]">{threshold}</span>
    </div>
  );
}

function StatusCard({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <div className="bg-[#f8f9fb] px-4 py-3">
      <div className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#7c828a]">
        {label}
      </div>

      <div className="mt-1 text-[15px] font-bold text-[#30343b]">{value}</div>

      <div className="mt-1 text-[8px] text-[#777e87]">{note}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-l-[3px] border-[#0867b9] bg-[#e7eff8] px-3 py-2 text-[10px] font-bold text-[#173d60]">
      {children}
    </div>
  );
}

function RoleRow({
  party,
  responsibilities,
}: {
  party: string;
  responsibilities: string;
}) {
  return (
    <div className="grid grid-cols-[25%_75%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px] leading-[1.5]">
      <span className="font-semibold text-[#30343b]">{party}</span>

      <span className="text-[#5f666d]">{responsibilities}</span>
    </div>
  );
}

function calculateCurrentAllocation(plan: WealthPlan) {
  const result = {
    equity: 0,
    fixed_income: 0,
    real_estate: 0,
    alternative: 0,
    cash: 0,
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

    switch (holding.cls) {
      case "equity":
        result.equity += (value / total) * 100;
        break;

      case "fixed_income":
        result.fixed_income += (value / total) * 100;
        break;

      case "real_estate":
        result.real_estate += (value / total) * 100;
        break;

      case "cash":
        result.cash += (value / total) * 100;
        break;

      default:
        result.alternative += (value / total) * 100;
        break;
    }
  }

  return result;
}

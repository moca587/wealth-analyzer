"use client";

import type { RiskProfile, WealthPlan } from "@/lib/engine/types";

import { calcIpsPortfolioMetrics } from "@/lib/portfolio/ips-metrics";

import { ReportPage } from "../../report-page";

import { IpsAllocationChart } from "../../charts/ips-allocation-chart";
import { EfficientFrontierChart } from "../../charts/efficient-frontier-chart";

import { RISK_PROFILES } from "@/lib/engine/constants";

type Props = {
  plan: WealthPlan;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

const PROFILE_ORDER: RiskProfile[] = [
  "very_conservative",
  "conservative",
  "moderately_conservative",
  "moderate",
  "moderately_aggressive",
  "aggressive",
  "very_aggressive",
];

export function InvestmentPolicyStatementChartsPage({
  plan,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const risk = plan.clients[0]?.risk ?? "moderate";

  const ipsMetrics = calcIpsPortfolioMetrics(risk);

  const profiles = PROFILE_ORDER.map((profile) => {
    const values = RISK_PROFILES[profile];

    return {
      x: values.sigma,
      y: values.mu,
    };
  });

  const currentRiskProfile = RISK_PROFILES[risk];

  const current = {
    x: currentRiskProfile.sigma,
    y: currentRiskProfile.mu,
  };

  const allocationRows = [
    {
      label: "Global Equity",
      value: ipsMetrics.allocation.equity,
      color: "#0867b9",
    },
    {
      label: "Fixed Income",
      value: ipsMetrics.allocation.fixed_income,
      color: "#12a7a5",
    },
    {
      label: "Real Assets / REITs",
      value: ipsMetrics.allocation.real_estate,
      color: "#7037e8",
    },
    {
      label: "Alternatives",
      value: ipsMetrics.allocation.alternative,
      color: "#df8b17",
    },
    {
      label: "Cash & Equivalents",
      value: ipsMetrics.allocation.cash,
      color: "#7c8795",
    },
  ];

  return (
    <ReportPage
      clientName={clientName}
      title="Investment Policy Statement"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      {/* Allocation */}
      <p className="mt-3 text-[10px] leading-[1.55] text-[#5f666d]">
        The donut shows the target mix by asset class — the share of the
        portfolio each class is meant to hold.
      </p>

      <div className="mt-5 grid grid-cols-[180px_1fr] items-center gap-8">
        <div className="h-[155px] w-[155px]">
          <IpsAllocationChart allocation={ipsMetrics.allocation} />
        </div>

        <div>
          <div className="grid grid-cols-[1fr_80px_55px] border-b border-[#d8dde3] pb-2 text-[8px] font-semibold text-[#6b7280]">
            <span />
            <span className="text-right">Target</span>
          </div>

          <div className="mt-2">
            {allocationRows.map((item) => (
              <div
                key={item.label}
                className="grid grid-cols-[1fr_80px] items-center py-1.5 text-[9px]"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5"
                    style={{ backgroundColor: item.color }}
                  />

                  <span>{item.label}</span>
                </div>

                <span className="text-right font-semibold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Risk / return */}
      <div className="mt-8 border-t border-[#d8dde3] pt-5">
        <div className="text-[10px] font-bold text-[#173d60]">
          Risk / return positioning (efficient frontier)
        </div>

        <p className="mt-2 text-[9px] leading-[1.5] text-[#6b7280]">
          Each dot is a model risk profile plotted by its expected return and
          volatility. The highlighted dot is this household&apos;s policy
          positioning.
        </p>

        <div className="mt-4">
          <EfficientFrontierChart profiles={profiles} current={current} />
        </div>

        <div className="mt-3 text-[9px] font-semibold text-[#30343b]">
          Your profile{" "}
          <span className="text-[#0867b9]">
            μ {(ipsMetrics.geometricReturn * 100).toFixed(1)}%{" · "}σ{" "}
            {(ipsMetrics.volatility * 100).toFixed(1)}%
          </span>
        </div>
      </div>
    </ReportPage>
  );
}

"use client";

import type { WealthPlan } from "@/lib/engine/types";

import { ReportPage } from "../../report-page";
import { PortfolioEfficiencyChart } from "../../charts/portfolio-efficiency-chart";

import { calcReturnRiskMetrics } from "@/lib/portfolio/portfolio-metrics";

type Props = {
  plan: WealthPlan;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

const RISK_BANDS: Record<
  string,
  {
    label: string;
    min: number;
    max: number;
  }
> = {
  very_conservative: {
    label: "Very Conservative",
    min: 2,
    max: 5,
  },

  conservative: {
    label: "Conservative",
    min: 4,
    max: 8,
  },

  moderately_conservative: {
    label: "Moderately Conservative",
    min: 6,
    max: 10,
  },

  moderate: {
    label: "Moderate",
    min: 10,
    max: 14,
  },

  moderately_aggressive: {
    label: "Moderately Aggressive",
    min: 12,
    max: 17,
  },

  aggressive: {
    label: "Aggressive",
    min: 15,
    max: 20,
  },

  very_aggressive: {
    label: "Very Aggressive",
    min: 18,
    max: 24,
  },
};

export function PortfolioEfficiencyPage({
  plan,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const risk = plan.clients[0]?.risk ?? "moderate";

  const riskBand = RISK_BANDS[risk] ?? RISK_BANDS.moderate;

  const holdings = plan.holdings ?? [];

  const currentMetrics = calcReturnRiskMetrics(holdings, 0);

  const expectedReturn = currentMetrics?.netReturn ?? 0;
  const volatility = currentMetrics?.volatility ?? 0;

  return (
    <ReportPage
      clientName={clientName}
      title="Evaluating Portfolio Efficiency"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <div className="mt-3 border-l-[4px] border-[#0867b9] bg-[#dceaf7] px-3 py-2 text-[10px] font-bold text-[#173d60]">
        Evaluating the Efficiency of Your Portfolio
      </div>

      <p className="mt-3 text-[9px] leading-[1.55] text-[#4f565e]">
        The shaded region represents the risk band associated with your investor
        profile ({riskBand.label}). The diamond marks your current
        allocation&apos;s expected return and risk (standard deviation) under
        the plan&apos;s capital market assumptions.
      </p>

      <div className="mt-5 h-[310px]">
        <PortfolioEfficiencyChart
          expectedReturn={expectedReturn}
          volatility={volatility}
          riskLabel={riskBand.label}
          riskMin={riskBand.min}
          riskMax={riskBand.max}
        />
      </div>

      <div className="mt-4 flex items-center gap-8 text-[8px] text-[#555]">
        <div className="flex items-center gap-2">
          <span className="h-3 w-4 bg-[#aaae91]/60" />
          <span>Investor-profile risk band</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="inline-block h-3 w-3 rotate-45 bg-[#202938]" />

          <span>
            Current allocation — return {expectedReturn.toFixed(1)}% · risk{" "}
            {volatility.toFixed(1)}%
          </span>
        </div>
      </div>

      <p className="mt-5 text-[8px] leading-[1.5] text-[#6b7280]">
        A portfolio whose risk falls inside the shaded band is consistent with
        your stated investor profile. Note: the shaded region reflects
        volatility only — it does not guarantee any outcome.
      </p>
    </ReportPage>
  );
}

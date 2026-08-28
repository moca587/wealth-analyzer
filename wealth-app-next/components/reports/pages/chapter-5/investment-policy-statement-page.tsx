import type { WealthPlan } from "@/lib/engine/types";

import { ageFromDOB } from "@/lib/engine/financial-math";
import { RISK_PROFILES } from "@/lib/engine/constants";

import { calcIpsPortfolioMetrics } from "@/lib/portfolio/ips-metrics";

import { ReportPage } from "../../report-page";

type Props = {
  plan: WealthPlan;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function InvestmentPolicyStatementPage({
  plan,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const primary = plan.clients[0];

  const age = primary?.dob ? ageFromDOB(primary.dob) : undefined;

  const retirementAge = plan.retirement?.retirementAge ?? 65;

  const yearsToRetirement =
    age != null ? Math.max(0, retirementAge - age) : undefined;

  const riskKey = primary?.risk;

  const riskProfile = riskKey ? RISK_PROFILES[riskKey] : undefined;

  const riskLabel = riskProfile?.label ?? riskKey ?? "—";

  const ipsMetrics = calcIpsPortfolioMetrics(primary?.risk ?? "moderate");

  const expectedReturn = ipsMetrics.geometricReturn * 100;

  const volatility = ipsMetrics.volatility * 100;

  const inflation = plan.inflationRate;

  const realReturn =
    ((1 + ipsMetrics.geometricReturn) / (1 + inflation) - 1) * 100;
  const jurisdiction = formatCountry(primary?.country);

  console.log("IPS VALUES", {
    inflationRate: plan.inflationRate,
    returnMean: plan.returnMean,
    returnVolatility: plan.returnVolatility,
    risk: plan.clients[0]?.risk,
  });

  return (
    <ReportPage
      clientName={clientName}
      title="Investment Policy Statement"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      {/* Plain-language introduction */}
      <p className="mt-3 text-[10px] leading-[1.6] text-[#5f666d]">
        In plain terms: The rulebook for how your money is invested: what you
        are aiming for, how much risk is acceptable, and how the portfolio is
        kept on course. Agreeing the rules up front is what keeps decisions
        steady when markets are not.
      </p>

      {/* Formal IPS introduction */}
      <p className="mt-4 text-[9px] leading-[1.55] text-[#5f666d]">
        This Investment Policy Statement (&quot;IPS&quot;) establishes the
        objectives, constraints, strategic asset allocation and governance
        policies agreed for the management of the household portfolio. It is a
        working framework — not a contract — and grants no discretionary
        authority.
      </p>

      {/* Client information table */}
      <div className="mt-5">
        <div className="grid grid-cols-[34%_66%] bg-[#0867b9] px-3 py-2 text-[8px] font-bold text-white">
          <span>Item</span>
          <span>Value</span>
        </div>

        <InfoRow label="Client(s)" value={clientName} />

        <InfoRow label="Jurisdiction" value={jurisdiction} />

        <InfoRow label="Effective date" value={date} />

        <InfoRow
          label="Plan review"
          value="At least annually, and on life events or market events"
        />
      </div>

      {/* 1. Investment objectives */}
      <div className="mt-6">
        <SectionTitle>1. Investment objectives</SectionTitle>

        <p className="mt-3 text-[9px] leading-[1.65] text-[#4f565e]">
          The household is in a primarily accumulation phase
          {yearsToRetirement != null
            ? ` (~${yearsToRetirement} years to retirement at age ${retirementAge})`
            : ` (retirement planned at age ${retirementAge})`}
          .
          {expectedReturn != null && volatility != null && (
            <>
              {" "}
              The strategic allocation carries an expected long-term return of{" "}
              <strong>{expectedReturn.toFixed(1)}% per year</strong> (geometric,
              nominal) with estimated volatility of{" "}
              <strong>{volatility.toFixed(1)}%</strong>.
            </>
          )}
          {realReturn != null && (
            <>
              {" "}
              After {(inflation * 100).toFixed(1)}% inflation, the expected real
              return is about <strong>{realReturn.toFixed(1)}% per year</strong>
              .
            </>
          )}
        </p>
      </div>

      {/* 2. Risk tolerance */}
      <div className="mt-6">
        <SectionTitle>2. Risk tolerance</SectionTitle>

        <div className="mt-3">
          <div className="grid grid-cols-[45%_55%] bg-[#e7eff8] px-3 py-2 text-[8px] font-bold text-[#173d60]">
            <span>Dimension</span>
            <span>Assessment</span>
          </div>

          <RiskRow label="Willingness (stated)" value={riskLabel} />

          <RiskRow label="Ability (capacity)" value={getCapacityLabel(plan)} />

          <RiskRow label="Policy profile (governing)" value={riskLabel} />
        </div>

        <p className="mt-3 text-[9px] leading-[1.6] text-[#5f666d]">
          Where willingness and ability diverge, this IPS adopts the more
          conservative of the two. The policy profile drives the strategic
          allocation.
        </p>
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

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[34%_66%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px]">
      <span className="font-semibold text-[#5f666d]">{label}</span>

      <span className="text-[#30343b]">{value}</span>
    </div>
  );
}

function RiskRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[45%_55%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px]">
      <span className="text-[#5f666d]">{label}</span>

      <span className="font-semibold text-[#30343b]">{value}</span>
    </div>
  );
}

function formatCountry(country?: string): string {
  switch (country?.toUpperCase()) {
    case "US":
    case "USA":
      return "United States";

    case "UK":
    case "GB":
    case "GBR":
      return "United Kingdom";

    default:
      return country || "—";
  }
}

/*
 * TEMPORARY:
 *
 * If WealthPlan already stores a real risk-capacity / ability result,
 * use that instead.
 */
function getCapacityLabel(plan: WealthPlan): string {
  const primary = plan.clients[0];

  const age = primary?.dob ? ageFromDOB(primary.dob) : undefined;

  const retirementAge = plan.retirement?.retirementAge ?? 65;

  if (age != null && retirementAge - age >= 15) {
    return "Aggressive";
  }

  if (age != null && retirementAge - age >= 7) {
    return "Moderate";
  }

  return "Conservative";
}

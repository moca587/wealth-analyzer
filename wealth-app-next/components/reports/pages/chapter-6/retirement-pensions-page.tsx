"use client";

import type { WealthPlan } from "@/lib/engine/types";

import { ReportPage } from "../../report-page";

type Props = {
  plan: WealthPlan;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function RetirementPensionsPage({
  plan,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const pension = plan.pensions?.[0];

  if (!pension) {
    return (
      <ReportPage
        clientName={clientName}
        title="Retirement Pensions"
        date={date}
        page={page}
        totalPages={totalPages}
      >
        <p className="mt-5 text-[9px] text-[#6b7280]">
          No pension or state benefit is configured for this plan.
        </p>
      </ReportPage>
    );
  }

  const client =
    plan.clients.find((client) => client.id === pension.clientId) ??
    plan.clients[0];

  const pensionClientName = client?.first?.trim() || clientName;

  const country = formatCountry(client?.country ?? "US");

  const baseAnnualBenefit = pension.annualAmount || 0;

  const plannedClaimAge = pension.startAge || 67;

  const planToAge = plan.retirement?.planToAge ?? 90;

  const colaRate = pension.colaRate ?? plan.inflationRate ?? 0;

  console.log("PENSION COLA", {
    pension,
    colaRate,
  });

  // Legacy comparison table tests claiming ages 62–70.
  const claimAges = Array.from({ length: 9 }, (_, index) => 62 + index);

  const claimingRows = claimAges.map((claimAge) => {
    const annualBenefit = adjustedPensionBenefit(
      baseAnnualBenefit,
      plannedClaimAge,
      claimAge,
    );

    const yearsPaid = Math.max(0, planToAge - claimAge + 1);

    // const cumulativeTotal = annualBenefit * yearsPaid;
    const cumulativeTotal = cumulativePensionBenefit(
      annualBenefit,
      yearsPaid,
      colaRate,
    );

    return {
      claimAge,
      annualBenefit,
      cumulativeTotal,
    };
  });

  const planRow = claimingRows.find((row) => row.claimAge === plannedClaimAge);

  const planTotal = planRow?.cumulativeTotal ?? 0;

  const bestRow = claimingRows.reduce(
    (best, row) => (row.cumulativeTotal > best.cumulativeTotal ? row : best),
    claimingRows[0],
  );

  return (
    <ReportPage
      clientName={clientName}
      title="Retirement Pensions"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      {/* Intro */}
      <p className="mt-4 text-[9px] leading-[1.55] text-[#4f565e]">
        In plain terms: The state and occupational pensions your plan counts on
        based on your residence country ({country}).
      </p>

      {/* Configured pension */}
      <p className="mt-5 text-[8px] leading-[1.5] text-[#5f666d]">
        Configured state pension / social security, credited in the simulation
        from each start age:
      </p>

      <div className="mt-3">
        <div className="grid grid-cols-[25%_25%_20%_30%] bg-[#0867b9] px-3 py-2 text-[8px] font-bold text-white">
          <span>Client</span>
          <span>Annual benefit</span>
          <span>Starts</span>
          <span>Inflation adjustment</span>
        </div>

        <div className="grid grid-cols-[25%_25%_20%_30%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px] text-[#30343b]">
          <span>{pensionClientName}</span>

          <span>
            {formatMoney(baseAnnualBenefit, plan.currency)}
            /yr
          </span>

          <span>age {plannedClaimAge}</span>

          <span>{formatCola(colaRate)}</span>
        </div>
      </div>

      {/* Claiming-age explanation */}
      <p className="mt-5 text-[8px] leading-[1.5] text-[#4f565e]">
        Claiming age matters: each year of early claiming reduces the annual
        benefit by 7.0%, while each year of delay increases it by the same
        compounded rate.
      </p>

      <div className="mt-5 border-l-[4px] border-[#0867b9] bg-[#dceaf7] px-3 py-2 text-[10px] font-bold text-[#173d60]">
        Cumulative totals to age {planToAge} for {pensionClientName}{" "}
        <span className="font-normal">(nominal, before tax)</span>
      </div>

      {/* Claiming table */}
      <div className="mt-3">
        <div className="grid grid-cols-[23%_27%_27%_23%] bg-[#0867b9] px-3 py-2 text-[8px] font-bold text-white">
          <span>Claim at age</span>
          <span>Annual benefit</span>
          <span>Total by age {planToAge}</span>
          <span>vs your plan</span>
        </div>

        {claimingRows.map((row) => {
          const difference = row.cumulativeTotal - planTotal;

          const isPlan = row.claimAge === plannedClaimAge;

          const isBest = row.claimAge === bestRow.claimAge && !isPlan;

          return (
            <div
              key={row.claimAge}
              className="grid grid-cols-[23%_27%_27%_23%] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px] text-[#30343b]"
            >
              <span className={isPlan || isBest ? "font-bold" : ""}>
                {row.claimAge}

                {isPlan && <> (your plan)</>}

                {isBest && <> (best)</>}
              </span>

              <span>{formatMoney(row.annualBenefit, plan.currency)}</span>

              <span>{formatMoney(row.cumulativeTotal, plan.currency)}</span>

              <span>
                {isPlan ? "—" : formatSignedMoney(difference, plan.currency)}
              </span>
            </div>
          );
        })}
      </div>

      <p className="mt-5 text-[7.5px] leading-[1.5] text-[#6b7280]">
        Pension benefits are generally taxed as ordinary income; the simulation
        credits them from each configured start age with the selected inflation
        adjustment. Not tax advice.
      </p>
    </ReportPage>
  );
}

/**
 * Legacy claiming-age comparison:
 *
 * one year later  = benefit × 1.07
 * one year earlier = benefit ÷ 1.07
 *
 * Example:
 * $22,000 at age 67
 * age 68 = $23,540
 * age 69 = $25,188
 */
function adjustedPensionBenefit(
  baseBenefit: number,
  plannedAge: number,
  claimAge: number,
) {
  const yearDifference = claimAge - plannedAge;

  return baseBenefit * Math.pow(1.07, yearDifference);
}

function formatCola(colaRate: number) {
  if (colaRate > 0) {
    return "Adjusts with inflation (full COLA)";
  }

  return "No inflation adjustment";
}

function formatCountry(country: string) {
  switch (country) {
    case "US":
      return "United States";

    case "CA":
      return "Canada";

    case "GB":
      return "United Kingdom";

    case "CH":
      return "Switzerland";

    default:
      return country;
  }
}

function formatMoney(value: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatSignedMoney(value: number, currency: string) {
  if (Math.abs(value) < 0.5) {
    return "—";
  }

  const formatted = formatMoney(Math.abs(value), currency);

  return value > 0 ? `+${formatted}` : `-${formatted}`;
}

function cumulativePensionBenefit(
  startingAnnualBenefit: number,
  yearsPaid: number,
  colaRate: number,
) {
  if (yearsPaid <= 0) {
    return 0;
  }

  if (Math.abs(colaRate) < 1e-10) {
    return startingAnnualBenefit * yearsPaid;
  }

  let total = 0;

  for (let year = 0; year < yearsPaid; year++) {
    total += startingAnnualBenefit * Math.pow(1 + colaRate, year);
  }

  return total;
}

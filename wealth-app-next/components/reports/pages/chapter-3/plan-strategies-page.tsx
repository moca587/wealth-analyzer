import type { WealthPlan } from "@/lib/engine/types";

import { formatMoney } from "@/lib/engine/financial-math";

import { ReportPage } from "../../report-page";

type Props = {
  plan: WealthPlan;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function PlanStrategiesPage({
  plan,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const primary = plan.clients[0];

  const retirementAge = plan.retirement?.retirementAge;
  const annualSpending = plan.retirement?.annualSpending ?? 0;

  const currentAge = primary?.dob ? calculateAge(primary.dob) : undefined;

  const retirementYear =
    currentAge != null && retirementAge != null
      ? new Date().getFullYear() + (retirementAge - currentAge)
      : undefined;

  const pension = plan.pensions?.[0];

  const riskLabel = formatRisk(primary?.risk);

  return (
    <ReportPage
      clientName={clientName}
      title="Plan Strategies"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <p className="mt-3 text-[10px] leading-4 text-[#5f666d]">
        A summary of the strategies reflected in this plan, in plain language.
      </p>

      <div className="mt-7 space-y-4">
        {/* Lifestyle */}
        <StrategyRow
          title="Lifestyle"
          text={
            retirementAge != null && annualSpending > 0
              ? `${primary?.first || clientName} plans to retire at age ${retirementAge}${
                  retirementYear ? ` (${retirementYear})` : ""
                }, spending ${formatMoney(
                  annualSpending,
                  plan.currency,
                )} per year in retirement (today's money).`
              : "Retirement assumptions have not yet been fully configured."
          }
        />

        {/* Income */}
        <StrategyRow
          title="Income"
          text={
            pension
              ? `claim ${pension.label || "pension"} of ${formatMoney(
                  pension.annualAmount,
                  plan.currency,
                )}/yr from age ${pension.startAge}.`
              : "No pension or state benefit is currently included."
          }
        />

        {/* Saving */}
        <StrategyRow
          title="Saving"
          text={
            plan.annualSavings > 0
              ? `set aside ${formatMoney(
                  plan.annualSavings,
                  plan.currency,
                )} per year while working.`
              : "No annual savings contribution is currently specified."
          }
        />

        {/* Goals */}
        {plan.goals.length > 0 ? (
          plan.goals.map((goal) => (
            <StrategyRow
              key={goal.id}
              title="Goal"
              text={`fund "${goal.name}" at ${formatMoney(
                goal.amt,
                plan.currency,
              )}/yr from ${goal.startYear} to ${goal.endYear}${
                goal.tier ? ` (${goal.tier})` : ""
              }.`}
            />
          ))
        ) : (
          <StrategyRow
            title="Goal"
            text="No additional financial goals are currently specified."
          />
        )}

        {/* Investing */}
        <StrategyRow
          title="Investing"
          text={
            riskLabel
              ? `maintain the ${riskLabel} allocation based on the household's selected risk profile.`
              : "Maintain the portfolio allocation reflected in the current plan."
          }
        />
      </div>
    </ReportPage>
  );
}

function StrategyRow({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex gap-3 text-[11px] leading-5 text-[#4f565e]">
      <span className="mt-[8px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#0867b9]" />

      <p>
        <strong className="text-[#30343b]">{title}</strong>
        {" — "}
        {text}
      </p>
    </div>
  );
}

function calculateAge(dob: string): number | undefined {
  const birthDate = new Date(dob);

  if (Number.isNaN(birthDate.getTime())) {
    return undefined;
  }

  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const beforeBirthday =
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate());

  if (beforeBirthday) {
    age--;
  }

  return age;
}

function formatRisk(risk?: string): string | undefined {
  if (!risk) {
    return undefined;
  }

  return risk
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

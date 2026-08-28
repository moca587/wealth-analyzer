import type { WealthPlan } from "@/lib/engine/types";

import { ReportPage } from "../../report-page";

type Props = {
  plan: WealthPlan;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function MethodologyAssumptionsPage({
  plan,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const inflation = (plan.inflationRate ?? 0) * 100;

  return (
    <ReportPage
      clientName={clientName}
      title="Methodology & Assumptions"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <div className="mt-5 space-y-4">
        <MethodologyItem
          title="Return simulation"
          text="Log-normal returns are sampled using a Box-Muller normal draw. Each annual portfolio return incorporates the configured expected return and volatility, producing a distribution of possible outcomes rather than a single deterministic path."
        />

        <MethodologyItem
          title="Asset growth"
          text="Investable assets grow using the sampled portfolio return derived from the portfolio's asset-class allocation and capital market assumptions. Taxable and tax-deferred investment pools receive the same portfolio return. Property is modeled separately using its own stochastic appreciation assumption."
        />

        <MethodologyItem
          title="Savings & surplus"
          text="While working, after-tax income is reduced by inflation-adjusted expenses and debt service. Any remaining cash-flow surplus is added to the taxable investment pool, while a cash-flow deficit reduces available liquid assets."
        />

        <MethodologyItem
          title="Debt amortisation"
          text="Each loan amortises over its configured remaining term using standard loan-payment mathematics. Outstanding balances decline as scheduled payments are made."
        />

        <MethodologyItem
          title="Net figures"
          text="Projections incorporate the planning engine's income-tax assumptions. Working income, pension income, required minimum distributions and tax-deferred retirement withdrawals are modeled with applicable tax calculations. These are planning assumptions, not tax advice; consult a qualified tax professional for individual tax matters."
        />

        <MethodologyItem
          title="Retirement drawdown"
          text="At retirement, earned income stops and the model transitions to retirement spending and retirement-income assumptions. Pension benefits and applicable retirement-account withdrawals are credited according to their configured ages and plan rules."
        />

        <MethodologyItem
          title="Inflation"
          text={`Working expenses, retirement spending and goal costs compound using the plan's configured annual inflation assumption of ${inflation.toFixed(
            1,
          )}%. Pension benefits grow separately according to each pension's configured COLA rate, if any.`}
        />
      </div>
    </ReportPage>
  );
}

function MethodologyItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="border-b border-[#e1e5ea] pb-3">
      <p className="text-[8.5px] leading-[1.6] text-[#4f565e]">
        <strong className="font-bold text-[#30343b]">{title}:</strong> {text}
      </p>
    </div>
  );
}

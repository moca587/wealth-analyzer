import type {
  WealthPlan,
} from "@/lib/engine/types";

import {
  ageFromDOB,
  calcRetirementNumber,
  formatMoney,
} from "@/lib/engine/financial-math";

type Props = {
  plan: WealthPlan;
};

export function RetirementNumberSection({
  plan,
}: Props) {
  // The retirement calculation needs a client
  // and an enabled retirement plan.
  const client =
    plan.clients[0];

  const retirement =
    plan.retirement;

  if (
    !client ||
    !retirement ||
    !retirement.enabled
  ) {
    return (
      <section className={sectionClass}>
        <h2 className={titleClass}>
          Your Personal Retirement Number
        </h2>

        <p className="mt-3 text-[11px] text-[#9ca3af]">
          Enable retirement planning to
          calculate your retirement number.
        </p>
      </section>
    );
  }

  // Calculate the client's current age
  // from the date of birth.
  const currentAge =
    client.dob
      ? ageFromDOB(
          client.dob
        ) ?? 40
      : 40;

  // The existing retirement-number helper
  // expects a life-expectancy input.
  //
  // Until country-specific life expectancy is
  // wired here, use 83 as the input. The helper
  // itself applies a minimum planning age of 98.
  const lifeExpectancy = 83;

  // Calculate the retirement target using the
  // existing financial-math helper.
  const retirementNumber =
    calcRetirementNumber(
      currentAge,
      retirement.retirementAge,
      retirement.annualSpending,
      plan.inflationRate,
      lifeExpectancy,
      0.068
    );

  // Current net worth =
  // total assets - outstanding debt.
  const totalAssets =
    (plan.assets ?? []).reduce(
      (sum, asset) =>
        sum +
        Number(asset.value || 0),
      0
    );

  const totalDebt =
    (plan.loans ?? []).reduce(
      (sum, loan) =>
        sum +
        Number(loan.bal || 0),
      0
    );

  const currentNetWorth =
    totalAssets - totalDebt;

  // Compare today's present-value retirement
  // target with current net worth.
  //
  // Positive = funding gap.
  // Negative = surplus.
  const fundingGap =
    retirementNumber.pvToday -
    currentNetWorth;

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Your Personal Retirement Number
      </h2>

      <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
        The lump-sum you would theoretically
        need today to purchase an
        inflation-adjusted annuity from a
        highly-rated issuer — funding your
        retirement income from your target
        retirement age through age{" "}

        <strong className="text-[#16213e]">
          {retirementNumber.planAge}
        </strong>{" "}

        (a longevity horizon set from your
        residence country&apos;s life expectancy).
        Calculated using a{" "}

        <strong className="text-[#16213e]">
          6.8% discount rate
        </strong>{" "}

        and your configured inflation
        assumption, based on standard
        actuarial present-value formulas.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Retirement Number"
          value={formatMoney(
            retirementNumber.pvAtRet,
            plan.currency
          )}
          description="lump sum needed at retirement"
        />

        <MetricCard
          label="Present Value Today"
          value={formatMoney(
            retirementNumber.pvToday,
            plan.currency
          )}
          description="discounted to today's dollars"
        />

        <MetricCard
          label="Current Net Worth"
          value={formatMoney(
            currentNetWorth,
            plan.currency
          )}
          description="vs. target above"
        />

        <MetricCard
          label="Funding Gap / Surplus"
          value={formatMoney(
            Math.abs(fundingGap),
            plan.currency
          )}
          description={
            fundingGap > 0
              ? "Additional savings needed to meet target"
              : "Current wealth exceeds the present-value target"
          }
        />
      </div>

      <div className="mt-5 rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] px-4 py-3">
        <p className="text-[10px] leading-5 text-[#64748b]">
          <strong className="text-[#16213e]">
            Formula:
          </strong>{" "}
          PV = AnnualSpend × [1 − (1 +
          realRate)<sup>−n</sup>] / realRate,
          where realRate = (discountRate −
          inflation) / (1 + inflation) and n
          = years from retirement age to age{" "}

          {retirementNumber.planAge}.

          {" "}The result is then discounted
          back to today at the nominal discount
          rate.
        </p>

        <p className="mt-2 text-[10px] leading-5 text-[#9ca3af]">
          Annuity pricing assumes a 6.8%
          discount rate with your configured
          inflation rate (
          {(plan.inflationRate * 100).toFixed(1)}
          %). Run the simulation or update
          expenses to refresh.
        </p>
      </div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-5">
      <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]">
        {label}
      </div>

      <div className="mt-2 text-[24px] font-extrabold tracking-tight text-[#16213e]">
        {value}
      </div>

      <div className="mt-1 text-[10px] leading-4 text-[#64748b]">
        {description}
      </div>
    </div>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";
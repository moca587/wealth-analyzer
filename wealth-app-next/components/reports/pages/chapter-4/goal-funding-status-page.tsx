import type { WealthPlan, SimulationResult } from "@/lib/engine/types";

import { formatMoney } from "@/lib/engine/financial-math";

import { ReportPage } from "../../report-page";

import { GoalFundingChart } from "../../charts/goal-funding-chart";

type Props = {
  plan: WealthPlan;
  result: SimulationResult;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function GoalFundingStatusPage({
  plan,
  result,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const goals = plan.goals ?? [];

  // -------------------------------------------------------
  // Goal funding
  //
  // TEMPORARY funding-cost calculation.
  //
  // The legacy report uses a true present-value calculation
  // with tax gross-up and priority/confidence discounting.
  //
  // Replace this function later with your existing
  // goal-funding / PV helper if one already exists.
  // -------------------------------------------------------

  const goalFundingRows = goals.map((goal) => {
    const years = Math.max(1, goal.endYear - goal.startYear + 1);

    const goalAmount = goal.amt * years;

    const simulationGoal = result.goalSuccess.find(
      (item) => item.goalId === goal.id,
    );

    const probability = simulationGoal?.probability ?? 0;

    const fundedAmount = goalAmount * Math.min(1, Math.max(0, probability));

    const shortfall = Math.max(0, goalAmount - fundedAmount);

    const fundingPct =
      goalAmount > 0 ? Math.min(100, (fundedAmount / goalAmount) * 100) : 0;

    return {
      goal,
      goalAmount,
      fundedAmount,
      shortfall,
      fundingPct,
    };
  });

  const estimatedGoalCost = goalFundingRows.reduce(
    (sum, row) => sum + row.goalAmount,
    0,
  );

  const totalFunded = goalFundingRows.reduce(
    (sum, row) => sum + row.fundedAmount,
    0,
  );

  const overallFundingPct =
    estimatedGoalCost > 0
      ? Math.min(100, (totalFunded / estimatedGoalCost) * 100)
      : 0;

  // -------------------------------------------------------
  // Retirement timing
  // -------------------------------------------------------

  const primary = plan.clients[0];

  const retirementAge = plan.retirement?.retirementAge;

  const currentAge = primary?.dob ? calculateAge(primary.dob) : undefined;

  const currentYear = new Date().getFullYear();

  const retirementYear =
    currentAge != null && retirementAge != null
      ? currentYear + (retirementAge - currentAge)
      : undefined;

  return (
    <ReportPage
      clientName={clientName}
      title="Key Factors: Goal Funding Status"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      {/* Explanation */}
      <p className="mt-3 text-[10px] leading-[1.6] text-[#5f666d]">
        This overview compares the present-value (PV) cost of your goals —
        grossed up for tax — against the assets and future savings allocated to
        them in priority order. Each goal is discounted at a return matched to
        its confidence level (Essential 95%, Important 75%, Aspirational 55%).
      </p>

      {/* Main top section */}
      <div className="mt-6 grid grid-cols-[47%_51%] gap-[2%]">
        {/* ---------------------------------------------- */}
        {/* LEFT — funding chart                           */}
        {/* ---------------------------------------------- */}

        <div>
          <SectionHeader
            title="Estimated Cost of Your Goals"
            right={formatMoney(estimatedGoalCost, plan.currency)}
          />

          <div className="relative mt-4">
            <GoalFundingChart
              assets={totalFunded}
              goalCost={estimatedGoalCost}
              currency={plan.currency}
            />

            {/* 100% funded circle */}
            <div
              className="absolute left-1/2 top-[48px] grid h-[78px] w-[78px] -translate-x-1/2 place-items-center rounded-full border-[11px] bg-white"
              style={{
                borderColor: fundingColor(overallFundingPct),
              }}
            >
              <div className="text-center">
                <div
                  className="text-[11px] font-bold"
                  style={{
                    color: fundingColor(overallFundingPct),
                  }}
                >
                  {overallFundingPct.toFixed(0)}%
                </div>

                <div
                  className="text-[7px] font-bold"
                  style={{
                    color: fundingColor(overallFundingPct),
                  }}
                >
                  FUNDED
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------------------------------------- */}
        {/* RIGHT — goal cards                             */}
        {/* ---------------------------------------------- */}

        <div>
          <SectionHeader
            title="Goals"
            right={`${goals.length} ${goals.length === 1 ? "goal" : "goals"}`}
          />

          <div className="mt-4 space-y-3">
            {goalFundingRows.length > 0 ? (
              goalFundingRows.map((row) => (
                <GoalCard
                  key={row.goal.id}
                  name={row.goal.name}
                  tier={row.goal.tier}
                  amount={row.goalAmount}
                  funded={row.fundedAmount}
                  shortfall={row.shortfall}
                  pct={row.fundingPct}
                  currency={plan.currency}
                />
              ))
            ) : (
              <div className="rounded-md border border-[#d8dde3] bg-[#fafbfc] px-4 py-4 text-[9px] italic text-[#8a9098]">
                No goals have been added to this plan.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Funding explanation */}
      <p className="mt-5 text-[8px] leading-4 text-[#747b83]">
        Funding ratios at or above 100% indicate a fully funded goal; lower
        ratios indicate a present-value shortfall to close through added
        savings, return, or a revised goal. Hypothetical and not guaranteed.
      </p>

      {/* ------------------------------------------------ */}
      {/* Future income / savings                          */}
      {/* ------------------------------------------------ */}

      <div className="mt-5">
        <SectionHeader title="Estimated Future Income / Savings" />

        <div className="mt-3">
          {/* Header */}
          <div className="grid grid-cols-[1.35fr_1fr_.65fr] bg-[#0867b9] px-3 py-2 text-[8px] font-bold text-white">
            <span>Description</span>

            <span>Time period</span>

            <span>Annual amount</span>
          </div>

          {/* Income */}
          {plan.incomes.map((income) => (
            <FutureRow
              key={income.id}
              description={`${income.source}${
                primary?.first ? ` — ${primary.first}` : ""
              }`}
              period={
                retirementYear != null
                  ? `${currentYear} until retirement (${retirementYear})`
                  : "While working"
              }
              amount={formatMoney(income.amount, plan.currency)}
            />
          ))}

          {/* Pensions */}
          {(plan.pensions ?? []).map((pension) => {
            const pensionStartYear =
              currentAge != null
                ? currentYear + (pension.startAge - currentAge)
                : undefined;

            return (
              <FutureRow
                key={pension.id}
                description={`State pension / Social Security${
                  primary?.first ? ` — ${primary.first}` : ""
                }`}
                period={
                  pensionStartYear != null
                    ? `${pensionStartYear} through rest of life`
                    : `From age ${pension.startAge} through rest of life`
                }
                amount={formatMoney(pension.annualAmount, plan.currency)}
              />
            );
          })}

          {/* Annual savings */}
          <FutureRow
            description="Committed annual savings"
            period={
              retirementYear != null
                ? `${currentYear} until retirement (${retirementYear})`
                : "While working"
            }
            amount={formatMoney(plan.annualSavings, plan.currency)}
          />
        </div>
      </div>
    </ReportPage>
  );
}

// ---------------------------------------------------------------------------
// Goal card
// ---------------------------------------------------------------------------

function GoalCard({
  name,
  tier,
  amount,
  funded,
  shortfall,
  pct,
  currency,
}: {
  name: string;
  tier?: "essential" | "important" | "aspirational";
  amount: number;
  funded: number;
  shortfall: number;
  pct: number;
  currency: string;
}) {
  const color = fundingColor(pct);

  return (
    <div className="rounded-md border border-[#d8dde3] bg-[#fafbfc] px-4 py-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[7px] font-bold uppercase tracking-[0.08em] text-[#7c828a]">
            {formatTier(tier)}
          </div>

          <div className="mt-1 text-[13px] font-bold text-[#30343b]">
            {name}
          </div>
        </div>

        <div
          className="rounded px-3 py-1 text-[8px] font-bold text-white"
          style={{
            backgroundColor: color,
          }}
        >
          {pct.toFixed(0)}% FUNDED
        </div>
      </div>

      <div className="mt-3 space-y-1">
        <MetricLine
          label="Goal amount (PV)"
          value={formatMoney(amount, currency)}
        />

        <MetricLine
          label="Funded — assets + future savings"
          value={formatMoney(funded, currency)}
        />

        <MetricLine
          label="Shortfall"
          value={formatMoney(shortfall, currency)}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function SectionHeader({ title, right }: { title: string; right?: string }) {
  return (
    <div className="flex items-center justify-between border-l-[3px] border-[#0867b9] bg-[#e7eff8] px-3 py-2">
      <span className="text-[9px] font-bold uppercase text-[#173d60]">
        {title}
      </span>

      {right && (
        <span className="text-[9px] font-bold text-[#30343b]">{right}</span>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Goal-card metric
// ---------------------------------------------------------------------------

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-[8px]">
      <span className="text-[#6b7280]">{label}</span>

      <span className="font-bold text-[#30343b]">{value}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Future-income table row
// ---------------------------------------------------------------------------

function FutureRow({
  description,
  period,
  amount,
}: {
  description: string;
  period: string;
  amount: string;
}) {
  return (
    <div className="grid grid-cols-[1.35fr_1fr_.65fr] border-b border-x border-[#d8dde3] px-3 py-2 text-[8px] text-[#30343b]">
      <span>{description}</span>

      <span>{period}</span>

      <span>{amount}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fundingColor(pct: number): string {
  if (pct >= 100) {
    return "#1b7651";
  }

  if (pct >= 75) {
    return "#d99a24";
  }

  return "#c94a4a";
}

function formatTier(
  tier: "essential" | "important" | "aspirational" | undefined,
): string {
  switch (tier) {
    case "essential":
      return "Essential";

    case "important":
      return "Important";

    case "aspirational":
      return "Aspirational";

    default:
      return "Goal";
  }
}

function calculateAge(dob: string): number | undefined {
  const birth = new Date(dob);

  if (Number.isNaN(birth.getTime())) {
    return undefined;
  }

  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();

  const beforeBirthday =
    today.getMonth() < birth.getMonth() ||
    (today.getMonth() === birth.getMonth() &&
      today.getDate() < birth.getDate());

  if (beforeBirthday) {
    age--;
  }

  return age;
}

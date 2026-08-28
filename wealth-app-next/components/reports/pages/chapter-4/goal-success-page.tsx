import type { WealthPlan, SimulationResult } from "@/lib/engine/types";

import { formatMoney } from "@/lib/engine/financial-math";

import { ReportPage } from "../../report-page";

type GoalSuccess = {
  goalId: string;
  successPct: number;
};

type Props = {
  plan: WealthPlan;
  result: SimulationResult;
  clientName: string;
  date: string;
  page: number;
  totalPages: number;
};

export function GoalSuccessPage({
  plan,
  result,
  clientName,
  date,
  page,
  totalPages,
}: Props) {
  const goals = plan.goals ?? [];

  function getSuccessPct(goalId: string) {
    const resultForGoal = result.goalSuccess.find(
      (goal) => goal.goalId === goalId,
    );

    return resultForGoal ? resultForGoal.probability * 100 : 0;
  }

  const lowestSuccess =
    goals.length > 0
      ? Math.min(...goals.map((goal) => getSuccessPct(goal.id)))
      : 0;

  return (
    <ReportPage
      clientName={clientName}
      title="Goal Success Probability"
      date={date}
      page={page}
      totalPages={totalPages}
    >
      <p className="mt-3 max-w-[95%] text-[10px] leading-[1.6] text-[#5f666d]">
        In plain terms: For each goal: in what share of the simulated futures
        could the plan pay for it when it came due? Green means on track, amber
        needs attention, red is at risk — and the marker shape carries the same
        message for color-blind readers.
      </p>

      {/* GOAL BARS */}
      <div className="mt-7 space-y-6">
        {goals.map((goal) => {
          const successPct = getSuccessPct(goal.id);

          return (
            <div key={goal.id}>
              <div className="mb-2 flex items-end justify-between">
                <div>
                  <div className="text-[11px] font-bold text-[#30343b]">
                    {goal.name}
                  </div>

                  <div className="mt-1 text-[8px] text-[#7c828a]">
                    {formatMoney(goal.amt, plan.currency)}/yr · {goal.startYear}
                    –{goal.endYear}
                  </div>
                </div>

                <div className="text-[15px] font-bold text-[#30343b]">
                  {successPct.toFixed(0)}%
                </div>
              </div>

              <SuccessBar value={successPct} />
            </div>
          );
        })}
      </div>

      {/* TABLE */}
      <div className="mt-8">
        <div className="grid grid-cols-[1.5fr_1fr_1fr_1fr] border-b border-[#cfd5dc] pb-2 text-[8px] font-bold text-[#70777e]">
          <span>Goal</span>
          <span>Annual amount</span>
          <span>Years</span>
          <span className="text-right">Success probability</span>
        </div>

        <div>
          {goals.map((goal) => {
            const successPct = getSuccessPct(goal.id);

            return (
              <div
                key={goal.id}
                className="grid grid-cols-[1.5fr_1fr_1fr_1fr] border-b border-[#e5e8ec] py-3 text-[9px] text-[#30343b]"
              >
                <span className="font-semibold">{goal.name}</span>

                <span>
                  {formatMoney(goal.amt, plan.currency)}
                  /yr
                </span>

                <span>
                  {goal.startYear}–{goal.endYear}
                </span>

                <span className="text-right font-bold">
                  {successPct.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* EXPLANATION */}
      <div className="mt-8 rounded-lg bg-[#f3f8f5] px-5 py-4">
        <div className="text-[8px] font-bold uppercase tracking-[0.12em] text-[#6d7770]">
          What this means for you
        </div>

        <p className="mt-2 text-[10px] leading-5 text-[#5f666d]">
          {goals.length === 0
            ? "No goals have been entered into the plan."
            : lowestSuccess >= 90
              ? `Every goal is funded in at least ${lowestSuccess.toFixed(
                  0,
                )}% of simulated futures — the plan as entered carries them comfortably. Revisit after any large life change.`
              : lowestSuccess >= 70
                ? `Some goals may need attention. The lowest goal success probability is ${lowestSuccess.toFixed(
                    0,
                  )}%.`
                : `At least one goal is at risk. The lowest goal success probability is ${lowestSuccess.toFixed(
                    0,
                  )}%. Consider adjusting the goal, savings, timing or investment strategy.`}
        </p>
      </div>
    </ReportPage>
  );
}

function SuccessBar({ value }: { value: number }) {
  const width = Math.max(0, Math.min(100, value));

  const barColor =
    value >= 90
      ? "bg-[#16805b]"
      : value >= 70
        ? "bg-[#d99a24]"
        : "bg-[#c94a4a]";

  const marker = value >= 90 ? "●" : value >= 70 ? "▲" : "■";

  return (
    <div className="relative h-5 overflow-hidden rounded-sm bg-[#edf0f3]">
      <div
        className={`h-full ${barColor}`}
        style={{
          width: `${width}%`,
        }}
      />

      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] text-[#30343b]">
        {marker}
      </span>
    </div>
  );
}

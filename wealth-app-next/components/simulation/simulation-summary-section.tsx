import type {
  SimulationResult,
} from "@/lib/engine/types";

import {
  formatMoney,
} from "@/lib/engine/financial-math";

type Props = {
  result: SimulationResult;
  currency: string;

  sustainableSpend?: number;
  retirementFunding?: number;
};

export function SimulationSummarySection({
  result, // monte carlo result
  currency,
  sustainableSpend,
  retirementFunding,
}: Props) {
  const projectedWealth =
    result.realFinal.p50; // 50th percentile of final wealth distribution

  const goalSuccess =
    result.goalSuccess.length > 0
      ? result.goalSuccess.reduce(
          (sum, goal) =>
            sum + goal.probability,
          0
        ) / result.goalSuccess.length // divide by number of goals
      : undefined;

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <SummaryCard
        label="Projected wealth"
        value={formatMoney(
          projectedWealth,
          currency
        )}
        description="median · today's money"
      />

      <SummaryCard
        label="Goal success"
        value={
          goalSuccess != null
            ? `${(
                goalSuccess * 100
              ).toFixed(0)}%`
            : "—"
        }
        description="across your goals"
      />

      <SummaryCard
        label="Sustainable spend"
        value={
          sustainableSpend != null
            ? formatMoney(
                sustainableSpend,
                currency
              )
            : "—"
        }
        description="per year · today's money"
      />

      <SummaryCard
        label="Retirement funding"
        value={
          retirementFunding != null
            ? formatMoney(
                retirementFunding,
                currency
              )
            : "—"
        }
        description="vs. present-value target"
      />
    </section>
  );
}

function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <div className={cardClass}>
      <div className={labelClass}>
        {label}
      </div>

      <div className="mt-2 text-[24px] font-extrabold tracking-tight text-[#16213e]">
        {value}
      </div>

      <div className="mt-1 text-[11px] text-[#64748b]">
        {description}
      </div>
    </div>
  );
}

const cardClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-5 shadow-sm";

const labelClass =
  "text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748b]";
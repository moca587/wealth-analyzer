import type { SimulationResult } from "@/lib/engine/types";

type Props = {
  result: SimulationResult;
};

export function GoalFundingSection({
  result,
}: Props) {
  const goals = result.goalSuccess;

  const averageSuccess =
    goals.length > 0
      ? goals.reduce(
          (sum, goal) =>
            sum + goal.probability,
          0
        ) / goals.length
      : undefined;

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Goal Funding Probability + Present Value
      </h2>

      <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
        Each goal is scored using the simulated
        probability of being fully funded. To do: Present-value
        funding metrics. 
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <SummaryCard
          label="Simulated success"
          value={
            averageSuccess != null
              ? formatProbability(
                  averageSuccess
                )
              : "—"
          }
          description="Average probability across all goals, from the simulated outcomes"
        />

        <SummaryCard
          label="PV funding ratio"
          value="—"
          description="Present-value funding calculation not wired yet"
        />
      </div>

      <div className="mt-6 space-y-4">
        {goals.length === 0 ? (
          <div className="rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] px-4 py-6 text-center text-[11px] italic text-[#9ca3af]">
            No goals available.
          </div>
        ) : (
          goals.map((goal) => (
            <GoalFundingCard
              key={goal.goalId}
              name={
                goal.goalName ||
                "Unnamed goal"
              }
              probability={
                goal.probability
              }
            />
          ))
        )}
      </div>

      <div className="mt-6 grid gap-3 md:grid-cols-4">
        <LegendItem
          label="Fully funded"
          description="probability ≥ 80%"
        />

        <LegendItem
          label="Partly funded"
          description="50–79%"
        />

        <LegendItem
          label="At risk"
          description="25–49%"
        />

        <LegendItem
          label="Underfunded"
          description="< 25%"
        />
      </div>

      <p className="mt-5 text-[10px] leading-5 text-[#9ca3af]">
        Simulated success is taken from the Monte Carlo
        goal-success result for each goal.
      </p>
    </section>
  );
}

function GoalFundingCard({
  name,
  probability,
}: {
  name: string;
  probability: number;
}) {
  const pct =
    Math.min(
      100,
      Math.max(
        0,
        probability * 100
      )
    );

  return (
    <div className="rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[12px] font-bold text-[#16213e]">
            {name}
          </div>

          <div className="mt-1 text-[10px] text-[#9ca3af]">
            Simulated success
          </div>
        </div>

        <div
          className={`text-[20px] font-extrabold ${successColor(
            probability
          )}`}
        >
          {formatProbability(
            probability
          )}
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#e8eef8]">
        <div
          className={`h-full rounded-full transition-all ${successBarColor(
            probability
          )}`}
          style={{
            width: `${pct}%`,
          }}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div>
          <div className="text-[9px] font-bold uppercase tracking-[0.06em] text-[#64748b]">
            Simulated success
          </div>

          <div className="mt-1 text-[12px] font-semibold text-[#16213e]">
            {formatProbability(
              probability
            )}
          </div>
        </div>

        <div>
          <div className="text-[9px] font-bold uppercase tracking-[0.06em] text-[#64748b]">
            PV funding ratio
          </div>

          <div className="mt-1 text-[12px] font-semibold text-[#9ca3af]">
            —
          </div>
        </div>
      </div>
    </div>
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
    <div className="rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
      <div className="text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]">
        {label}
      </div>

      <div className="mt-2 text-[26px] font-extrabold tracking-tight text-[#16213e]">
        {value}
      </div>

      <div className="mt-1 text-[10px] leading-4 text-[#9ca3af]">
        {description}
      </div>
    </div>
  );
}

function LegendItem({
  label,
  description,
}: {
  label: string;
  description: string;
}) {
  return (
    <div className="rounded-lg bg-[#f8faff] px-3 py-2">
      <div className="text-[10px] font-bold text-[#16213e]">
        {label}
      </div>

      <div className="mt-0.5 text-[9px] text-[#9ca3af]">
        {description}
      </div>
    </div>
  );
}

function formatProbability(
  value: number
): string {
  return `${(
    value * 100
  ).toFixed(0)}%`;
}

function successColor(
  probability: number
): string {
  if (probability >= 0.8) {
    return "text-[#00875a]";
  }

  if (probability >= 0.5) {
    return "text-amber-500";
  }

  return "text-red-500";
}

function successBarColor(
  probability: number
): string {
  if (probability >= 0.8) {
    return "bg-[#00875a]";
  }

  if (probability >= 0.5) {
    return "bg-amber-500";
  }

  return "bg-red-500";
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";
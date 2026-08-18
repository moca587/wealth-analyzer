import {
  formatSuccess,
  formatPointDelta,
} from "@/lib/portfolio-comparison/format";

type GoalComparisonRow = {
  id: string;
  name: string;
  targetYear?: number;

  currentSuccess?: number;
  proposedSuccess?: number;
};

type Props = {
  goals: GoalComparisonRow[];
};

export function GoalsComparisonSection({
  goals,
}: Props) {
  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Likelihood of Reaching Each Goal
      </h2>

      <p className="mt-2 text-[12px] leading-5 text-[#64748b]">
        Each goal is evaluated under both portfolios using the same
        household income, expenses, savings, debt schedule, and inflation.
        Δ is the change in success rate moving from Current to Proposed.
      </p>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-[rgba(0,87,184,.10)] bg-[#f8faff]">
              <th className={thClass}>
                Goal
              </th>

              <th className={numberThClass}>
                Target Yr
              </th>

              <th className={numberThClass}>
                Current
              </th>

              <th className={numberThClass}>
                Proposed
              </th>

              <th className={numberThClass}>
                Δ
              </th>
            </tr>
          </thead>

          <tbody>
            {goals.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-3 py-6 text-center text-[11px] italic text-[#9ca3af]"
                >
                  No goals available.
                </td>
              </tr>
            ) : (
              goals.map((goal) => (
                <GoalRow
                  key={goal.id}
                  goal={goal}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function GoalRow({
  goal,
}: {
  goal: GoalComparisonRow;
}) {
  const delta =
    goal.currentSuccess != null &&
    goal.proposedSuccess != null
      ? goal.proposedSuccess -
        goal.currentSuccess
      : undefined;

  return (
    <tr className="border-b border-[rgba(0,87,184,.07)] last:border-b-0">
      <td className={tdClass}>
        <span className="font-semibold text-[#16213e]">
          {goal.name}
        </span>
      </td>

      <td className={numberTdClass}>
        {goal.targetYear ?? "—"}
      </td>

      <td className={numberTdClass}>
        {formatSuccess(
          goal.currentSuccess
        )}
      </td>

      <td className={numberTdClass}>
        {formatSuccess(
          goal.proposedSuccess
        )}
      </td>

      <td className={numberTdClass}>
        <span
          className={
            delta == null
              ? "text-[#9ca3af]"
              : delta > 0
                ? "font-bold text-[#00875a]"
                : delta < 0
                  ? "font-bold text-red-500"
                  : "font-bold text-[#64748b]"
          }
        >
          {formatPointDelta(delta)}
        </span>
      </td>
    </tr>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const thClass =
  "px-3 py-2 text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]";

const numberThClass =
  "px-3 py-2 text-right text-[10px] font-bold uppercase tracking-[0.06em] text-[#64748b]";

const tdClass =
  "px-3 py-3 text-[11px]";

const numberTdClass =
  "px-3 py-3 text-right text-[11px] tabular-nums text-[#16213e]";
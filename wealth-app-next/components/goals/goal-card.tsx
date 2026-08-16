import type { Goal } from "@/lib/engine/types";
import { formatMoney } from "@/lib/engine/financial-math";

export function GoalCard({
  goal,
  currency,
  onRemove,
}: {
  goal: Goal;
  currency: string;
  onRemove: () => void;
}) {
  const years = Math.max(1, goal.endYear - goal.startYear + 1);
  const total = goal.amt * years;

  return (
    <div className="rounded-xl border border-[rgba(0,87,184,.09)] bg-[#f8faff] px-5 py-4">
      <div className="flex items-center gap-4">
        <div className="text-lg">⭐</div>

        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#16213e]">
              {goal.name}
            </span>

            {goal.cat && (
              <span className="rounded-full bg-[#eaf1ff] px-2 py-0.5 text-[10px] text-[#0057b8]">
                {goal.cat}
              </span>
            )}

            {goal.tier && (
              <span className="rounded-full bg-[#f3e8ff] px-2 py-0.5 text-[10px] text-[#7c3aed]">
                {goal.tier}
              </span>
            )}
          </div>

          <div className="mt-1 text-[12px] text-[#64748b]">
            {formatMoney(goal.amt, currency)}/yr ·{" "}
            {goal.startYear}–{goal.endYear} ·{" "}
            {formatMoney(total, currency)} total
          </div>
        </div>

        <button
          type="button"
          className="text-[11px] font-semibold text-[#0057b8]"
        >
          Edit
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="text-sm text-[#9ca3af] hover:text-red-500"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
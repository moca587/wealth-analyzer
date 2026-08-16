"use client";

import { useState } from "react";
import type { Goal } from "@/lib/engine/types";
import { GoalCard } from "./goal-card";
import { AddGoalForm } from "./add-goal-form";

export function FinancialGoalsSection({
  goals,
  currency,
  onAddGoal,
  onRemoveGoal,
}: {
  goals: Goal[];
  currency: string;
  onAddGoal: (goal: Goal) => void;
  onRemoveGoal: (id: string) => void;
}) {
  const [showAddGoal, setShowAddGoal] = useState(false);

  return (
    <section className="rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]">
          Financial Goals
        </h2>

        <button
          type="button"
          onClick={() => setShowAddGoal((prev) => !prev)}
          className="rounded-lg bg-[#0057b8] px-4 py-2 text-[12px] font-semibold text-white"
        >
          + Add Goal
        </button>
      </div>

      <div className="space-y-3">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            currency={currency}
            onRemove={() => onRemoveGoal(goal.id)}
          />
        ))}
      </div>

      {goals.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#dbe3ef] py-10 text-center text-sm text-[#9ca3af]">
          No goals added.
        </div>
      )}

      {showAddGoal && (
        <div className="mt-5">
          <AddGoalForm
            currency={currency}
            onAdd={(goal) => {
              onAddGoal(goal);
              setShowAddGoal(false);
            }}
          />
        </div>
      )}
    </section>
  );
}
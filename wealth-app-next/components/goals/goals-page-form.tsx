"use client";

import type { WealthPlan, Goal } from "@/lib/engine/types";
import { usePlan } from "@/lib/plan/use-plan";

import { RetirementGoalsSection } from "./retirement-goals-section";
import { SocialSecuritySection } from "./social-security-section";
import { FinancialGoalsSection } from "./financial-goals-section";
import { ScenariosSection } from "./scenarios-section";

import { NoPlanLoaded } from "@/components/plan/no-plan-loaded";

export function GoalsPageForm({
  initialPlan,
  initialVersion,
}: {
  initialPlan: WealthPlan | null;
  initialVersion: number;
}) {
  const { plan, updatePlan } = usePlan(initialPlan, initialVersion);

  if (!plan) {
    return <NoPlanLoaded />;
  }

  function addGoal(goal: Goal) {
    if (!plan) return;

    updatePlan({
      goals: [...plan.goals, goal],
    });
  }

  function removeGoal(id: string) {
    if (!plan) return;

    updatePlan({
      goals: plan.goals.filter((goal) => goal.id !== id),
    });
  }

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-8 py-7">
      <div className="mx-auto max-w-5xl space-y-6">
        <RetirementGoalsSection plan={plan} update={updatePlan} />

        <SocialSecuritySection plan={plan} update={updatePlan} />

        <FinancialGoalsSection
          goals={plan.goals}
          currency={plan.currency}
          onAddGoal={addGoal}
          onRemoveGoal={removeGoal}
        />

        <ScenariosSection plan={plan} />
      </div>
    </main>
  );
}

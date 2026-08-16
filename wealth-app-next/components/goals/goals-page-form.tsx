"use client";

import { useState } from "react";
import type { WealthPlan, Goal } from "@/lib/engine/types";
import { emptyPlan } from "@/lib/plan/default-plan";

import { RetirementGoalsSection } from "./retirement-goals-section";
import { SocialSecuritySection } from "./social-security-section";
import { FinancialGoalsSection } from "./financial-goals-section";
import { ScenariosSection } from "./scenarios-section";
// import { SocialSecuritySection } from "./social-security-section";
// import { FinancialGoalsSection } from "./financial-goals-section";
// import { ScenariosSection } from "./scenarios-section";

export function GoalsPageForm({
  initialPlan,
  initialVersion,
}: {
  initialPlan: WealthPlan | null;
  initialVersion: number;
}) {
  const [plan, setPlan] = useState<WealthPlan>(
    () => initialPlan ?? emptyPlan()
  );

  function updatePlan(patch: Partial<WealthPlan>) {
    setPlan((prev) => ({
      ...prev,
      ...patch,
      updatedAt: new Date().toISOString(),
    }));
  }

  function addGoal(goal: Goal) {
    updatePlan({
      goals: [...plan.goals, goal],
    });
  }

  function removeGoal(id: string) {
    updatePlan({
      goals: plan.goals.filter((goal) => goal.id !== id),
    });
  }

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-8 py-7">
      <div className="mx-auto max-w-5xl space-y-6">

        <RetirementGoalsSection
          plan={plan}
          update={updatePlan}
        />

        <SocialSecuritySection
          plan={plan}
          update={updatePlan}
        />

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
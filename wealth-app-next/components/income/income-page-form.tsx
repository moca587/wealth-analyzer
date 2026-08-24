"use client";

import type { WealthPlan } from "@/lib/engine/types";
import { usePlan } from "@/lib/plan/use-plan";

import { IncomeSection } from "./income-section";
import { SavingsSection } from "./savings-section";

import { NoPlanLoaded } from "@/components/plan/no-plan-loaded";

export function IncomePageForm({
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

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-8 py-7">
      <div className="mx-auto max-w-5xl space-y-6">
        <IncomeSection plan={plan} update={updatePlan} />

        <SavingsSection plan={plan} update={updatePlan} />
      </div>
    </main>
  );
}

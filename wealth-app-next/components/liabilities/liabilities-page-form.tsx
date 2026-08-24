"use client";

import type { WealthPlan } from "@/lib/engine/types";
import { usePlan } from "@/lib/plan/use-plan";

import { LoansSection } from "./loans-section";
import { InsuranceProtectionSection } from "./insurance-protection-section";

import { NoPlanLoaded } from "@/components/plan/no-plan-loaded";

export function LiabilitiesPageForm({
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
        <LoansSection plan={plan} update={updatePlan} />

        <InsuranceProtectionSection plan={plan} update={updatePlan} />
      </div>
    </main>
  );
}

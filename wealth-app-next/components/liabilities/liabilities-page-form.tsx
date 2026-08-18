"use client";

import { useState } from "react";
import type { WealthPlan } from "@/lib/engine/types";
import { emptyPlan } from "@/lib/plan/default-plan";

import { LoansSection } from "./loans-section";
import { InsuranceProtectionSection } from "./insurance-protection-section";

export function LiabilitiesPageForm({
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

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-8 py-7">
      <div className="mx-auto max-w-5xl space-y-6">
        <LoansSection
          plan={plan}
          update={updatePlan}
        />

        <InsuranceProtectionSection
          plan={plan}
          update={updatePlan}
        />
      </div>
    </main>
  );
}
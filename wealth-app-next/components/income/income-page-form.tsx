"use client";

import { useState } from "react";
import type { WealthPlan } from "@/lib/engine/types";
import { emptyPlan } from "@/lib/plan/default-plan";

import { IncomeSection } from "./income-section";
import { SavingsSection } from "./savings-section";

export function IncomePageForm({
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
        <IncomeSection
          plan={plan}
          update={updatePlan}
        />

        <SavingsSection plan={plan} />
      </div>
    </main>
  );
}
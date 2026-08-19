"use client";

import { useState } from "react";
import type { WealthPlan } from "@/lib/engine/types";
import { emptyPlan } from "@/lib/plan/default-plan";

import { AnnualExpensesSection } from "./annual-expenses-section";
import { InflationSection } from "./inflation-section";
import { TaxSection } from "./tax-section";

export function ExpensesPageForm({
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
        <AnnualExpensesSection
          plan={plan}
          update={updatePlan}
        />

        <InflationSection
          plan={plan}
          update={updatePlan}
        />

        <TaxSection
          plan={plan}
          update={updatePlan}
        />
      </div>
    </main>
  );
}
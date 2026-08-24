"use client";

import type { WealthPlan } from "@/lib/engine/types";
import { usePlan } from "@/lib/plan/use-plan";

import { AnnualExpensesSection } from "./annual-expenses-section";
import { InflationSection } from "./inflation-section";
import { TaxSection } from "./tax-section";

import { NoPlanLoaded } from "@/components/plan/no-plan-loaded";

export function ExpensesPageForm({
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
        <AnnualExpensesSection plan={plan} update={updatePlan} />

        <InflationSection plan={plan} update={updatePlan} />

        <TaxSection plan={plan} update={updatePlan} />
      </div>
    </main>
  );
}

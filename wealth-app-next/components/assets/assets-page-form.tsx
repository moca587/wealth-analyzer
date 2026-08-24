"use client";

import type { WealthPlan } from "@/lib/engine/types";
import { usePlan } from "@/lib/plan/use-plan";

import AccountsSection from "./accounts-section";
import { AddAccountSection } from "./add-account-section";
import { EquityCompSection } from "./equity-comp-section";
import { InvestmentParametersSection } from "./investment-parameters-section";

import { NoPlanLoaded } from "@/components/plan/no-plan-loaded";

export function AssetsPageForm({
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
        <AccountsSection plan={plan} update={updatePlan} />

        <AddAccountSection plan={plan} update={updatePlan} />

        <EquityCompSection plan={plan} update={updatePlan} />

        <InvestmentParametersSection plan={plan} update={updatePlan} />
      </div>
    </main>
  );
}

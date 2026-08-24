"use client";

import type { WealthPlan } from "@/lib/engine/types";
import { usePlan } from "@/lib/plan/use-plan";

import { HoldingsSection } from "./holdings-section";
import { AddInvestmentSection } from "./add-investment-section";
import { PortfolioSummarySection } from "./portfolio-summary-section";
import { AllocationSection } from "./allocation-section";
import { LinkedAccountSection } from "./linked-account-section";
import { AddAlternativeSection } from "./add-alternative-section";

import { NoPlanLoaded } from "@/components/plan/no-plan-loaded";

// import { HoldingsSection } from "@/components/plan/sections/holdings-section";

export function PortfolioPageForm({
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
      <div className="mx-auto max-w-6xl space-y-6">
        <LinkedAccountSection plan={plan} update={updatePlan} />

        <PortfolioSummarySection plan={plan} />

        <AllocationSection plan={plan} />

        <HoldingsSection plan={plan} update={updatePlan} />

        <AddInvestmentSection plan={plan} update={updatePlan} />

        <AddAlternativeSection plan={plan} update={updatePlan} />
      </div>
    </main>
  );
}

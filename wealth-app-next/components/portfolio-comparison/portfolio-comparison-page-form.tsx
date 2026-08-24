"use client";

import type { WealthPlan } from "@/lib/engine/types";
import type { Proposal } from "@/lib/orders/proposal";

import {
  calcAllocationByClass,
  calcReturnRiskMetrics,
} from "@/lib/portfolio/portfolio-metrics";

import { CLASS_COLOR, type AssetClass } from "@/lib/portfolio/asset-class";

import { NoPlanLoaded } from "@/components/plan/no-plan-loaded";

import { ComparisonHeaderSection } from "./comparison-header-section";
import { ReturnsComparisonSection } from "./returns-comparison-section";
import { ReturnRiskDetailsSection } from "./return-risk-details-section";
import { AllocationComparisonSection } from "./allocation-comparison-section";
import { TrailingReturnsSection } from "./trailing-returns-section";
import { PlanLikelihoodSection } from "./plan-likelihood-section";
import { GoalsComparisonSection } from "./goals-comparison-section";

type Props = {
  initialPlan: WealthPlan | null;
  initialProposal: Proposal | null;
};

export function PortfolioComparisonPageForm({
  initialPlan,
  initialProposal,
}: Props) {
  const plan = initialPlan;
  const proposal = initialProposal;

  if (!plan) {
    return <NoPlanLoaded />;
  }

  const currentByClass = calcAllocationByClass(plan.holdings ?? []);

  const currentMetrics = calcReturnRiskMetrics(plan.holdings ?? [], 0);

  const currentAllocation = currentByClass.map((item) => ({
    name: item.name,
    pct: item.pct,
    color: CLASS_COLOR[item.key as AssetClass] ?? "#94a3b8",
  }));

  // Proposal already stores weights directly,
  // so we can aggregate them by asset class.
  const proposedByClass = new Map<string, number>();

  for (const position of proposal?.positions ?? []) {
    const cls = position.cls ?? "other";

    proposedByClass.set(
      cls,
      (proposedByClass.get(cls) ?? 0) + position.weightPct,
    );
  }

  const proposedAllocation = Array.from(proposedByClass.entries()).map(
    ([cls, pct]) => ({
      name: cls,
      pct,
      color: CLASS_COLOR[cls as AssetClass] ?? "#94a3b8",
    }),
  );

  const goalRows = plan.goals.map((goal) => ({
    id: goal.id,
    name: goal.name,
    targetYear: goal.startYear,

    currentSuccess: undefined,
    proposedSuccess: undefined,
  }));

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-8 py-7">
      <div className="mx-auto max-w-6xl space-y-6">
        <ComparisonHeaderSection
          simulations={500}
          years={45}
          isRunning={false}
          onRefresh={() => {
            // comparison rerun logic later
          }}
        />

        <ReturnsComparisonSection
          currentExpectedReturn={currentMetrics?.netReturn}
          currentVolatility={currentMetrics?.volatility}
        />

        <ReturnRiskDetailsSection
          currentGrossReturn={currentMetrics?.grossReturn}
          currentAdvisoryFee={currentMetrics?.advisoryFee}
          currentNetReturn={currentMetrics?.netReturn}
          currentVolatility={currentMetrics?.volatility}
        />

        <AllocationComparisonSection
          current={currentAllocation}
          proposed={proposedAllocation}
        />

        <TrailingReturnsSection />

        <GoalsComparisonSection goals={goalRows} />

        <PlanLikelihoodSection />
      </div>
    </main>
  );
}

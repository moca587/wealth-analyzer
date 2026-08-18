"use client";

import type { WealthPlan } from "@/lib/engine/types";
import { ComparisonHeaderSection } from "./comparison-header-section";
import { ReturnsComparisonSection } from "./returns-comparison-section";
import { ReturnRiskDetailsSection } from "./return-risk-details-section";
import { AllocationComparisonSection } from "./allocation-comparison-section";
import { TrailingReturnsSection } from "./trailing-returns-section";
import { PlanLikelihoodSection } from "./plan-likelihood-section";

import {
    calcAllocationByClass,
} from "@/lib/portfolio/portfolio-metrics";

import {
    CLASS_COLOR,
    type AssetClass,
} from "@/lib/portfolio/asset-class";
import { GoalsComparisonSection } from "./goals-comparison-section";

type Props = {
    initialPlan: WealthPlan | null;
    initialVersion: number;
};

export function PortfolioComparisonPageForm({
    initialPlan,
    initialVersion,
}: Props) {
    const plan = initialPlan;

    if (!plan) {
        return (
            <main className="min-h-screen bg-[#f4f6fb] px-8 py-7">
                <div className="mx-auto max-w-6xl">
                    <p className="text-sm text-[#64748b]">
                        No client plan loaded.
                    </p>
                </div>
            </main>
        );
    }


    const currentByClass =
        calcAllocationByClass(
            plan.holdings ?? []
        );

    const currentAllocation =
        currentByClass.map((item) => ({
            name: item.name,

            pct: item.pct,

            color:
                CLASS_COLOR[
                item.key as AssetClass
                ] ?? "#94a3b8",
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

                <ReturnsComparisonSection />

                <ReturnRiskDetailsSection />

                <AllocationComparisonSection
                    current={currentAllocation}
                    proposed={[]}
                />

                <TrailingReturnsSection />

                <GoalsComparisonSection
                    goals={[]}
                />

                <PlanLikelihoodSection />

            </div>
        </main>
    );
}
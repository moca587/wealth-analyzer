"use client";

import { useState } from "react";
import type { WealthPlan } from "@/lib/engine/types";
import { emptyPlan } from "@/lib/plan/default-plan";

import AccountsSection from "./accounts-section";
import { AddAccountSection } from "./add-account-section";
import { EquityCompSection } from "./equity-comp-section";
import { InvestmentParametersSection } from "./investment-parameters-section";

export function AssetsPageForm({
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
                <AccountsSection
                    plan={plan}
                    update={updatePlan}
                />

                <AddAccountSection
                    plan={plan}
                    update={updatePlan}
                />

                <EquityCompSection
                    plan={plan}
                    update={updatePlan}
                />

                <InvestmentParametersSection
                    plan={plan}
                    update={updatePlan}
                />


            </div>
        </main>
    );
}
// "use client";

// import { useState } from "react";
// import type { WealthPlan } from "@/lib/engine/types";
// import { emptyPlan } from "@/lib/plan/default-plan";
// import { WealthOverview } from "./wealth-overview";
// import { HouseholdSection } from "@/components/plan/sections/household-section";
// import { ChildrenSection } from "@/components/plan/sections/children-section";

// export function HouseholdPageForm({
//   initialPlan,
//   initialVersion,
//   householdName,
// }: {
//   initialPlan: WealthPlan | null;
//   initialVersion: number;
//   householdName: string;
// }) {
//   const [plan, setPlan] = useState<WealthPlan>(
//     () => initialPlan ?? emptyPlan()
//   );

//   const updatePlan = (patch: Partial<WealthPlan>) => {
//     setPlan((prev) => ({
//       ...prev,
//       ...patch,
//       updatedAt: new Date().toISOString(),
//     }));
//   };

//   return (
//     <main className="min-h-screen bg-[#f4f6fb] px-8 py-7">
//       <WealthOverview plan={plan} />

//       <section className="mt-6 rounded-xl border border-[rgba(0,87,184,0.08)] bg-white px-[26px] py-[22px] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
//         <div className="mb-[18px] flex items-center gap-2.5 text-[10.5px] font-bold uppercase tracking-[0.10em] text-[#9ca3af]">
//           Household Profiles
//           <div className="h-px flex-1 bg-[rgba(0,87,184,0.10)]" />
//         </div>

//         <HouseholdSection plan={plan} update={updatePlan} />

//         <div className="mt-5">
//           <ChildrenSection plan={plan} update={updatePlan} />
//         </div>
//       </section>
//     </main>
//   );
// }

"use client";

import { useState } from "react";

import {
    wealthPlanSchema,
} from "@/lib/plan/schema";

import type {
    WealthPlan,
} from "@/lib/engine/types";

import {
    WealthOverviewSection,
} from "@/components/household/wealth-overview-section";

import {
    HouseholdProfilesSection,
} from "@/components/household/household-profiles-section";

type Props = {
    initialPlan: WealthPlan | null;
    initialVersion: number;
    householdName?: string;
};

export function HouseholdPageForm({
    initialPlan,
    initialVersion,
    householdName,
}: Props) {
    const [plan, setPlan] =
        useState<WealthPlan | null>(
            initialPlan
        );

    const [version] =
        useState(initialVersion);

    // Merge a partial WealthPlan update
    // into the existing plan.
    function updatePlan(
        patch: Partial<WealthPlan>
    ) {
        setPlan((currentPlan) => {
            if (!currentPlan) {
                return currentPlan;
            }

            return {
                ...currentPlan,
                ...patch,
                updatedAt:
                    new Date()
                        .toISOString()
                        .slice(0, 10),
            };
        });
    }

    // The page cannot render household information
    // until a plan has been loaded.
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

    return (
        <main className="min-h-screen bg-[#f4f6fb] px-8 py-7">
            <div className="mx-auto max-w-6xl space-y-6">

                {/* Household wealth summary */}
                <WealthOverviewSection
                    plan={plan}
                />

                {/* Client / household information */}
                <HouseholdProfilesSection
                    plan={plan}
                    update={updatePlan}
                />

               

            </div>
        </main>
    );
}
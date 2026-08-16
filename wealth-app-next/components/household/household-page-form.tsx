"use client";

import { useState } from "react";
import type { WealthPlan } from "@/lib/engine/types";
import { emptyPlan } from "@/lib/plan/default-plan";
import { WealthOverview } from "./wealth-overview";
import { HouseholdSection } from "@/components/plan/sections/household-section";
import { ChildrenSection } from "@/components/plan/sections/children-section";

export function HouseholdPageForm({
  initialPlan,
  initialVersion,
  householdName,
}: {
  initialPlan: WealthPlan | null;
  initialVersion: number;
  householdName: string;
}) {
  const [plan, setPlan] = useState<WealthPlan>(
    () => initialPlan ?? emptyPlan()
  );

  const updatePlan = (patch: Partial<WealthPlan>) => {
    setPlan((prev) => ({
      ...prev,
      ...patch,
      updatedAt: new Date().toISOString(),
    }));
  };

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-8 py-7">
      <WealthOverview plan={plan} />

      <section className="mt-6 rounded-xl border border-[rgba(0,87,184,0.08)] bg-white px-[26px] py-[22px] shadow-[0_1px_4px_rgba(0,0,0,0.04)]">
        <div className="mb-[18px] flex items-center gap-2.5 text-[10.5px] font-bold uppercase tracking-[0.10em] text-[#9ca3af]">
          Household Profiles
          <div className="h-px flex-1 bg-[rgba(0,87,184,0.10)]" />
        </div>

        <HouseholdSection plan={plan} update={updatePlan} />

        <div className="mt-5">
          <ChildrenSection plan={plan} update={updatePlan} />
        </div>
      </section>
    </main>
  );
}
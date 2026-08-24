"use client";

import { useState } from "react";
import { usePlan } from "@/lib/plan/use-plan";

import { wealthPlanSchema } from "@/lib/plan/schema";

import type { WealthPlan } from "@/lib/engine/types";

import { migratePlan } from "@/lib/plan/migrate";
import { migrateProposal } from "@/lib/proposal/migrate";
import { saveProposal } from "@/lib/proposal/api";

import { WealthOverviewSection } from "@/components/household/wealth-overview-section";
import { HouseholdProfilesSection } from "@/components/household/household-profiles-section";
import { ProfileDataSection } from "@/components/household/profile-data-section";

import { NoPlanLoaded } from "@/components/plan/no-plan-loaded";

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
  const { plan, updatePlan, replacePlan } = usePlan(
    initialPlan,
    initialVersion,
  );

  // Load profile from JSON and persist to supabase
  function loadProfileFile(file: File) {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const text = String(reader.result);

        const raw: unknown = JSON.parse(text);

        // Convert legacy profile data
        // into the current WealthPlan.
        const migrated = migratePlan(raw);

        // Validate the migrated WealthPlan.
        const result = wealthPlanSchema.safeParse(migrated);

        if (!result.success) {
          console.error(result.error);

          alert("Invalid profile file.");

          return;
        }

        // Save the main WealthPlan.
        await replacePlan(result.data);

        // Convert legacy proposal data
        // into the new Proposal structure.
        const migratedProposal = migrateProposal(raw);

        // Proposal data is stored separately
        // from the WealthPlan.
        if (migratedProposal) {
          try {
            await saveProposal(migratedProposal);
          } catch (error) {
            console.error("Could not save imported proposal:", error);

            alert(
              "Profile was loaded, but the investment proposal could not be saved.",
            );
          }
        }
      } catch (error) {
        console.error(error);

        alert("Could not load profile.");
      }
    };

    reader.readAsText(file);
  }

  // The page cannot render household information
  // until a plan has been loaded.
  if (!plan) {
    return <NoPlanLoaded />;
  }

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-8 py-7">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Household wealth summary */}
        <WealthOverviewSection plan={plan} />

        {/* Client / household information */}
        <HouseholdProfilesSection plan={plan} update={updatePlan} />

        <ProfileDataSection onLoad={loadProfileFile} />
      </div>
    </main>
  );
}

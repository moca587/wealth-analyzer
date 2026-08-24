"use client";

import { useState } from "react";

import type { WealthPlan } from "@/lib/engine/types";

import { buildPlanRecommendations } from "@/lib/engine/recommendations";

import { PlanRecommendationsSection } from "@/components/recommendations/plan-recommendations-section";
import { NoPlanLoaded } from "@/components/plan/no-plan-loaded";

type Props = {
  initialPlan: WealthPlan | null;

  initialVersion: number;

  householdName?: string;
};

export function RecommendationsPageForm({
  initialPlan,
  initialVersion,
  householdName,
}: Props) {
  const [plan] = useState<WealthPlan | null>(initialPlan);

  const [version] = useState(initialVersion);

  if (!plan) {
    return <NoPlanLoaded />;
  }

  // Run all deterministic plan checks
  // against the current WealthPlan.
  const recommendations = buildPlanRecommendations(plan);

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-8 py-7">
      <div className="mx-auto max-w-6xl space-y-6">
        <PlanRecommendationsSection recommendations={recommendations} />
      </div>
    </main>
  );
}

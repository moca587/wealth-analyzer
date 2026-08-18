"use client";

import { useState } from "react";

import type { WealthPlan } from "@/lib/engine/types";
import type {
  AiPortfolioRecommendation,
} from "@/lib/ai-portfolio/types";

// import { AiPortfolioHeroSection } from "./ai-portfolio-hero-section";
// import { AiPortfolioStepsSection } from "./ai-portfolio-steps-section";
import { AiPortfolioPreferencesSection } from "./ai-portfolio-preferences-section";

// import { AiPortfolioResultSection } from "./ai-portfolio-result-section";
// import { AiPortfolioSourcesSection } from "./ai-portfolio-sources-section";

type Props = {
    initialPlan: WealthPlan | null;
    initialVersion: number;
};

export function AiPortfolioPageForm({
    initialPlan,
    initialVersion,
}: Props) {
    const plan = initialPlan;

    const [recommendation, setRecommendation] =
        useState<AiPortfolioRecommendation | null>(null);

    // Is the AI currently generating a portfolio? 
    const [isGenerating, setIsGenerating] =
        useState(false);

    // If API fails or returns an error, we can display it here
    const [error, setError] =
        useState<string | null>(null);

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

                {/* <AiPortfolioHeroSection />

        <AiPortfolioStepsSection /> */}

                <AiPortfolioPreferencesSection
                    plan={plan}
                    isGenerating={isGenerating}
                    setIsGenerating={setIsGenerating}
                    setRecommendation={setRecommendation}
                    setError={setError}
                />

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/*
        {recommendation && (
          <AiPortfolioResultSection
            plan={plan}
            recommendation={recommendation}
          />
        )}

        <AiPortfolioSourcesSection />
        */}

            </div>
        </main>
    );
}
"use client";

import { useState } from "react";

import type { WealthPlan } from "@/lib/engine/types";
import type { AiPortfolioResult } from "@/lib/ai-portfolio/types";

import { AiPortfolioPreferencesSection } from "./ai-portfolio-preferences-section";

import { AiPortfolioSummaryCards } from "./ai-portfolio-summary-cards";
import { AiPortfolioGrowthProjections } from "./ai-portfolio-growth-projections";
import { AiPortfolioAssetMix } from "./ai-portfolio-asset-mix";
import { AiPortfolioFundsList } from "./ai-portfolio-funds-list";
import { AiPortfolioRisks } from "./ai-portfolio-risks";
import { AiPortfolioNextSteps } from "./ai-portfolio-next-steps";
import { AiPortfolioSourcesSection } from "./ai-portfolio-sources-section";

type Props = {
  initialPlan: WealthPlan | null;
  initialVersion: number;
};

export function AiPortfolioPageForm({ initialPlan, initialVersion }: Props) {
  const plan = initialPlan;

  const [recommendation, setRecommendation] =
    useState<AiPortfolioResult | null>(null);

  const [amount, setAmount] = useState(100000);

  // Is the AI currently generating a portfolio?
  const [isGenerating, setIsGenerating] = useState(false);

  // If API fails or returns an error, we can display it here
  const [error, setError] = useState<string | null>(null);

  if (!plan) {
    return (
      <main className="min-h-screen bg-[#f4f6fb] px-8 py-7">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-[#64748b]">No client plan loaded.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-8 py-7">
      <div className="mx-auto max-w-6xl space-y-6">
        <AiPortfolioPreferencesSection
          plan={plan}
          amount={amount}
          setAmount={setAmount}
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

        {recommendation && (
          <AiPortfolioSummaryCards recommendation={recommendation} />
        )}

        {recommendation && (
          <AiPortfolioGrowthProjections
            investmentAmount={amount}
            recommendation={recommendation}
          />
        )}

        {recommendation && (
          <AiPortfolioAssetMix assetMix={recommendation.assetMix} />
        )}

        {recommendation && (
          <AiPortfolioFundsList funds={recommendation.funds} />
        )}

        {recommendation && <AiPortfolioRisks risks={recommendation.risks} />}

        {recommendation && (
          <AiPortfolioNextSteps
            onApply={() => {
              console.log("Apply to proposal", recommendation);
            }}
          />
        )}
        {recommendation && <AiPortfolioSourcesSection />}
      </div>
    </main>
  );
}

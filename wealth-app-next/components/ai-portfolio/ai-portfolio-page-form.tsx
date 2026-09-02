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

import type { Proposal } from "@/lib/orders/proposal";
import { useProposal } from "@/lib/proposal/use-proposal";

type Props = {
  initialPlan: WealthPlan | null;
  initialVersion: number;
  initialProposal: Proposal | null;
  initialRecommendation: AiPortfolioResult | null;
};

export function AiPortfolioPageForm({
  initialPlan,
  initialVersion,
  initialProposal,
  initialRecommendation,
}: Props) {
  const plan = initialPlan;

  const emptyProposal: Proposal = {
    positions: [],
    targetAmount: 0,
    currency: "USD",
  };

  const { proposal, replaceProposal } = useProposal(
    initialProposal ?? emptyProposal,
  );
  const [recommendation, setRecommendation] =
    useState<AiPortfolioResult | null>(initialRecommendation);

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

  // proposal
  async function handleApplyToProposal() {
    if (!recommendation) {
      return;
    }

    const positions = recommendation.funds.map((fund) => ({
      id: crypto.randomUUID(),

      ticker: fund.ticker,

      name: fund.name,

      cls: fund.category,

      weightPct: fund.weightPct,

      note: fund.reasoning,
    }));

    const newProposal: Proposal = {
      ...proposal,

      positions,

      targetAmount: amount,

      investmentThesis: recommendation.summary,
    };

    await replaceProposal(newProposal);
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
              void handleApplyToProposal();
            }}
          />
        )}
        {recommendation && (
          <AiPortfolioSourcesSection
            sources={["fidelity", "blackrock", "schwab", "Nuveen"]}
          />
        )}
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";

import type { WealthPlan } from "@/lib/engine/types";
import type { Proposal } from "@/lib/orders/proposal";
import type { FundPerformance } from "@/lib/portfolio/fund-performance";

import { runMonteCarlo } from "@/lib/engine/monte-carlo-old";

import type { SimulationResult } from "@/lib/engine/types";

import {
  calcAllocationByClass,
  calcReturnRiskMetrics,
  calcProposalReturnRiskMetrics,
} from "@/lib/portfolio/portfolio-metrics";

import {
  blendFundPerformance,
  type TrailingReturns,
} from "@/lib/portfolio/trailing-returns";

import { CLASS_COLOR, type AssetClass } from "@/lib/portfolio/asset-class";

import { NoPlanLoaded } from "@/components/plan/no-plan-loaded";

import { ComparisonHeaderSection } from "./comparison-header-section";
import { ReturnsComparisonSection } from "./returns-comparison-section";
import { ReturnRiskDetailsSection } from "./return-risk-details-section";
import { AllocationComparisonSection } from "./allocation-comparison-section";
import { TrailingReturnsSection } from "./trailing-returns-section";
import { PlanLikelihoodSection } from "./plan-likelihood-section";
import { GoalsComparisonSection } from "./goals-comparison-section";

import { calcAdvisoryFeePct } from "@/lib/proposal/advisory-fee";

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

  const [currentTrailing, setCurrentTrailing] = useState<TrailingReturns>();

  const [proposedTrailing, setProposedTrailing] = useState<TrailingReturns>();

  const [benchmarkTrailing, setBenchmarkTrailing] = useState<TrailingReturns>();

  const [currentComparisonResult, setCurrentComparisonResult] =
    useState<SimulationResult | null>(null);

  const [proposedComparisonResult, setProposedComparisonResult] =
    useState<SimulationResult | null>(null);

  if (!plan) {
    return <NoPlanLoaded />;
  }

  // -------------------------------------------------------
  // Current portfolio metrics
  // -------------------------------------------------------

  const currentByClass = calcAllocationByClass(plan.holdings ?? []);

  const currentMetrics = calcReturnRiskMetrics(plan.holdings ?? [], 0);

  const currentAllocation = currentByClass.map((item) => ({
    name: item.name,
    pct: item.pct,
    color: CLASS_COLOR[item.key as AssetClass] ?? "#94a3b8",
  }));

  // -------------------------------------------------------
  // Proposed portfolio allocation
  // -------------------------------------------------------

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

  // -------------------------------------------------------
  // Historical trailing returns
  // -------------------------------------------------------

  useEffect(() => {
    if (!initialPlan) {
      return;
    }

    const planForEffect = initialPlan;

    async function loadCurrentTrailingReturns() {
      const holdings = (planForEffect.holdings ?? []).filter(
        (holding) => holding.ticker?.trim() && (holding.value || 0) > 0,
      );

      const items = await Promise.all(
        holdings.map(async (holding) => {
          const ticker = holding.ticker?.trim();

          if (!ticker) {
            return null;
          }

          const response = await fetch(
            `/api/fund-performance/${encodeURIComponent(ticker)}`,
          );

          if (!response.ok) {
            return null;
          }

          const performance = (await response.json()) as FundPerformance;

          return {
            weight: holding.value || 0,
            performance,
          };
        }),
      );

      const validItems = items.filter(
        (
          item,
        ): item is {
          weight: number;
          performance: FundPerformance;
        } => item !== null,
      );

      setCurrentTrailing(blendFundPerformance(validItems));
    }

    void loadCurrentTrailingReturns();
  }, [initialPlan]);

  useEffect(() => {
    async function loadProposedTrailingReturns() {
      const positions = (proposal?.positions ?? []).filter(
        (position) => position.ticker?.trim() && (position.weightPct || 0) > 0,
      );

      const items = await Promise.all(
        positions.map(async (position) => {
          const ticker = position.ticker?.trim();

          if (!ticker) {
            return null;
          }

          const response = await fetch(
            `/api/fund-performance/${encodeURIComponent(ticker)}`,
          );

          if (!response.ok) {
            return null;
          }

          const performance = (await response.json()) as FundPerformance;

          return {
            weight: position.weightPct,
            performance,
          };
        }),
      );

      const validItems = items.filter(
        (
          item,
        ): item is {
          weight: number;
          performance: FundPerformance;
        } => item !== null,
      );

      setProposedTrailing(blendFundPerformance(validItems));
    }

    void loadProposedTrailingReturns();
  }, [proposal]);

  useEffect(() => {
    async function loadBenchmarkTrailingReturns() {
      const response = await fetch("/api/fund-performance/SPY");

      if (!response.ok) {
        return;
      }

      const performance = (await response.json()) as FundPerformance;

      setBenchmarkTrailing({
        oneYear: performance.r1y ?? undefined,

        threeYear: performance.r3y ?? undefined,

        fiveYear: performance.r5y ?? undefined,

        tenYear: performance.r10y ?? undefined,
      });
    }

    void loadBenchmarkTrailingReturns();
  }, []);

  // -------------------------------------------------------
  // Proposed expected return / volatility
  // -------------------------------------------------------

  const proposedAdvisoryFee = proposal
    ? calcAdvisoryFeePct(
        proposal.feeType ?? "none",
        proposal.feeRate ?? 0,
        proposal.targetAmount,
      )
    : 0;

  const proposedMetrics = proposal
    ? calcProposalReturnRiskMetrics(proposal, proposedAdvisoryFee)
    : null;

  useEffect(() => {
    if (!initialPlan || !currentMetrics || !proposedMetrics) {
      setCurrentComparisonResult(null);
      setProposedComparisonResult(null);

      return;
    }

    const sims = 500;
    const years = 45;

    // Same seed means both portfolios experience
    // the same sequence of random market shocks.
    const seed = 12345;

    const currentResult = runMonteCarlo({
      plan: initialPlan,
      sims,
      years,
      seed,

      returnMeanOverride: currentMetrics.netReturn / 100,

      returnSigmaOverride: currentMetrics.volatility / 100,
    });

    const proposedResult = runMonteCarlo({
      plan: initialPlan,
      sims,
      years,
      seed,

      returnMeanOverride: proposedMetrics.netReturn / 100,

      returnSigmaOverride: proposedMetrics.volatility / 100,
    });

    setCurrentComparisonResult(currentResult);

    setProposedComparisonResult(proposedResult);
  }, [
    initialPlan,
    currentMetrics?.netReturn,
    currentMetrics?.volatility,
    proposedMetrics?.netReturn,
    proposedMetrics?.volatility,
  ]);

  //   console.log("proposal positions:", proposal?.positions);
  //   console.log("proposed metrics:", proposedMetrics);

  // -------------------------------------------------------
  // Goals
  // -------------------------------------------------------

  const goalRows = plan.goals.map((goal) => {
    const currentGoal = currentComparisonResult?.goalSuccess.find(
      (item) => item.goalId === goal.id,
    );

    const proposedGoal = proposedComparisonResult?.goalSuccess.find(
      (item) => item.goalId === goal.id,
    );

    return {
      id: goal.id,
      name: goal.name,
      targetYear: goal.startYear,

      currentSuccess:
        currentGoal != null ? currentGoal.probability * 100 : undefined,

      proposedSuccess:
        proposedGoal != null ? proposedGoal.probability * 100 : undefined,
    };
  });

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
          currentTrailing={currentTrailing}
          proposedTrailing={proposedTrailing}
          currentExpectedReturn={currentMetrics?.netReturn}
          currentVolatility={currentMetrics?.volatility}
          proposedExpectedReturn={proposedMetrics?.netReturn}
          proposedVolatility={proposedMetrics?.volatility}
        />

        <ReturnRiskDetailsSection
          currentGrossReturn={currentMetrics?.grossReturn}
          currentAdvisoryFee={currentMetrics?.advisoryFee}
          currentNetReturn={currentMetrics?.netReturn}
          currentVolatility={currentMetrics?.volatility}
          proposedGrossReturn={proposedMetrics?.grossReturn}
          proposedAdvisoryFee={proposedMetrics?.advisoryFee}
          proposedNetReturn={proposedMetrics?.netReturn}
          proposedVolatility={proposedMetrics?.volatility}
        />

        <AllocationComparisonSection
          current={currentAllocation}
          proposed={proposedAllocation}
        />

        <TrailingReturnsSection
          current={currentTrailing}
          proposed={proposedTrailing}
          benchmark={benchmarkTrailing}
          benchmarkName="S&P 500 Index"
          benchmarkDescription="Large-cap US equity benchmark."
        />
        <GoalsComparisonSection goals={goalRows} />

        <PlanLikelihoodSection
          currentReturn={currentMetrics?.netReturn}
          currentVolatility={currentMetrics?.volatility}
          proposedReturn={proposedMetrics?.netReturn}
          proposedVolatility={proposedMetrics?.volatility}
        />
      </div>
    </main>
  );
}

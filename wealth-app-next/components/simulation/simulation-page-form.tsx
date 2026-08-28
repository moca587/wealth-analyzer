"use client";

import { useState } from "react";

import type { WealthPlan, SimulationResult } from "@/lib/engine/types";

import { runMonteCarlo } from "@/lib/engine/monte-carlo-old";
import { ageFromDOB, portfolioReturnParams } from "@/lib/engine/financial-math";
// import { calculateSustainableSpend } from "@/lib/engine/sustainable-spend";
import { calculateRetirementFunding } from "@/lib/engine/retirement-funding";
import { calculateAchievableLifestyle } from "@/lib/engine/achievable-lifestyle";

import { useSimulation } from "@/lib/simulation/simulation-context";

import { SimulationSettingsSheet } from "./simulation-settings-sheet";
import { SimulationHeaderSection } from "./simulation-header-section";
import { SimulationSummarySection } from "./simulation-summary-section";
import { AnnualWealthSection } from "./annual-wealth-section";
import { GoalFundingSection } from "./goal-funding-section";
import { GoalsBasedAnalysisSection } from "./goals-based-analysis-section";
import { WealthAllocationFrameworkSection } from "./wealth-allocation-framework-section";
import { RetirementNumberSection } from "./retirement-number-section";
import { RequiredMinimumWithdrawalsSection } from "./required-minimum-withdrawals-section";
import { RothConversionSection } from "./roth-conversion-section";
import { AssetLocationSection } from "./asset-location-section";
import { BehaviorGapSection } from "./behavior-gap-section";
import { EstateTransferSection } from "./estate-transfer-section";
import { MethodologySection } from "./methodology-section";
import { WealthOutlookSection } from "./wealth-outlook-section";
import { LinearCashFlowSection } from "./linear-cash-flow-section";
import { NetWorthComponentsSection } from "./net-worth-components-section";
import { ThreeScenarioSection } from "./three-scenario-section";
import { MeanVarianceSection } from "./mean-variance-section";
import { SensitivityAnalysisSection } from "./sensitivity-analysis-section";
import { AchievableLifestyleSection } from "./achievable-lifestyle-section";

import { usePlan } from "@/lib/plan/use-plan";
import { NoPlanLoaded } from "@/components/plan/no-plan-loaded";

export const REPORT_SEED = 20260101;

type Props = {
  initialPlan: WealthPlan | null;
  initialVersion: number;
};

export function SimulationPageForm({ initialPlan, initialVersion }: Props) {
  const { plan, updatePlan } = usePlan(initialPlan, initialVersion);

  const [sims, setSims] = useState<200 | 500 | 1000>(1000);

  const [years, setYears] = useState(30); // number of years the simulation projects

  //   const [result, setResult] = useState<SimulationResult | null>(null); // monte carlo result
  const { result, setResult } = useSimulation();

  const [running, setRunning] = useState(false);

  const [settingsOpen, setSettingsOpen] = useState(false);

  // make sure plan exists and has at least one client before proceeding
  if (!plan || plan.clients.length === 0) {
    return <NoPlanLoaded />;
  }

  //   const sustainableSpend = result
  //     ? calculateSustainableSpend(plan, result)
  //     : undefined;

  const retirementFundingResult = calculateRetirementFunding(plan);

  const retirementFunding = retirementFundingResult.funding;

  // calculate starting year/age for the simulation based on the current year and the first client's date of birth
  const startYear = new Date().getFullYear();

  const startAge = plan.clients[0]?.dob
    ? (ageFromDOB(plan.clients[0].dob, new Date(startYear, 0, 1)) ?? 40)
    : 40;

  // portfolio parameters
  const investableAssets = plan.assets.filter(
    (asset) => asset.cls !== "real_estate" && asset.value > 0,
  );

  const portfolio = portfolioReturnParams(
    investableAssets.map((asset) => ({
      cls: asset.cls,
      value: asset.value,
    })),
    {
      mean: 0.07,
      sigma: 0.12,
    },
  );

  // achievable lifestyle
  //   const achievableLifestyle = calculateAchievableLifestyle(plan, startYear);
  const achievableLifestyle = result
    ? calculateAchievableLifestyle(plan, {
        paths: result.paths,
        years: result.paths[0]?.length ? result.paths[0].length - 1 : 0,
        mu: portfolio.mean,
        sigma: portfolio.sigma,
      })
    : null;

  const sustainableSpend = achievableLifestyle?.expected.annualSpending;

  // Runs the Monte Carlo simulation and saves the result into React state
  function run() {
    setRunning(true);

    setTimeout(() => {
      try {
        const simulation = runMonteCarlo({
          plan: plan!,
          sims,
          years,
          seed: REPORT_SEED,
        });

        setResult(simulation);
      } finally {
        setRunning(false);
      }
    }, 30);
  }

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-8 py-7">
      <div className="mx-auto max-w-6xl space-y-6">
        <SimulationHeaderSection
          running={running}
          onRun={run}
          onSettings={() => setSettingsOpen(true)}
        />
        {result && (
          <SimulationSummarySection
            result={result}
            currency={plan.currency}
            sustainableSpend={sustainableSpend}
            retirementFunding={retirementFunding}
          />
        )}

        {result && (
          <WealthOutlookSection
            result={result}
            currency={plan.currency}
            startYear={startYear}
            startAge={startAge}
            displayYears={years}
          />
        )}

        {result && achievableLifestyle && (
          <AchievableLifestyleSection
            data={achievableLifestyle}
            currency={plan.currency}
            asOfYear={startYear}
          />
        )}

        {result && (
          <AnnualWealthSection
            result={result}
            currency={plan.currency}
            startYear={startYear}
            startAge={startAge}
            // displayYears={years}
          />
        )}

        {result && <GoalFundingSection plan={plan} result={result} />}

        {result && <GoalsBasedAnalysisSection plan={plan} />}

        {result && <WealthAllocationFrameworkSection plan={plan} />}

        {result && <RetirementNumberSection plan={plan} />}

        {result && <RequiredMinimumWithdrawalsSection plan={plan} />}

        {result && <RothConversionSection plan={plan} />}

        {result && <LinearCashFlowSection plan={plan} />}

        {result && <ThreeScenarioSection plan={plan} />}

        {result && <NetWorthComponentsSection plan={plan} />}

        {/* tax efficiency overlay  */}
        {result && <AssetLocationSection plan={plan} />}

        {result && <MeanVarianceSection plan={plan} />}

        {result && (
          <SensitivityAnalysisSection
            plan={plan}
            result={result}
            years={years}
          />
        )}

        {result && <BehaviorGapSection plan={plan} years={years} sims={sims} />}

        {result && (
          <EstateTransferSection
            plan={plan}
            result={result}
            update={updatePlan}
          />
        )}

        {result && <MethodologySection />}

        <SimulationSettingsSheet
          open={settingsOpen}
          onClose={() => setSettingsOpen(false)}
          years={years}
          setYears={setYears}
          sims={sims}
          setSims={setSims}
        />
      </div>
    </main>
  );
}

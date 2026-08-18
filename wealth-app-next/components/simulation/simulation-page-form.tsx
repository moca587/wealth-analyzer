"use client";

import { useState } from "react";

import type {
    WealthPlan,
    SimulationResult,
} from "@/lib/engine/types";

import {
    runMonteCarlo,
} from "@/lib/engine/monte-carlo-old";
import { ageFromDOB } from "@/lib/engine/financial-math";

import { SimulationHeaderSection } from "./simulation-header-section";
import {
    SimulationSummarySection,
} from "./simulation-summary-section";
import { AnnualWealthSection } from "./annual-wealth-section";
import { GoalFundingSection } from "./goal-funding-section";
import {
    GoalsBasedAnalysisSection,
} from "./goals-based-analysis-section";
import { WealthAllocationFrameworkSection } from "./wealth-allocation-framework-section";
import {
    RetirementNumberSection,
} from "./retirement-number-section";

export const REPORT_SEED = 20260101;

type Props = {
    initialPlan: WealthPlan | null;
    initialVersion: number;
};

export function SimulationPageForm({
    initialPlan,
    initialVersion,
}: Props) {
    const plan = initialPlan;

    const [sims, setSims] =
        useState<200 | 500 | 1000>(1000);

    const [years, setYears] =
        useState(30); // number of years the simulation projects

    const [result, setResult] =
        useState<SimulationResult | null>(
            null
        ); // monte carlo result

    const [running, setRunning] =
        useState(false);

    // make sure plan exists and has at least one client before proceeding
    if (
        !plan ||
        plan.clients.length === 0
    ) {
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

    // calculate starting year/age for the simulation based on the current year and the first client's date of birth
    const startYear =
        new Date().getFullYear();

    const startAge =
        plan.clients[0]?.dob
            ? ageFromDOB(
                plan.clients[0].dob,
                new Date(startYear, 0, 1)
            ) ?? 40
            : 40;

    // Runs the Monte Carlo simulation and saves the result into React state
    function run() {
        setRunning(true);

        setTimeout(() => {
            try {
                const simulation =
                    runMonteCarlo({
                        plan: plan!, // plan might be null? 
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
                />

                {result && (
                    <SimulationSummarySection
                        result={result}
                        currency={plan.currency}
                    />
                )}

                {result && (
                    <AnnualWealthSection
                        result={result}
                        currency={plan.currency}
                        startYear={startYear}
                        startAge={startAge}
                    />
                )}

                {result && (
                    <GoalFundingSection
                        result={result}
                    />
                )}

                {result && (
                    <GoalsBasedAnalysisSection
                        plan={plan}
                    />
                )}

                {result && (
                    <WealthAllocationFrameworkSection
                        plan={plan}
                    />
                )}

                {result && (
                    <RetirementNumberSection
                        plan={plan}
                    />
                )}



            </div>
        </main>
    );
}
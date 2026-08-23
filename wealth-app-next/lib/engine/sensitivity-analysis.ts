import type { WealthPlan } from "@/lib/engine/types";
import { runMonteCarlo } from "@/lib/engine/monte-carlo-old";

export type SensitivityRow = {
  label: string;
  shift: string;
  lower?: number;
  higher?: number;
};

const SENSITIVITY_SIMS = 200;
const SENSITIVITY_SEED = 20260101;

export function calculateSensitivity(
  plan: WealthPlan,
  baseMedian: number,
  years: number,
): SensitivityRow[] {
  function run(changedPlan: WealthPlan): number {
    const simulation = runMonteCarlo({
      plan: changedPlan,
      sims: SENSITIVITY_SIMS,
      years,
      seed: SENSITIVITY_SEED,
    });

    return simulation.realFinal.p50;
  }

  function impact(changedPlan: WealthPlan): number {
    return run(changedPlan) - baseMedian;
  }

  // Inflation -1 percentage point
  const lowerInflation = structuredClone(plan);

  lowerInflation.inflationRate = Math.max(0, plan.inflationRate - 0.01);

  // Inflation +1 percentage point
  const higherInflation = structuredClone(plan);

  higherInflation.inflationRate = plan.inflationRate + 0.01;

  // Expenses -20%
  const lowerExpenses = structuredClone(plan);

  lowerExpenses.expenses = lowerExpenses.expenses.map((expense) => ({
    ...expense,
    amount: expense.amount * 0.8,
  }));

  // Expenses +20%
  const higherExpenses = structuredClone(plan);

  higherExpenses.expenses = higherExpenses.expenses.map((expense) => ({
    ...expense,
    amount: expense.amount * 1.2,
  }));

  // Income -20%
  const lowerIncome = structuredClone(plan);

  lowerIncome.incomes = lowerIncome.incomes.map((income) => ({
    ...income,
    amount: income.amount * 0.8,
  }));

  // Income +20%
  const higherIncome = structuredClone(plan);

  higherIncome.incomes = higherIncome.incomes.map((income) => ({
    ...income,
    amount: income.amount * 1.2,
  }));

  // Property value -20%
  const lowerProperty = structuredClone(plan);

  lowerProperty.assets = lowerProperty.assets.map((asset) =>
    asset.cls === "real_estate"
      ? {
          ...asset,
          value: asset.value * 0.8,
        }
      : asset,
  );

  // Property value +20%
  const higherProperty = structuredClone(plan);

  higherProperty.assets = higherProperty.assets.map((asset) =>
    asset.cls === "real_estate"
      ? {
          ...asset,
          value: asset.value * 1.2,
        }
      : asset,
  );

  // Annual savings -20%
  const lowerSavings = structuredClone(plan);

  lowerSavings.annualSavings = plan.annualSavings * 0.8;

  // Annual savings +20%
  const higherSavings = structuredClone(plan);

  higherSavings.annualSavings = plan.annualSavings * 1.2;

  return [
    {
      label: "Inflation rate",
      shift: "±1 pp",
      lower: impact(lowerInflation),
      higher: impact(higherInflation),
    },

    {
      label: "Annual expenses",
      shift: "±20%",
      lower: impact(lowerExpenses),
      higher: impact(higherExpenses),
    },

    {
      label: "Gross income",
      shift: "±20%",
      lower: impact(lowerIncome),
      higher: impact(higherIncome),
    },

    {
      label: "Property value",
      shift: "±20%",
      lower: impact(lowerProperty),
      higher: impact(higherProperty),
    },

    {
      label: "Annual savings",
      shift: "±20%",
      lower: impact(lowerSavings),
      higher: impact(higherSavings),
    },
  ];
}

import type { WealthPlan } from "./types";

import { ageFromDOB } from "./financial-math";

export type RetirementFundingResult = {
  retirementTarget: number;
  presentValueTarget: number;
  currentNetWorth: number;
  funding: number;
};

export function calculateRetirementFunding(
  plan: WealthPlan,
): RetirementFundingResult {
  const client = plan.clients[0];

  if (!client || !plan.retirement?.enabled) {
    return {
      retirementTarget: 0,
      presentValueTarget: 0,
      currentNetWorth: 0,
      funding: 0,
    };
  }

  const currentAge = client.dob ? (ageFromDOB(client.dob) ?? 40) : 40;

  const retirementAge = plan.retirement.retirementAge;

  const planToAge = plan.retirement.planToAge ?? 90;

  const annualSpending = plan.retirement.annualSpending ?? 0;

  const inflation = plan.inflationRate ?? 0.03;

  const discountRate = 0.068;

  const yearsToRetirement = Math.max(0, retirementAge - currentAge);

  const yearsInRetirement = Math.max(1, planToAge - retirementAge);

  const realRate = (1 + discountRate) / (1 + inflation) - 1;

  const retirementTarget =
    realRate !== 0
      ? (annualSpending * (1 - Math.pow(1 + realRate, -yearsInRetirement))) /
        realRate
      : annualSpending * yearsInRetirement;

  const presentValueTarget =
    retirementTarget / Math.pow(1 + discountRate, yearsToRetirement);

  const totalAssets = plan.assets.reduce(
    (sum, asset) => sum + Number(asset.value || 0),
    0,
  );

  const totalDebt = plan.loans.reduce(
    (sum, loan) => sum + Number(loan.bal || 0),
    0,
  );

  const currentNetWorth = totalAssets - totalDebt;

  const funding = currentNetWorth - presentValueTarget;

  console.log("RETIREMENT FUNDING DEBUG", {
    currentAge,
    retirementAge,
    planToAge,
    annualSpending,
    yearsToRetirement,
    yearsInRetirement,
    inflation,
    realRate,
    retirementTarget,
    presentValueTarget,
    totalAssets,
    totalDebt,
    currentNetWorth,
    funding,
  });

  return {
    retirementTarget,
    presentValueTarget,
    currentNetWorth,
    funding,
  };
}

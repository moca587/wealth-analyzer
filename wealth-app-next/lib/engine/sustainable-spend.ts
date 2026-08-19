import type { SimulationResult, WealthPlan } from "./types";

import { ageFromDOB, boxMuller, portfolioReturnParams } from "./financial-math";

import { RISK_PROFILES } from "./constants";

export function calculateSustainableSpend(
  plan: WealthPlan,
  result: SimulationResult,
): number {
  const client = plan.clients[0];

  if (!client || !plan.retirement?.enabled) {
    return 0;
  }

  const currentAge = client.dob ? (ageFromDOB(client.dob) ?? 40) : 40;

  const retirementAge = plan.retirement.retirementAge;

  const planToAge = plan.retirement.planToAge ?? 90;

  const yearsToRetirement = Math.max(0, retirementAge - currentAge);

  const yearsInRetirement = Math.max(1, planToAge - retirementAge);

  // result.realPercentiles is already
  // expressed in today's dollars.
  const p50 = result.realPercentiles["p50"] ?? [];

  const retirementIndex = Math.min(yearsToRetirement, p50.length - 1);

  const wealthAtRetirement = Math.max(0, p50[retirementIndex] ?? 0);

  const investableAssets = plan.assets.filter(
    (asset) => asset.cls !== "real_estate",
  );

  const risk =
    client.risk && RISK_PROFILES[client.risk]
      ? RISK_PROFILES[client.risk]
      : RISK_PROFILES.moderate;

  const { mean: mu, sigma } = portfolioReturnParams(
    investableAssets.map((asset) => ({
      cls: asset.cls,
      value: Number(asset.value || 0),
    })),
    {
      mean: risk.mu / 100,
      sigma: risk.sigma / 100,
    },
  ); // actual portfolio expected return and volatility based on the plan's asset allocation

  return solveSustainableSpend(
    wealthAtRetirement,
    yearsInRetirement,
    mu,
    sigma,
    0.9,
  );
}

// finds the highest annual retirement spending amount that achieves at least the target success probability over the given number of years, using a binary search approach
function solveSustainableSpend(
  startWealth: number,
  years: number,
  mu: number,
  sigma: number,
  targetSuccess: number,
): number {
  if (startWealth <= 0) {
    return 0;
  }

  let low = 0;

  let high = startWealth * 0.15;

  for (let iteration = 0; iteration < 20; iteration++) {
    const mid = (low + high) / 2;

    const success = retirementSurvivalProbability(
      startWealth,
      mid,
      years,
      mu,
      sigma,
      300,
    );

    // default 0.9 success threshold
    if (success >= targetSuccess) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return low;
}

function retirementSurvivalProbability(
  startWealth: number,
  annualSpend: number,
  years: number,
  mu: number,
  sigma: number,
  simulations: number,
): number {
  let successes = 0;

  for (let sim = 0; sim < simulations; sim++) {
    let wealth = startWealth;

    let depleted = false;

    for (let year = 0; year < years; year++) {
      // annualSpend is in today's money.
      wealth -= annualSpend;

      if (wealth <= 0) {
        depleted = true;

        break;
      }

      const growth = Math.exp(mu - 0.5 * sigma * sigma + sigma * boxMuller());

      wealth *= growth;
    }

    if (!depleted) {
      successes++;
    }
  }

  return successes / simulations;
}

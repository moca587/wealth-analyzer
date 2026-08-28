import type { WealthPlan } from "@/lib/engine/types";

import {
  ageFromDOB,
  boxMuller,
  createSeededRandom,
  geometricMean,
} from "@/lib/engine/financial-math";

export type AchievableLifestylePoint = {
  retirementAge: number;
  conservative: number;
  expected: number;
  optimistic: number;
};

export type LifestyleCase = {
  confidence: 80 | 50 | 30;
  annualSpending: number;
  wealthAtRetirement: number;
};

export type AchievableLifestyleSummary = {
  currentAge: number;
  targetRetirementAge: number;
  planToAge: number;

  conservative: LifestyleCase;
  expected: LifestyleCase;
  optimistic: LifestyleCase;

  chart: AchievableLifestylePoint[];
};

export type AchievableLifestyleSimulation = {
  /**
   * Same Monte Carlo paths used by the main Simulation tab.
   *
   * paths[simulation][year]
   */
  paths: number[][];

  /**
   * Number of years represented by the paths.
   * Equivalent to legacy lastSimYrs.
   */
  years: number;

  /**
   * Arithmetic annual expected return used by the active simulation.
   * Equivalent to legacy getActiveSimulationParams().mu.
   */
  mu: number;

  /**
   * Annual volatility used by the active simulation.
   * Equivalent to legacy getActiveSimulationParams().sig.
   */
  sigma: number;
};

const PLAN_TO_AGE = 90;

const TARGET_SURVIVAL_PCT = 90;

const DRAWDOWN_SIMS = 100;

const SIM_SEED = 20260710;

/**
 * TypeScript port of the CURRENT legacy
 * "Potentially Achievable Annual Lifestyle" engine.
 *
 * IMPORTANT:
 *
 * This intentionally uses the SAME Monte Carlo paths as the
 * main simulation instead of independently accumulating wealth.
 */
export function calculateAchievableLifestyle(
  plan: WealthPlan,
  simulation: AchievableLifestyleSimulation,
): AchievableLifestyleSummary | null {
  const retirement = plan.retirement;

  if (!retirement || !retirement.enabled) {
    return null;
  }

  const client = plan.clients[0];

  // Legacy:
  // const a1 =
  //   ageFromDOB(val("c1d")) || 40;
  const currentAge = client?.dob
    ? (ageFromDOB(client.dob, new Date()) ?? 40)
    : 40;

  // Legacy:
  // const retAge =
  //   num("retAge", 65);
  const targetRetirementAge = retirement.retirementAge || 65;

  // Legacy:
  // const inflation =
  //   num("inf", CMA_INFLATION) / 100;
  const inflation = plan.inflationRate;

  const { paths, years: simulationYears, mu, sigma } = simulation;

  if (!paths.length) {
    return null;
  }

  // -------------------------------------------------------
  // Exact current legacy spendAt() behavior
  // -------------------------------------------------------

  function spendAt(
    retireAge: number,
    confidencePct: 80 | 50 | 30,
  ): LifestyleCase {
    // Legacy:
    //
    // const yrsAccum =
    //   Math.max(0, retireAge - a1);
    const yearsAccumulating = Math.max(0, retireAge - currentAge);

    // Legacy:
    //
    // const yearsInRet =
    //   Math.max(1, 90 - retireAge);
    const yearsInRetirement = Math.max(1, PLAN_TO_AGE - retireAge);

    // ---------------------------------------------------
    // Legacy:
    //
    // const wealth =
    //   (lastSimPaths && lastSimPaths.length)
    //     ? percentileAt(
    //         lastSimPaths,
    //         Math.min(
    //           yrsAccum,
    //           lastSimYrs
    //         ),
    //         100 - confP
    //       )
    //     : investable;
    //
    // Current implementation assumes a simulation exists,
    // because this is the Simulation-tab lifestyle chart.
    // ---------------------------------------------------

    const yearIndex = Math.min(yearsAccumulating, simulationYears);

    const wealthAtRetirement = percentileAt(
      paths,
      yearIndex,
      100 - confidencePct,
    );

    // ---------------------------------------------------
    // Pension schedule.
    //
    // This replaces legacy:
    //
    // _retirementPensionSchedule(
    //   retireAge,
    //   yearsInRet,
    //   inflation
    // )
    // ---------------------------------------------------

    const pensionByYear = retirementPensionSchedule(
      plan,
      retireAge,
      yearsInRetirement,
    );

    // ---------------------------------------------------
    // Legacy:
    //
    // const spendNom =
    //   _solveSustainableSpendMC(
    //     wealth,
    //     yearsInRet,
    //     P.mu,
    //     P.sig,
    //     inflation,
    //     90,
    //     100,
    //     pens
    //   );
    // ---------------------------------------------------

    const nominalSpending = solveSustainableSpendMC(
      Math.max(0, wealthAtRetirement),
      yearsInRetirement,
      mu,
      sigma,
      inflation,
      TARGET_SURVIVAL_PCT,
      DRAWDOWN_SIMS,
      pensionByYear,
    );

    // Legacy:
    //
    // return spendNom /
    //   Math.pow(
    //     1 + inflation,
    //     yrsAccum
    //   );
    //
    // nominal-at-retirement → today's money
    const annualSpending =
      nominalSpending / Math.pow(1 + inflation, yearsAccumulating);

    return {
      confidence: confidencePct,

      annualSpending: Math.max(0, annualSpending),

      wealthAtRetirement: Math.max(0, wealthAtRetirement),
    };
  }

  // -------------------------------------------------------
  // Cards at selected retirement age
  // -------------------------------------------------------

  const conservative = spendAt(targetRetirementAge, 80);

  const expected = spendAt(targetRetirementAge, 50);

  const optimistic = spendAt(targetRetirementAge, 30);

  // -------------------------------------------------------
  // Exact legacy age generation
  //
  // const startAge = a1;
  // const endAge =
  //   Math.max(retAge, a1 + 1);
  //
  // const span =
  //   endAge - startAge;
  //
  // const stepA =
  //   span > 40
  //     ? Math.ceil(span / 40)
  //     : 1;
  // -------------------------------------------------------

  const startAge = currentAge;

  const endAge = Math.max(targetRetirementAge, currentAge + 1);

  const span = endAge - startAge;

  const step = span > 40 ? Math.ceil(span / 40) : 1;

  const ages: number[] = [];

  for (let age = startAge; age <= endAge; age += step) {
    ages.push(age);
  }

  if (ages[ages.length - 1] !== endAge) {
    ages.push(endAge);
  }

  // Legacy:
  //
  // const p80 =
  //   ages.map(a => spendAt(a,80))
  //
  // const p50 =
  //   ages.map(a => spendAt(a,50))
  //
  // const p30 =
  //   ages.map(a => spendAt(a,30))

  const chart = ages.map((retirementAge) => {
    const p80 = spendAt(retirementAge, 80);

    const p50 = spendAt(retirementAge, 50);

    const p30 = spendAt(retirementAge, 30);

    return {
      retirementAge,

      conservative: p80.annualSpending,

      expected: p50.annualSpending,

      optimistic: p30.annualSpending,
    };
  });

  return {
    currentAge,
    targetRetirementAge,
    planToAge: PLAN_TO_AGE,

    conservative,
    expected,
    optimistic,

    chart,
  };
}

// ============================================================================
// Percentile
// ============================================================================

/**
 * Exact percentile indexing behavior from legacy:
 *
 * const i = Math.max(
 *   0,
 *   Math.min(
 *     arr.length - 1,
 *     Math.floor(
 *       p / 100 * arr.length
 *     )
 *   )
 * );
 */
function percentileAt(
  paths: number[][],
  yearIndex: number,
  percentile: number,
): number {
  if (!paths.length) {
    return 0;
  }

  const values = paths
    .map((path) => path[yearIndex] ?? 0)
    .sort((a, b) => a - b);

  const index = Math.max(
    0,
    Math.min(values.length - 1, Math.floor((percentile / 100) * values.length)),
  );

  return values[index] ?? 0;
}

// ============================================================================
// Sustainable retirement spending
// ============================================================================

/**
 * Exact TypeScript port of legacy:
 *
 * _solveSustainableSpendMC()
 */
function solveSustainableSpendMC(
  startWealth: number,
  yearsInRetirement: number,
  mu: number,
  sigma: number,
  inflation: number,
  targetSuccessPct: number,
  simulations = 150,
  pensionByYear: number[] | null = null,
): number {
  const pensionYearOne = pensionByYear?.[0] ?? 0;

  if (startWealth <= 0 && pensionYearOne <= 0) {
    return 0;
  }

  // Legacy:
  //
  // let lo = 0,
  //     hi =
  //       startWealth * 0.15
  //       + pen0;

  let low = 0;

  let high = startWealth * 0.15 + pensionYearOne;

  // Exact legacy: 12 bisection iterations
  for (let iteration = 0; iteration < 12; iteration++) {
    const midpoint = (low + high) / 2;

    const survivalProbability = survivalProbabilityMC(
      startWealth,
      midpoint,
      yearsInRetirement,
      mu,
      sigma,
      inflation,
      simulations,
      pensionByYear,
    );

    if (survivalProbability >= targetSuccessPct / 100) {
      low = midpoint;
    } else {
      high = midpoint;
    }
  }

  return low;
}

/**
 * Exact TypeScript port of legacy:
 *
 * _survivalProb()
 */
function survivalProbabilityMC(
  startWealth: number,
  spending: number,
  yearsInRetirement: number,
  mu: number,
  sigma: number,
  inflation: number,
  simulations = 300,
  pensionByYear: number[] | null = null,
): number {
  // IMPORTANT:
  // Legacy resets the seed on EVERY survival-probability
  // evaluation. This makes every bisection candidate use
  // exactly the same market paths.
  const random = createSeededRandom(SIM_SEED);

  let successes = 0;

  for (let simulation = 0; simulation < simulations; simulation++) {
    let portfolio = startWealth;

    let depleted = false;

    for (let year = 0; year < yearsInRetirement; year++) {
      // Legacy:
      //
      // const gross =
      //   spend *
      //   Math.pow(1 + inf, y);
      const grossSpending = spending * Math.pow(1 + inflation, year);

      const pension = pensionByYear?.[year] ?? 0;

      // Portfolio only funds spending
      // above pension income.
      const withdrawal = Math.max(0, grossSpending - pension);

      portfolio -= withdrawal;

      if (portfolio <= 0 && withdrawal > 0) {
        depleted = true;
        break;
      }

      // Legacy:
      //
      // const r =
      //   (mu - 0.5*sig*sig)
      //   + sig*boxMuller();
      //
      // port =
      //   port * Math.exp(r);

      const z = boxMuller(random);

      const logReturn = mu - 0.5 * sigma * sigma + sigma * z;

      portfolio = portfolio * Math.exp(logReturn);
    }

    if (!depleted) {
      successes++;
    }
  }

  return successes / simulations;
}

// ============================================================================
// Pension
// ============================================================================

function retirementPensionSchedule(
  plan: WealthPlan,
  retirementAge: number,
  yearsInRetirement: number,
): number[] {
  const pensions = plan.pensions ?? [];

  const schedule = new Array(Math.max(0, yearsInRetirement)).fill(0);

  for (let year = 0; year < yearsInRetirement; year++) {
    const age = retirementAge + year;

    let totalPension = 0;

    for (const pension of pensions) {
      if (age < pension.startAge) {
        continue;
      }

      const yearsSinceStart = age - pension.startAge;

      totalPension +=
        pension.annualAmount *
        Math.pow(1 + (pension.colaRate ?? 0), yearsSinceStart);
    }

    schedule[year] = totalPension;
  }

  return schedule;
}

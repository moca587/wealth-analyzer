import type { BehaviorGapResult, WealthPlan } from "./types";

import {
  boxMuller,
  calculatePercentile,
  portfolioReturnParams,
} from "./financial-math";

const BG_CRASH_THRESHOLD = -0.15;

const BG_SELL_FRACTION = 0.65;

const BG_SIDELINE_YEARS = 2;

const BG_REENTRY_YEARS = 2;

export function buildBehaviorGapAnalysis(
  plan: WealthPlan,
  years: number,
  sims: number,
): BehaviorGapResult {
  // ─────────────────────────────────────────────
  // Starting investable assets
  // ─────────────────────────────────────────────

  const investableAssets = plan.assets.filter(
    (asset) =>
      asset.liquid && asset.cls !== "cash" && asset.cls !== "real_estate",
  );

  const startingInvested = investableAssets.reduce(
    (sum, asset) => sum + Number(asset.value || 0),
    0,
  );

  // ─────────────────────────────────────────────
  // Portfolio return assumptions
  // ─────────────────────────────────────────────

  const portfolioParams = portfolioReturnParams(
    investableAssets.map((asset) => ({
      cls: asset.cls,
      value: Number(asset.value || 0),
    })),
    {
      mean: plan.returnMean ?? 0.07,
      sigma: plan.returnVolatility ?? 0.12,
    },
  );

  const mu = portfolioParams?.mean ?? plan.returnMean ?? 0.07;

  const sigma = portfolioParams?.sigma ?? plan.returnVolatility ?? 0.12;

  // ─────────────────────────────────────────────
  // Annual savings
  // ─────────────────────────────────────────────

  const annualIncome = plan.incomes.reduce(
    (sum, income) => sum + Number(income.amount || 0),
    0,
  );

  const annualExpenses =
    plan.expenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0,
    ) * 12;

  const annualSavings = Math.max(0, annualIncome - annualExpenses);

  // Each element will be one
  // complete simulated wealth path.
  const disciplinedPaths: number[][] = [];

  const panicPaths: number[][] = [];

  let panickedCount = 0;

  // ─────────────────────────────────────────────
  // Run many simulated futures
  // ─────────────────────────────────────────────

  for (let sim = 0; sim < sims; sim++) {
    // Both investors begin with
    // exactly the same amount.
    let disciplinedInvested = startingInvested;

    let panicInvested = startingInvested;

    // Cash created when the panic
    // investor sells investments.
    let panicParked = 0;

    // Number of years still waiting
    // before re-entering.
    let sidelineLeft = 0;

    // Number of years remaining in
    // gradual re-entry.
    let reentryLeft = 0;

    // Only allow one panic event
    // during each simulated path.
    let panicked = false;

    const disciplinedPath = [startingInvested];

    const panicPath = [startingInvested];

    // ───────────────────────────────────────────
    // Move through each year of this simulation.
    // ───────────────────────────────────────────

    for (let year = 1; year <= years; year++) {
      // Generate ONE random market return.
      //
      // This exact return is used for
      // both investors.
      const z = boxMuller(); // random normal value

      const marketReturn = mu - 0.5 * sigma * sigma + sigma * z; // ??

      // ───────────────────────────────────────
      // Disciplined investor
      //
      // Stays invested and puts annual
      // savings into investments every year.
      // ───────────────────────────────────────

      disciplinedInvested = Math.max(
        0,
        disciplinedInvested * (1 + marketReturn) + annualSavings,
      );

      // ───────────────────────────────────────
      // Panic investor
      //
      // First experiences the SAME market
      // return as the disciplined investor.
      // ───────────────────────────────────────

      panicInvested = Math.max(0, panicInvested * (1 + marketReturn));

      // If the market falls 15% or more
      // and this investor has not panicked
      // before, sell 65% of invested assets.
      if (!panicked && marketReturn <= BG_CRASH_THRESHOLD) {
        panicked = true;

        panickedCount++;

        const sold = panicInvested * BG_SELL_FRACTION;

        panicInvested -= sold;

        panicParked += sold;

        sidelineLeft = BG_SIDELINE_YEARS;
      }

      // ───────────────────────────────────────
      // Sideline period
      //
      // Annual savings go to parked cash
      // rather than investments.
      // ───────────────────────────────────────

      if (sidelineLeft > 0) {
        panicParked += annualSavings;

        sidelineLeft--;

        if (sidelineLeft === 0) {
          reentryLeft = BG_REENTRY_YEARS;
        }
      }

      // ───────────────────────────────────────
      // Gradual re-entry period
      // ───────────────────────────────────────
      else if (reentryLeft > 0) {
        // Divide remaining parked cash
        // evenly over the remaining
        // re-entry years.
        const chunk = panicParked / reentryLeft;

        panicInvested += chunk;

        panicParked -= chunk;

        reentryLeft--;

        // New savings are invested again.
        panicInvested += annualSavings;
      }

      // ───────────────────────────────────────
      // Normal state
      //
      // Before panic or after re-entry,
      // savings are invested normally.
      // ───────────────────────────────────────
      else {
        panicInvested += annualSavings;
      }

      disciplinedPath.push(disciplinedInvested);

      // Panic investor wealth includes
      // both invested money and parked cash.
      panicPath.push(panicInvested + panicParked);
    }

    disciplinedPaths.push(disciplinedPath);

    panicPaths.push(panicPath);
  }

  // ─────────────────────────────────────────────
  // Get ending wealth from every simulation.
  // ─────────────────────────────────────────────

  const disciplinedFinal = disciplinedPaths
    .map((path) => path[years] ?? 0)
    .sort((a, b) => a - b);

  const panicFinal = panicPaths
    .map((path) => path[years] ?? 0)
    .sort((a, b) => a - b);

  // Your calculatePercentile() expects
  // the array to already be sorted and
  // takes percentile as 0–100.
  const staysInvestedMedian = calculatePercentile(disciplinedFinal, 50);

  const panicMedian = calculatePercentile(panicFinal, 50);

  // Dollar cost of panic-selling.
  const panicCost = Math.max(0, staysInvestedMedian - panicMedian);

  // ─────────────────────────────────────────────
  // Annualized performance gap
  // ─────────────────────────────────────────────

  const disciplinedCagr = calculateCagr(
    startingInvested,
    staysInvestedMedian,
    years,
  );

  const panicCagr = calculateCagr(startingInvested, panicMedian, years);

  const annualizedGap = Math.max(0, disciplinedCagr - panicCagr);

  // Fraction of simulations where
  // a crash triggered the panic rule.
  const panicShare = sims > 0 ? panickedCount / sims : 0;

  return {
    years,
    disciplinedPaths,
    panicPaths,
    startingInvested,
    staysInvestedMedian,
    panicMedian,
    panicCost,
    annualizedGap,
    panicShare,
  };
}

function calculateCagr(start: number, end: number, years: number): number {
  if (start <= 0 || end <= 0 || years <= 0) {
    return 0;
  }

  return Math.pow(end / start, 1 / years) - 1;
}

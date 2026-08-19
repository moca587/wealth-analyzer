import type {
  WealthPlan,
  CashFlowPhase,
  LinearCashFlowRow,
  LinearCashFlowResult,
  LinearCashFlowOptions,
} from "./types";

import {
  ageFromDOB,
  calcMortgagePayment,
  calcRMD,
  computeStateTax,
  estimateIncomeTax,
  geometricMean,
  portfolioReturnParams,
} from "./financial-math";

import { RISK_PROFILES } from "./constants";

// ─────────────────────────────────────────────────────────────
// Internal loan state
// ─────────────────────────────────────────────────────────────

interface LoanState {
  balance: number;
  ratePct: number;
  yearsRemaining: number;
}

// ─────────────────────────────────────────────────────────────
// Main deterministic projection
// ─────────────────────────────────────────────────────────────

export function buildLinearCashFlow(
  plan: WealthPlan,
  options: LinearCashFlowOptions = {},
): LinearCashFlowResult {
  const client = plan.clients[0];

  if (!client) {
    throw new Error("Linear cash flow requires at least one client");
  }

  // ───────────────────────────────────────────────────────────
  // Projection horizon
  // ───────────────────────────────────────────────────────────

  const startYear = options.asOfYear ?? new Date().getFullYear();

  const asOfDate = new Date(startYear, 0, 1);

  const startAge = client.dob ? (ageFromDOB(client.dob, asOfDate) ?? 40) : 40;

  const endAge = Math.max(startAge, options.endAge ?? 90);

  // Include both the starting age and final age.
  //
  // Example:
  // age 45 through age 90 = 46 rows.
  const projectionYears = endAge - startAge;

  // ───────────────────────────────────────────────────────────
  // Household assumptions
  // ───────────────────────────────────────────────────────────

  const inflation = plan.inflationRate;

  const country = client.country || "US";

  const state = client.state;

  const retirement = plan.retirement;

  const retirementEnabled = !!(retirement && retirement.enabled);

  const retirementAge = retirementEnabled
    ? retirement!.retirementAge
    : Infinity;

  const retirementSpendToday = retirementEnabled
    ? retirement!.annualSpending
    : 0;

  const annualSavingsTarget = Math.max(0, options.annualSavingsTarget ?? 0);

  const retirementPoolGrowth = options.retirementPoolGrowth ?? 0.035;

  const cashSurplusShare = clamp(options.cashSurplusShare ?? 0.3, 0, 1);

  const investmentSurplusShare = 1 - cashSurplusShare;

  // ───────────────────────────────────────────────────────────
  // Current income / expenses
  // ───────────────────────────────────────────────────────────

  const baseIncome = plan.incomes.reduce(
    (sum, income) => sum + Number(income.amount || 0),
    0,
  );

  /*
   * Your current Monte Carlo treats expenses as monthly
   * and converts them to annual amounts with * 12.
   *
   * Keep the same convention here so the two engines
   * interpret WealthPlan consistently.
   */
  const baseAnnualExpenses =
    plan.expenses.reduce(
      (sum, expense) => sum + Number(expense.amount || 0),
      0,
    ) * 12;

  // ───────────────────────────────────────────────────────────
  // Starting asset pools
  // ───────────────────────────────────────────────────────────

  /*
   * Match the current Monte Carlo's broad asset treatment:
   *
   * liquid !== false → taxable / liquid pool
   * liquid === false → retirement / deferred pool
   * real_estate      → property
   */
  let cash = plan.assets
    .filter((asset) => asset.cls === "cash" && asset.liquid !== false)
    .reduce((sum, asset) => sum + Number(asset.value || 0), 0);

  let retirementPool = plan.assets
    .filter((asset) => asset.cls !== "real_estate" && asset.liquid === false)
    .reduce((sum, asset) => sum + Number(asset.value || 0), 0);

  let propertyValue = plan.assets
    .filter((asset) => asset.cls === "real_estate")
    .reduce((sum, asset) => sum + Number(asset.value || 0), 0);

  /*
   * Invested assets are liquid non-cash, non-property assets.
   */
  const investableAssets = plan.assets.filter(
    (asset) =>
      asset.cls !== "real_estate" &&
      asset.cls !== "cash" &&
      asset.liquid !== false &&
      Number(asset.value) > 0,
  );

  let investments = investableAssets.reduce(
    (sum, asset) => sum + Number(asset.value || 0),
    0,
  );

  /*
   * Assets that do not fit the four tracked pools remain
   * constant as "other assets".
   *
   * This prevents them from disappearing from net worth.
   */
  const trackedAssetIds = new Set(
    plan.assets
      .filter((asset) => {
        const isCash = asset.cls === "cash" && asset.liquid !== false;

        const isProperty = asset.cls === "real_estate";

        const isRetirement =
          asset.cls !== "real_estate" && asset.liquid === false;

        const isInvestment =
          asset.cls !== "real_estate" &&
          asset.cls !== "cash" &&
          asset.liquid !== false &&
          Number(asset.value) > 0;

        return isCash || isProperty || isRetirement || isInvestment;
      })
      .map((asset) => asset.id),
  );

  const otherAssets = plan.assets
    .filter((asset) => !trackedAssetIds.has(asset.id))
    .reduce((sum, asset) => sum + Number(asset.value || 0), 0);

  // ───────────────────────────────────────────────────────────
  // Deterministic portfolio return
  // ───────────────────────────────────────────────────────────

  /*
   * Use the same current portfolio CMA / covariance engine
   * as the Monte Carlo.
   *
   * The client risk profile is only the fallback if there
   * are no usable classified investments.
   */
  const riskProfile =
    client.risk && RISK_PROFILES[client.risk]
      ? RISK_PROFILES[client.risk]
      : RISK_PROFILES.moderate;

  const { mean: portfolioMean, sigma: portfolioSigma } = portfolioReturnParams(
    investableAssets.map((asset) => ({
      cls: asset.cls,
      value: Number(asset.value),
    })),
    {
      mean: riskProfile.mu / 100,
      sigma: riskProfile.sigma / 100,
    },
  );

  /*
   * Deterministic "median-like" return:
   *
   * geometric mean =
   * arithmetic mean - 1/2 * sigma^2
   */
  const investmentReturn = geometricMean(portfolioMean, portfolioSigma);

  /*
   * Legacy deterministic property assumption:
   * inflation minus 1 percentage point,
   * with a 1% minimum.
   */
  const propertyGrowth = Math.max(0.01, inflation - 0.01);

  // ───────────────────────────────────────────────────────────
  // Goal schedule
  // ───────────────────────────────────────────────────────────

  /*
   * A goal with:
   *
   * amt = $10k
   * startYear = 2030
   * endYear = 2034
   *
   * produces $10k of nominal goal outflow in each
   * calendar year from 2030 through 2034.
   */
  const goalOutflows = buildGoalOutflowMap(plan, startYear);

  // ───────────────────────────────────────────────────────────
  // Loan state
  // ───────────────────────────────────────────────────────────

  const loans: LoanState[] = plan.loans.map((loan) => ({
    balance: Number(loan.bal || 0),

    ratePct: Number(loan.rate || 0),

    yearsRemaining: Number(loan.yrs || 0),
  }));

  // ───────────────────────────────────────────────────────────
  // Projection state
  // ───────────────────────────────────────────────────────────

  const rows: LinearCashFlowRow[] = [];

  let unfunded = 0;

  /*
   * Each iteration represents one calendar year.
   *
   * The updated balances from this year become the
   * starting balances for the next year.
   */
  for (let yearOffset = 0; yearOffset <= projectionYears; yearOffset += 1) {
    const year = startYear + yearOffset;

    const age = startAge + yearOffset;

    const retired = age >= retirementAge;

    const notes: string[] = [];

    if (yearOffset === 0) {
      notes.push("today");
    }

    if (retirementEnabled && age === retirementAge) {
      notes.push("retirement starts");
    }

    // ─────────────────────────────────────────────────────────
    // Grow investment / property / retirement pools
    // ─────────────────────────────────────────────────────────

    /*
     * For the first row we want today's actual balances.
     * Growth starts from year 1 onward.
     */
    if (yearOffset > 0) {
      investments *= 1 + investmentReturn;

      propertyValue *= 1 + propertyGrowth;

      retirementPool *= 1 + retirementPoolGrowth;
    }

    // ─────────────────────────────────────────────────────────
    // Pension income
    // ─────────────────────────────────────────────────────────

    let pensionIncome = 0;

    for (const pension of plan.pensions ?? []) {
      if (age < pension.startAge) {
        continue;
      }

      const pensionYears = age - pension.startAge;

      const amount =
        Number(pension.annualAmount || 0) *
        Math.pow(1 + Number(pension.colaRate || 0), pensionYears);

      pensionIncome += amount;

      if (age === pension.startAge) {
        notes.push("pension starts");
      }
    }

    // ─────────────────────────────────────────────────────────
    // Retirement account distribution / RMD
    // ─────────────────────────────────────────────────────────

    let retirementDistribution = 0;

    if (retired && retirementPool > 0) {
      /*
       * Legacy behavior:
       *
       * During retirement, draw at least 4% voluntarily,
       * but obey a larger mandatory RMD when required.
       */
      const voluntaryDraw = retirementPool * 0.04;

      const mandatoryRmd = calcRMD(retirementPool, age, country);

      retirementDistribution = Math.min(
        retirementPool,
        Math.max(voluntaryDraw, mandatoryRmd),
      );

      retirementPool -= retirementDistribution;

      if (mandatoryRmd > voluntaryDraw) {
        notes.push("mandatory RMD");
      }
    }

    const pensionRmdIncome = pensionIncome + retirementDistribution;

    // ─────────────────────────────────────────────────────────
    // Earned income
    // ─────────────────────────────────────────────────────────

    const earnedIncome = retired ? 0 : baseIncome;

    // ─────────────────────────────────────────────────────────
    // Expenses
    // ─────────────────────────────────────────────────────────

    const workingExpenses =
      baseAnnualExpenses * Math.pow(1 + inflation, yearOffset);

    const retirementExpenses =
      retirementSpendToday * Math.pow(1 + inflation, yearOffset);

    const expenses =
      retired && retirementEnabled ? retirementExpenses : workingExpenses;

    // ─────────────────────────────────────────────────────────
    // Debt service
    // ─────────────────────────────────────────────────────────

    let debtService = 0;

    for (const loan of loans) {
      if (loan.balance <= 0 || loan.yearsRemaining <= 0) {
        continue;
      }

      const annualPayment = calculateAnnualLoanPayment(loan);

      /*
       * Approximate annual amortization:
       * payment first covers interest,
       * remainder reduces principal.
       */
      const interest = loan.balance * (loan.ratePct / 100);

      const principal = Math.min(
        loan.balance,
        Math.max(0, annualPayment - interest),
      );

      loan.balance = Math.max(0, loan.balance - principal);

      loan.yearsRemaining = Math.max(0, loan.yearsRemaining - 1);

      debtService += Math.min(annualPayment, interest + principal);
    }

    // ─────────────────────────────────────────────────────────
    // Income tax
    // ─────────────────────────────────────────────────────────

    const taxableIncome = earnedIncome + pensionRmdIncome;

    const incomeTax =
      estimateIncomeTax(taxableIncome, country) +
      computeStateTax(taxableIncome, country, state);

    // ─────────────────────────────────────────────────────────
    // Cash flow before savings / goals
    // ─────────────────────────────────────────────────────────

    const surplusBeforeSavings =
      earnedIncome + pensionRmdIncome - incomeTax - expenses - debtService;

    /*
     * Savings target only applies while working.
     *
     * It cannot exceed the positive cash flow produced
     * by the current year.
     */
    const savingsTarget = retired
      ? 0
      : Math.min(annualSavingsTarget, Math.max(0, surplusBeforeSavings));

    let surplusDeficit = surplusBeforeSavings - savingsTarget;

    // ─────────────────────────────────────────────────────────
    // Apply savings target
    // ─────────────────────────────────────────────────────────

    /*
     * Treat the savings target as money deliberately retained.
     *
     * Split it using the same 30/70 cash-invest convention
     * described by the legacy deterministic projection.
     */
    if (savingsTarget > 0) {
      cash += savingsTarget * cashSurplusShare;

      investments += savingsTarget * investmentSurplusShare;
    }

    // ─────────────────────────────────────────────────────────
    // Apply remaining surplus / deficit
    // ─────────────────────────────────────────────────────────

    if (surplusDeficit > 0) {
      /*
       * Reinvest remaining positive surplus:
       * 30% cash / 70% investments by default.
       */
      cash += surplusDeficit * cashSurplusShare;

      investments += surplusDeficit * investmentSurplusShare;
    } else if (surplusDeficit < 0) {
      /*
       * Legacy rule:
       * deficits drain cash first.
       */
      let need = -surplusDeficit;

      const fromCash = Math.min(Math.max(0, cash), need);

      cash -= fromCash;
      need -= fromCash;

      /*
       * If cash is exhausted,
       * drain investments next.
       */
      const fromInvestments = Math.min(Math.max(0, investments), need);

      investments -= fromInvestments;

      need -= fromInvestments;

      /*
       * Any amount that still cannot be funded becomes
       * cumulative unfunded need, allowing net worth to
       * continue below zero instead of flooring at zero.
       */
      if (need > 0) {
        unfunded += need;

        cash = 0;
        investments = 0;
      }
    }

    // ─────────────────────────────────────────────────────────
    // Goal outflows
    // ─────────────────────────────────────────────────────────

    const goalOutflow = goalOutflows.get(year) ?? 0;

    if (goalOutflow > 0) {
      notes.push("goal");

      let need = goalOutflow;

      // Goals also drain cash first.
      const fromCash = Math.min(Math.max(0, cash), need);

      cash -= fromCash;
      need -= fromCash;

      // Then investments.
      const fromInvestments = Math.min(Math.max(0, investments), need);

      investments -= fromInvestments;

      need -= fromInvestments;

      if (need > 0) {
        unfunded += need;
      }
    }

    cash = Math.max(0, cash);

    investments = Math.max(0, investments);

    // ─────────────────────────────────────────────────────────
    // Ending balance sheet
    // ─────────────────────────────────────────────────────────

    const totalDebt = loans.reduce(
      (sum, loan) => sum + Math.max(0, loan.balance),
      0,
    );

    const netWorth =
      cash +
      investments +
      retirementPool +
      propertyValue +
      otherAssets -
      totalDebt -
      unfunded;

    if (netWorth < 0) {
      notes.push("DEPLETED");
    }

    rows.push({
      year,
      age,

      phase: retired ? "Retired" : "Working",

      earnedIncome,
      pensionRmdIncome,

      incomeTax,
      expenses,
      debtService,

      savingsTarget,
      surplusDeficit,

      goalOutflow,

      cash,
      investments,
      retirementPool,

      propertyValue,
      otherAssets,

      totalDebt,
      unfunded,

      netWorth,

      notes,
    });
  }

  return {
    rows,

    startYear,
    startAge,
    endAge,

    investmentReturn,
    portfolioMean,
    portfolioSigma,

    propertyGrowth,
    retirementPoolGrowth,
  };
}

// ─────────────────────────────────────────────────────────────
// Goal schedule helper
// ─────────────────────────────────────────────────────────────

function buildGoalOutflowMap(
  plan: WealthPlan,
  startYear: number,
): Map<number, number> {
  const result = new Map<number, number>();

  for (const goal of plan.goals) {
    /*
     * Retirement spending is already handled separately
     * by plan.retirement.annualSpending.
     *
     * Avoid double-counting a retirement-category goal.
     */
    if (plan.retirement?.enabled && goal.cat === "Retirement") {
      continue;
    }

    const firstYear = Math.max(startYear, goal.startYear);

    const lastYear = Math.max(firstYear, goal.endYear);

    for (let year = firstYear; year <= lastYear; year += 1) {
      const existing = result.get(year) ?? 0;

      result.set(year, existing + Number(goal.amt || 0));
    }
  }

  return result;
}

// ─────────────────────────────────────────────────────────────
// Loan helper
// ─────────────────────────────────────────────────────────────

function calculateAnnualLoanPayment(loan: LoanState): number {
  if (loan.balance <= 0 || loan.yearsRemaining <= 0) {
    return 0;
  }

  const monthlyPayment = calcMortgagePayment(
    loan.balance,
    loan.ratePct,
    loan.yearsRemaining,
  );

  return monthlyPayment * 12;
}

// ─────────────────────────────────────────────────────────────
// Small utility
// ─────────────────────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

import type { WealthPlan } from "./types";

import {
  calcMortgagePayment,
  computeStateTax,
  estimateIncomeTax,
  formatCompactMoney,
} from "./financial-math";

export type RecommendationSeverity = "high" | "medium" | "low";

export type PlanRecommendation = {
  id: string;
  title: string;
  description: string;
  severity: RecommendationSeverity;
};

export function buildPlanRecommendations(
  plan: WealthPlan,
): PlanRecommendation[] {
  const recommendations: PlanRecommendation[] = [];

  // ─────────────────────────────────────────────
  // Portfolio concentration
  //
  // IMPORTANT:
  // Use plan.holdings here, not plan.assets.
  //
  // Assets are account-level balances.
  // Holdings are individual securities such as
  // VOO, BND, AAPL, etc.
  // ─────────────────────────────────────────────

  const holdings = plan.holdings ?? [];

  const totalPortfolioValue = holdings.reduce(
    (sum, holding) => sum + Number(holding.value || 0),
    0,
  );

  for (const holding of holdings) {
    if (totalPortfolioValue <= 0) {
      continue;
    }

    const value = Number(holding.value || 0);

    if (value <= 0) {
      continue;
    }

    const weight = value / totalPortfolioValue;

    // Flag positions above 20%.
    if (weight > 0.2) {
      const holdingName = holding.ticker || holding.name;

      recommendations.push({
        id: `concentration-${holding.id}`,

        title: `Concentration risk: ${holdingName} is ${(weight * 100).toFixed(0)}% of portfolio`,

        description:
          "Holdings above 20% of the portfolio carry outsized single-position risk. Consider trimming over time, tax permitting.",

        severity: weight >= 0.5 ? "high" : "medium",
      });
    }
  }

  // ─────────────────────────────────────────────
  // Gross household income
  // ─────────────────────────────────────────────

  const grossIncome = plan.incomes.reduce(
    (sum, income) => sum + Number(income.amount || 0),
    0,
  );

  // ─────────────────────────────────────────────
  // Annual household expenses
  //
  // WealthPlan stores expenses monthly.
  // ─────────────────────────────────────────────

  const monthlyExpenses = plan.expenses.reduce(
    (sum, expense) => sum + Number(expense.amount || 0),
    0,
  );

  const annualExpenses = monthlyExpenses * 12;

  // ─────────────────────────────────────────────
  // Income tax
  // ─────────────────────────────────────────────

  const primaryClient = plan.clients[0];

  const country = primaryClient?.country ?? "US";

  const state = primaryClient?.state;

  const federalTax = estimateIncomeTax(grossIncome, country);

  const stateTax = computeStateTax(grossIncome, country, state);

  const totalTax = federalTax + stateTax;

  // ─────────────────────────────────────────────
  // Annual debt service
  // how much the household pays toward all loans in one year
  // ─────────────────────────────────────────────

  const annualDebtService = plan.loans.reduce((sum, loan) => {
    const balance = Number(loan.bal || 0);

    const rate = Number(loan.rate || 0);

    const years = Number(loan.yrs || 0);

    if (balance <= 0) {
      return sum;
    }

    // Match the legacy fallback when
    // remaining loan years are missing.
    if (years <= 0) {
      const monthlyRate = rate / 100 / 12;

      const monthlyPayment =
        monthlyRate > 0 ? balance * monthlyRate : balance / 120;

      return sum + monthlyPayment * 12;
    }

    const monthlyPayment = calcMortgagePayment(balance, rate, years);

    return sum + monthlyPayment * 12;
  }, 0);

  // ─────────────────────────────────────────────
  // Household surplus / deficit
  // how much money the household has left over each year
  // ─────────────────────────────────────────────

  const annualSurplus =
    grossIncome - totalTax - annualExpenses - annualDebtService;

  if (annualSurplus < 0) {
    // when annualSurplus is negative, display the deficit as a positive amount
    const deficit = Math.abs(annualSurplus);

    recommendations.push({
      id: "household-deficit",

      title: `Household is running a deficit of ${formatCompactMoney(
        deficit,
        plan.currency,
      )}/yr`,

      description: `After tax, expenses, and debt service, outflows exceed income by ${formatCompactMoney(
        deficit,
        plan.currency,
      )} per year. Savings targets cannot be met from income — cash reserves are being depleted.`,

      severity: "high",
    });
  }

  // ─────────────────────────────────────────────
  // Cash buffer
  // ─────────────────────────────────────────────

  const liquidCash = plan.assets
    .filter((asset) => asset.cls === "cash")
    .reduce((sum, asset) => sum + Number(asset.value || 0), 0);

  const cashBufferMonths =
    monthlyExpenses > 0 ? liquidCash / monthlyExpenses : undefined;

  if (cashBufferMonths != null && cashBufferMonths < 6) {
    recommendations.push({
      id: "cash-buffer",

      title: `Cash buffer covers ${cashBufferMonths.toFixed(1)} months of expenses`,

      description: `Target is 6–12 months. Current liquid cash of ${formatCompactMoney(
        liquidCash,
        plan.currency,
      )} is below the recommended minimum. Consider building reserves before increasing investment contributions.`,

      severity: cashBufferMonths < 3 ? "high" : "medium",
    });
  }

  // ─────────────────────────────────────────────
  // Future checks
  //
  // Add later when those analytics are available:
  //
  // - IPS drift
  // - goal funding
  // - retirement success probability
  // - asset-location efficiency
  // ─────────────────────────────────────────────

  return recommendations.sort(
    (a, b) => severityRank(b.severity) - severityRank(a.severity),
  );
}

// ─────────────────────────────────────────────
// Severity ordering
// ─────────────────────────────────────────────

function severityRank(severity: RecommendationSeverity): number {
  switch (severity) {
    case "high":
      return 3;

    case "medium":
      return 2;

    case "low":
      return 1;
  }
}

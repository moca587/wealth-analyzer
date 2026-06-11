// ─────────────────────────────────────────────────────────────────
// Monte Carlo wealth projection engine.
// Pure function: given a plan + simulation parameters, returns
// percentile bands, paths, goal probabilities, final-year stats.
//
// Mirrors the algorithm in wealth-analyzer.html runSim():
//   - Log-normal returns via Box-Muller transform
//   - Property appreciation as stochastic 3% ± 2%
//   - Real loan amortization (interest math, balance amortizes down)
//   - Surplus split 30% invested / 70% cash (configurable later)
//   - Goal funding evaluated at calendar-year targets
// ─────────────────────────────────────────────────────────────────

import { boxMuller, calcMortgagePayment, geometricMean } from "./financial-math";
import { RISK_PROFILES } from "./constants";
import type {
  SimulationInput,
  SimulationResult,
  WealthPlan,
  Client,
  Goal,
  Loan,
  Asset
} from "./types";

/** Blend μ/σ across 1-2 clients (average if both present). */
function getBlendedReturnParams(clients: Client[]): { muPct: number; sigmaPct: number } {
  const valid = clients.filter((c) => c.risk && RISK_PROFILES[c.risk]);
  if (valid.length === 0) return { muPct: 7.0, sigmaPct: 12 };
  const sumMu = valid.reduce((s, c) => s + RISK_PROFILES[c.risk!].mu, 0);
  const sumSig = valid.reduce((s, c) => s + RISK_PROFILES[c.risk!].sigma, 0);
  return { muPct: sumMu / valid.length, sigmaPct: sumSig / valid.length };
}

/** Sum a numeric field across an array, treating null/undefined as 0. */
function sumOf<T>(arr: T[], getter: (item: T) => number): number {
  return arr.reduce((s, x) => s + (getter(x) || 0), 0);
}

/** Per-period (annual) amortization: returns new balance + interest paid. */
function amortizeLoan(loan: Loan): { newBal: number; interestPaid: number; principalPaid: number } {
  if (loan.bal <= 0 || loan.yrs <= 0) return { newBal: 0, interestPaid: 0, principalPaid: 0 };
  const monthlyPmt = calcMortgagePayment(loan.bal, loan.rate, loan.yrs);
  const annualPmt = monthlyPmt * 12;
  let bal = loan.bal;
  let interestTotal = 0;
  const monthlyRate = loan.rate / 100 / 12;
  for (let m = 0; m < 12; m++) {
    if (bal <= 0) break;
    const interest = bal * monthlyRate;
    const principal = monthlyPmt - interest;
    interestTotal += interest;
    bal -= principal;
  }
  return {
    newBal: Math.max(0, bal),
    interestPaid: interestTotal,
    principalPaid: annualPmt - interestTotal
  };
}

/**
 * Run the Monte Carlo simulation.
 *
 * This is the migration target — port verified to match the HTML
 * app's runSim() output within numerical noise (different RNG seeds).
 */
export function runMonteCarlo(input: SimulationInput): SimulationResult {
  const t0 = performance.now();
  const { plan, sims, years, bands } = input;

  // ─── Pre-compute static inputs ───
  const { muPct, sigmaPct } = getBlendedReturnParams(plan.clients);
  const mu = muPct / 100;
  const sigma = sigmaPct / 100;
  const drift = geometricMean(mu, sigma);

  const totalInvestableAssets = sumOf(
    plan.assets.filter((a) => a.cls !== "real_estate"),
    (a) => a.value
  );
  const totalPropertyValue = sumOf(
    plan.assets.filter((a) => a.cls === "real_estate"),
    (a) => a.value
  );

  const annualIncome = sumOf(plan.incomes, (i) => i.amount);
  const annualExpense = sumOf(plan.expenses, (e) => e.amount) * 12;

  const startYear = new Date().getFullYear();

  // Pre-compute goal target year offsets (relative year indices)
  const goalsByYear: Array<{ goal: Goal; yearOffset: number }> = plan.goals
    .map((g) => ({ goal: g, yearOffset: g.startYear - startYear }))
    .filter((g) => g.yearOffset >= 0 && g.yearOffset < years);

  // ─── Run all sims ───
  const paths: number[][] = [];
  const goalHits: Record<string, number> = {};
  plan.goals.forEach((g) => { goalHits[g.id] = 0; });

  for (let s = 0; s < sims; s++) {
    let investable = totalInvestableAssets;
    let propertyVal = totalPropertyValue;
    const loanState: Loan[] = plan.loans.map((l) => ({ ...l }));
    const path: number[] = [];
    let goalFundedThisSim: Record<string, boolean> = {};

    for (let y = 0; y < years; y++) {
      // 1. Stochastic return on investable assets
      const annRet = drift + sigma * boxMuller();
      investable = investable * (1 + annRet);

      // 2. Stochastic property appreciation (3% ± 2%)
      const propRet = 0.03 + 0.02 * boxMuller();
      propertyVal = propertyVal * (1 + propRet);

      // 3. Loan amortization
      let interestPaid = 0;
      loanState.forEach((l) => {
        const { newBal, interestPaid: ip } = amortizeLoan(l);
        l.bal = newBal;
        if (l.yrs > 0) l.yrs -= 1;
        interestPaid += ip;
      });

      // 4. Annual surplus → 30% invested / 70% cash (added to investable)
      const surplus = annualIncome - annualExpense - interestPaid;
      if (surplus > 0) {
        investable += surplus * 0.30; // invested allocation
        investable += surplus * 0.70; // cash (still part of net worth)
      }

      // 5. Goal funding — for each goal whose calendar year is THIS year
      goalsByYear.forEach(({ goal, yearOffset }) => {
        if (yearOffset !== y) return;
        if (goalFundedThisSim[goal.id]) return;
        const yearsNeeded = Math.max(1, goal.endYear - goal.startYear + 1);
        const totalNeeded = goal.amt * yearsNeeded;
        if (investable >= totalNeeded) {
          goalFundedThisSim[goal.id] = true;
        }
      });

      // 6. Net worth this year = investable + property − total debt
      const totalDebt = loanState.reduce((s, l) => s + Math.max(0, l.bal), 0);
      path.push(investable + propertyVal - totalDebt);
    }

    paths.push(path);
    Object.entries(goalFundedThisSim).forEach(([gid, hit]) => {
      if (hit) goalHits[gid] = (goalHits[gid] || 0) + 1;
    });
  }

  // ─── Compute percentiles per year ───
  const pct = (sortedRow: number[], p: number) =>
    sortedRow[Math.max(0, Math.min(sims - 1, Math.floor(sims * (p / 100))))];

  const p10: number[] = [], p25: number[] = [], p50: number[] = [];
  const p75: number[] = [], p80: number[] = [], p90: number[] = [];

  for (let y = 0; y < years; y++) {
    const row = paths.map((p) => p[y]).sort((a, b) => a - b);
    p10.push(pct(row, 10));
    p25.push(pct(row, 25));
    p50.push(pct(row, 50));
    p75.push(pct(row, 75));
    p80.push(pct(row, 80));
    p90.push(pct(row, 90));
  }

  const finalRow = paths.map((p) => p[years - 1]).sort((a, b) => a - b);
  const mean = finalRow.reduce((s, v) => s + v, 0) / sims;

  // ─── Goal success rates ───
  const goalSuccess = plan.goals.map((g) => ({
    goalId: g.id,
    goalName: g.name,
    probability: (goalHits[g.id] || 0) / sims
  }));

  // ─── Hash input for caching (stable for identical plans) ───
  const inputHash = hashPlan(plan, sims, years);

  return {
    inputHash,
    sims,
    years,
    paths,
    percentiles: { p10, p25, p50, p75, p80, p90 },
    goalSuccess,
    final: {
      p10: pct(finalRow, 10),
      p25: pct(finalRow, 25),
      p50: pct(finalRow, 50),
      p75: pct(finalRow, 75),
      p90: pct(finalRow, 90),
      mean
    },
    runMs: Math.round(performance.now() - t0)
  };
}

/** Cheap stable hash for caching simulation results */
function hashPlan(plan: WealthPlan, sims: number, years: number): string {
  const s = JSON.stringify({
    c: plan.clients.map((c) => [c.risk, c.horizon]),
    a: plan.assets.map((a) => [a.cls, a.value]),
    l: plan.loans.map((l) => [l.bal, l.rate, l.yrs]),
    g: plan.goals.map((g) => [g.amt, g.startYear, g.endYear]),
    i: plan.incomes.map((i) => i.amount),
    e: plan.expenses.map((e) => e.amount),
    inf: plan.inflationRate,
    sims, years
  });
  // Simple FNV-1a hash
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

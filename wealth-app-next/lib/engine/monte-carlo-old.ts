// ─────────────────────────────────────────────────────────────────
// Monte Carlo wealth projection engine.
// Pure function: given a plan + simulation parameters, returns
// percentile bands, paths, goal probabilities, final-year stats.
//
// Originally ported from wealth-analyzer.html runSim(); has since been
// re-modelled (per-asset-class CMAs + correlation, progressive income tax,
// two-pool retirement decumulation with pensions/RMDs) and is intentionally
// NOT numerically parity with the legacy engine:
//   - TRUE log-normal returns via Box-Muller: pool *= exp((μ−σ²/2) + σZ),
//     so the mean tracks the stated CMA μ and the median grows at the
//     geometric rate. (The original port copied legacy's (μ−σ²/2)+σZ draw
//     but applied it arithmetically, double-counting the volatility drag —
//     fixed 2026-07. The legacy app itself always applied exp().)
//   - Property appreciation as stochastic 3% ± 2% (arithmetic; σ too small
//     for the distinction to matter)
//   - Real loan amortization: debt service (interest + principal) is funded
//     from each year's cash flow while the balance amortizes down (engine v2)
//   - Goal funding evaluated at calendar-year targets
// ─────────────────────────────────────────────────────────────────

import {
  boxMuller,
  calcMortgagePayment,
  createSeededRandom,
  geometricMean,
  portfolioReturnParams,
  estimateIncomeTax,
  ageFromDOB,
  calcRMD,
  computeStateTax,
} from "./financial-math";
import { RISK_PROFILES } from "./constants";
import type {
  SimulationInput,
  SimulationResult,
  WealthPlan,
  Client,
  Goal,
  Loan,
  Asset,
} from "./types";

/** Blend μ/σ across 1-2 clients (average if both present). */
function getBlendedReturnParams(clients: Client[]): {
  muPct: number;
  sigmaPct: number;
} {
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

/** Per-period (annual) amortization: returns new balance + interest/principal paid. */
function amortizeLoan(loan: Loan): {
  newBal: number;
  interestPaid: number;
  principalPaid: number;
} {
  if (loan.bal <= 0) return { newBal: 0, interestPaid: 0, principalPaid: 0 };
  // A term-expired loan that still carries a balance (yrs ≤ 0 but bal > 0 — e.g.
  // an imported stub liability) is debt owed now: keep it on the books rather
  // than silently erasing it. It just doesn't amortize further.
  if (loan.yrs <= 0)
    return { newBal: loan.bal, interestPaid: 0, principalPaid: 0 };
  const monthlyPmt = calcMortgagePayment(loan.bal, loan.rate, loan.yrs);
  let bal = loan.bal;
  let interestTotal = 0;
  const monthlyRate = loan.rate / 100 / 12;
  for (let m = 0; m < 12; m++) {
    if (bal <= 0) break;
    const interest = bal * monthlyRate;
    const principal = Math.min(monthlyPmt - interest, bal); // final payment can't overpay
    interestTotal += interest;
    bal -= principal;
  }
  const newBal = Math.max(0, bal);
  return {
    newBal,
    interestPaid: interestTotal,
    principalPaid: loan.bal - newBal,
  };
}

function validatePercentiles(percentiles: number[]): number[] {
  if (percentiles.length === 0) {
    throw new Error("At least one percentile is required");
  }
  const unique = [...new Set(percentiles)].sort((a, b) => a - b);
  for (const value of unique) {
    if (!Number.isFinite(value) || value < 0 || value > 100) {
      throw new Error(`Invalid percentile: ${value}`);
    }
  }
  return unique;
}

/**
 * Run the Monte Carlo simulation.
 *
 * This is the migration target — port verified to match the HTML
 * app's runSim() output within numerical noise (different RNG seeds).
 */
export function runMonteCarlo(
  input: SimulationInput,
  options: { percentiles?: number[] } = {},
): SimulationResult {
  const t0 = performance.now();
  const { plan, sims, years, seed, returnMeanOverride, returnSigmaOverride } =
    input;
  const rng = seed !== undefined ? createSeededRandom(seed) : Math.random;

  const requestedPercentiles = validatePercentiles(
    options.percentiles ?? [10, 25, 30, 50, 75, 80, 90],
  );

  // Anchor the run to a fixed calendar year so goal offsets and the primary
  // client's age are reproducible for a given seed (they otherwise drift with
  // the wall clock). Defaults to the current year for live runs.
  const asOfYear = input.asOfYear ?? new Date().getFullYear();
  const asOfDate = new Date(asOfYear, 0, 1);

  // ─── Pre-compute static inputs ───
  const investableAssets = plan.assets.filter((a) => a.cls !== "real_estate");
  // Split investable into a taxable pool and a tax-deferred (retirement-account)
  // pool. They grow identically, but in retirement, spending is withdrawn from
  // taxable first; deferred draws + RMDs are taxed as income; and RMDs are
  // forced past age 73. For non-retirement plans this is behaviourally identical
  // to a single pool.
  const initialTaxable = sumOf(
    investableAssets.filter((a) => a.liquid !== false),
    (a) => a.value,
  );
  const initialDeferred = sumOf(
    investableAssets.filter((a) => a.liquid === false),
    (a) => a.value,
  );
  const totalPropertyValue = sumOf(
    plan.assets.filter((a) => a.cls === "real_estate"),
    (a) => a.value,
  );

  // Portfolio return/volatility derived from the ACTUAL investable allocation
  // via per-asset-class CMAs + correlation — so composition matters (a 100%
  // equity plan now differs from a 60/40). The blended risk profile is only a
  // fallback when there are no classified investable holdings.
  const { muPct, sigmaPct } = getBlendedReturnParams(plan.clients);

  const portfolioParams = portfolioReturnParams(
    investableAssets.map((a) => ({
      cls: a.cls,
      value: a.value,
    })),
    {
      mean: muPct / 100,
      sigma: sigmaPct / 100,
    },
  );

  const mu = returnMeanOverride ?? portfolioParams.mean;

  const sigma = returnSigmaOverride ?? portfolioParams.sigma;

  const drift = geometricMean(mu, sigma);
  const inflation = plan.inflationRate;

  const annualIncome = sumOf(plan.incomes, (i) => i.amount);
  const annualExpense = sumOf(plan.expenses, (e) => e.amount) * 12;

  // Income tax on working income (flat income → computed once).
  const taxableIncome = sumOf(
    plan.incomes.filter((i) => i.taxable !== false),
    (i) => i.amount,
  );
  const taxCountry = plan.clients[0]?.country || "US";
  const afterTaxIncome =
    annualIncome -
    estimateIncomeTax(taxableIncome, taxCountry) -
    computeStateTax(taxableIncome, taxCountry, plan.clients[0]?.state);

  // ─── Retirement / decumulation config ───
  // Guard against a malformed dob (the schema doesn't enforce date format):
  // a NaN age would poison the retirement horizon (Y = NaN → empty paths,
  // NaN percentiles) the same way an unclamped `years` used to.
  // const dobAge = plan.clients[0]?.dob ? ageFromDOB(plan.clients[0].dob, asOfDate) : NaN;
  // const currentAge = Number.isFinite(dobAge) ? dobAge : 40;
  const dobAge = plan.clients[0]?.dob
    ? ageFromDOB(plan.clients[0].dob, asOfDate)
    : null;

  const currentAge: number =
    dobAge !== null && Number.isFinite(dobAge) ? dobAge : 40;

  const ret = plan.retirement;
  const retEnabled = !!(ret && ret.enabled && ret.retirementAge > 0);
  const retirementAge = retEnabled ? ret!.retirementAge : Infinity;
  const retSpendToday = retEnabled ? ret!.annualSpending || 0 : 0;
  const planToAge = retEnabled ? ret!.planToAge || 90 : 0;
  const pensions = plan.pensions || [];
  // With retirement on, model through planToAge; otherwise use the caller's years,
  // clamped to a sane [1, 100] horizon — years ≤ 0 would produce empty paths and
  // NaN percentiles downstream; a non-finite value (e.g. NaN from an empty form
  // field) falls back to the typical 30-year horizon.
  const requestedYears = Number.isFinite(years)
    ? Math.min(100, Math.max(1, Math.floor(years)))
    : 30;
  // const Y = retEnabled
  //   ? Math.max(1, Math.min(70, planToAge - currentAge))
  //   : requestedYears;
  const Y = retEnabled
    ? Math.max(requestedYears, planToAge - currentAge)
    : requestedYears;

  const startYear = asOfYear;

  // A `cat === "Retirement"` goal that overlaps the decumulation phase would be
  // funded TWICE — once by the decumulation loop (via retirement.annualSpending)
  // and again as a lump-sum goal drawdown below — making success/depletion look
  // worse than reality. When retirement is enabled we therefore exclude
  // retirement-category goals from goal-funding; the decumulation engine already
  // models that spend. (Their "success" is reported as the money-lasts
  // probability instead of an always-zero funded flag — see goalSuccess below.)
  const coveredByRetirement = (g: Goal) => retEnabled && g.cat === "Retirement";

  // Pre-compute goal target year offsets (relative year indices)
  const goalsByYear: Array<{ goal: Goal; yearOffset: number }> = plan.goals
    .filter((g) => !coveredByRetirement(g))
    .map((g) => ({ goal: g, yearOffset: g.startYear - startYear }))
    .filter((g) => g.yearOffset >= 0 && g.yearOffset < Y);

  // ─── Run all sims ───
  const paths: number[][] = [];
  const pathMeta: Array<{
    unfunded: number;
    shortfallYear: number | null;
    liquidityDepletedYear: number | null;
  }> = []; // NEW
  const goalHits: Record<string, number> = {};
  plan.goals.forEach((g) => {
    goalHits[g.id] = 0;
  });
  let depletionCount = 0;

  for (let s = 0; s < sims; s++) {
    let taxable = initialTaxable;
    let deferred = initialDeferred;
    let propertyVal = totalPropertyValue;
    const loanState: Loan[] = plan.loans.map((l) => ({ ...l }));
    const path: number[] = [];
    const goalFundedThisSim: Record<string, boolean> = {};

    let depleted = false;
    let unfunded = 0;
    let shortfallYear: number | null = null;
    let liquidityDepletedYear: number | null = null;

    for (let y = 0; y < Y; y++) {
      const age = currentAge + y;

      // 1. Stochastic return on both investable pools — TRUE log-normal:
      // the drawn annRet = (μ − σ²/2) + σZ is a LOG return, so the annual
      // multiplier is e^annRet. This delivers the stated CMA arithmetic mean μ
      // (E[e^annRet] = 1+μ-ish) with median growth e^drift — the −σ²/2
      // volatility drag counted exactly once. (The port originally applied this
      // draw arithmetically as 1+annRet, double-counting the drag; fixed
      // 2026-07 — see CLAUDE.md "Return model". Legacy always used exp().)
      // e^x > 0, so a long-only pool can never flip negative in a down year.
      // Returns apply ONLY to a positive balance, so a temporary cash shortfall
      // (negative taxable) is never compounded like a leveraged short.
      const growth = Math.exp(drift + sigma * boxMuller(rng));
      if (taxable > 0) taxable *= growth;
      if (deferred > 0) deferred *= growth;

      // 2. Stochastic property appreciation (3% ± 2%) — property isn't drawn for spending
      const propRet = 0.03 + 0.02 * boxMuller(rng);
      propertyVal = propertyVal * (1 + propRet);

      // 3. Loan amortization — debt service (interest + principal) is real cash
      // out the door, deducted from the year's cash flow below. Paying principal
      // moves cash to equity (assets −P, debt −P), so a payment nets out to
      // costing exactly the interest. Expense categories are assumed to exclude
      // debt service on tracked loans (it would double-count otherwise).
      let debtService = 0;
      loanState.forEach((l) => {
        const { newBal, interestPaid, principalPaid } = amortizeLoan(l);
        l.bal = newBal;
        if (l.yrs > 0) l.yrs -= 1;
        debtService += interestPaid + principalPaid;
      });

      // 4. Cash flow — accumulation while working, decumulation in retirement.
      // Required Minimum Distributions are AGE-based (IRS rules apply from 73
      // regardless of employment), so they are taken before the phase split: a
      // client who keeps working past 73 (retirementAge > 73) is still forced to
      // draw down the tax-deferred pool.
      let netRMD = 0;
      if (retEnabled && age >= 73 && deferred > 0) {
        const rmd = calcRMD(deferred, age, "US");
        deferred -= rmd;
        netRMD =
          rmd -
          estimateIncomeTax(rmd, taxCountry) -
          computeStateTax(rmd, taxCountry, plan.clients[0]?.state);
      }

      const inRetirement = retEnabled && age >= retirementAge;
      if (!inRetirement) {
        // Working: surplus (post-tax income − inflated expenses − debt service)
        // is saved into the taxable pool; a shortfall draws it down. A forced RMD
        // during working years is after-tax income not earmarked for spending, so
        // it is reinvested into the taxable pool.
        const inflatedExpense = annualExpense * Math.pow(1 + inflation, y);
        taxable += afterTaxIncome - inflatedExpense - debtService + netRMD;
      } else {
        // Retirement: salary stops. Pensions (COLA-grown) + RMDs provide taxed
        // income; the remaining spending need is withdrawn — taxable first, then
        // the tax-deferred pool (grossed up for tax).
        let pensionGross = 0;
        for (const p of pensions) {
          if (age >= p.startAge)
            pensionGross +=
              (p.annualAmount || 0) *
              Math.pow(1 + (p.colaRate || 0), age - p.startAge);
        }
        const netPension =
          pensionGross -
          estimateIncomeTax(pensionGross, taxCountry) -
          computeStateTax(pensionGross, taxCountry, plan.clients[0]?.state);

        const spending = retSpendToday * Math.pow(1 + inflation, y);
        let need = spending + debtService - netPension - netRMD;
        if (need <= 0) {
          // Pension/RMD more than covers spending — reinvest the surplus.
          taxable += -need;
        } else {
          const fromTaxable = Math.min(Math.max(0, taxable), need);
          taxable -= fromTaxable;
          need -= fromTaxable;
          if (need > 0) {
            // Deferred withdrawals are taxed as income — gross up so the net
            // covers the need. The rate is estimated on the full withdrawal-funded
            // outflow (spending + debt service), so a mortgage paid from the
            // deferred pool isn't modeled as tax-free when spending is small.
            const grossBase = spending + debtService;
            const effRate = Math.min(
              0.5,
              Math.max(
                0,
                (estimateIncomeTax(grossBase, taxCountry) +
                  computeStateTax(
                    grossBase,
                    taxCountry,
                    plan.clients[0]?.state,
                  )) /
                  Math.max(1, grossBase),
              ),
            );
            // const effRate = Math.min(0.5, Math.max(0, estimateIncomeTax(grossBase, taxCountry) / Math.max(1, grossBase)));
            deferred -= need / (1 - effRate);
            need = 0;
          }
        }
        if (taxable < 0) {
          deferred += taxable;
          taxable = 0;
        }
        if (deferred < 0) {
          unfunded += -deferred;
          if (liquidityDepletedYear === null) liquidityDepletedYear = y;
          depleted = true;
          deferred = 0;
        }
      }

      // 5. Goal funding — drawn from taxable then deferred (calendar-year aware).
      goalsByYear.forEach(({ goal, yearOffset }) => {
        if (yearOffset !== y) return;
        if (goalFundedThisSim[goal.id]) return;
        const yearsNeeded = Math.max(1, goal.endYear - goal.startYear + 1);
        const totalNeeded =
          goal.amt * yearsNeeded * Math.pow(1 + inflation, yearOffset);
        if (taxable + deferred >= totalNeeded) {
          goalFundedThisSim[goal.id] = true;
          const fromTaxable = Math.min(Math.max(0, taxable), totalNeeded);
          taxable -= fromTaxable;
          deferred -= totalNeeded - fromTaxable;
        } else {
          // record dollar gap
          const available = Math.max(0, taxable) + Math.max(0, deferred);
          const gap = totalNeeded - available;
          if (gap > 0.5) {
            unfunded += gap;
            if (shortfallYear === null) shortfallYear = y;
            if (liquidityDepletedYear === null) liquidityDepletedYear = y;
          }
          const fromTaxable = Math.max(0, taxable);
          taxable -= fromTaxable;
          deferred -= Math.max(0, deferred);
          // goalFundedThisSim[goal.id] = true;
          goalFundedThisSim[goal.id] = false;
        }
      });

      // 6. Net worth this year = investable pools + property − total debt
      const totalDebt = loanState.reduce((s, l) => s + Math.max(0, l.bal), 0);
      path.push(taxable + deferred + propertyVal - totalDebt - unfunded);
    }

    paths.push(path);
    pathMeta.push({ unfunded, shortfallYear, liquidityDepletedYear }); // NEW
    if (depleted) depletionCount++;
    Object.entries(goalFundedThisSim).forEach(([gid, hit]) => {
      if (hit) goalHits[gid] = (goalHits[gid] || 0) + 1;
    });
  }

  // ─── Compute percentiles per year ───
  const pct = (sortedRow: number[], p: number) =>
    sortedRow[Math.max(0, Math.min(sims - 1, Math.floor(sims * (p / 100))))];

  // const p10: number[] = [], p25: number[] = [], p50: number[] = [];
  // const p75: number[] = [], p80: number[] = [], p90: number[] = [];

  // for (let y = 0; y < Y; y++) {
  //   const row = paths.map((p) => p[y]).sort((a, b) => a - b);
  //   p10.push(pct(row, 10));
  //   p25.push(pct(row, 25));
  //   p50.push(pct(row, 50));
  //   p75.push(pct(row, 75));
  //   p80.push(pct(row, 80));
  //   p90.push(pct(row, 90));
  // }
  const percentileSeries: Record<string, number[]> = {};

  for (const p of requestedPercentiles) {
    percentileSeries[`p${p}`] = [];
  }

  for (let y = 0; y < Y; y++) {
    const row = paths.map((path) => path[y]).sort((a, b) => a - b);

    for (const p of requestedPercentiles) {
      percentileSeries[`p${p}`].push(pct(row, p));
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Convert nominal future dollars to today's dollars
  // ─────────────────────────────────────────────────────────────

  const realPercentileSeries: Record<string, number[]> = {};

  for (const p of requestedPercentiles) {
    realPercentileSeries[`p${p}`] = percentileSeries[`p${p}`].map(
      (value, yearOffset) => value / Math.pow(1 + inflation, yearOffset),
    );
  }

  const finalRow = paths.map((path) => path[Y - 1]).sort((a, b) => a - b);

  const mean = finalRow.reduce((sum, value) => sum + value, 0) / sims;

  const finalPercentiles: Record<string, number> = {};

  for (const p of requestedPercentiles) {
    finalPercentiles[`p${p}`] = pct(finalRow, p);
  }

  // Final values in today's dollars
  const realFinalPercentiles: Record<string, number> = {};

  for (const p of requestedPercentiles) {
    const series = realPercentileSeries[`p${p}`];

    realFinalPercentiles[`p${p}`] = series[series.length - 1];
  }
  // ─── Goal success rates ───
  // Retirement-category goals excluded from goal-funding (see coveredByRetirement
  // above) are met by the decumulation engine, so their "success" IS the
  // money-lasts probability — reporting the raw funded flag would always be 0.
  const retSuccessProb = (sims - depletionCount) / sims;
  const goalSuccess = plan.goals.map((g) => ({
    goalId: g.id,
    goalName: g.name,
    probability: coveredByRetirement(g)
      ? retSuccessProb
      : (goalHits[g.id] || 0) / sims,
  }));

  const depletedMeta = pathMeta.filter((m) => m.liquidityDepletedYear !== null);
  const medianUnfunded = depletedMeta.length
    ? depletedMeta.map((m) => m.unfunded).sort((a, b) => a - b)[
        Math.floor(depletedMeta.length / 2)
      ]
    : 0;

  // ─── Hash input for caching (stable for identical plans) ───
  const inputHash = hashPlan(plan, sims, Y, seed, asOfYear);

  // ─── Retirement "will my money last?" summary ───
  const retirement = retEnabled
    ? {
        enabled: true,
        successProbability: (sims - depletionCount) / sims,
        depletionProbability: depletionCount / sims,
        retirementAge: ret!.retirementAge,
        planToAge,
      }
    : undefined;

  return {
    inputHash,
    sims,
    years: Y,
    paths,

    // Nominal future dollars
    percentiles: percentileSeries,

    // Inflation-adjusted today's dollars
    realPercentiles: realPercentileSeries,

    goalSuccess,

    // Nominal ending values
    final: {
      ...finalPercentiles,
      mean,
    },

    // Today's-dollar ending values
    realFinal: realFinalPercentiles,

    medianUnfunded,

    depletionProbability: depletedMeta.length / sims,

    ...(retirement ? { retirement } : {}),

    runMs: Math.round(performance.now() - t0),
  };
}

// Bump whenever the simulation model changes (not just inputs), so persisted
// results keyed by inputHash can never be served for a different engine.
const ENGINE_VERSION = 2;

/** Cheap stable hash for caching simulation results */
function hashPlan(
  plan: WealthPlan,
  sims: number,
  years: number,
  seed?: number,
  asOfYear?: number,
): string {
  const s = JSON.stringify({
    v: ENGINE_VERSION,
    c: plan.clients.map((c) => [c.risk, c.horizon, c.country, c.dob]),
    a: plan.assets.map((a) => [a.cls, a.value, a.liquid]),
    l: plan.loans.map((l) => [l.bal, l.rate, l.yrs]),
    g: plan.goals.map((g) => [g.amt, g.startYear, g.endYear]),
    i: plan.incomes.map((i) => [i.amount, i.taxable !== false]),
    e: plan.expenses.map((e) => e.amount),
    r: plan.retirement
      ? [
          plan.retirement.enabled,
          plan.retirement.retirementAge,
          plan.retirement.annualSpending,
          plan.retirement.planToAge,
        ]
      : null,
    p: (plan.pensions || []).map((p) => [
      p.annualAmount,
      p.startAge,
      p.colaRate,
    ]),
    inf: plan.inflationRate,
    sims,
    years,
    seed: seed ?? null,
    asOfYear: asOfYear ?? null,
  });
  // Simple FNV-1a hash
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

// ─────────────────────────────────────────────────────────────────
// GOLDEN-MASTER regression harness for the Monte Carlo engine.
//
// A curated set of fully-specified plans is run with a fixed `seed` AND a
// fixed `asOfYear`, which makes the engine's output byte-reproducible. The
// resulting statistics are frozen in EXPECTED below. Any future change that
// moves the numbers — an intentional model change OR an accidental
// regression — trips these tests, forcing a conscious decision.
//
// Tolerance: comparisons are relative (money) / absolute (probabilities)
// rather than exact. A fixed seed makes mulberry32's uniform stream identical
// everywhere (pure integer math), and V8 ships its own transcendental
// implementations, so cross-platform drift is far below these tolerances —
// while any *real* algorithm change moves medians by whole percent, orders of
// magnitude above them. This keeps the gate green across Node/OS yet sensitive
// to genuine drift.
//
// TO REGENERATE after an INTENTIONAL engine change:
//   1. set GEN_GOLDEN=1 and run this file — it throws a JSON blob of the new
//      signatures (npx vitest run golden-master  with GEN_GOLDEN=1).
//   2. paste the blob into EXPECTED below.
//   3. review the diff: the numbers should move only in the way you intended.
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { runMonteCarlo } from "@/lib/engine/monte-carlo";
import type { WealthPlan, SimulationInput, SimulationResult } from "@/lib/engine/types";

const ASOF = 2026;

/** Build a fully-specified plan from partial overrides (fixed metadata). */
function mk(p: Partial<WealthPlan> & Pick<WealthPlan, "clients">): WealthPlan {
  return {
    version: 1,
    currency: "USD",
    inflationRate: 0.038,
    inflationRegion: "US",
    children: [],
    incomes: [],
    expenses: [],
    assets: [],
    loans: [],
    goals: [],
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...p,
  };
}

// ─── Canonical scenarios (each anchored to a fixed seed + asOfYear) ───
const SCENARIOS: Array<{ name: string; input: SimulationInput }> = [
  {
    name: "accumulation-60-40",
    input: {
      sims: 1000, years: 30, seed: 101, asOfYear: ASOF,
      plan: mk({
        clients: [{ id: "c1", first: "A", last: "B", country: "US", risk: "moderate", horizon: "15_plus" }],
        incomes: [{ id: "i1", clientId: "c1", source: "Salary", amount: 150000, taxable: true }],
        expenses: [{ id: "e1", name: "Living", amount: 6000 }],
        assets: [
          { id: "a1", type: "brokerage", label: "Equity", value: 300000, liquid: true, cls: "equity" },
          { id: "a2", type: "bonds", label: "Bonds", value: 200000, liquid: true, cls: "fixed_income" },
          { id: "a3", type: "savings", label: "Cash", value: 50000, liquid: true, cls: "cash" },
        ],
      }),
    },
  },
  {
    name: "goals-college-and-wedding",
    input: {
      sims: 1000, years: 30, seed: 202, asOfYear: ASOF,
      plan: mk({
        clients: [{ id: "c1", first: "A", last: "B", country: "US", risk: "moderate", horizon: "15_plus" }],
        incomes: [{ id: "i1", clientId: "c1", source: "Salary", amount: 180000, taxable: true }],
        expenses: [{ id: "e1", name: "Living", amount: 7000 }],
        assets: [
          { id: "a1", type: "brokerage", label: "Equity", value: 400000, liquid: true, cls: "equity" },
          { id: "a2", type: "savings", label: "Cash", value: 100000, liquid: true, cls: "cash" },
        ],
        goals: [
          { id: "g1", name: "College", cat: "Education", tier: "essential", amt: 40000, startYear: 2030, endYear: 2033 },
          { id: "g2", name: "Wedding", cat: "Family", tier: "important", amt: 50000, startYear: 2035, endYear: 2035 },
        ],
      }),
    },
  },
  {
    name: "retirement-funded",
    input: {
      sims: 1000, years: 40, seed: 303, asOfYear: ASOF,
      plan: mk({
        clients: [{ id: "c1", first: "Alex", last: "W", dob: "1972-05-14", country: "US", risk: "moderately_aggressive", horizon: "15_plus" }],
        incomes: [{ id: "i1", clientId: "c1", source: "Salary", amount: 185000, taxable: true }],
        expenses: [{ id: "e1", name: "Living", amount: 7500 }],
        assets: [
          { id: "a1", type: "brokerage", label: "Taxable", value: 640000, liquid: true, cls: "equity" },
          { id: "a2", type: "401k", label: "401(k)", value: 880000, liquid: false, cls: "mixed" },
          { id: "a3", type: "savings", label: "Cash", value: 120000, liquid: true, cls: "cash" },
          { id: "a4", type: "home", label: "Home", value: 850000, liquid: false, cls: "real_estate" },
        ],
        loans: [{ id: "l1", type: "Mortgage", bal: 410000, rate: 5.4, yrs: 24 }],
        // Note: the only goal here is an Education goal (a genuine, separate
        // drawdown). Retirement spend is modelled by the decumulation engine
        // (retirement.annualSpending); a `cat === "Retirement"` goal would now be
        // excluded from goal-funding to avoid double-counting — see pipeline.test.ts.
        goals: [
          { id: "g2", name: "College", cat: "Education", tier: "important", amt: 60000, startYear: 2028, endYear: 2031 },
        ],
        retirement: { enabled: true, retirementAge: 65, annualSpending: 90000, planToAge: 92 },
        pensions: [{ id: "pn1", label: "Social Security", annualAmount: 34000, startAge: 67, colaRate: 0.025 }],
      }),
    },
  },
  {
    name: "two-client-blend",
    input: {
      sims: 1000, years: 25, seed: 404, asOfYear: ASOF,
      plan: mk({
        clients: [
          { id: "c1", first: "A", last: "B", dob: "1980-03-01", country: "US", risk: "aggressive", horizon: "15_plus" },
          { id: "c2", first: "C", last: "D", dob: "1982-07-01", country: "US", risk: "conservative", horizon: "15_plus" },
        ],
        incomes: [
          { id: "i1", clientId: "c1", source: "Salary", amount: 160000, taxable: true },
          { id: "i2", clientId: "c2", source: "Salary", amount: 90000, taxable: true },
        ],
        expenses: [{ id: "e1", name: "Living", amount: 8000 }],
        assets: [
          { id: "a1", type: "brokerage", label: "Equity", value: 500000, liquid: true, cls: "equity" },
          { id: "a2", type: "home", label: "Home", value: 600000, liquid: false, cls: "real_estate" },
          { id: "a3", type: "savings", label: "Cash", value: 80000, liquid: true, cls: "cash" },
        ],
        loans: [{ id: "l1", type: "Mortgage", bal: 300000, rate: 4.5, yrs: 20 }],
      }),
    },
  },
  {
    name: "retirement-tight",
    input: {
      sims: 1000, years: 40, seed: 505, asOfYear: ASOF,
      plan: mk({
        clients: [{ id: "c1", first: "E", last: "F", dob: "1968-01-01", country: "US", risk: "moderate", horizon: "10_15" }],
        incomes: [{ id: "i1", clientId: "c1", source: "Salary", amount: 110000, taxable: true }],
        expenses: [{ id: "e1", name: "Living", amount: 5500 }],
        assets: [
          { id: "a1", type: "brokerage", label: "Taxable", value: 450000, liquid: true, cls: "equity" },
          { id: "a2", type: "ira", label: "IRA", value: 350000, liquid: false, cls: "mixed" },
          { id: "a3", type: "savings", label: "Cash", value: 60000, liquid: true, cls: "cash" },
        ],
        retirement: { enabled: true, retirementAge: 65, annualSpending: 75000, planToAge: 95 },
        pensions: [{ id: "pn1", label: "Social Security", annualAmount: 26000, startAge: 67, colaRate: 0.02 }],
      }),
    },
  },
];

// ─── Signature: the stable, comparable projection of a result ───
type Sig = {
  years: number;
  final: { p10: number; p25: number; p50: number; p75: number; p90: number; mean: number };
  goals: Record<string, number>;
  retirement?: { success: number; depletion: number; retirementAge: number; planToAge: number };
};

function signature(r: SimulationResult): Sig {
  const sig: Sig = {
    years: r.years,
    final: {
      p10: Math.round(r.final.p10), p25: Math.round(r.final.p25), p50: Math.round(r.final.p50),
      p75: Math.round(r.final.p75), p90: Math.round(r.final.p90), mean: Math.round(r.final.mean),
    },
    goals: Object.fromEntries(r.goalSuccess.map((g) => [g.goalId, Number(g.probability.toFixed(4))])),
  };
  if (r.retirement) {
    sig.retirement = {
      success: Number(r.retirement.successProbability.toFixed(4)),
      depletion: Number(r.retirement.depletionProbability.toFixed(4)),
      retirementAge: r.retirement.retirementAge,
      planToAge: r.retirement.planToAge,
    };
  }
  return sig;
}

// ─── Frozen golden values (regenerate via GEN_GOLDEN=1 — see header) ───
// Regenerated 2026-07-09 for the TRUE log-normal return model
// (pool *= e^annRet — see monte-carlo.ts header). Every scenario moved UP vs
// the prior arithmetic model, as predicted: medians +20-60% (scaling with
// equity share × horizon), money-lasts probabilities +12-13pp.
const EXPECTED: Record<string, Sig> = {
  "accumulation-60-40": {
    years: 30,
    final: { p10: 1713538, p25: 2467555, p50: 3750848, p75: 5435146, p90: 7619986, mean: 4265555 },
    goals: {},
  },
  "goals-college-and-wedding": {
    years: 30,
    final: { p10: 958518, p25: 1806255, p50: 3475576, p75: 5862945, p90: 8958971, mean: 4519698 },
    goals: { g1: 1, g2: 1 },
  },
  "retirement-funded": {
    years: 39,
    final: { p10: 2472088, p25: 2736940, p50: 5089116, p75: 11421473, p90: 21010922, mean: 9264342 },
    goals: { g2: 1 },
    retirement: { success: 0.609, depletion: 0.391, retirementAge: 65, planToAge: 92 },
  },
  "two-client-blend": {
    years: 25,
    final: { p10: 3770327, p25: 4920615, p50: 7050298, p75: 9854526, p90: 13879012, mean: 8127171 },
    goals: {},
  },
  "retirement-tight": {
    years: 37,
    final: { p10: 0, p25: 0, p50: 0, p75: 1328158, p90: 6855091, mean: 2050439 },
    goals: {},
    retirement: { success: 0.322, depletion: 0.678, retirementAge: 65, planToAge: 95 },
  },
};

// Money fields compared within 0.2% relative (+$50 abs floor); probabilities
// within 1 percentage point. See header for why this is drift-sensitive yet
// cross-platform stable.
const MONEY_REL = 2e-3;
const MONEY_ABS = 50;
const PROB_ABS = 0.01;

function expectMoneyClose(actual: number, expected: number, label: string) {
  const tol = Math.max(MONEY_ABS, Math.abs(expected) * MONEY_REL);
  expect(Math.abs(actual - expected), `${label}: ${actual} vs golden ${expected} (tol ±${tol.toFixed(0)})`).toBeLessThanOrEqual(tol);
}

describe("golden-master engine snapshots", () => {
  if (process.env.GEN_GOLDEN) {
    it("GENERATE golden values", () => {
      const out: Record<string, Sig> = {};
      for (const s of SCENARIOS) out[s.name] = signature(runMonteCarlo(s.input));
      throw new Error("\nGOLDEN_START\n" + JSON.stringify(out, null, 2) + "\nGOLDEN_END\n");
    });
    return;
  }

  for (const s of SCENARIOS) {
    it(`${s.name} matches golden values`, () => {
      const golden = EXPECTED[s.name];
      expect(golden, `no golden values for "${s.name}" — regenerate with GEN_GOLDEN=1`).toBeTruthy();

      const sig = signature(runMonteCarlo(s.input));
      expect(sig.years).toBe(golden.years);

      (["p10", "p25", "p50", "p75", "p90", "mean"] as const).forEach((k) =>
        expectMoneyClose(sig.final[k], golden.final[k], `${s.name} final.${k}`)
      );

      expect(Object.keys(sig.goals).sort()).toEqual(Object.keys(golden.goals).sort());
      for (const [gid, prob] of Object.entries(golden.goals)) {
        expect(Math.abs(sig.goals[gid] - prob), `${s.name} goal ${gid}: ${sig.goals[gid]} vs ${prob}`).toBeLessThanOrEqual(PROB_ABS);
      }

      if (golden.retirement) {
        expect(sig.retirement).toBeTruthy();
        expect(sig.retirement!.retirementAge).toBe(golden.retirement.retirementAge);
        expect(sig.retirement!.planToAge).toBe(golden.retirement.planToAge);
        expect(Math.abs(sig.retirement!.success - golden.retirement.success)).toBeLessThanOrEqual(PROB_ABS);
        expect(Math.abs(sig.retirement!.depletion - golden.retirement.depletion)).toBeLessThanOrEqual(PROB_ABS);
      } else {
        expect(sig.retirement).toBeUndefined();
      }
    });
  }
});

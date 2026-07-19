// ─────────────────────────────────────────────────────────────────
// INTEGRATION ("E2E-lite") — exercises the exact data path the app and the
// printable report use, end to end, with no browser:
//
//   raw (legacy/partial) plan  →  migratePlan  →  parsePlan (Zod)  →
//   runMonteCarlo  →  report-relevant coherence assertions
//
// A real browser E2E (Playwright) would additionally cover auth + routing, but
// those need a running dev server + browser binaries + a workflow-scoped CI
// change we can't push from here. This covers the highest-risk regression
// surface — the numbers the UI renders — deterministically and in-process.
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { migratePlan } from "@/lib/plan/migrate";
import { parsePlan } from "@/lib/plan/schema";
import { runMonteCarlo } from "@/lib/engine/monte-carlo-old";
import { estimateIncomeTax } from "@/lib/engine/financial-math";
import type { WealthPlan, SimulationResult } from "@/lib/engine/types";

const ASOF = 2026;

// A deliberately messy, legacy-shaped export: stringified numbers, a legacy
// `targetYear` goal (no start/end span), an income pointing at a client id that
// won't survive migration, and retirement/pensions present.
const RAW_LEGACY_EXPORT = {
  version: 1,
  currency: "USD",
  inflationRate: 0.038,
  clients: [
    { id: "keep", first: "Dana", last: "Reyes", dob: "1975-06-01", country: "US", risk: "moderate", horizon: "15_plus" },
  ],
  incomes: [
    { id: "in1", clientId: "keep", source: "Salary", amount: "165000", taxable: true },
    { id: "in2", clientId: "GHOST_CLIENT", source: "Consulting", amount: "20000", taxable: true }, // orphan
  ],
  expenses: [{ id: "ex1", name: "Living", amount: "6800" }],
  assets: [
    { id: "as1", type: "brokerage", value: "520000", liquid: true, cls: "equity" },
    { id: "as2", type: "401k", value: "610000", liquid: false, cls: "mixed" },
    { id: "as3", type: "savings", value: "90000", liquid: true, cls: "cash" },
    { id: "as4", type: "home", value: "700000", liquid: false, cls: "real_estate" },
  ],
  loans: [{ id: "ln1", type: "Mortgage", bal: "330000", rate: "5.1", yrs: "22" }],
  goals: [
    { id: "gl1", name: "College", cat: "Education", tier: "important", amt: "45000", targetYear: 2032 }, // legacy shape
  ],
  retirement: { enabled: true, retirementAge: 66, annualSpending: 84000, planToAge: 92 },
  pensions: [{ id: "pn1", label: "Social Security", annualAmount: 30000, startAge: 67, colaRate: 0.025 }],
};

describe("pipeline: migrate → validate → simulate", () => {
  const migrated = migratePlan(RAW_LEGACY_EXPORT);
  const parsed = parsePlan(migrated);

  it("migration normalizes a legacy export into a schema-valid plan", () => {
    expect(parsed.ok, parsed.ok ? "" : JSON.stringify((parsed as { fieldErrors: unknown }).fieldErrors)).toBe(true);
  });

  it("coerces stringified numbers to real numbers", () => {
    expect(migrated.incomes[0].amount).toBe(165000);
    expect(migrated.assets[0].value).toBe(520000);
    expect(migrated.loans[0].bal).toBe(330000);
    expect(migrated.loans[0].rate).toBeCloseTo(5.1, 5);
  });

  it("reassigns orphaned income to the surviving client", () => {
    const survivingId = migrated.clients[0].id;
    migrated.incomes.forEach((i) => expect(i.clientId).toBe(survivingId));
  });

  it("maps a legacy targetYear goal onto a start/end span", () => {
    const g = migrated.goals[0];
    expect(g.startYear).toBe(2032);
    expect(g.endYear).toBe(2032);
    expect(g.endYear).toBeGreaterThanOrEqual(g.startYear);
  });

  it("produces a coherent, NaN-free simulation the report can render", () => {
    if (!parsed.ok) throw new Error("plan did not validate");
    const plan = parsed.plan;
    const result: SimulationResult = runMonteCarlo({ plan, sims: 1000, years: 40, seed: 2026, asOfYear: ASOF });

    // Structural shape the chart + tables rely on.
    expect(result.paths.length).toBe(1000);
    expect(result.years).toBeGreaterThan(0);
    result.paths.forEach((p) => expect(p.length).toBe(result.years));
    (["p10", "p25", "p50", "p75", "p90"] as const).forEach((k) =>
      expect(result.percentiles[k].length).toBe(result.years)
    );

    // No NaN / Infinity anywhere the UI formats as currency.
    const allFinal = [result.final.p10, result.final.p25, result.final.p50, result.final.p75, result.final.p90, result.final.mean];
    allFinal.forEach((v) => expect(Number.isFinite(v)).toBe(true));

    // Net-worth statement identity the report header shows.
    const totalAssets = plan.assets.reduce((s, a) => s + a.value, 0);
    const totalLiab = plan.loans.reduce((s, l) => s + l.bal, 0);
    expect(totalAssets).toBe(520000 + 610000 + 90000 + 700000);
    expect(totalLiab).toBe(330000);
    expect(totalAssets - totalLiab).toBe(1590000);

    // Tax line the cash-flow section shows is non-negative and below gross.
    const tax = estimateIncomeTax(185000, "US");
    expect(tax).toBeGreaterThan(0);
    expect(tax).toBeLessThan(185000);

    // Goal success: one entry per goal, ids aligned, probabilities in [0,1].
    expect(result.goalSuccess.map((g) => g.goalId).sort()).toEqual(plan.goals.map((g) => g.id).sort());
    result.goalSuccess.forEach((g) => {
      expect(g.probability).toBeGreaterThanOrEqual(0);
      expect(g.probability).toBeLessThanOrEqual(1);
    });

    // Retirement summary present + internally consistent.
    expect(result.retirement).toBeTruthy();
    const ret = result.retirement!;
    expect(ret.retirementAge).toBe(66);
    expect(ret.planToAge).toBe(92);
    expect(ret.successProbability + ret.depletionProbability).toBeCloseTo(1, 6);
    [ret.successProbability, ret.depletionProbability].forEach((p) => {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    });
  });
});

describe("pipeline: retirement-category goals don't double-count against decumulation", () => {
  // The engine models retirement spend via retirement.annualSpending. A separate
  // `cat === "Retirement"` GOAL for the same spend used to ALSO be drawn from
  // wealth, double-counting retirement spending and making success/depletion look
  // worse than reality (the app's sample plans carry exactly this pattern). The
  // engine now excludes retirement-category goals from goal-funding when
  // retirement is enabled, so adding one is a no-op on the decumulation outcome.
  const base: WealthPlan = {
    version: 1, currency: "USD", inflationRate: 0.03, inflationRegion: "US",
    clients: [{ id: "c1", first: "P", last: "Q", dob: "1970-01-01", country: "US", risk: "moderate", horizon: "15_plus" }],
    children: [],
    incomes: [{ id: "i1", clientId: "c1", source: "Salary", amount: 150000, taxable: true }],
    expenses: [{ id: "e1", name: "Living", amount: 6000 }],
    assets: [
      { id: "a1", type: "brokerage", value: 700000, liquid: true, cls: "equity" },
      { id: "a2", type: "401k", value: 700000, liquid: false, cls: "mixed" },
    ],
    loans: [], goals: [],
    retirement: { enabled: true, retirementAge: 65, annualSpending: 80000, planToAge: 90 },
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  };
  const withOverlap: WealthPlan = {
    ...base,
    goals: [{ id: "gret", name: "Retirement Income", cat: "Retirement", tier: "essential", amt: 80000, startYear: 2035, endYear: 2060 }],
  };

  it("adding an overlapping retirement-income goal no longer changes modelled success", () => {
    const clean = runMonteCarlo({ plan: base, sims: 1000, years: 40, seed: 77, asOfYear: ASOF });
    const withGoal = runMonteCarlo({ plan: withOverlap, sims: 1000, years: 40, seed: 77, asOfYear: ASOF });
    // The retirement-category goal is excluded from goal-funding, so the
    // decumulation outcome is identical to the plan without it (no double-count).
    expect(withGoal.retirement!.successProbability).toBe(clean.retirement!.successProbability);
    expect(withGoal.retirement!.depletionProbability).toBe(clean.retirement!.depletionProbability);
  });

  it("reports the covered retirement goal's success as the money-lasts probability, not zero", () => {
    const withGoal = runMonteCarlo({ plan: withOverlap, sims: 1000, years: 40, seed: 77, asOfYear: ASOF });
    const gs = withGoal.goalSuccess.find((g) => g.goalId === "gret");
    expect(gs).toBeTruthy();
    expect(gs!.probability).toBe(withGoal.retirement!.successProbability);
  });
});

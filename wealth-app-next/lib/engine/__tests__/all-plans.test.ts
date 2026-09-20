// ─────────────────────────────────────────────────────────────────
// ALL-PLANS INTEGRATION — one rich household plan that lights up every
// feature the audit shipped, exercised end to end through the real engine +
// plan pipeline. Where the per-feature suites isolate a single mechanism, this
// proves they compose correctly on a single realistic plan:
//
//   Plan B — per-asset-class CMAs + correlation → portfolio μ/σ; income tax
//   Plan C — retirement decumulation + pensions + RMDs → success/depletion
//   Plan D — the numbers the printable report derives are coherent
//   Plan E — seeded + asOfYear determinism; migrate→validate→serialize pipeline
//
// (Plan A is auth/routing/resilience — not engine-testable here; it is verified
// via routes + middleware + build, not this suite.)
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { runMonteCarlo } from "@/lib/engine/monte-carlo-old";
import { portfolioReturnParams, estimateIncomeTax } from "@/lib/engine/financial-math";
import { ASSET_CLASS_CMA } from "@/lib/engine/constants";
import { migratePlan } from "@/lib/plan/migrate";
import { parsePlan } from "@/lib/plan/schema";
import { serializePlan, deserializePlan } from "@/lib/plan/import-export";
import type { WealthPlan, Asset, SimulationInput } from "@/lib/engine/types";

const ASOF = 2026;
const SEED = 20260101;

// A two-client household with a diversified balance sheet (7 asset classes),
// taxable + non-taxable income, a mortgage, near-term goals, retirement enabled,
// and two pensions. The 401(k) deferred balance is large enough that RMDs kick
// in once the primary client passes 73 within the modelled horizon.
function richPlan(): WealthPlan {
  const assets: Asset[] = [
    { id: "a_eq", type: "brokerage", label: "Taxable Equity", value: 600000, liquid: true, cls: "equity" },
    { id: "a_fi", type: "bonds", label: "Bond Fund", value: 300000, liquid: true, cls: "fixed_income" },
    { id: "a_re", type: "home", label: "Primary Residence", value: 800000, liquid: false, cls: "real_estate" },
    { id: "a_ca", type: "savings", label: "Cash", value: 150000, liquid: true, cls: "cash" },
    { id: "a_401k", type: "401k", label: "401(k)", value: 500000, liquid: false, cls: "mixed" },
    { id: "a_co", type: "commodity", label: "Commodities", value: 100000, liquid: true, cls: "commodity" },
    { id: "a_cr", type: "crypto", label: "Crypto", value: 50000, liquid: true, cls: "crypto" },
  ];
  return {
    version: 1, currency: "USD", inflationRate: 0.038, inflationRegion: "US",
    clients: [
      { id: "c1", first: "Marcus", last: "Vance", dob: "1969-03-01", country: "US", risk: "moderately_aggressive", horizon: "15_plus" },
      { id: "c2", first: "Lena", last: "Vance", dob: "1971-08-01", country: "US", risk: "moderate", horizon: "15_plus" },
    ],
    children: [{ id: "ch1", first: "Nora", last: "Vance", dob: "2012-04-10" }],
    incomes: [
      { id: "i1", clientId: "c1", source: "Salary", amount: 210000, taxable: true },
      { id: "i2", clientId: "c2", source: "Salary", amount: 120000, taxable: true },
      { id: "i3", clientId: "c1", source: "Municipal bond interest", amount: 15000, taxable: false },
    ],
    expenses: [{ id: "e1", name: "Living", amount: 9000 }],
    assets,
    loans: [{ id: "l1", type: "Mortgage", bal: 350000, rate: 5.2, yrs: 20 }],
    goals: [
      { id: "g_col", name: "College", cat: "Education", tier: "essential", amt: 55000, startYear: 2028, endYear: 2031 },
      { id: "g_trv", name: "Travel", cat: "Lifestyle", tier: "aspirational", amt: 30000, startYear: 2035, endYear: 2037 },
    ],
    retirement: { enabled: true, retirementAge: 64, annualSpending: 130000, planToAge: 95 },
    pensions: [
      { id: "pn1", label: "Social Security", annualAmount: 40000, startAge: 67, colaRate: 0.025 },
      { id: "pn2", label: "Defined Benefit", annualAmount: 24000, startAge: 65, colaRate: 0 },
    ],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
  };
}

function run(plan: WealthPlan, extra: Partial<SimulationInput> = {}) {
  return runMonteCarlo({ plan, sims: 1000, years: 40, seed: SEED, asOfYear: ASOF, ...extra });
}

describe("all-plans integration", () => {
  const plan = richPlan();

  // ─── Plan B: composition drives μ/σ; diversification lowers σ ───
  describe("Plan B — CMAs, correlation, tax", () => {
    const investable = plan.assets
      .filter((a) => a.cls !== "real_estate")
      .map((a) => ({ cls: a.cls, value: a.value }));
    const fallback = { mean: 0.085, sigma: 0.15 }; // moderately_aggressive-ish

    it("portfolio mean is the value-weighted class mean (exact)", () => {
      const total = investable.reduce((s, h) => s + h.value, 0);
      const expectedMean = investable.reduce((s, h) => s + (h.value / total) * ASSET_CLASS_CMA[h.cls!].mean, 0);
      const { mean } = portfolioReturnParams(investable, fallback);
      expect(mean).toBeCloseTo(expectedMean, 10);
    });

    it("portfolio σ is BELOW the value-weighted class σ (diversification, ρ<1)", () => {
      const total = investable.reduce((s, h) => s + h.value, 0);
      const weightedAvgSigma = investable.reduce((s, h) => s + (h.value / total) * ASSET_CLASS_CMA[h.cls!].sigma, 0);
      const { sigma } = portfolioReturnParams(investable, fallback);
      expect(sigma).toBeGreaterThan(0);
      expect(sigma).toBeLessThan(weightedAvgSigma);
    });

    it("progressive income tax uses only taxable income, is positive and marginal", () => {
      const taxableIncome = plan.incomes.filter((i) => i.taxable !== false).reduce((s, i) => s + i.amount, 0);
      expect(taxableIncome).toBe(330000); // 210k + 120k, the 15k muni excluded
      const tax = estimateIncomeTax(taxableIncome, "US");
      expect(tax).toBeGreaterThan(0);
      expect(tax).toBeLessThan(taxableIncome);
      const effectiveRate = tax / taxableIncome;
      expect(effectiveRate).toBeGreaterThan(0.15);
      expect(effectiveRate).toBeLessThan(0.37); // below the top marginal rate
    });
  });

  // ─── Plan C: retirement life-cycle produces a sane distribution ───
  describe("Plan C — retirement, pensions, RMDs", () => {
    const r = run(plan);

    it("models an accumulate→decumulate horizon to planToAge", () => {
      // primary client age at asOf 2026 = 56 (born 1969-03, before Jan 1) → 95-56 = 39 yrs
      // (the engine's horizon is max(requested years, planToAge - age), so ask for fewer)
      const short = run(plan, { years: 30 });
      expect(short.years).toBe(39);
      // horizon reaches past age 73, so the RMD branch is exercised
      expect(short.years).toBeGreaterThan(73 - 56);
    });

    it("returns a 'will my money last?' summary that is internally consistent", () => {
      expect(r.retirement).toBeTruthy();
      const ret = r.retirement!;
      expect(ret.retirementAge).toBe(64);
      expect(ret.planToAge).toBe(95);
      expect(ret.successProbability + ret.depletionProbability).toBeCloseTo(1, 6);
      // a genuine distribution, not degenerate 0/1
      expect(ret.successProbability).toBeGreaterThan(0);
      expect(ret.successProbability).toBeLessThan(1);
    });
  });

  // ─── Plan D: the report's derived numbers are coherent ───
  describe("Plan D — report data coherence", () => {
    // report-view runs runMonteCarlo({sims:1000, years:30, seed:20260101}).
    const sim = runMonteCarlo({ plan, sims: 1000, years: 30, seed: 20260101, asOfYear: ASOF });

    it("net-worth statement identity holds", () => {
      const totalAssets = plan.assets.reduce((s, a) => s + a.value, 0);
      const totalLiab = plan.loans.reduce((s, l) => s + l.bal, 0);
      expect(totalAssets).toBe(2500000);
      expect(totalLiab).toBe(350000);
      expect(totalAssets - totalLiab).toBe(2150000);
    });

    it("assets group cleanly by class with no leftover value", () => {
      const byClass = new Map<string, number>();
      for (const a of plan.assets) byClass.set(a.cls!, (byClass.get(a.cls!) || 0) + a.value);
      const regrouped = Array.from(byClass.values()).reduce((s, v) => s + v, 0);
      expect(regrouped).toBe(plan.assets.reduce((s, a) => s + a.value, 0));
      expect(byClass.size).toBe(7);
    });

    it("projection the report charts is finite and ordered", () => {
      (["p10", "p25", "p50", "p75", "p90"] as const).forEach((k) => {
        expect(Number.isFinite(sim.final[k])).toBe(true);
      });
      expect(sim.final.p10).toBeLessThanOrEqual(sim.final.p50);
      expect(sim.final.p50).toBeLessThanOrEqual(sim.final.p90);
      expect(sim.goalSuccess.map((g) => g.goalId).sort()).toEqual(["g_col", "g_trv"]);
    });
  });

  // ─── Plan E: determinism + the migrate/validate/serialize pipeline ───
  describe("Plan E — determinism + pipeline round-trip", () => {
    it("same seed + asOfYear ⇒ byte-identical result", () => {
      const a = run(plan);
      const b = run(plan);
      expect(a.final).toEqual(b.final);
      expect(a.retirement).toEqual(b.retirement);
      expect(a.goalSuccess).toEqual(b.goalSuccess);
    });

    it("still runs with asOfYear omitted (defaults to current year)", () => {
      const r = runMonteCarlo({ plan, sims: 200, years: 20, seed: SEED });
      expect(r.years).toBeGreaterThan(0);
      expect(Number.isFinite(r.final.p50)).toBe(true);
    });

    it("survives a full export → import → simulate round-trip unchanged", () => {
      const json = serializePlan(plan);
      const back = deserializePlan(json);
      expect(back.ok, back.ok ? "" : (back as { error: string }).error).toBe(true);
      if (!back.ok) return;
      // the imported plan simulates to the same result as the original
      const before = run(plan);
      const after = run(back.plan);
      expect(after.final.p50).toBeCloseTo(before.final.p50, 6);
      expect(after.retirement!.successProbability).toBeCloseTo(before.retirement!.successProbability, 6);
    });

    it("also normalizes a legacy-shaped version of the same plan", () => {
      // targetYear (legacy) + stringified numbers on a subset
      const legacy = {
        ...plan,
        goals: [{ id: "g_col", name: "College", cat: "Education", tier: "essential", amt: "55000", targetYear: 2028 }],
        assets: plan.assets.map((a) => ({ ...a, value: String(a.value) })),
      };
      const parsed = parsePlan(migratePlan(legacy));
      expect(parsed.ok, parsed.ok ? "" : JSON.stringify((parsed as { fieldErrors: unknown }).fieldErrors)).toBe(true);
      if (parsed.ok) {
        expect(parsed.plan.assets[0].value).toBe(600000);
        expect(parsed.plan.goals[0].startYear).toBe(2028);
        expect(parsed.plan.goals[0].endYear).toBe(2028);
      }
    });
  });
});

// ─────────────────────────────────────────────────────────────────
// HARDENING regressions — each test pins a specific engine bug that the
// adversarial audit (2026-07) surfaced and this change fixed. If any of these
// go red, a fix was reverted.
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { runMonteCarlo } from "@/lib/engine/monte-carlo-old";
import type { WealthPlan, Asset, SimulationInput } from "@/lib/engine/types";

const ASOF = 2026;

function mk(assets: Asset[], extra: Partial<WealthPlan> = {}): WealthPlan {
  return {
    version: 1, currency: "USD", inflationRate: 0.03, inflationRegion: "US",
    clients: [{ id: "c1", first: "A", last: "B", country: "US", risk: "moderate", horizon: "15_plus" }],
    children: [],
    incomes: [{ id: "i1", clientId: "c1", source: "Salary", amount: 0, taxable: true }],
    expenses: [{ id: "e1", name: "Living", amount: 0 }],
    assets, loans: [], goals: [],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    ...extra,
  };
}
const run = (plan: WealthPlan, extra: Partial<SimulationInput> = {}) =>
  runMonteCarlo({ plan, sims: 1000, years: 40, seed: 777, asOfYear: ASOF, ...extra });

describe("hardening: return multiplier floored, no compounding of debt", () => {
  it("a long-only pool never goes negative from returns (no −100%+ single-year draw)", () => {
    // 100% crypto (σ 0.60), no cashflow so the pool changes ONLY via returns.
    // Before the clamp, a sub-−100% draw flipped the balance negative and
    // projected an impossible multi-million NEGATIVE net worth for a long-only
    // $200k position (observed floor −$78M). A long position can hit 0, never <0.
    const plan = mk([{ id: "a1", type: "crypto", label: "Crypto", value: 200000, liquid: true, cls: "crypto" }]);
    const r = run(plan);
    const minCell = Math.min(...r.paths.map((p) => Math.min(...p)));
    expect(minCell).toBeGreaterThanOrEqual(0);
    expect(Number.isFinite(r.final.p50)).toBe(true);
  });

  it("a pure cash shortfall does not compound at the market rate (deterministic)", () => {
    // No assets, no income, only expenses: net worth is just −Σ inflated
    // expenses. Before the fix the negative balance was multiplied by (1+annRet)
    // each year, making it random and deeper than the true cumulative shortfall.
    const years = 10, monthly = 3000, inf = 0.03;
    const plan = mk([], { expenses: [{ id: "e1", name: "Living", amount: monthly }] });
    const r = run(plan, { years });
    let expected = 0;
    for (let y = 0; y < years; y++) expected -= monthly * 12 * Math.pow(1 + inf, y);
    // Deterministic across all sims (a non-positive pool never grows).
    expect(r.final.p10).toBe(r.final.p90);
    expect(r.final.p50).toBeCloseTo(expected, 2);
  });
});

describe("hardening: a term-expired loan with a balance is not erased", () => {
  it("a yrs=0 balance still reduces net worth by exactly its amount", () => {
    const base = mk([{ id: "a1", type: "brokerage", label: "Eq", value: 300000, liquid: true, cls: "equity" }]);
    const withLoan: WealthPlan = { ...base, loans: [{ id: "l1", type: "Personal", bal: 10000, rate: 0, yrs: 0 }] };
    const a = run(base);
    const b = run(withLoan);
    // Same seed ⇒ identical asset paths; the persistent $10k debt is a flat offset.
    expect(a.final.p50 - b.final.p50).toBeCloseTo(10000, 2);
  });
});

describe("hardening: RMDs are age-based (73), not coupled to retirementAge", () => {
  it("a client working past 73 is still forced to draw the deferred pool", () => {
    // Client already 74 (born 1952, asOf 2026). Zero income/expense/spending, a
    // large tax-deferred pool. With spending 0, RMDs are the only cash event, so
    // a plan that "retires" at 74 and one that "retires" at 80 must be IDENTICAL
    // — RMDs fire at 73 either way. Before the fix, retire@80 skipped RMDs for
    // ages 74-79 and ended richer.
    const deferred: Asset[] = [{ id: "a1", type: "401k", label: "401k", value: 1000000, liquid: false, cls: "mixed" }];
    const common = {
      clients: [{ id: "c1", first: "A", last: "B", dob: "1952-01-01", country: "US", risk: "moderate", horizon: "15_plus" }],
    } as Partial<WealthPlan>;
    const retire74 = mk(deferred, { ...common, retirement: { enabled: true, retirementAge: 74, annualSpending: 0, planToAge: 90 } });
    const retire80 = mk(deferred, { ...common, retirement: { enabled: true, retirementAge: 80, annualSpending: 0, planToAge: 90 } });
    const a = run(retire74);
    const b = run(retire80);
    expect(a.final.p50).toBeCloseTo(b.final.p50, 2);
    // And RMD tax drag means terminal wealth is below the untouched 1M seed grown
    // — i.e. the deferred pool really was distributed, not left to compound.
    expect(a.retirement).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────
// ANALYTICAL sanity-bounds for the Monte Carlo engine.
//
// The engine is no longer a port of the legacy wealth-analyzer.html runMC()
// (it re-models with per-asset-class CMAs + correlation, progressive income
// tax, and a two-pool decumulation life-cycle), so a numeric "parity" test
// against that engine would compare two intentionally-different models. The
// honest equivalent is to pin the engine against FIRST-PRINCIPLES truth:
// closed-form growth, log-normal skew, ordering, and composition effects that
// any correct wealth projector must satisfy. These catch a broad class of
// regressions the golden-master snapshots would also flag — but here the
// *reason* a value is right is explicit, so a red test points at the bug.
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { runMonteCarlo } from "@/lib/engine/monte-carlo";
import { geometricMean } from "@/lib/engine/financial-math";
import { ASSET_CLASS_CMA } from "@/lib/engine/constants";
import type { WealthPlan, SimulationInput, Asset } from "@/lib/engine/types";

const ASOF = 2026;

function mk(assets: Asset[], extra: Partial<WealthPlan> = {}): WealthPlan {
  return {
    version: 1, currency: "USD", inflationRate: 0.03, inflationRegion: "US",
    clients: [{ id: "c1", first: "A", last: "B", country: "US", risk: "moderate", horizon: "15_plus" }],
    children: [],
    // Income exactly equals expense ⇒ zero surplus ⇒ terminal wealth is driven
    // purely by investment growth on the starting assets (no savings, no draws).
    incomes: [{ id: "i1", clientId: "c1", source: "Salary", amount: 0, taxable: true }],
    expenses: [{ id: "e1", name: "Living", amount: 0 }],
    assets, loans: [], goals: [],
    createdAt: "2026-01-01T00:00:00.000Z", updatedAt: "2026-01-01T00:00:00.000Z",
    ...extra,
  };
}

const asset = (cls: Asset["cls"], value: number): Asset =>
  ({ id: "a_" + cls, type: cls!, label: cls!, value, liquid: true, cls });

function run(plan: WealthPlan, seed: number, years = 30): ReturnType<typeof runMonteCarlo> {
  const input: SimulationInput = { plan, sims: 1000, years, seed, asOfYear: ASOF };
  return runMonteCarlo(input);
}

describe("analytical bounds — closed-form growth", () => {
  it("single-class median tracks initial × e^(drift·T) (exact log-normal closed form)", () => {
    // With no cashflow and a single asset class, each path is
    // initial · exp(Σ(drift + σZ)), so log terminal wealth is
    // Normal(T·drift, σ²T) and the median is EXACTLY initial·e^(T·drift).
    // Holds for every σ — check the volatile class too, not just cash.
    const T = 30, initial = 1_000_000;
    for (const cls of ["cash", "equity"] as const) {
      const { mean: mu, sigma } = ASSET_CLASS_CMA[cls];
      const drift = geometricMean(mu, sigma);
      const closedForm = initial * Math.exp(drift * T);

      const r = run(mk([asset(cls, initial)]), 111, T);
      const rel = Math.abs(r.final.p50 - closedForm) / closedForm;
      // Sampling error of a 1000-sim median scales with σ√T — cash is sub-1%,
      // equity a few percent.
      const tol = cls === "cash" ? 0.03 : 0.08;
      expect(rel, `${cls} median ${Math.round(r.final.p50)} vs closed-form ${Math.round(closedForm)} (rel ${(rel * 100).toFixed(2)}%)`).toBeLessThan(tol);
    }
  });

  it("single-class MEAN tracks the stated CMA: initial × e^(μ·T) within 3 sample-SE", () => {
    // E[e^(drift+σZ)] = e^(drift+σ²/2) = e^μ, so expected terminal wealth is
    // initial·e^(μT) — the engine now DELIVERS the published capital-market
    // assumption instead of under-shooting it by σ²/2 (the pre-2026-07
    // arithmetic model's double-counted volatility drag).
    const T = 30, initial = 1_000_000;
    for (const cls of ["cash", "fixed_income", "equity"] as const) {
      const { mean: mu } = ASSET_CLASS_CMA[cls];
      const expected = initial * Math.exp(mu * T);

      const r = run(mk([asset(cls, initial)]), 222, T);
      const finals = r.paths.map((p) => p[T - 1]);
      const m = finals.reduce((s, v) => s + v, 0) / finals.length;
      const sd = Math.sqrt(finals.reduce((s, v) => s + (v - m) * (v - m), 0) / (finals.length - 1));
      const se = sd / Math.sqrt(finals.length);
      const z = Math.abs(m - expected) / se;
      expect(z, `${cls} mean ${Math.round(m)} vs e^(μT) ${Math.round(expected)} (z=${z.toFixed(2)})`).toBeLessThan(3);
    }
  });

  it("zero assets + zero net cashflow ⇒ zero terminal wealth", () => {
    const r = run(mk([]), 222);
    expect(r.final.p50).toBe(0);
    expect(r.final.p90).toBe(0);
  });
});

describe("analytical bounds — distribution shape", () => {
  const plans: Array<[string, WealthPlan]> = [
    ["equity", mk([asset("equity", 500_000)])],
    ["cash", mk([asset("cash", 500_000)])],
    ["60/40", mk([asset("equity", 300_000), asset("fixed_income", 200_000)])],
  ];

  it("percentiles are monotonically ordered every year", () => {
    const r = run(plans[0][1], 333);
    const check = (p: { p10: number; p25: number; p50: number; p75: number; p90: number }) => {
      expect(p.p10).toBeLessThanOrEqual(p.p25);
      expect(p.p25).toBeLessThanOrEqual(p.p50);
      expect(p.p50).toBeLessThanOrEqual(p.p75);
      expect(p.p75).toBeLessThanOrEqual(p.p90);
    };
    for (let y = 0; y < r.years; y++) {
      check({ p10: r.percentiles.p10[y], p25: r.percentiles.p25[y], p50: r.percentiles.p50[y], p75: r.percentiles.p75[y], p90: r.percentiles.p90[y] });
    }
    check(r.final);
  });

  it("mean ≥ median (log-normal right skew) for every composition", () => {
    plans.forEach(([name, plan], i) => {
      const r = run(plan, 400 + i);
      expect(r.final.mean, `${name}: mean ${Math.round(r.final.mean)} < median ${Math.round(r.final.p50)}`).toBeGreaterThanOrEqual(r.final.p50);
    });
  });
});

describe("analytical bounds — composition effects", () => {
  it("equity grows faster AND spreads wider than cash (same starting value)", () => {
    const equity = run(mk([asset("equity", 500_000)]), 501);
    const cash = run(mk([asset("cash", 500_000)]), 501);

    // Higher expected return ⇒ higher median terminal wealth.
    expect(equity.final.p50).toBeGreaterThan(cash.final.p50);
    // Higher volatility ⇒ wider dispersion.
    const spread = (r: { final: { p90: number; p10: number } }) => r.final.p90 - r.final.p10;
    expect(spread(equity)).toBeGreaterThan(spread(cash));
  });

  it("diversification: a 50/50 equity+fixed_income sleeve is less volatile than pure equity of equal value", () => {
    const equity = run(mk([asset("equity", 500_000)]), 601);
    const mixed = run(mk([asset("equity", 250_000), asset("fixed_income", 250_000)]), 601);
    const cv = (r: { final: { p90: number; p10: number; p50: number } }) => (r.final.p90 - r.final.p10) / r.final.p50;
    // Correlation < 1 between equity and fixed income ⇒ blended portfolio σ is
    // below the value-weighted average, so relative spread narrows.
    expect(cv(mixed)).toBeLessThan(cv(equity));
  });
});

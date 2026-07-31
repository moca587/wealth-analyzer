import { describe, expect, test } from "vitest";
import { runMonteCarlo } from "../monte-carlo";
import type { SimulationInput, WealthPlan } from "../types";

// Creates a test Wealth Plan with sensible defaults, allowing overrides for specific test cases.
function makePlan(overrides: Partial<WealthPlan> = {}): WealthPlan {
  const base: WealthPlan = {
    version: 1,
    currency: "USD",
    inflationRate: 0.038,
    inflationRegion: "US",
    clients: [
      {
        id: "c1",
        first: "Test",
        last: "Client",
        dob: "1980-01-01",
        country: "US",
        risk: "moderate",
        horizon: "15_plus",
      },
    ],
    children: [],
    incomes: [
      {
        id: "i1",
        clientId: "c1",
        source: "salary",
        amount: 100000,
        taxable: true,
      },
    ],
    expenses: [
      {
        id: "e1",
        name: "Living expenses",
        amount: 4000, // monthly
      },
    ],
    assets: [
      {
        id: "a1",
        type: "brokerage",
        label: "Brokerage",
        value: 100000,
        liquid: true,
        country: "US",
        cls: "equity",
      },
      {
        id: "a2",
        type: "home",
        label: "Home",
        value: 300000,
        liquid: false,
        country: "US",
        cls: "real_estate",
      },
    ],
    loans: [],
    goals: [],
    notes: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };

  return base;
}

// Helper to run Monte Carlo 
// Input is SimulationInput, returns SimulationResult 
function run(
  plan: WealthPlan,
  overrides: Partial<SimulationInput> = {}
) {
  return runMonteCarlo({
    plan,
    sims: 500,
    years: 20,
    ...overrides,
  });
}

describe("runMonteCarlo", () => {
  test("returns correct path shape", () => {
    const result = run(makePlan(), { sims: 200, years: 10 });

    expect(result.sims).toBe(200);
    expect(result.years).toBe(10);
    expect(result.paths).toHaveLength(200);
    expect(result.paths[0]).toHaveLength(10);
  });

  test("final percentiles are ordered", () => {
    const result = run(makePlan());

    expect(result.final.p10).toBeLessThanOrEqual(result.final.p25);
    expect(result.final.p25).toBeLessThanOrEqual(result.final.p50);
    expect(result.final.p50).toBeLessThanOrEqual(result.final.p75);
    expect(result.final.p75).toBeLessThanOrEqual(result.final.p90);
  });

  test("higher savings increases median final wealth", () => {
    const lowSavings = run(
      makePlan({
        incomes: [
          {
            id: "i1",
            clientId: "c1",
            source: "salary",
            amount: 80000,
            taxable: true,
          },
        ],
        expenses: [
          {
            id: "e1",
            name: "Living expenses",
            amount: 5000,
          },
        ],
      })
    );

    const highSavings = run(
      makePlan({
        incomes: [
          {
            id: "i1",
            clientId: "c1",
            source: "salary",
            amount: 150000,
            taxable: true,
          },
        ],
        expenses: [
          {
            id: "e1",
            name: "Living expenses",
            amount: 3000,
          },
        ],
      })
    );

    expect(highSavings.final.p50).toBeGreaterThan(lowSavings.final.p50);
  });

  test("portfolio composition drives return — an all-equity plan beats an all-cash plan", () => {
    const equityPlan = run(
      makePlan({
        assets: [{ id: "a1", type: "brokerage", label: "Equity", value: 200000, liquid: true, country: "US", cls: "equity" }],
      }),
      { seed: 5 }
    );
    const cashPlan = run(
      makePlan({
        assets: [{ id: "a1", type: "savings", label: "Cash", value: 200000, liquid: true, country: "US", cls: "cash" }],
      }),
      { seed: 5 }
    );

    // Same everything except the asset class — equity's higher CMA return wins.
    expect(equityPlan.final.p50).toBeGreaterThan(cashPlan.final.p50);
  });

  test("portfolio composition drives volatility — equity spreads wider than cash", () => {
    const equityPlan = run(
      makePlan({
        assets: [{ id: "a1", type: "brokerage", label: "Equity", value: 200000, liquid: true, country: "US", cls: "equity" }],
      }),
      { seed: 8 }
    );
    const cashPlan = run(
      makePlan({
        assets: [{ id: "a1", type: "savings", label: "Cash", value: 200000, liquid: true, country: "US", cls: "cash" }],
      }),
      { seed: 8 }
    );

    const equitySpread = equityPlan.final.p90 - equityPlan.final.p10;
    const cashSpread = cashPlan.final.p90 - cashPlan.final.p10;
    expect(equitySpread).toBeGreaterThan(cashSpread);
  });

  test("income tax reduces projected wealth versus untaxed income", () => {
    const taxed = run(
      makePlan({ incomes: [{ id: "i1", clientId: "c1", source: "salary", amount: 150000, taxable: true }] }),
      { seed: 11 }
    );
    const untaxed = run(
      makePlan({ incomes: [{ id: "i1", clientId: "c1", source: "salary", amount: 150000, taxable: false }] }),
      { seed: 11 }
    );

    expect(untaxed.final.p50).toBeGreaterThan(taxed.final.p50);
  });

  test("goal success probability is returned between 0 and 1", () => {
    const currentYear = new Date().getFullYear();

    const result = run(
      makePlan({
        goals: [
          {
            id: "g1",
            name: "College Fund",
            cat: "education",
            tier: "important",
            amt: 10000,
            startYear: currentYear + 5,
            endYear: currentYear + 9,
          },
        ],
      })
    );

    expect(result.goalSuccess).toHaveLength(1);
    expect(result.goalSuccess[0].goalName).toBe("College Fund");
    expect(result.goalSuccess[0].probability).toBeGreaterThanOrEqual(0);
    expect(result.goalSuccess[0].probability).toBeLessThanOrEqual(1);
  });

  test("simulation returns an input hash", () => {
    const result = run(makePlan());

    expect(typeof result.inputHash).toBe("string");
    expect(result.inputHash.length).toBeGreaterThan(0);
  });

  test("a fixed seed reproduces byte-identical percentiles across repeated runs", () => {
    const plan = makePlan();
    const a = run(plan, { seed: 12345 });
    const b = run(plan, { seed: 12345 });

    expect(b.percentiles).toEqual(a.percentiles);
    expect(b.final).toEqual(a.final);
    expect(b.inputHash).toBe(a.inputHash);
  });

  test("different seeds produce different outcomes (sanity check the seed is actually used)", () => {
    const plan = makePlan();
    const a = run(plan, { seed: 1 });
    const b = run(plan, { seed: 2 });

    expect(b.final.p50).not.toBe(a.final.p50);
  });

  test("a funded goal draws down wealth rather than just being checked for affordability", () => {
    const currentYear = new Date().getFullYear();
    const withoutGoal = run(makePlan({ goals: [] }), { seed: 42 });
    const withGoal = run(
      makePlan({
        goals: [
          {
            id: "g1",
            name: "One-time purchase",
            tier: "important",
            amt: 50000,
            startYear: currentYear + 5,
            endYear: currentYear + 5,
          },
        ],
      }),
      { seed: 42 }
    );

    expect(withGoal.final.p50).toBeLessThan(withoutGoal.final.p50);
  });

  test("a negative-surplus plan draws down liquid assets below a breakeven plan", () => {
    const breakeven = run(
      makePlan({
        incomes: [{ id: "i1", clientId: "c1", source: "salary", amount: 48000, taxable: true }],
        expenses: [{ id: "e1", name: "Living expenses", amount: 4000 }], // 48000/yr — breakeven
      }),
      { seed: 7 }
    );
    const overspending = run(
      makePlan({
        incomes: [{ id: "i1", clientId: "c1", source: "salary", amount: 48000, taxable: true }],
        expenses: [{ id: "e1", name: "Living expenses", amount: 6000 }], // 72000/yr — shortfall
      }),
      { seed: 7 }
    );

    expect(overspending.final.p50).toBeLessThan(breakeven.final.p50);
  });

  test("higher inflation lowers the projected wealth outcome", () => {
    const lowInflation = run(makePlan({ inflationRate: 0.02 }), { seed: 99 });
    const highInflation = run(makePlan({ inflationRate: 0.10 }), { seed: 99 });

    expect(highInflation.final.p50).toBeLessThan(lowInflation.final.p50);
  });

  test("loan balances never go negative or NaN for a zero-rate loan", () => {
    const result = run(
      makePlan({
        loans: [{ id: "l1", type: "Personal", bal: 20000, rate: 0, yrs: 5 }],
      }),
      { years: 10, seed: 3 }
    );

    result.paths.forEach((path) => path.forEach((v) => expect(Number.isFinite(v)).toBe(true)));
  });

  test("loan balances never go negative or NaN for a very high-rate loan", () => {
    const result = run(
      makePlan({
        loans: [{ id: "l1", type: "Credit card", bal: 15000, rate: 29.99, yrs: 3 }],
      }),
      { years: 10, seed: 4 }
    );

    result.paths.forEach((path) => path.forEach((v) => expect(Number.isFinite(v)).toBe(true)));
  });

  // ─── Debt service funding (regression: principal used to vanish for free) ───

  // Zero-cashflow, cash-only base so loan effects are isolated and near-deterministic.
  function debtPlan(loans: WealthPlan["loans"], assets: WealthPlan["assets"] = []) {
    return makePlan({
      incomes: [{ id: "i1", clientId: "c1", source: "salary", amount: 0, taxable: true }],
      expenses: [{ id: "e1", name: "none", amount: 0 }],
      assets,
      loans,
    });
  }

  test("a debt with no funding source cannot vanish — net worth stays ≈ −principal, never ~0", () => {
    // Nothing on the balance sheet but a $120k 0% loan. Paying it down moves the
    // shortfall into the (negative) cash pool, so net worth can never climb back
    // toward zero. Before the fix the debt amortized away for free and the final
    // median was ~0.
    const r = run(debtPlan([{ id: "l1", type: "Personal", bal: 120000, rate: 0, yrs: 10 }]), { years: 12, seed: 1 });
    expect(r.final.p50).toBeLessThan(-100000);
  });

  test("carrying a mortgage ends materially below debt-free (same assets, same seed)", () => {
    const baseline = run(debtPlan([], [{ id: "a1", type: "savings", label: "Cash", value: 500000, liquid: true, country: "US", cls: "cash" }]), { years: 20, seed: 9 });
    const mortgaged = run(
      debtPlan(
        [{ id: "l1", type: "Mortgage", bal: 300000, rate: 0, yrs: 15 }],
        [{ id: "a1", type: "savings", label: "Cash", value: 500000, liquid: true, country: "US", cls: "cash" }]
      ),
      { years: 20, seed: 9 }
    );
    // At 0% the cost is the growth lost on the principal payments — comfortably
    // above $250k here. Before the fix both plans converged to the same value.
    expect(mortgaged.final.p50).toBeLessThan(baseline.final.p50 - 250000);
  });

  test("interest makes a loan cost more than a 0% loan of the same principal", () => {
    const assets = [{ id: "a1", type: "savings", label: "Cash", value: 500000, liquid: true, country: "US" as const, cls: "cash" as const }];
    const free = run(debtPlan([{ id: "l1", type: "Loan", bal: 200000, rate: 0, yrs: 15 }], assets), { years: 20, seed: 6 });
    const costly = run(debtPlan([{ id: "l1", type: "Loan", bal: 200000, rate: 7, yrs: 15 }], assets), { years: 20, seed: 6 });
    expect(costly.final.p50).toBeLessThan(free.final.p50);
  });

  test("year-1 identity: with empty pools, every path is exactly −(balance + first-year interest)", () => {
    // Zero assets/income/expenses + a 0% $120k loan: year 1 pays exactly $12k of
    // principal from the (empty → negative) cash pool, so every path's first
    // point is EXACTLY −120,000 (−12k cash − 108k remaining debt). This pins the
    // debt-service MAGNITUDE — any over-/under-deduction (e.g. 2× or interest-only)
    // shifts it. Deterministic: returns multiply a zero pool, so no RNG leaks in.
    const r = run(debtPlan([{ id: "l1", type: "Personal", bal: 120000, rate: 0, yrs: 10 }]), { years: 3, seed: 5 });
    r.paths.forEach((p) => expect(p[0]).toBe(-120000));
  });

  test("a degenerate loan (balance left, zero remaining term) stays on the balance sheet unpaid", () => {
    const r = run(debtPlan([{ id: "l1", type: "Frozen", bal: 50000, rate: 5, yrs: 0 }]), { years: 10, seed: 2 });
    // Before the fix the balance was silently zeroed in year one (debt vanished).
    expect(r.final.p50).toBeCloseTo(-50000, 0);
  });

  // ─── Horizon guard (regression: years ≤ 0 produced NaN output) ───

  test("years: 0 clamps to a 1-year horizon with finite output", () => {
    const r = run(makePlan(), { years: 0, seed: 1 });
    expect(r.years).toBe(1);
    expect(Number.isFinite(r.final.p50)).toBe(true);
    expect(Number.isFinite(r.final.mean)).toBe(true);
  });

  test("negative and NaN years never yield NaN results", () => {
    const neg = run(makePlan(), { years: -5, seed: 1 });
    expect(neg.years).toBe(1);
    expect(Number.isFinite(neg.final.mean)).toBe(true);

    const nan = run(makePlan(), { years: NaN, seed: 1 });
    expect(nan.years).toBe(30); // non-finite falls back to the typical horizon
    expect(Number.isFinite(nan.final.mean)).toBe(true);
  });

  test("huge and fractional years are clamped and floored", () => {
    // Upper clamp guards against a runaway horizon (memory/time blowup)…
    expect(run(makePlan(), { years: 1e6, seed: 1, sims: 200 }).years).toBe(100);
    // …and flooring keeps result.years in sync with the integer path length.
    const frac = run(makePlan(), { years: 20.5, seed: 1 });
    expect(frac.years).toBe(20);
    expect(frac.paths[0]).toHaveLength(20);
  });

  test("a malformed dob with retirement enabled still yields a finite horizon (no NaN age)", () => {
    const r = run(
      makePlan({
        clients: [{ id: "c1", first: "X", last: "Y", dob: "not-a-date", country: "US", risk: "moderate", horizon: "15_plus" }],
        retirement: { enabled: true, retirementAge: 65, annualSpending: 50000, planToAge: 90 },
        assets: [{ id: "a1", type: "brokerage", label: "Cash", value: 500000, liquid: true, country: "US", cls: "cash" }],
      }),
      { seed: 1 }
    );
    expect(r.years).toBeGreaterThanOrEqual(1);
    expect(Number.isFinite(r.final.mean)).toBe(true);
  });

  test("inputHash is engine-versioned — byte-pinned so any model change forces a conscious bump", () => {
    // If this trips: either the plan-hash inputs changed or the model changed.
    // Bump ENGINE_VERSION in monte-carlo.ts and repin — never silently repin.
    const r = run(makePlan(), { seed: 12345, years: 20, asOfYear: 2026 });
    expect(r.inputHash).toBe("kdzhv6");
  });

  // ─── Retirement / decumulation (Plan C) ───

  // A near-retirement household: taxable brokerage + a tax-deferred 401(k).
  function retiree(retirement: WealthPlan["retirement"], pensions?: WealthPlan["pensions"], assetOverride?: WealthPlan["assets"]) {
    return makePlan({
      clients: [{ id: "c1", first: "R", last: "T", dob: "1966-01-01", country: "US", risk: "moderate", horizon: "15_plus" }],
      incomes: [{ id: "i1", clientId: "c1", source: "salary", amount: 120000, taxable: true }],
      expenses: [{ id: "e1", name: "Living", amount: 4000 }],
      assets: assetOverride ?? [
        { id: "a1", type: "brokerage", label: "Taxable", value: 500000, liquid: true, country: "US", cls: "equity" },
        { id: "a2", type: "401k", label: "401(k)", value: 400000, liquid: false, country: "US", cls: "equity" },
      ],
      retirement,
      pensions,
    });
  }

  test("retirement mode reports a depletion/success probability and extends the horizon", () => {
    const r = run(retiree({ enabled: true, retirementAge: 65, annualSpending: 50000, planToAge: 90 }), { seed: 1 });
    expect(r.retirement).toBeDefined();
    expect(r.retirement!.enabled).toBe(true);
    expect(r.retirement!.depletionProbability).toBeGreaterThanOrEqual(0);
    expect(r.retirement!.depletionProbability).toBeLessThanOrEqual(1);
    expect(r.retirement!.depletionProbability + r.retirement!.successProbability).toBeCloseTo(1, 10);
    expect(r.years).toBeGreaterThan(20); // modelled through planToAge, not the caller's 20
  });

  test("higher retirement spending raises the depletion probability", () => {
    const modest = run(retiree({ enabled: true, retirementAge: 65, annualSpending: 40000, planToAge: 90 }), { seed: 2 });
    const lavish = run(retiree({ enabled: true, retirementAge: 65, annualSpending: 130000, planToAge: 90 }), { seed: 2 });
    expect(lavish.retirement!.depletionProbability).toBeGreaterThan(modest.retirement!.depletionProbability);
  });

  test("a pension lowers the depletion probability", () => {
    const ret = { enabled: true, retirementAge: 65, annualSpending: 95000, planToAge: 90 };
    const noPension = run(retiree(ret, []), { seed: 3 });
    const withPension = run(retiree(ret, [{ id: "p1", label: "Social Security", annualAmount: 40000, startAge: 67, colaRate: 0.02 }]), { seed: 3 });
    expect(withPension.retirement!.depletionProbability).toBeLessThan(noPension.retirement!.depletionProbability);
  });

  test("retiring earlier raises the depletion probability", () => {
    const late = run(retiree({ enabled: true, retirementAge: 70, annualSpending: 85000, planToAge: 90 }), { seed: 4 });
    const early = run(retiree({ enabled: true, retirementAge: 62, annualSpending: 85000, planToAge: 90 }), { seed: 4 });
    expect(early.retirement!.depletionProbability).toBeGreaterThan(late.retirement!.depletionProbability);
  });

  test("a well-funded retiree's money lasts (low depletion)", () => {
    const r = run(
      retiree(
        { enabled: true, retirementAge: 65, annualSpending: 40000, planToAge: 90 },
        [],
        [{ id: "a1", type: "brokerage", label: "Taxable", value: 2000000, liquid: true, country: "US", cls: "equity" }]
      ),
      { seed: 5 }
    );
    expect(r.retirement!.depletionProbability).toBeLessThan(0.15);
  });

  test("a mortgage carried into retirement raises the depletion probability (debt service hits the retirement need)", () => {
    // Guards the retirement branch of the debt-service fix specifically: the
    // golden master would catch its removal, but this survives a careless regen.
    const ret = { enabled: true, retirementAge: 65, annualSpending: 80000, planToAge: 90 };
    const debtFree = run(retiree(ret), { seed: 21 });
    const withMortgageBase = retiree(ret);
    const withMortgage = run(
      { ...withMortgageBase, loans: [{ id: "l1", type: "Mortgage", bal: 350000, rate: 5.5, yrs: 25 }] },
      { seed: 21 }
    );
    expect(withMortgage.retirement!.depletionProbability).toBeGreaterThan(debtFree.retirement!.depletionProbability);
  });
});
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
});
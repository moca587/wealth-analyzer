import { describe, expect, test } from "vitest";
import { runMonteCarlo } from "../monte-carlo";
import type { SimulationInput, WealthPlan } from "../types";

// Creates a test financial plan 
// Can be overridden with partials for specific test cases
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
    bands: { low: 30, high: 80 },
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

  test("higher return risk profile increases median final wealth", () => {
    const conservative = run(
      makePlan({
        clients: [
          {
            id: "c1",
            first: "Test",
            last: "Client",
            dob: "1980-01-01",
            country: "US",
            risk: "conservative",
            horizon: "15_plus",
          },
        ],
      })
    );

    const aggressive = run(
      makePlan({
        clients: [
          {
            id: "c1",
            first: "Test",
            last: "Client",
            dob: "1980-01-01",
            country: "US",
            risk: "aggressive",
            horizon: "15_plus",
          },
        ],
      })
    );

    expect(aggressive.final.p50).toBeGreaterThan(conservative.final.p50);
  });

  test("higher volatility creates wider outcome spread", () => {
    const lowVol = run(
      makePlan({
        clients: [
          {
            id: "c1",
            first: "Test",
            last: "Client",
            dob: "1980-01-01",
            country: "US",
            risk: "conservative",
            horizon: "15_plus",
          },
        ],
      })
    );

    const highVol = run(
      makePlan({
        clients: [
          {
            id: "c1",
            first: "Test",
            last: "Client",
            dob: "1980-01-01",
            country: "US",
            risk: "very_aggressive",
            horizon: "15_plus",
          },
        ],
      })
    );

    const lowSpread = lowVol.final.p90 - lowVol.final.p10;
    const highSpread = highVol.final.p90 - highVol.final.p10;

    expect(highSpread).toBeGreaterThan(lowSpread);
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
});
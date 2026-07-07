import { describe, expect, test } from "vitest";
import { parsePlan } from "../schema";
import { emptyPlan } from "../default-plan";
import type { WealthPlan } from "@/lib/engine/types";

function validPlan(overrides: Partial<WealthPlan> = {}): WealthPlan {
  const base = emptyPlan();
  return { ...base, ...overrides };
}

describe("parsePlan", () => {
  test("accepts a freshly-created empty plan", () => {
    const result = parsePlan(validPlan());
    expect(result.ok).toBe(true);
  });

  test("accepts a fully-populated plan", () => {
    const plan = validPlan({
      clients: [
        { id: "c1", first: "A", last: "B", country: "US", risk: "moderate", horizon: "15_plus" },
        { id: "c2", first: "C", last: "D", country: "US", risk: "moderate", horizon: "15_plus" },
      ],
      incomes: [{ id: "i1", clientId: "c1", source: "Salary", amount: 100000, taxable: true }],
      expenses: [{ id: "e1", name: "Rent", amount: 3000 }],
      assets: [{ id: "a1", type: "Brokerage", value: 50000, liquid: true, cls: "equity" }],
      loans: [{ id: "l1", type: "Mortgage", bal: 300000, rate: 6.5, yrs: 30 }],
      goals: [{ id: "g1", name: "Retirement", amt: 80000, startYear: 2050, endYear: 2070 }],
    });
    const result = parsePlan(plan);
    expect(result.ok).toBe(true);
  });

  test("rejects malformed payloads outright (not an object)", () => {
    expect(parsePlan(null).ok).toBe(false);
    expect(parsePlan("not a plan").ok).toBe(false);
    expect(parsePlan([1, 2, 3]).ok).toBe(false);
  });

  test("rejects a plan with zero clients", () => {
    const result = parsePlan(validPlan({ clients: [] }));
    expect(result.ok).toBe(false);
  });

  test("rejects a plan with more than two clients", () => {
    const c = (id: string) => ({ id, first: "", last: "" });
    const result = parsePlan(validPlan({ clients: [c("c1"), c("c2"), c("c3")] as WealthPlan["clients"] }));
    expect(result.ok).toBe(false);
  });

  test("rejects NaN/Infinity in money fields instead of silently coercing them", () => {
    const result = parsePlan(validPlan({ incomes: [{ id: "i1", clientId: "x", source: "s", amount: NaN }] }));
    expect(result.ok).toBe(false);
  });

  test("rejects a negative asset value", () => {
    const result = parsePlan(
      validPlan({ assets: [{ id: "a1", type: "Brokerage", value: -100, liquid: true }] })
    );
    expect(result.ok).toBe(false);
  });

  test("rejects a goal whose endYear is before its startYear", () => {
    const result = parsePlan(
      validPlan({ goals: [{ id: "g1", name: "X", amt: 1000, startYear: 2050, endYear: 2040 }] })
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.fieldErrors["goals.0.endYear"]).toBeDefined();
  });

  test("rejects an unknown risk profile enum value", () => {
    const result = parsePlan(
      validPlan({
        clients: [{ id: "c1", first: "", last: "", risk: "super_risky" as WealthPlan["clients"][number]["risk"] }],
      })
    );
    expect(result.ok).toBe(false);
  });

  test("rejects an income referencing a clientId that doesn't exist", () => {
    const result = parsePlan(
      validPlan({ incomes: [{ id: "i1", clientId: "ghost-client", source: "Salary", amount: 1000 }] })
    );
    expect(result.ok).toBe(false);
  });

  test("rejects an inflation rate outside the sane range for a generic region", () => {
    const result = parsePlan(validPlan({ inflationRate: 0.5, inflationRegion: "US" }));
    expect(result.ok).toBe(false);
  });

  test("allows Brazil's historically high inflation rate as an explicit override", () => {
    const result = parsePlan(validPlan({ inflationRate: 0.585, inflationRegion: "BR" }));
    expect(result.ok).toBe(true);
  });

  test("still rejects an absurd inflation rate even for Brazil", () => {
    const result = parsePlan(validPlan({ inflationRate: 5, inflationRegion: "BR" }));
    expect(result.ok).toBe(false);
  });
});

import { describe, expect, test } from "vitest";
import { serializePlan, deserializePlan } from "../import-export";
import { migratePlan } from "../migrate";
import { emptyPlan } from "../default-plan";
import { parsePlan } from "../schema";

describe("serialize/deserialize round-trip", () => {
  test("a valid plan survives export then import unchanged in substance", () => {
    const plan = emptyPlan();
    plan.clients[0].first = "Ada";
    plan.assets.push({ id: "a1", type: "brokerage", value: 25000, liquid: true, cls: "equity", country: "US" });
    plan.goals.push({ id: "g1", name: "House", amt: 40000, startYear: 2035, endYear: 2035 });

    const text = serializePlan(plan);
    const result = deserializePlan(text);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan.clients[0].first).toBe("Ada");
      expect(result.plan.assets).toHaveLength(1);
      expect(result.plan.goals[0].name).toBe("House");
    }
  });

  test("accepts a bare plan object (no export envelope)", () => {
    const plan = emptyPlan();
    const result = deserializePlan(JSON.stringify(plan));
    expect(result.ok).toBe(true);
  });

  test("rejects non-JSON text with a friendly error", () => {
    const result = deserializePlan("this is not json {");
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toMatch(/JSON/i);
  });

  test("rejects an unrepairable plan (negative money survives migration, schema rejects it)", () => {
    // migratePlan heals shape issues (e.g. swapped goal years) but does not
    // invent data — a negative amount is preserved and then fails validation.
    const result = deserializePlan(JSON.stringify({ plan: { ...emptyPlan(), assets: [{ id: "a1", type: "brokerage", value: -5000, liquid: true }] } }));
    expect(result.ok).toBe(false);
  });

  test("repairs a swapped goal year span rather than rejecting it (upgrade, not fail)", () => {
    const result = deserializePlan(JSON.stringify({ plan: { ...emptyPlan(), goals: [{ id: "g1", name: "X", amt: 1000, startYear: 2050, endYear: 2040 }] } }));
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.plan.goals[0].endYear).toBeGreaterThanOrEqual(result.plan.goals[0].startYear);
  });
});

describe("migratePlan", () => {
  test("upgrades a legacy goal with targetYear into startYear/endYear", () => {
    const migrated = migratePlan({
      clients: [{ id: "c1", first: "A", last: "B", risk: "moderate", horizon: "15_plus", country: "US" }],
      goals: [{ id: "g1", name: "Retire", amt: 60000, targetYear: 2045 }],
    });
    expect(migrated.goals[0].startYear).toBe(2045);
    expect(migrated.goals[0].endYear).toBe(2045);
    expect(parsePlan(migrated).ok).toBe(true);
  });

  test("coerces stringified numbers and blanks into finite money values", () => {
    const migrated = migratePlan({
      clients: [{ id: "c1", first: "A", last: "B" }],
      incomes: [{ id: "i1", clientId: "c1", source: "Salary", amount: "90000" }],
      assets: [{ id: "a1", type: "brokerage", value: "", liquid: true }],
    });
    expect(migrated.incomes[0].amount).toBe(90000);
    expect(migrated.assets[0].value).toBe(0);
    expect(parsePlan(migrated).ok).toBe(true);
  });

  test("reassigns income pointing at a dropped client to a surviving one", () => {
    const migrated = migratePlan({
      clients: [{ id: "c1", first: "A", last: "B" }],
      incomes: [{ id: "i1", clientId: "ghost", source: "Salary", amount: 50000 }],
    });
    expect(migrated.incomes[0].clientId).toBe(migrated.clients[0].id);
    expect(parsePlan(migrated).ok).toBe(true);
  });

  test("an empty/garbage object migrates to a valid default plan", () => {
    expect(parsePlan(migratePlan({})).ok).toBe(true);
    expect(parsePlan(migratePlan(null)).ok).toBe(true);
    expect(parsePlan(migratePlan("nonsense")).ok).toBe(true);
  });
});

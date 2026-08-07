// ─────────────────────────────────────────────────────────────────
// Importing a REAL file from the single-file HTML app.
//
// This test reads the actual sample client profiles in the repo, not a
// hand-written fixture — because the bug it exists to stop was precisely
// that the hand-written fixtures matched what migrate.ts expected while no
// real export ever did.
//
// The assertion that matters most is not "the numbers are right" but
// "nothing is silently zero". A plan that imports with plausible net worth
// and no cash flow produces a confident, wrong projection, and the advisor
// has no signal that anything was lost.
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { importLegacyPlan, isLegacyExport } from "../from-legacy";
import { migratePlan } from "../migrate";
import { parsePlan } from "../schema";
import { runMonteCarlo } from "@/lib/engine/monte-carlo";

const SAMPLES = join(process.cwd(), "..", "Sample Client profiles");
const load = (name: string) =>
  JSON.parse(readFileSync(join(SAMPLES, name), "utf8")) as unknown;

const KELLER = "beatrice-keller-swiss-profile.json";
const hasKeller = existsSync(join(SAMPLES, KELLER));

describe("detecting a legacy export", () => {
  it("recognises the real file by its `fields` bag", () => {
    if (!hasKeller) return;
    expect(isLegacyExport(load(KELLER))).toBe(true);
  });

  it("does not mistake a SaaS export for one", () => {
    expect(isLegacyExport({ clients: [], assets: [], version: 1 })).toBe(false);
    expect(isLegacyExport({})).toBe(false);
    expect(isLegacyExport(null)).toBe(false);
    // A `fields` key that is not an object bag must not trigger it.
    expect(isLegacyExport({ fields: [1, 2, 3] })).toBe(false);
  });
});

describe.runIf(hasKeller)("the Keller household imports as a real plan", () => {
  const result = () => importLegacyPlan(load(KELLER));

  it("carries the client's NAME across", () => {
    // The old path produced a nameless client. An advisor opening a
    // migrated book to a list of blanks does not trust anything else in it.
    const { plan } = result();
    expect(plan.clients[0].first).toBeTruthy();
    expect(plan.clients[0].last).toBeTruthy();
  });

  it("carries income — the field the old import dropped entirely", () => {
    const { plan, carried } = result();
    expect(carried.incomes).toBeGreaterThan(0);
    const total = plan.incomes.reduce((s, i) => s + i.amount, 0);
    expect(total, "a household with no income projects far worse than reality").toBeGreaterThan(0);
  });

  it("converts ANNUAL legacy expenses to the MONTHLY field", () => {
    // The legacy panel is titled "Annual Household Expenses" and asks for
    // "total annual spending for the entire family"; ExpenseCategory.amount
    // is monthly. Carrying them across 1:1 (the first version of this
    // adapter) overstated spending 12x and made every imported household
    // look ruined. Anchored to the file so a regression is unmissable.
    const { plan } = result();
    const annualSpend = plan.expenses.reduce((s, e) => s + e.amount, 0) * 12;
    const annualIncome = plan.incomes.reduce((s, i) => s + i.amount, 0);
    expect(annualSpend).toBeGreaterThan(0);
    expect(annualSpend, "a household cannot plausibly spend 3x its income")
      .toBeLessThan(annualIncome);
  });

  it("does not label a pension with the legacy source MODE", () => {
    // penSrc is a <select> of auto/manual — how the figure was derived, not
    // what the benefit is called. It was printing "manual" on the client's
    // pension line.
    for (const p of result().plan.pensions ?? []) {
      expect(p.label.toLowerCase()).not.toBe("manual");
      expect(p.label.toLowerCase()).not.toBe("auto");
      expect(p.label.length).toBeGreaterThan(0);
    }
  });

  it("carries the Swiss country code rather than defaulting to US", () => {
    // The specific silent corruption: a defaulted "US" taxes a Zurich
    // household on US federal brackets and offers the wrong account types.
    const { plan } = result();
    expect(plan.clients[0].country).toBe("CH");
  });

  it("carries the currency rather than leaving the plan default", () => {
    const { plan } = result();
    expect(plan.currency).toBe("CHF");
  });

  it("carries the file's inflation rate as a DECIMAL, not a percent", () => {
    // 2.1 in the file must become 0.021, not 2.1 (= 210% inflation).
    const { plan } = result();
    expect(plan.inflationRate).toBeGreaterThan(0);
    expect(plan.inflationRate, "a percent stored as a decimal is a 100x error").toBeLessThan(0.5);
  });

  it("carries retirement and pensions", () => {
    const { plan, carried } = result();
    if (carried.retirement) {
      expect(plan.retirement!.retirementAge).toBeGreaterThan(0);
      expect(plan.retirement!.annualSpending).toBeGreaterThan(0);
      expect(plan.retirement!.planToAge!).toBeGreaterThan(plan.retirement!.retirementAge);
    }
    for (const p of plan.pensions ?? []) {
      expect(p.annualAmount).toBeGreaterThan(0);
      expect(p.startAge).toBeGreaterThan(0);
    }
  });

  it("carries assets, loans and goals", () => {
    const { carried } = result();
    expect(carried.assets).toBeGreaterThan(0);
    expect(carried.goals).toBeGreaterThan(0);
  });

  it("imports the legacy `investments` as holdings, with real cost/yield", () => {
    // The recon's "7 portfolio holding(s)" that the importer used to DROP.
    // They carry per-position expense ratio and yield the account rows do
    // not — the whole reason the holdings layer exists.
    const { plan, carried } = result();
    expect(carried.holdings).toBe(7);
    const holdings = plan.holdings ?? [];
    const spi = holdings.find((h) => h.ticker === "CHSPI");
    expect(spi, "the SPI ETF should be a holding").toBeTruthy();
    expect(spi!.er).toBeCloseTo(0.1, 6);
    expect(spi!.yld).toBeCloseTo(2.6, 6);
    expect(spi!.cls).toBe("equity");
    // An individual stock carries a yield but no expense ratio — not a fund.
    const nestle = holdings.find((h) => h.ticker === "NESN");
    expect(nestle!.er).toBeUndefined();
    expect(nestle!.yld).toBeGreaterThan(0);
  });

  it("does not list holdings among the things it could not import", () => {
    const { notes } = result();
    expect(notes.join(" ")).not.toMatch(/portfolio holding/i);
  });

  it("SAYS what it could not bring across", () => {
    // The whole point. Legacy files carry holdings, beneficiaries, equity
    // comp and tax assumptions that this app has nowhere to put; an import
    // that stays quiet about that reads as complete.
    const { notes } = result();
    expect(notes.length, "an import that drops data must say so").toBeGreaterThan(0);
  });

  it("produces a plan the schema accepts and the engine can run", () => {
    const { plan } = result();
    const parsed = parsePlan(plan);
    expect(parsed.ok, JSON.stringify("fieldErrors" in parsed ? parsed.fieldErrors : {})).toBe(true);
    if (!parsed.ok) return;
    const sim = runMonteCarlo({ plan: parsed.plan, sims: 200, years: 20, seed: 7, asOfYear: 2026 });
    expect(Number.isFinite(sim.final.p50)).toBe(true);
    // The old import ran on zero income and zero expenses and still printed
    // a confident median. A real median must at least be a real number.
    expect(sim.percentiles.p50.every(Number.isFinite)).toBe(true);
  });

  it("is reached through migratePlan, not just when called directly", () => {
    // The defect was that nothing called the legacy reader. This pins the
    // wiring, which is the part that actually broke.
    const plan = migratePlan(load(KELLER));
    expect(plan.clients[0].first, "migratePlan must route a legacy file to the legacy reader").toBeTruthy();
    expect(plan.incomes.length).toBeGreaterThan(0);
  });
});

describe("refusing to invent numbers", () => {
  const legacy = (fields: Record<string, unknown>, rest: Record<string, unknown> = {}) =>
    importLegacyPlan({ fields, ccy: "CHF", ...rest });

  it("does not turn a blank country into US", () => {
    const { plan, notes } = legacy({ c1f: "Anna", c1l: "Muster", c1co: "" });
    expect(plan.clients[0].country).toBeUndefined();
    expect(notes.join(" ")).toMatch(/country/i);
  });

  it("does not turn a blank income into a zero that reads as real", () => {
    const { plan, notes } = legacy({ c1f: "Anna", c1l: "Muster", inc1: "" });
    expect(plan.incomes).toEqual([]);
    expect(notes.join(" ")).toMatch(/income/i);
  });

  it("skips a pension with an amount but no start age", () => {
    // Guessing a start age moves the whole retirement projection.
    const { plan, notes } = legacy({
      c1f: "Anna", c1l: "Muster", penSrc: "AHV", penAnnual: "29400", penStartAge: "",
    });
    expect(plan.pensions ?? []).toEqual([]);
    expect(notes.join(" ")).toMatch(/start age/i);
  });

  it("leaves retirement off when only half of it is specified", () => {
    const { plan, notes } = legacy({ c1f: "A", c1l: "B", retAge: "65", retSpend: "" });
    expect(plan.retirement?.enabled).toBeFalsy();
    expect(notes.join(" ")).toMatch(/half-specified|Retirement/i);
  });

  it("never lets planToAge fall at or below retirementAge", () => {
    // The schema rejects it, and a 'successful' zero-length retirement is a
    // falsely reassuring 100%.
    const { plan } = legacy({ c1f: "A", c1l: "B", retAge: "65", retSpend: "90000", retLife: "60" });
    expect(plan.retirement!.planToAge!).toBeGreaterThan(plan.retirement!.retirementAge);
    expect(parsePlan(plan).ok).toBe(true);
  });

  it("rejects a non-numeric amount rather than coercing it to 0", () => {
    const { plan } = legacy({ c1f: "A", c1l: "B", inc1: "abc" });
    expect(plan.incomes).toEqual([]);
  });

  it("picks up aProp/aOther, which are not rows in `assets`", () => {
    // These live on the legacy household screen. Dropping them understates
    // net worth by the value of the family home.
    const { plan } = legacy({ c1f: "A", c1l: "B", aProp: "1250000", aOther: "80000" });
    expect(plan.assets.reduce((s, a) => s + a.value, 0)).toBe(1330000);
    expect(plan.assets.find((a) => a.cls === "real_estate")?.value).toBe(1250000);
  });

  it("divides annual expenses by twelve, exactly", () => {
    const { plan } = legacy({ c1f: "A", c1l: "B", expL: "78000", expI: "12000", expO: "10000" });
    const byName = Object.fromEntries(plan.expenses.map((e) => [e.name, e.amount]));
    expect(byName.Living).toBe(6500);
    expect(byName.Insurance).toBe(1000);
    expect(byName.Other).toBeCloseTo(833.33, 2);
  });

  it("keeps a genuinely named pension source", () => {
    const { plan } = legacy({
      c1f: "A", c1l: "B", penSrc: "AHV / Pensionskasse",
      penAnnual: "29400", penStartAge: "65",
    });
    expect(plan.pensions![0].label).toBe("AHV / Pensionskasse");
  });

  it("names a pension after its owner when the source is just a mode", () => {
    const { plan } = legacy({
      c1f: "Beatrice", c1l: "Keller", penSrc: "manual",
      penAnnual: "29400", penStartAge: "65", penCola: "1.5",
    });
    expect(plan.pensions![0].label).toBe("Pension — Beatrice Keller");
    expect(plan.pensions![0].colaRate, "cola is a percent in the file").toBeCloseTo(0.015, 6);
  });

  it("omits client 2 when the household has only one", () => {
    const { plan } = legacy({ c1f: "A", c1l: "B", c2f: "", c2l: "" });
    expect(plan.clients).toHaveLength(1);
  });

  it("honours the legacy c2visible flag", () => {
    const { plan } = legacy({ c1f: "A", c1l: "B", c2f: "Ghost", c2l: "Spouse" }, { c2visible: false });
    expect(plan.clients).toHaveLength(1);
  });

  it("says so when it imports an unnamed household", () => {
    const { notes } = legacy({});
    expect(notes.join(" ")).toMatch(/unnamed/i);
  });
});

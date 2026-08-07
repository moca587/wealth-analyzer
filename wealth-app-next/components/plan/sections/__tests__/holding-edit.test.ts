// The holdings editor's non-trivial logic, tested without a DOM. The row
// add/remove/update is the proven assets-section pattern; these are the
// bits that could actually be wrong.

import { describe, it, expect } from "vitest";
import { blankHolding, parseNumField, applyFundPick } from "../holding-edit";
import { parsePlan } from "@/lib/plan/schema";
import { emptyPlan } from "@/lib/plan/default-plan";
import type { Holding } from "@/lib/engine/types";
import type { FundPick } from "@/components/orders/fund-picker";

const holding = (o: Partial<Holding> = {}): Holding => ({ ...blankHolding(), ...o });
const pick = (o: Partial<FundPick> = {}): FundPick =>
  ({ name: "", ticker: "", cls: "equity", vehicle: "etf", ...o });

describe("blankHolding", () => {
  it("is a schema-valid position, so an added-then-saved row round-trips", () => {
    const plan = { ...emptyPlan(), holdings: [blankHolding()] };
    expect(parsePlan(plan).ok).toBe(true);
  });
  it("gives each row a distinct id", () => {
    expect(blankHolding().id).not.toBe(blankHolding().id);
  });
});

describe("parseNumField", () => {
  it("blank → undefined (unknown), NOT 0 — a position with no fee is not a free one", () => {
    expect(parseNumField("", 0.2)).toBeUndefined();
    expect(parseNumField("   ", undefined)).toBeUndefined();
  });
  it("parses a number", () => {
    expect(parseNumField("0.22", undefined)).toBe(0.22);
    expect(parseNumField("0", 0.2)).toBe(0);
  });
  it("keeps the previous value when the input is genuinely non-numeric", () => {
    // "0." parses to 0 (a valid partial), which is fine for a controlled
    // field mid-keystroke; only a truly unparseable string holds the prior.
    expect(parseNumField("0.", 0.2)).toBe(0);
    expect(parseNumField("abc", 0.2)).toBe(0.2);
    expect(parseNumField("-", undefined)).toBeUndefined(); // Number("-") is NaN
  });
});

describe("applyFundPick", () => {
  it("fills name, ticker and class from the fund", () => {
    const h = applyFundPick(holding(), pick({ name: "FTSE All-World", ticker: "VWRL", cls: "equity" }));
    expect(h.name).toBe("FTSE All-World");
    expect(h.ticker).toBe("VWRL");
    expect(h.cls).toBe("equity");
  });

  it("fills expense ratio and yield when the universe carries them", () => {
    const h = applyFundPick(holding(), pick({ ticker: "VWRL", er: 0.22, yld: 1.9 }));
    expect(h.er).toBe(0.22);
    expect(h.yld).toBe(1.9);
  });

  it("does NOT blank a cost the advisor typed when the fund has none", () => {
    // The load-bearing rule: an individual stock in the universe carries no
    // er; picking it must not wipe an er the advisor already entered.
    const h = applyFundPick(holding({ er: 0.30, yld: 2.5 }), pick({ ticker: "NESN" /* no er/yld */ }));
    expect(h.er, "typed expense ratio survives a fund with no figure").toBe(0.30);
    expect(h.yld).toBe(2.5);
  });

  it("keeps the row's value and id — a pick fills identity, not the amount", () => {
    const before = holding({ id: "keep", value: 50000 });
    const h = applyFundPick(before, pick({ name: "X", ticker: "X", er: 0.1 }));
    expect(h.id).toBe("keep");
    expect(h.value).toBe(50000);
  });

  it("ignores a class the fund reports that is not a known asset class", () => {
    const h = applyFundPick(holding({ cls: "fixed_income" }), pick({ cls: "weird" }));
    expect(h.cls, "an unknown fund class does not corrupt the row").toBe("fixed_income");
  });

  it("produces a schema-valid holding", () => {
    const h = applyFundPick(holding({ value: 10000 }), pick({ name: "VWRL", ticker: "VWRL", cls: "equity", er: 0.22, yld: 1.9 }));
    expect(parsePlan({ ...emptyPlan(), holdings: [h] }).ok).toBe(true);
  });
});

import { describe, it, expect } from "vitest";
import { searchFunds } from "../fund-search";
import { FUND_UNIVERSE } from "../fund-universe";
import type { Fund } from "../fund-universe";

const sample: Fund[] = [
  { tkr: "VTI", name: "Vanguard Total Stock Market ETF", cls: "equity", vehicle: "etf", sponsor: "Vanguard", er: 0.03 },
  { tkr: "VT", name: "Vanguard Total World Stock ETF", cls: "equity", vehicle: "etf", sponsor: "Vanguard", er: 0.07, ucits: false },
  { tkr: "VWRL", name: "Vanguard FTSE All-World UCITS ETF", cls: "equity", vehicle: "etf", sponsor: "Vanguard", er: 0.22, ucits: true },
  { tkr: "AGGG", name: "iShares Core Global Aggregate Bond UCITS ETF", cls: "fixed_income", vehicle: "etf", sponsor: "BlackRock", er: 0.10, ucits: true },
  { tkr: "IGLN", name: "iShares Physical Gold ETC", cls: "commodity", vehicle: "etf", sponsor: "BlackRock", er: 0.12, ucits: true },
];

describe("searchFunds", () => {
  it("puts an exact ticker match first", () => {
    const r = searchFunds(sample, { text: "VT" });
    expect(r[0].tkr).toBe("VT");
  });

  it("ranks a ticker prefix above a name substring", () => {
    const r = searchFunds(sample, { text: "VW" });
    expect(r[0].tkr).toBe("VWRL"); // prefix beats "All-World" name hit elsewhere
  });

  it("matches a word-start inside the name", () => {
    const r = searchFunds(sample, { text: "world" });
    expect(r.map((f) => f.tkr)).toContain("VT");
    expect(r.map((f) => f.tkr)).toContain("VWRL");
  });

  it("matches on sponsor", () => {
    const r = searchFunds(sample, { text: "blackrock" });
    expect(r.map((f) => f.tkr).sort()).toEqual(["AGGG", "IGLN"]);
  });

  it("filters by class", () => {
    const r = searchFunds(sample, { cls: "fixed_income" });
    expect(r.map((f) => f.tkr)).toEqual(["AGGG"]);
  });

  it("filters to UCITS only", () => {
    const r = searchFunds(sample, { ucitsOnly: true });
    expect(r.every((f) => f.ucits)).toBe(true);
    expect(r.map((f) => f.tkr)).not.toContain("VTI"); // non-UCITS excluded
  });

  it("breaks ties by cheaper expense ratio", () => {
    // Two equity funds with no text query rank flat, so the tiebreak (er)
    // decides: VTI (0.03) before VT (0.07) before VWRL (0.22).
    const r = searchFunds(sample.filter((f) => f.cls === "equity"), {});
    expect(r.map((f) => f.tkr)).toEqual(["VTI", "VT", "VWRL"]);
  });

  it("respects the limit", () => {
    expect(searchFunds(sample, { limit: 2 }).length).toBe(2);
  });

  it("returns nothing for a query that matches nothing", () => {
    expect(searchFunds(sample, { text: "zzzznope" })).toEqual([]);
  });

  it("works against the REAL 973-fund universe without throwing", () => {
    expect(FUND_UNIVERSE.length).toBe(973);
    const r = searchFunds(FUND_UNIVERSE, { text: "s&p 500", cls: "equity", limit: 10 });
    expect(r.length).toBeGreaterThan(0);
    expect(r.length).toBeLessThanOrEqual(10);
    // Every ticker in the universe is unique, so the picker's ticker key is safe.
    const tickers = new Set(FUND_UNIVERSE.map((f) => f.tkr));
    expect(tickers.size).toBe(FUND_UNIVERSE.length);
  });
});

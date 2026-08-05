// ─────────────────────────────────────────────────────────────────
// Proposal → ticket. The pure half of the Investment Proposal builder.
//
// The invariant that MUST hold: the ticket the browser builds passes the
// server's checkTicket. checkTicket re-sums the lines and rejects a total
// that disagrees, so the rounding-residue handling here is not cosmetic —
// get it wrong and every uneven split is rejected after the advisor
// presses BUY.
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { checkProposal, proposalIsSendable, buildTicket, type Proposal } from "../proposal";
import { checkTicket } from "../schema";
import { sumLines } from "../model";

const base = (over: Partial<Proposal> = {}): Proposal => ({
  positions: [
    { id: "a", name: "Global Equity", isin: "IE00B4L5Y983", weightPct: 60 },
    { id: "b", name: "Global Bonds", isin: "IE00BDBRDM35", weightPct: 40 },
  ],
  targetAmount: 100000,
  currency: "CHF",
  ...over,
});

const build = (p: Proposal, account = "CH-1") =>
  buildTicket(p, { ticketId: "wo_test_00000001", account, createdAt: "2026-08-05T00:00:00Z" });

describe("checkProposal", () => {
  it("passes a clean two-line proposal", () => {
    expect(checkProposal(base())).toEqual([]);
    expect(proposalIsSendable(base())).toBe(true);
  });

  it("catches weights that do not sum to 100", () => {
    const probs = checkProposal(base({ positions: [
      { id: "a", name: "A", isin: "IE00B4L5Y983", weightPct: 60 },
      { id: "b", name: "B", isin: "IE00BDBRDM35", weightPct: 30 },
    ] }));
    expect(probs.some((x) => x.level === "error" && /sum to 90/.test(x.message))).toBe(true);
    expect(proposalIsSendable(base({ positions: [
      { id: "a", name: "A", isin: "IE00B4L5Y983", weightPct: 60 },
      { id: "b", name: "B", isin: "IE00BDBRDM35", weightPct: 30 },
    ] }))).toBe(false);
  });

  it("tolerates a tenth of a percent of slack", () => {
    // The amounts are authoritative, not the weights, so 33.3/33.3/33.4 is
    // fine and must not block a sensible three-way split.
    const p = base({ positions: [
      { id: "a", name: "A", isin: "IE00B4L5Y983", weightPct: 33.3 },
      { id: "b", name: "B", isin: "IE00BDBRDM35", weightPct: 33.3 },
      { id: "c", name: "C", isin: "IE00B4L5YC18", weightPct: 33.4 },
    ] });
    expect(proposalIsSendable(p)).toBe(true);
  });

  it("rejects an ISIN that fails its check digit", () => {
    const probs = checkProposal(base({ positions: [
      { id: "a", name: "A", isin: "IE00B4L5Y984", weightPct: 100 }, // last digit wrong
    ] }));
    expect(probs.some((x) => x.level === "error" && /check digit/.test(x.message))).toBe(true);
  });

  it("flags a bare ticker as a WARNING, not a block", () => {
    const p = base({ positions: [{ id: "a", name: "Apple", ticker: "AAPL", weightPct: 100 }] });
    const probs = checkProposal(p);
    expect(probs.some((x) => x.level === "warning" && /ticker/.test(x.message))).toBe(true);
    expect(proposalIsSendable(p), "a ticker-only line is sendable").toBe(true);
  });

  it("blocks a line with NO identifier at all", () => {
    const p = base({ positions: [{ id: "a", name: "Mystery", weightPct: 100 }] });
    expect(proposalIsSendable(p)).toBe(false);
  });

  it("catches a CUSIP and ISIN that name different securities", () => {
    // The failure no custodian catches. Apple's ISIN vs Microsoft's CUSIP
    // (594918104 → US5949181045) — both individually valid, different
    // securities.
    const p = base({ positions: [{
      id: "a", name: "Apple", isin: "US0378331005", cusip: "594918104", weightPct: 100,
    }] });
    const probs = checkProposal(p);
    expect(probs.some((x) => x.level === "error" && /different securities/.test(x.message))).toBe(true);
  });

  it("accepts a CUSIP and ISIN that DO agree", () => {
    // 037833100 → US0378331005 (Apple), the arithmetically-derived match.
    const p = base({ positions: [{
      id: "a", name: "Apple", isin: "US0378331005", cusip: "037833100", weightPct: 100,
    }] });
    expect(proposalIsSendable(p)).toBe(true);
  });
});

describe("buildTicket", () => {
  it("produces a ticket the SERVER accepts", () => {
    const ticket = build(base());
    const check = checkTicket(ticket, { account: "CH-1", currency: "CHF", maxTicketAmount: 1_000_000 });
    expect(check.ok, JSON.stringify(check.errors)).toBe(true);
  });

  it("makes the line amounts sum EXACTLY to the target on an uneven split", () => {
    // 3-way even split of 100000: 33333.33 × 3 = 99999.99. The last line
    // must absorb the cent, or the server's total-vs-lines check rejects it.
    const p = base({ targetAmount: 100000, positions: [
      { id: "a", name: "A", isin: "IE00B4L5Y983", weightPct: 33.333 },
      { id: "b", name: "B", isin: "IE00BDBRDM35", weightPct: 33.333 },
      { id: "c", name: "C", isin: "IE00B4L5YC18", weightPct: 33.334 },
    ] });
    const ticket = build(p);
    expect(sumLines(ticket.lines)).toBe(100000);
    expect(ticket.totals.amount).toBe(100000);
    const check = checkTicket(ticket, { account: "CH-1", currency: "CHF", maxTicketAmount: 1_000_000 });
    expect(check.ok, JSON.stringify(check.errors)).toBe(true);
  });

  it("stages, never executes", () => {
    expect(build(base()).intent).toBe("stage");
  });

  it("takes the account from the caller (the connection), not the proposal", () => {
    // The account of record is a property of the server-side connection.
    const ticket = build(base(), "CH-REAL-ACCOUNT");
    expect(ticket.account.id).toBe("CH-REAL-ACCOUNT");
  });

  it("carries identifiers through, upper-cased and trimmed", () => {
    const p = base({ positions: [{ id: "a", name: "X", isin: " ie00b4l5y983 ", weightPct: 100 }] });
    expect(build(p).lines[0].instrument.isin).toBe("IE00B4L5Y983");
  });

  it("reuses the ticketId it is given, so a retry is idempotent", () => {
    const a = buildTicket(base(), { ticketId: "wo_same_0001", account: "CH-1", createdAt: "2026-08-05T00:00:00Z" });
    const b = buildTicket(base(), { ticketId: "wo_same_0001", account: "CH-1", createdAt: "2026-08-05T00:01:00Z" });
    expect(a.ticketId).toBe(b.ticketId);
  });
});

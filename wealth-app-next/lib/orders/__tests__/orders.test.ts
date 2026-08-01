// ─────────────────────────────────────────────────────────────────
// The order relay's job is to refuse bad instructions. These tests are
// mostly about what it REJECTS — a ticket that gets through is money
// moving in a client's account.
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect, afterEach } from "vitest";
import {
  ORDER_SCHEMA, round2, sameMoney, sumLines, ticketFingerprint, stripIdentity, type OrderTicket,
} from "../model";
import { checkOrderHost, orderAllowlistConfigured } from "../allowlist";
import {
  orderConnectionInput, orderConnectionPatch, orderTicketSchema,
  checkTicket, isValidIsin, toPublic,
} from "../schema";
import { ticketToWire, readPlacementResponse, OrderFormatError } from "../adapters";

const CONN = { account: "CH-8842-01", currency: "CHF", maxTicketAmount: 10_000_000 };

function line(over: Partial<OrderTicket["lines"][number]> = {}, i = 1) {
  return {
    lineId: `ln${i}`, side: "BUY" as const,
    instrument: { isin: "IE00B4L5Y983", ticker: "IWDA", name: "iShares Core MSCI World", vehicle: "etf", cls: "equity" },
    weightPct: 100, amount: 1000, currency: "CHF", orderType: "market" as const, note: "",
    ...over,
  };
}
function ticket(over: Partial<OrderTicket> = {}): OrderTicket {
  const lines = over.lines ?? [line()];
  return {
    schema: ORDER_SCHEMA,
    ticketId: "wo_abcdefgh_123456",
    createdAt: "2026-08-01T10:00:00.000Z",
    intent: "stage",
    account: { id: "CH-8842-01", custodian: "UBS", currency: "CHF" },
    client: { name: "Béatrice Keller", advisor: "M. Advisor" },
    source: { system: "Wealth Analyzer", version: "x", objective: "balanced" },
    totals: { amount: sumLines(lines), currency: "CHF", positions: lines.length },
    ...over,
    lines,
  };
}

// ═══ money primitives ════════════════════════════════════════════
describe("money handling", () => {
  it("rounds to the minor unit", () => {
    expect(round2(1000.005)).toBe(1000.01);
    expect(round2(0.1 + 0.2)).toBe(0.3);
  });
  it("treats float drift as equal but a cent as different", () => {
    expect(sameMoney(0.1 + 0.2, 0.3)).toBe(true);
    expect(sameMoney(1000.0000001, 1000)).toBe(true);
    expect(sameMoney(1000.01, 1000)).toBe(false);
  });
  it("sums lines at minor-unit precision", () => {
    expect(sumLines([{ amount: 333.33 }, { amount: 333.33 }, { amount: 333.34 }])).toBe(1000);
  });
});

// ═══ ticket schema ═══════════════════════════════════════════════
describe("orderTicketSchema", () => {
  it("accepts a well-formed ticket", () => {
    expect(orderTicketSchema.safeParse(ticket()).success).toBe(true);
  });

  it("refuses intent other than stage — this relay never executes", () => {
    for (const intent of ["execute", "EXECUTE", "", null]) {
      const bad = { ...ticket(), intent } as unknown;
      expect(orderTicketSchema.safeParse(bad).success, String(intent)).toBe(false);
    }
  });

  it("refuses a side other than BUY", () => {
    const bad = ticket({ lines: [line({ side: "SELL" as never })] });
    expect(orderTicketSchema.safeParse(bad).success).toBe(false);
  });

  it("refuses non-finite or negative money", () => {
    for (const amount of [NaN, Infinity, -Infinity, -1]) {
      const bad = ticket({ lines: [line({ amount })] });
      expect(orderTicketSchema.safeParse(bad).success, String(amount)).toBe(false);
    }
  });

  it("refuses an empty ticket", () => {
    expect(orderTicketSchema.safeParse(ticket({ lines: [] })).success).toBe(false);
  });

  it("refuses a ticketId that could be used for injection or is too short", () => {
    for (const id of ["short", "has space", "a/../b", "x".repeat(90), "<script>"]) {
      expect(orderTicketSchema.safeParse(ticket({ ticketId: id })).success, id).toBe(false);
    }
    expect(orderTicketSchema.safeParse(ticket({ ticketId: "wo_abc123_xyz789" })).success).toBe(true);
  });

  it("normalizes currency case", () => {
    const p = orderTicketSchema.safeParse(ticket({
      lines: [line({ currency: "chf" })],
      totals: { amount: 1000, currency: "chf", positions: 1 },
      account: { id: "CH-8842-01", custodian: "", currency: "chf" },
    }));
    expect(p.success && p.data.totals.currency).toBe("CHF");
  });
});

// ═══ semantic checks — the ones that stop a wrong trade ══════════
describe("checkTicket", () => {
  it("passes a coherent ticket", () => {
    const r = checkTicket(ticket(), CONN);
    expect(r.ok, r.errors.join(" | ")).toBe(true);
  });

  it("refuses a ticket whose own arithmetic disagrees", () => {
    // The browser computed both the lines and the total. If they disagree,
    // the number the advisor confirmed is not the number being ordered.
    const t = ticket({ lines: [line({ amount: 600 }), line({ amount: 400 }, 2)] });
    t.totals.amount = 5000;
    const r = checkTicket(t, CONN);
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/arithmetic disagrees/);
  });

  it("refuses a line the PM system cannot identify, blocking the WHOLE ticket", () => {
    const t = ticket({
      lines: [line({ amount: 500 }), line({ amount: 500, instrument: { isin: "", ticker: "", name: "Mystery Fund" } }, 2)],
    });
    const r = checkTicket(t, CONN);
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/Mystery Fund/);
  });

  it("takes the custody account from the CONNECTION, not the payload", () => {
    const t = ticket({ account: { id: "ATTACKER-ACCOUNT", custodian: "", currency: "CHF" } });
    const r = checkTicket(t, CONN);
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/ATTACKER-ACCOUNT/);
    // Even on the rejected path the account is rewritten to the server's.
    expect(r.ticket.account.id).toBe("CH-8842-01");
  });

  it("accepts a ticket that omits the account and fills in the connection's", () => {
    const t = ticket({ account: { id: "", custodian: "", currency: "CHF" } });
    const r = checkTicket(t, CONN);
    expect(r.ok, r.errors.join(" | ")).toBe(true);
    expect(r.ticket.account.id).toBe("CH-8842-01");
  });

  it("refuses mixed currencies", () => {
    const t = ticket({ lines: [line({ amount: 500 }), line({ amount: 500, currency: "EUR" }, 2)] });
    const r = checkTicket(t, CONN);
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/not in CHF/);
  });

  it("refuses a position count that disagrees with the lines", () => {
    const t = ticket();
    t.totals.positions = 7;
    expect(checkTicket(t, CONN).ok).toBe(false);
  });

  it("refuses a zero-amount line and duplicate line ids", () => {
    expect(checkTicket(ticket({ lines: [line({ amount: 0 })] }), CONN).ok).toBe(false);
    const dup = ticket({ lines: [line({ amount: 500 }), line({ amount: 500 })] });   // both ln1
    expect(checkTicket(dup, CONN).errors.join(" ")).toMatch(/duplicate lineId/);
  });

  it("refuses over-allocation", () => {
    const t = ticket({ lines: [line({ weightPct: 70, amount: 700 }), line({ weightPct: 45, amount: 450 }, 2)] });
    t.totals.amount = 1150;
    expect(checkTicket(t, CONN).errors.join(" ")).toMatch(/over 100%/);
  });

  it("uppercases identifiers so the wire and the fingerprint agree", () => {
    const t = ticket({ lines: [line({ instrument: { isin: "ie00b4l5y983", ticker: "iwda" } })] });
    const r = checkTicket(t, CONN);
    expect(r.ticket.lines[0].instrument.isin).toBe("IE00B4L5Y983");
    expect(r.ticket.lines[0].instrument.ticker).toBe("IWDA");
  });
});

// ═══ idempotency fingerprint ═════════════════════════════════════
describe("ticketFingerprint", () => {
  it("is stable across cosmetic edits — a fixed note is still the same order", () => {
    const a = ticket({ client: { name: "A", advisor: "X" } });
    const b = ticket({ client: { name: "B", advisor: "Y" }, createdAt: "2027-01-01T00:00:00Z" });
    b.lines[0].note = "reworded rationale";
    expect(ticketFingerprint(a)).toBe(ticketFingerprint(b));
  });

  it("is stable when line ORDER changes", () => {
    const l1 = line({ amount: 600 }), l2 = line({ amount: 400, instrument: { isin: "CH0002792793" } }, 2);
    const a = ticket({ lines: [l1, l2] });
    const b = ticket({ lines: [l2, l1] });
    expect(ticketFingerprint(a)).toBe(ticketFingerprint(b));
  });

  it("CHANGES when the instruction changes — amount, instrument, or account", () => {
    const base = ticketFingerprint(ticket());
    expect(ticketFingerprint(ticket({ lines: [line({ amount: 1001 })] }))).not.toBe(base);
    expect(ticketFingerprint(ticket({ lines: [line({ instrument: { isin: "CH0002792793" } })] }))).not.toBe(base);
    expect(ticketFingerprint(ticket({ account: { id: "OTHER", custodian: "", currency: "CHF" } }))).not.toBe(base);
  });
});

// ═══ wire adapters ═══════════════════════════════════════════════
describe("ticketToWire", () => {
  const t = ticket({ lines: [line({ amount: 600 }), line({ amount: 400, instrument: { isin: "", ticker: "VTI" } }, 2)] });

  it("EVERY dialect says do-not-execute", () => {
    const avaloq = ticketToWire(t, "avaloq") as { orders: { status: string }[] };
    expect(avaloq.orders.every((o) => o.status === "PENDING_APPROVAL")).toBe(true);

    const generic = ticketToWire(t, "generic") as { execute: boolean };
    expect(generic.execute).toBe(false);

    const wa = ticketToWire(t, "wa") as OrderTicket;
    expect(wa.intent).toBe("stage");
  });

  it("Avaloq carries a per-line idempotency reference and books to the portfolio", () => {
    const w = ticketToWire(t, "avaloq") as { orders: { externalReference: string; portfolioId: string }[]; clientReference: string };
    expect(w.orders.map((o) => o.externalReference)).toEqual(["wo_abcdefgh_123456.ln1", "wo_abcdefgh_123456.ln2"]);
    expect(w.orders.every((o) => o.portfolioId === "CH-8842-01")).toBe(true);
    expect(w.clientReference).toBe("wo_abcdefgh_123456");
  });

  it("prefers ISIN and falls back to symbol only when there is no ISIN", () => {
    const w = ticketToWire(t, "avaloq") as { orders: { instrument: Record<string, string> }[] };
    expect(w.orders[0].instrument).toEqual({ isin: "IE00B4L5Y983" });
    expect(w.orders[1].instrument).toEqual({ symbol: "VTI" });
  });

  it("rejects an unknown dialect rather than sending something arbitrary", () => {
    expect(() => ticketToWire(t, "fix42" as never)).toThrow(OrderFormatError);
  });
});

// ═══ response handling ═══════════════════════════════════════════
describe("readPlacementResponse", () => {
  it("reads a reference and an accepted count", () => {
    const r = readPlacementResponse({ clientReference: "AVQ-1", orders: [{ status: "PENDING" }, { status: "PENDING" }] }, 201);
    expect(r).toMatchObject({ ok: true, ref: "AVQ-1", accepted: 2, rejected: [] });
  });

  it("treats ANY rejected line as an overall failure", () => {
    // "17 of 18 placed" is a state a human must reconcile, not a green tick.
    const r = readPlacementResponse({
      orders: [{ status: "PENDING" }, { externalReference: "t.ln2", status: "REJECTED", message: "not tradable" }],
    }, 200);
    expect(r.ok).toBe(false);
    expect(r.accepted).toBe(1);
    expect(r.rejected).toEqual(["t.ln2: not tradable"]);
  });

  it("does not believe a 200 that carries an error field", () => {
    const r = readPlacementResponse({ error: "portfolio is blocked" }, 200);
    expect(r.ok).toBe(false);
    expect(r.rejected.join(" ")).toMatch(/portfolio is blocked/);
  });

  it("reports a non-2xx even when the body is HTML or empty", () => {
    expect(readPlacementResponse("<html>Gateway Timeout</html>", 504).ok).toBe(false);
    expect(readPlacementResponse(null, 500).rejected.join(" ")).toMatch(/HTTP 500/);
  });

  it("surfaces an error keyed as `error` on a line", () => {
    const r = readPlacementResponse({ results: [{ reference: "x", error: "bad ISIN" }] }, 200);
    expect(r.ok).toBe(false);
    expect(r.rejected.join(" ")).toMatch(/bad ISIN/);
  });
});

// ═══ connection config ═══════════════════════════════════════════
describe("orderConnectionInput", () => {
  const base = { name: "Avaloq", url: "https://pm.example.com/api/orders", account: "CH-8842-01" };

  it("accepts a valid connection", () => {
    expect(orderConnectionInput.safeParse(base).success).toBe(true);
  });

  it("requires a custody account — orders must book somewhere", () => {
    expect(orderConnectionInput.safeParse({ ...base, account: "" }).success).toBe(false);
  });

  it("refuses an SSRF-unsafe endpoint at SAVE time", () => {
    for (const url of [
      "http://169.254.169.254/latest/meta-data/",
      "http://localhost:8080/orders",
      "http://10.0.0.5/orders",
      "file:///etc/passwd",
      "http://[::169.254.169.254]/x",
    ]) {
      expect(orderConnectionInput.safeParse({ ...base, url }).success, url).toBe(false);
    }
  });

  it("enforces the auth/secret invariant, including basic's user:password", () => {
    expect(orderConnectionInput.safeParse({ ...base, auth: "bearer" }).success).toBe(false);
    expect(orderConnectionInput.safeParse({ ...base, auth: "bearer", secret: "t" }).success).toBe(true);
    expect(orderConnectionInput.safeParse({ ...base, auth: "basic", secret: "nocolon" }).success).toBe(false);
    expect(orderConnectionInput.safeParse({ ...base, auth: "basic", secret: "u:p" }).success).toBe(true);
  });

  it("PATCH keeps the same URL safety when the field is present", () => {
    expect(orderConnectionPatch.safeParse({ url: "http://127.0.0.1/x" }).success).toBe(false);
    expect(orderConnectionPatch.safeParse({ name: "just a rename" }).success).toBe(true);
  });
});

describe("toPublic", () => {
  it("never returns the secret, only whether one exists", () => {
    const pub = toPublic({
      id: "1", name: "n", url: "https://x.example/o", format: "avaloq", auth: "bearer",
      header: null, account: "A", custodian: null, currency: "CHF",
      secret_ciphertext: "v1.aaa.bbb.ccc", last_sent_at: null, last_status: null, created_at: null,
    });
    expect(pub.hasSecret).toBe(true);
    expect(JSON.stringify(pub)).not.toContain("v1.aaa");
    expect("secret" in pub).toBe(false);
  });
});

// ═══ ISIN check digit ════════════════════════════════════════════
describe("isValidIsin", () => {
  it("accepts real ISINs", () => {
    for (const i of ["IE00B4L5Y983", "CH0038863350", "US0378331005", "GB0002634946"]) {
      expect(isValidIsin(i), i).toBe(true);
    }
  });
  it("rejects a transposed or malformed one", () => {
    for (const i of ["IE00B4L5Y984", "CH0038863351", "", "ABC", "IE00B4L5Y98"]) {
      expect(isValidIsin(i), i).toBe(false);
    }
  });
});

// ═══ positive acknowledgement — the worst defect found ═══════════
describe("readPlacementResponse: only a real acknowledgement counts as staged", () => {
  it("does NOT report success for a 200 carrying an HTML login page", () => {
    // The mirror of the inbound login-page bug, and worse: inbound produced a
    // wrong number a human still reviewed, this produces a green "staged" that
    // stops anyone looking again.
    const r = readPlacementResponse("<html><body>Please sign in</body></html>", 200, "text/html");
    expect(r.state).toBe("unknown");
    expect(r.ok).toBe(false);
    expect(r.uncertainty).toMatch(/check the pm system/i);
  });

  it("does NOT report success for a 200 with JSON that acknowledges nothing", () => {
    const r = readPlacementResponse({ status: "ok" }, 200, "application/json");
    expect(r.state).toBe("unknown");
    expect(r.ok).toBe(false);
  });

  it("does NOT report success for a 200 whose content-type is not JSON", () => {
    const r = readPlacementResponse({ reference: "X-1" }, 200, "text/html; charset=utf-8");
    expect(r.state).toBe("unknown");
  });

  it("DOES report staged for a real acknowledgement", () => {
    expect(readPlacementResponse({ clientReference: "AVQ-1" }, 201, "application/json").state).toBe("staged");
    expect(readPlacementResponse({ orders: [{ status: "PENDING" }] }, 200, "application/json").state).toBe("staged");
    expect(readPlacementResponse({ reference: "R" }, 200, "application/vnd.avaloq+json").state).toBe("staged");
  });

  it("distinguishes rejected from unknown — a 4xx is a real answer", () => {
    expect(readPlacementResponse({ error: "no such portfolio" }, 400, "application/json").state).toBe("rejected");
    expect(readPlacementResponse("nope", 422, "text/plain").state).toBe("rejected");
  });

  it("never reports ok:true unless state is staged", () => {
    for (const [b, st, ct] of [
      ["<html>", 200, "text/html"], [{ status: "ok" }, 200, "application/json"],
      [{ error: "x" }, 200, "application/json"], [null, 500, ""],
    ] as [unknown, number, string][]) {
      const r = readPlacementResponse(b, st, ct);
      expect(r.ok === (r.state === "staged")).toBe(true);
    }
  });
});

// ═══ ceiling, currency, ISIN ═════════════════════════════════════
describe("checkTicket: the authorization boundary", () => {
  it("refuses a ticket over the connection's ceiling", () => {
    const t = ticket({ lines: [line({ amount: 5_000_000 })] });
    t.totals.amount = 5_000_000;
    const r = checkTicket(t, { ...CONN, maxTicketAmount: 1_000_000 });
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/exceeds this connection's per-ticket limit/);
  });

  it("refuses a ticket denominated differently from the account", () => {
    // Nothing in this system converts currency — it would only be relabelled.
    const t = ticket({
      lines: [line({ currency: "JPY" })],
      totals: { amount: 1000, currency: "JPY", positions: 1 },
      account: { id: "CH-8842-01", custodian: "", currency: "JPY" },
    });
    const r = checkTicket(t, CONN);
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/does not convert currencies/);
  });

  it("refuses an ISIN that fails its check digit", () => {
    const t = ticket({ lines: [line({ instrument: { isin: "IE00B4L5Y984", name: "Typo Fund" } })] });
    const r = checkTicket(t, CONN);
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/check digit/);
  });
});

// ═══ identity minimisation ═══════════════════════════════════════
describe("stripIdentity", () => {
  it("removes the client's name and advisor but keeps the instruction intact", () => {
    const t = ticket();
    const s = stripIdentity(t);
    expect(s.client).toEqual({ name: "", advisor: "" });
    expect(s.lines).toEqual(t.lines);
    expect(s.totals).toEqual(t.totals);
    expect(s.account.id).toBe(t.account.id);
    // The instruction is unchanged, so idempotency is unaffected.
    expect(ticketFingerprint(s)).toBe(ticketFingerprint(t));
  });

  it("keeps identity out of the Avaloq wire when stripped", () => {
    const w = ticketToWire(stripIdentity(ticket()), "avaloq") as { preparedFor: string; preparedBy: string };
    expect(w.preparedFor).toBe("");
    expect(w.preparedBy).toBe("");
  });
});

// ═══ host pinning ════════════════════════════════════════════════
describe("order host allowlist", () => {
  const prev = process.env.ORDERS_HOST_ALLOWLIST;
  const prevEnv = process.env.NODE_ENV;
  const setEnv = (k: string, v?: string) => {
    if (v === undefined) delete (process.env as Record<string, string | undefined>)[k];
    else (process.env as Record<string, string | undefined>)[k] = v;
  };
  afterEach(() => { setEnv("ORDERS_HOST_ALLOWLIST", prev); setEnv("NODE_ENV", prevEnv); });

  it("pins to listed hosts and their subdomains", () => {
    setEnv("ORDERS_HOST_ALLOWLIST", "pm.example.com,oms.bank.example");
    expect(orderAllowlistConfigured()).toBe(true);
    expect(checkOrderHost("https://pm.example.com/api/orders").ok).toBe(true);
    expect(checkOrderHost("https://eu.pm.example.com/api/orders").ok).toBe(true);
    // trailing dot is the same host to DNS — a classic bypass
    expect(checkOrderHost("https://pm.example.com./api/orders").ok).toBe(true);
    expect(checkOrderHost("https://evil-pm.example.com.attacker.test/x").ok).toBe(false);
    expect(checkOrderHost("https://attacker.test/x").ok).toBe(false);
  });

  it("fails CLOSED in production when nothing is pinned", () => {
    setEnv("ORDERS_HOST_ALLOWLIST", "");
    setEnv("NODE_ENV", "production");
    const r = checkOrderHost("https://pm.example.com/api/orders");
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/ORDERS_HOST_ALLOWLIST/);
  });

  it("stays out of the way in development", () => {
    setEnv("ORDERS_HOST_ALLOWLIST", "");
    setEnv("NODE_ENV", "development");
    expect(checkOrderHost("https://pm.example.com/api/orders").ok).toBe(true);
  });
});

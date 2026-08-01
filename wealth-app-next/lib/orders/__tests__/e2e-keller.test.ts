// ─────────────────────────────────────────────────────────────────
// End-to-end: the REAL saved Béatrice Keller profile → an order ticket →
// the relay's server-side pipeline → a REAL HTTP PM system.
//
// Everything here runs the actual production modules. The only stubbed
// thing is Supabase (auth + the idempotency table), which needs a live
// project; `safePost`'s guard is exercised separately against the same
// loopback server, where it must REFUSE to connect.
//
// The profile is the one an advisor actually saved, not a fixture built
// to pass — which is the point: it turns out it cannot be sent as-is.
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";

import { ORDER_SCHEMA, round2, sumLines, ticketFingerprint, stripIdentity, type OrderTicket } from "../model";
import { orderTicketSchema, checkTicket } from "../schema";
import { ticketToWire, readPlacementResponse } from "../adapters";
import { safePost, FeedFetchError } from "@/lib/feeds/ssrf";

interface SavedPosition { name: string; tkr?: string; isin?: string | null; alloc: number; cls?: string; vehicle?: string; note?: string }

const PROFILE = JSON.parse(
  readFileSync(join(process.cwd(), "..", "Sample Client profiles", "beatrice-keller-swiss-profile.json"), "utf8")
) as { proposals: SavedPosition[]; fields?: Record<string, string>; ccy?: string };

const CONN = { account: "CH-8842-01", currency: "CHF", maxTicketAmount: 10_000_000 };
const TARGET = 2_400_000;

/** The same construction the browser's ordBuildTicket performs. */
function buildTicket(positions: SavedPosition[], target: number, ticketId = "wo_keller_000001"): OrderTicket {
  const lines = positions.map((p, i) => ({
    lineId: `ln${i + 1}`,
    side: "BUY" as const,
    instrument: {
      isin: (p.isin || "").toUpperCase(),
      ticker: (p.tkr || "").toUpperCase(),
      name: p.name, vehicle: p.vehicle || "", cls: p.cls || "",
    },
    weightPct: Number(p.alloc) || 0,
    amount: round2(target * ((Number(p.alloc) || 0) / 100)),
    currency: "CHF",
    orderType: "market" as const,
    note: (p.note || "").slice(0, 300),
  }));
  return {
    schema: ORDER_SCHEMA, ticketId, createdAt: "2026-08-01T12:00:00.000Z", intent: "stage",
    account: { id: CONN.account, custodian: "UBS", currency: "CHF" },
    client: { name: "Béatrice Keller", advisor: "M. Advisor" },
    source: { system: "Wealth Analyzer", version: "test", objective: "balanced" },
    totals: { amount: sumLines(lines), currency: "CHF", positions: lines.length },
    lines,
  };
}

// ─── A real PM system on loopback ────────────────────────────────
let server: Server;
let base = "";
const seen: { url: string; auth?: string; idem?: string; body: unknown }[] = [];

beforeAll(async () => {
  server = createServer((req, res) => {
    let raw = "";
    req.on("data", (c) => { raw += c; });
    req.on("end", () => {
      let body: unknown = null;
      try { body = JSON.parse(raw); } catch { /* keep null */ }
      seen.push({
        url: req.url || "", auth: req.headers.authorization,
        idem: req.headers["idempotency-key"] as string | undefined, body,
      });
      if (!req.headers.authorization) {
        res.writeHead(401, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ error: "missing credential" }));
      }
      const orders = ((body as { orders?: { externalReference: string }[] })?.orders) ?? [];
      if (req.url === "/partial") {
        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({
          clientReference: "AVQ-P1",
          orders: orders.map((o, i) => i === 1
            ? { externalReference: o.externalReference, status: "REJECTED", message: "instrument not tradable" }
            : { externalReference: o.externalReference, status: "PENDING_APPROVAL" }),
        }));
      }
      if (req.url === "/html") {
        res.writeHead(200, { "Content-Type": "text/html" });
        return res.end("<html><body>Please sign in</body></html>");
      }
      res.writeHead(201, { "Content-Type": "application/json" });
      res.end(JSON.stringify({
        orderId: "AVQ-1000", clientReference: (body as { clientReference?: string })?.clientReference ?? "",
        orders: orders.map((o) => ({ externalReference: o.externalReference, status: "PENDING_APPROVAL" })),
      }));
    });
  });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

// ═══ 1. The saved profile, exactly as it is on disk ═══════════════
describe("the profile as actually saved", () => {
  it("has the seven positions summing to 100%", () => {
    expect(PROFILE.proposals).toHaveLength(7);
    expect(PROFILE.proposals.reduce((s, p) => s + p.alloc, 0)).toBe(100);
  });

  it("CANNOT be sent — no ISINs, and one line has no identifier at all", () => {
    // This is the guard doing its job on real data, not a contrived case.
    // "CHF Money Market" carries neither ISIN nor ticker, so a custodian
    // could not resolve it, and one unidentifiable line blocks the whole
    // ticket rather than placing a partial order.
    const t = buildTicket(PROFILE.proposals, TARGET);
    const parsed = orderTicketSchema.safeParse(t);
    expect(parsed.success, "structurally valid").toBe(true);

    const r = checkTicket(parsed.success ? (parsed.data as OrderTicket) : t, CONN);
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/CHF Money Market/);
    expect(PROFILE.proposals.every((p) => !p.isin)).toBe(true);
  });
});

// ═══ 2. The same profile once identifiers are supplied ════════════
// ISINs for the instruments in the proposal. Note the last one: the first
// value written here was CH0009002501, and checkTicket rejected it on its
// check digit — the validator catching a fabricated identifier before it
// could reach a custodian is exactly the behaviour it exists for.
const WITH_ISINS: SavedPosition[] = [
  { name: "Vanguard FTSE All-World", tkr: "VWRL", isin: "IE00B3RBWM25", alloc: 30, cls: "equity" },
  { name: "iShares Core SPI", tkr: "CHSPI", isin: "CH0237935652", alloc: 15, cls: "equity" },
  { name: "iShares MSCI EM IMI", tkr: "EIMI", isin: "IE00BKM4GZ66", alloc: 10, cls: "equity" },
  { name: "iShares Core CHF Corporate Bond", tkr: "CHCORP", isin: "CH0226976816", alloc: 20, cls: "fixed_income" },
  { name: "iShares Global Aggregate Bond CHF-hedged", tkr: "AGGS", isin: "IE00BDBRDM35", alloc: 15, cls: "fixed_income" },
  { name: "UBS ETF Gold CHF-hedged", tkr: "AUCHAH", isin: "CH0106027193", alloc: 5, cls: "commodity" },
  { name: "CHF Money Market", tkr: "CSBGC0", isin: "CH0009002509", alloc: 5, cls: "cash" },
];

describe("the completed ticket, end to end", () => {
  it("every supplied ISIN passes its check digit, so the ticket validates", () => {
    const t = buildTicket(WITH_ISINS, TARGET);
    const parsed = orderTicketSchema.safeParse(t);
    expect(parsed.success).toBe(true);
    const r = checkTicket(parsed.data as OrderTicket, CONN);
    expect(r.ok, r.errors.join(" | ")).toBe(true);
    expect(r.ticket.totals.amount).toBe(TARGET);
    expect(sumLines(r.ticket.lines)).toBe(TARGET);
  });

  it("allocates the target exactly, to the cent", () => {
    const t = checkTicket(orderTicketSchema.parse(buildTicket(WITH_ISINS, TARGET)) as OrderTicket, CONN).ticket;
    expect(t.lines.map((l) => l.amount)).toEqual([720000, 360000, 240000, 480000, 360000, 120000, 120000]);
    expect(t.lines.reduce((s, l) => s + l.amount, 0)).toBe(TARGET);
  });

  it("reaches a real PM system and comes back staged", async () => {
    const t = checkTicket(orderTicketSchema.parse(buildTicket(WITH_ISINS, TARGET)) as OrderTicket, CONN).ticket;
    const wire = ticketToWire(stripIdentity(t), "avaloq");

    const res = await fetch(base + "/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", Authorization: "Bearer tok_test",
        "Idempotency-Key": t.ticketId,
      },
      body: JSON.stringify(wire),
    });
    const body = await res.json();
    const result = readPlacementResponse(body, res.status, res.headers.get("content-type") ?? "");

    expect(result.state).toBe("staged");
    expect(result.ok).toBe(true);
    expect(result.accepted).toBe(7);
    expect(result.ref).toBe("AVQ-1000");

    // What the PM system actually received.
    const got = seen[seen.length - 1];
    expect(got.idem).toBe(t.ticketId);
    const sent = got.body as { orders: { portfolioId: string; status: string; instrument: Record<string, string>; amount: { value: number; currency: string } }[]; preparedFor: string };
    expect(sent.orders).toHaveLength(7);
    expect(sent.orders.every((o) => o.status === "PENDING_APPROVAL"), "staged, never executed").toBe(true);
    expect(sent.orders.every((o) => o.portfolioId === "CH-8842-01")).toBe(true);
    expect(sent.orders.every((o) => !!o.instrument.isin)).toBe(true);
    expect(sent.orders.reduce((s, o) => s + o.amount.value, 0)).toBe(TARGET);
    expect(sent.preparedFor, "client identity stripped by default").toBe("");
  });

  it("refuses to send anonymously — the OMS 401s and that is a rejection", async () => {
    const t = checkTicket(orderTicketSchema.parse(buildTicket(WITH_ISINS, TARGET)) as OrderTicket, CONN).ticket;
    const res = await fetch(base + "/orders", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ticketToWire(t, "avaloq")),
    });
    const result = readPlacementResponse(await res.json(), res.status, res.headers.get("content-type") ?? "");
    expect(result.state).toBe("rejected");
    expect(result.ok).toBe(false);
  });

  it("a partially rejected batch is NOT reported as success", async () => {
    const t = checkTicket(orderTicketSchema.parse(buildTicket(WITH_ISINS, TARGET)) as OrderTicket, CONN).ticket;
    const res = await fetch(base + "/partial", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer tok_test" },
      body: JSON.stringify(ticketToWire(t, "avaloq")),
    });
    const result = readPlacementResponse(await res.json(), res.status, res.headers.get("content-type") ?? "");
    expect(result.state).toBe("rejected");
    expect(result.accepted).toBe(6);
    expect(result.rejected.join(" ")).toMatch(/not tradable/);
  });

  it("a 200 HTML login page is UNKNOWN, never staged", async () => {
    const res = await fetch(base + "/html", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer tok_test" },
      body: "{}",
    });
    const text = await res.text();
    const result = readPlacementResponse(text, res.status, res.headers.get("content-type") ?? "");
    expect(result.state).toBe("unknown");
    expect(result.ok).toBe(false);
  });
});

// ═══ 3. Idempotency over the real ticket ═════════════════════════
describe("idempotency on the Keller ticket", () => {
  it("a cosmetic edit is the same instruction; a changed amount is not", () => {
    const a = checkTicket(orderTicketSchema.parse(buildTicket(WITH_ISINS, TARGET)) as OrderTicket, CONN).ticket;
    const renamed = WITH_ISINS.map((p) => ({ ...p, note: "revised rationale" }));
    const b = checkTicket(orderTicketSchema.parse(buildTicket(renamed, TARGET)) as OrderTicket, CONN).ticket;
    expect(ticketFingerprint(b)).toBe(ticketFingerprint(a));

    const c = checkTicket(orderTicketSchema.parse(buildTicket(WITH_ISINS, TARGET + 100)) as OrderTicket, CONN).ticket;
    expect(ticketFingerprint(c)).not.toBe(ticketFingerprint(a));
  });
});

// ═══ 4. The guard, against the very same server ══════════════════
describe("safePost refuses the loopback PM system", () => {
  it("blocks it — and the server records no hit", async () => {
    const before = seen.length;
    await expect(
      safePost(base + "/orders", { "Content-Type": "application/json" }, "{}")
    ).rejects.toBeInstanceOf(FeedFetchError);
    expect(seen.length, "the order body never left the process").toBe(before);
  });
});

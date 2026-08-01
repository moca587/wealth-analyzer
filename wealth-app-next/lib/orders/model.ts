// ─────────────────────────────────────────────────────────────────
// wa.order/v1 — the order-ticket model.
//
// The outbound mirror of wa.feed/v1. A ticket is a set of BUY lines an
// advisor has approved in the Investment Proposal; the relay forwards it
// to a portfolio-management / order-management system, where a person
// with trading authority executes it.
//
// `intent` is ALWAYS "stage". Nothing in this codebase executes a trade.
// Every adapter must carry that through to the wire (Avaloq
// PENDING_APPROVAL, generic execute:false); a wire format that cannot
// express "do not execute yet" must not be added here.
//
// The single-file app (wealth-analyzer.html) produces exactly this shape,
// so a ticket built in the browser can be POSTed to /api/orders/<id>
// unchanged.
// ─────────────────────────────────────────────────────────────────

export const ORDER_SCHEMA = "wa.order/v1" as const;

/** Wire dialects the relay can speak. */
export type OrderFormat = "wa" | "avaloq" | "generic";

/** Only BUY today. SELL needs holdings-aware validation we do not do yet. */
export type OrderSide = "BUY";

export interface OrderInstrument {
  /** ISIN — what a European custodian actually books on. */
  isin?: string;
  /**
   * CUSIP — the US/Canadian identifier. For those issuers it determines the
   * ISIN outright (see lib/orders/identifiers.ts), so the two must agree when
   * both are present.
   */
  cusip?: string;
  /** Exchange ticker. Accepted, but many custodians will not resolve it. */
  ticker?: string;
  name?: string;
  vehicle?: string;
  cls?: string;
}

export interface OrderLine {
  lineId: string;
  side: OrderSide;
  instrument: OrderInstrument;
  /** Percentage of the ticket total. Kept for audit; amount is authoritative. */
  weightPct: number;
  /** Cash amount in `currency`. Minor-unit precision. */
  amount: number;
  currency: string;
  orderType: "market";
  note?: string;
}

export interface OrderTicket {
  schema: typeof ORDER_SCHEMA;
  /** Idempotency key. Stable across retries of the SAME ticket. */
  ticketId: string;
  createdAt: string;
  intent: "stage";
  account: { id: string; custodian?: string; currency: string };
  client: { name?: string; advisor?: string };
  source: { system?: string; version?: string; objective?: string };
  totals: { amount: number; currency: string; positions: number };
  lines: OrderLine[];
}

/**
 * The outcome of a placement attempt. THREE states, not two.
 *
 * "unknown" is the important one and the reason `ok: boolean` alone is not
 * enough. A request that timed out, or answered 200 with an HTML login page,
 * has NOT been shown to have failed — the PM system may well have staged the
 * ticket before the socket dropped or before the gateway interposed. Calling
 * that a failure invites the advisor to send again, which is how a
 * CHF 2,000,000 model portfolio becomes CHF 4,000,000 of exposure.
 *
 * Only a positively acknowledged response is "staged".
 */
export type PlacementState = "staged" | "rejected" | "unknown";

export interface OrderPlacementResult {
  state: PlacementState;
  /** True only for `state === "staged"`. Never infer success from a 2xx alone. */
  ok: boolean;
  /** The PM system's own reference, when it returns one. */
  ref: string;
  accepted: number | null;
  rejected: string[];
  /** Upstream HTTP status, 0 when the request never completed. */
  httpStatus: number;
  /** Why the outcome is uncertain, when it is. */
  uncertainty?: string;
}

/** Sum of line amounts, rounded to the minor unit. */
export function sumLines(lines: Pick<OrderLine, "amount">[]): number {
  return round2(lines.reduce((s, l) => s + (Number.isFinite(l.amount) ? l.amount : 0), 0));
}

/** Money is compared and stored at minor-unit precision, never raw floats. */
export function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/**
 * Two amounts are "the same money" if they agree to the minor unit.
 * Guards the browser-vs-server recomputation check: 1e-9 of float drift
 * across a JSON round-trip must not reject a correct ticket, while a real
 * discrepancy of one cent must.
 */
export function sameMoney(a: number, b: number): boolean {
  return Math.abs(round2(a) - round2(b)) < 0.005;
}

/**
 * A stable fingerprint of what the ticket actually INSTRUCTS — account,
 * currency, and each line's instrument and amount. Deliberately excludes
 * cosmetic fields (names, notes, createdAt, weights) so a re-send after an
 * advisor fixes a typo in a note is recognised as the same instruction.
 *
 * Used to detect the dangerous case: the same ticketId submitted twice with
 * DIFFERENT contents. An idempotency key that silently returns the first
 * result for a changed order would drop a real correction on the floor.
 */
export function ticketFingerprint(t: OrderTicket): string {
  const lines = t.lines
    .map((l) => {
      const base = [
        (l.instrument.isin || "").toUpperCase(),
        (l.instrument.ticker || "").toUpperCase(),
        l.side,
        round2(l.amount).toFixed(2),
        (l.currency || "").toUpperCase(),
      ].join("|");
      // CUSIP is APPENDED only when present, so adding the field did not
      // change the fingerprint of any ticket that carries none — a stored
      // fingerprint from before this field existed still matches, and a
      // retry of such a ticket is still recognised as a retry.
      const cusip = (l.instrument.cusip || "").toUpperCase();
      return cusip ? `${base}|C:${cusip}` : base;
    })
    .sort();                       // line ORDER is not part of the instruction
  return [
    (t.account.id || "").trim(),
    (t.totals.currency || "").toUpperCase(),
    round2(t.totals.amount).toFixed(2),
    ...lines,
  ].join("\n");
}

/**
 * Remove client identity from a ticket.
 *
 * The PM system needs an account, instruments and amounts. It does not need
 * the client's name to stage an order. Sending it anyway means a mistyped
 * endpoint URL exfiltrates who the client is, not merely what was bought —
 * so identity is opt-in per connection.
 */
export function stripIdentity(t: OrderTicket): OrderTicket {
  return { ...t, client: { name: "", advisor: "" } };
}

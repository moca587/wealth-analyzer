// ─────────────────────────────────────────────────────────────────
// wa.order/v1 → PM/OMS wire formats.
//
// The outbound mirror of lib/feeds/adapters.ts: one pure function per
// dialect, so adding a custodian never touches a route or the UI. Pure
// in, pure out — no network, no DB — so every dialect is unit-testable.
//
// These shapes are byte-compatible with ordToWire() in the single-file
// app, so a ticket produces the same payload whether it goes out through
// the browser or through this relay. If you change one, change both.
//
// INVARIANT: every dialect must express "staged, do not execute".
// Avaloq  → status PENDING_APPROVAL
// generic → execute: false
// wa      → intent: "stage" (carried on the ticket itself)
// A format that cannot say this does not belong here.
// ─────────────────────────────────────────────────────────────────

import type { OrderFormat, OrderPlacementResult, OrderTicket } from "./model";

export class OrderFormatError extends Error {
  constructor(message: string) { super(message); this.name = "OrderFormatError"; }
}

/**
 * NOTE FOR INTEGRATORS — the Avaloq payload is a TEMPLATE.
 * Avaloq is configured per bank, so field names vary between installations.
 * Confirm against the target instance's API contract before go-live and
 * adjust here only; nothing upstream of this function knows the wire format.
 */
export function ticketToWire(ticket: OrderTicket, format: OrderFormat): unknown {
  if (format === "avaloq") {
    return {
      orders: ticket.lines.map((l) => ({
        // Per-line idempotency: the PM system dedupes on this, so a retry of
        // the same ticket cannot create a second order for the same line.
        externalReference: `${ticket.ticketId}.${l.lineId}`,
        portfolioId: ticket.account.id,
        // Identifier preference: ISIN, then CUSIP, then the exchange symbol.
        // Avaloq books on one identifier, so send the most specific available
        // rather than a bag the far side must choose from.
        instrument: l.instrument.isin ? { isin: l.instrument.isin }
                  : l.instrument.cusip ? { cusip: l.instrument.cusip }
                  : { symbol: l.instrument.ticker },
        transactionType: l.side,
        orderType: "MARKET",
        amount: { value: l.amount, currency: l.currency },
        status: "PENDING_APPROVAL",     // staged, NOT executed
        remark: (l.note || "").slice(0, 120),
      })),
      clientReference: ticket.ticketId,
      preparedBy: ticket.client.advisor || "",
      preparedFor: ticket.client.name || "",
    };
  }

  if (format === "generic") {
    return {
      reference: ticket.ticketId,
      account: ticket.account.id,
      currency: ticket.totals.currency,
      execute: false,                    // explicit: stage only
      orders: ticket.lines.map((l) => ({
        reference: `${ticket.ticketId}.${l.lineId}`,
        side: l.side,
        isin: l.instrument.isin || null,
        cusip: l.instrument.cusip || null,
        symbol: l.instrument.ticker || null,
        name: l.instrument.name,
        amount: l.amount,
        currency: l.currency,
        type: l.orderType,
      })),
    };
  }

  if (format === "wa") return ticket;    // native passthrough

  throw new OrderFormatError(`unknown order format "${String(format)}"`);
}

const REJECTED = /reject|error|fail|denied|refus/i;
const JSON_CT = /^application\/(json|[\w.+-]+\+json)\b/i;

/**
 * Normalize whatever the PM system answered.
 *
 * The governing rule is POSITIVE ACKNOWLEDGEMENT: a placement counts as
 * staged only when the upstream said so in a way we can actually read — a
 * 2xx, a JSON object, and either a reference or a non-zero accepted count.
 *
 * Treating a bare 2xx as success is the exact mirror of the inbound defect
 * where a custodian's HTML login page was normalized into a plan, except
 * worse: inbound produced a wrong number a human still reviewed, whereas here
 * it produces a green "staged in the PM system" that stops anyone looking
 * again. An expired credential, a WAF interstitial, or a URL typo'd onto a
 * health endpoint all answer 200 with something that is not an order ack.
 *
 * Anything we cannot positively read becomes `unknown`, never `staged` and
 * never `rejected` — see PlacementState.
 *
 * Also deliberately pessimistic about partial success: if ANY line is
 * rejected the whole placement is `rejected`, because "17 of 18 orders
 * placed" is a state a human must reconcile, not a green tick.
 */
export function readPlacementResponse(
  body: unknown,
  httpStatus: number,
  contentType = "",
): OrderPlacementResult {
  const httpOk = httpStatus >= 200 && httpStatus < 300;
  const out: OrderPlacementResult = {
    state: "unknown", ok: false, ref: "", accepted: null, rejected: [], httpStatus,
  };

  const unknown = (why: string): OrderPlacementResult => {
    out.state = "unknown"; out.ok = false; out.uncertainty = why;
    return out;
  };
  const reject = (why: string): OrderPlacementResult => {
    out.state = "rejected"; out.ok = false;
    if (why) out.rejected.push(why);
    return out;
  };

  // Non-JSON body: an error page, a redirect interstitial, a plain-text ack
  // we cannot interpret. A non-2xx here is a real rejection; a 2xx is not
  // evidence of anything.
  if (body == null || typeof body === "string" || typeof body !== "object" || Array.isArray(body)) {
    const snippet = typeof body === "string" && body.trim() ? `: ${body.trim().slice(0, 200)}` : "";
    if (!httpOk) return reject(`upstream returned HTTP ${httpStatus}${snippet}`);
    return unknown(
      `The endpoint answered HTTP ${httpStatus} but not with a JSON order acknowledgement, ` +
      `so we cannot confirm the ticket was staged. Check the PM system before resending.`
    );
  }
  if (contentType && !JSON_CT.test(contentType)) {
    return unknown(
      `The endpoint answered HTTP ${httpStatus} with content-type "${contentType.split(";")[0]}", ` +
      `not JSON, so the ticket's status could not be confirmed. Check the PM system before resending.`
    );
  }

  const o = body as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === "string" || typeof v === "number" ? String(v) : "");
  out.ref = str(o.orderId) || str(o.reference) || str(o.clientReference) || str(o.id) || str(o.ticketId);

  const arr = Array.isArray(o.orders) ? o.orders
            : Array.isArray(o.results) ? o.results
            : null;
  if (arr) {
    const rows = arr.filter((x): x is Record<string, unknown> => !!x && typeof x === "object");
    const bad = (r: Record<string, unknown>) => REJECTED.test(str(r.status)) || !!r.error;
    out.accepted = rows.filter((r) => !bad(r)).length;
    out.rejected = rows.filter(bad).map((r) => {
      const who = str(r.externalReference) || str(r.reference) || str(r.isin) || "line";
      const why = str(r.message) || str(r.error) || str(r.status) || "rejected";
      return `${who}: ${why}`;
    });
  }

  // A top-level error field beats a 200. Some gateways answer 200 with
  // {"error": "..."} and treating that as success would report a placement
  // that never happened.
  const topError = str(o.error) || str(o.errorMessage);
  if (topError) out.rejected.push(topError.slice(0, 200));

  if (out.rejected.length) return reject("");
  if (!httpOk) return reject(`upstream returned HTTP ${httpStatus}`);

  // 2xx, JSON, nothing rejected — but did it actually acknowledge?
  if (out.ref || (out.accepted != null && out.accepted > 0)) {
    out.state = "staged"; out.ok = true;
    return out;
  }
  return unknown(
    `The endpoint answered HTTP ${httpStatus} with JSON that carries no order reference and no ` +
    `accepted lines, so we cannot confirm the ticket was staged. Check the PM system before resending.`
  );
}

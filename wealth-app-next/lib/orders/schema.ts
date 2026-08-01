// ─────────────────────────────────────────────────────────────────
// Runtime validation for order connections AND for inbound tickets.
//
// Two different trust problems live here:
//
//  1. A CONNECTION is advisor-supplied config. Same treatment as a feed
//     connection: SSRF-checked URL, auth/secret invariant, secret never
//     returned.
//
//  2. A TICKET is an instruction to buy securities with a client's money,
//     and it arrives from a BROWSER. The browser computed the per-line
//     amounts. We re-derive and re-check every one of them here rather
//     than forwarding numbers we did not verify — a tampered or simply
//     buggy client must not be able to place an order the advisor never
//     saw on the confirmation screen.
// ─────────────────────────────────────────────────────────────────

import { z } from "zod";
import { validateFeedUrl } from "@/lib/feeds/ssrf";
import { ORDER_SCHEMA, round2, sameMoney, sumLines, type OrderTicket } from "./model";
import { isValidIsin, isValidCusip, normalizeCusip, checkIdentifierAgreement } from "./identifiers";

export const orderFormatEnum = z.enum(["wa", "avaloq", "generic"]);
export const orderAuthEnum = z.enum(["none", "bearer", "apikey", "basic"]);

/**
 * The SSRF guard runs at SAVE time as well as send time. Typing an internal
 * host gives an immediate, clear error instead of a confusing failure later
 * with a live order ticket in hand. The send-time check still runs: DNS can
 * change under us.
 */
const safeUrl = z.string().trim().min(1, "order endpoint URL is required").superRefine((val, ctx) => {
  const v = validateFeedUrl(val);
  if (!v.ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message: v.reason });
});

export const orderConnectionInput = z.object({
  name: z.string().trim().min(1, "name is required").max(120),
  url: safeUrl,
  format: orderFormatEnum.default("wa"),
  auth: orderAuthEnum.default("none"),
  header: z.string().trim().max(80).optional().default("X-API-Key"),
  /** Plaintext on the way in only; stored encrypted, never returned. */
  secret: z.string().max(4096).optional().default(""),
  /** Custody account / portfolio id orders book to. */
  account: z.string().trim().min(1, "custody account is required").max(120),
  custodian: z.string().trim().max(120).optional().default(""),
  currency: z.string().trim().length(3).toUpperCase().optional().default("CHF"),
  /**
   * Hard per-ticket ceiling, in the connection's currency. Set on the server
   * so a browser cannot raise it. null = no ceiling, which is allowed but
   * means ticket size has no authorization boundary at all.
   */
  maxTicketAmount: z.number().finite().positive().max(1_000_000_000).optional().default(100_000),
  /** Send client.name / advisor to the PM system? Off by default. */
  sendClientIdentity: z.boolean().optional().default(false),
}).superRefine((v, ctx) => {
  if (v.auth !== "none" && !v.secret) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["secret"], message: `auth "${v.auth}" requires a secret` });
  }
  if (v.auth === "basic" && v.secret && !v.secret.includes(":")) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["secret"], message: "basic auth expects user:password" });
  }
});

/** PATCH — every field optional, same rules when present. */
export const orderConnectionPatch = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  url: safeUrl.optional(),
  format: orderFormatEnum.optional(),
  auth: orderAuthEnum.optional(),
  header: z.string().trim().max(80).optional(),
  secret: z.string().max(4096).optional(),
  account: z.string().trim().min(1).max(120).optional(),
  custodian: z.string().trim().max(120).optional(),
  currency: z.string().trim().length(3).toUpperCase().optional(),
  maxTicketAmount: z.number().finite().positive().max(1_000_000_000).optional(),
  sendClientIdentity: z.boolean().optional(),
});

export type OrderConnectionInput = z.infer<typeof orderConnectionInput>;

export interface OrderConnectionPublic {
  id: string;
  name: string;
  url: string;
  format: z.infer<typeof orderFormatEnum>;
  auth: z.infer<typeof orderAuthEnum>;
  header: string | null;
  account: string;
  custodian: string | null;
  currency: string;
  maxTicketAmount: number;
  sendClientIdentity: boolean;
  hasSecret: boolean;
  lastSentAt: string | null;
  lastStatus: string | null;
  createdAt: string | null;
}

/** Safe projection — the ciphertext becomes a boolean and never leaves. */
export function toPublic(row: Record<string, unknown>): OrderConnectionPublic {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    url: String(row.url ?? ""),
    format: (row.format as OrderConnectionPublic["format"]) ?? "wa",
    auth: (row.auth as OrderConnectionPublic["auth"]) ?? "none",
    header: (row.header as string | null) ?? null,
    account: String(row.account ?? ""),
    custodian: (row.custodian as string | null) ?? null,
    currency: String(row.currency ?? "CHF"),
    maxTicketAmount: Number(row.max_ticket_amount ?? 0),
    sendClientIdentity: !!row.send_client_identity,
    hasSecret: !!row.secret_ciphertext,
    lastSentAt: (row.last_sent_at as string | null) ?? null,
    lastStatus: (row.last_status as string | null) ?? null,
    createdAt: (row.created_at as string | null) ?? null,
  };
}

export function fieldErrors(err: z.ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    (out[key] ||= []).push(issue.message);
  }
  return out;
}

// ─── Inbound ticket ───────────────────────────────────────────────

/** Money must be a real, finite, non-negative number — never NaN/Infinity. */
const money = z.number().finite().nonnegative().max(1_000_000_000, "amount is implausibly large");

const instrumentSchema = z.object({
  isin: z.string().trim().max(12).optional().default(""),
  cusip: z.string().trim().max(12).optional().default(""),
  ticker: z.string().trim().max(20).optional().default(""),
  name: z.string().trim().max(200).optional().default(""),
  vehicle: z.string().trim().max(40).optional().default(""),
  cls: z.string().trim().max(40).optional().default(""),
});

const lineSchema = z.object({
  lineId: z.string().trim().min(1).max(40),
  side: z.literal("BUY"),
  instrument: instrumentSchema,
  weightPct: z.number().finite().min(0).max(100),
  amount: money,
  currency: z.string().trim().length(3).toUpperCase(),
  orderType: z.literal("market"),
  note: z.string().max(300).optional().default(""),
});

export const orderTicketSchema = z.object({
  schema: z.literal(ORDER_SCHEMA),
  ticketId: z.string().trim().regex(/^[A-Za-z0-9_.:-]{8,80}$/, "ticketId must be 8-80 chars of [A-Za-z0-9_.:-]"),
  createdAt: z.string().trim().max(40).optional().default(""),
  // Hard-pinned: this relay stages orders. A client asking to execute is
  // either a different product or an attack; either way it is rejected.
  intent: z.literal("stage"),
  account: z.object({
    id: z.string().trim().max(120).optional().default(""),
    custodian: z.string().trim().max(120).optional().default(""),
    currency: z.string().trim().length(3).toUpperCase(),
  }),
  client: z.object({
    name: z.string().trim().max(200).optional().default(""),
    advisor: z.string().trim().max(200).optional().default(""),
  }).optional().default({ name: "", advisor: "" }),
  source: z.object({
    system: z.string().trim().max(80).optional().default(""),
    version: z.string().trim().max(60).optional().default(""),
    objective: z.string().trim().max(60).optional().default(""),
  }).optional().default({ system: "", version: "", objective: "" }),
  totals: z.object({
    amount: money,
    currency: z.string().trim().length(3).toUpperCase(),
    positions: z.number().int().nonnegative(),
  }),
  lines: z.array(lineSchema).min(1, "a ticket must contain at least one line").max(200),
});

export interface TicketCheck {
  ok: boolean;
  errors: string[];
  ticket: OrderTicket;
}

/**
 * Semantic checks the type system cannot express. Every one of these is a
 * way a structurally-valid ticket still instructs the wrong trade.
 *
 * `connection` supplies the account and currency of record. The ticket's own
 * values are cross-checked against them rather than trusted: the account an
 * order books to is a property of the CONNECTION the advisor configured on
 * the server, not something a browser payload gets to choose.
 */
export function checkTicket(
  raw: OrderTicket,
  connection: { account: string; currency: string; maxTicketAmount?: number | null },
): TicketCheck {
  const errors: string[] = [];
  const ticket: OrderTicket = { ...raw };

  // The connection's currency is the account's currency of record. A ticket
  // denominated differently is not converted anywhere in this system — it
  // would simply be relabelled, so a JPY ticket into a CHF account books a
  // ~100x wrong notional.
  if (connection.currency && ticket.totals.currency !== connection.currency) {
    errors.push(
      `ticket is denominated in ${ticket.totals.currency} but this connection's account is ` +
      `${connection.currency}; the relay does not convert currencies`
    );
  }

  // The server's connection owns the destination. A ticket naming a different
  // account is refused rather than silently rebooked — if the two disagree,
  // one of them is wrong and we must not guess which.
  if (ticket.account.id && ticket.account.id !== connection.account) {
    errors.push(
      `ticket books to account "${ticket.account.id}" but this connection is configured for "${connection.account}"`
    );
  }
  ticket.account = { ...ticket.account, id: connection.account };

  // Every line must be in the ticket currency. A mixed-currency ticket has no
  // meaningful total, and the total is what the advisor confirmed.
  const ccy = ticket.totals.currency;
  if (ticket.account.currency !== ccy) {
    errors.push(`account currency ${ticket.account.currency} does not match ticket currency ${ccy}`);
  }
  const wrongCcy = ticket.lines.filter((l) => l.currency !== ccy);
  if (wrongCcy.length) {
    errors.push(`${wrongCcy.length} line(s) are not in ${ccy}: ${wrongCcy.map((l) => l.lineId).join(", ")}`);
  }

  // Re-derive the total from the lines. The browser sent both; if they
  // disagree, the number the advisor saw is not the number being ordered.
  const derived = sumLines(ticket.lines);
  if (!sameMoney(derived, ticket.totals.amount)) {
    errors.push(
      `line amounts sum to ${derived.toFixed(2)} but the ticket total says ` +
      `${round2(ticket.totals.amount).toFixed(2)} — refusing to send a ticket whose own arithmetic disagrees`
    );
  }
  if (ticket.totals.positions !== ticket.lines.length) {
    errors.push(`ticket claims ${ticket.totals.positions} positions but carries ${ticket.lines.length} lines`);
  }

  // Identity: a line the PM system cannot resolve must not be sent, and one
  // bad line blocks the whole ticket — a partially-placed order is worse
  // than one that never left.
  const unidentified = ticket.lines.filter((l) => !l.instrument.isin && !l.instrument.cusip && !l.instrument.ticker);
  if (unidentified.length) {
    errors.push(
      `${unidentified.length} line(s) carry no ISIN, CUSIP or ticker: ` +
      unidentified.map((l) => l.instrument.name || l.lineId).join(", ")
    );
  }
  const zero = ticket.lines.filter((l) => !(l.amount > 0));
  if (zero.length) errors.push(`${zero.length} line(s) have a zero amount`);

  // An ISIN carries its own check digit; a transposition is caught here rather
  // than by the custodian booking a different security.
  const badIsin = ticket.lines.filter((l) => l.instrument.isin && !isValidIsin(l.instrument.isin));
  if (badIsin.length) {
    errors.push(
      `${badIsin.length} line(s) carry an ISIN that fails its check digit: ` +
      badIsin.map((l) => `${l.instrument.isin} (${l.instrument.name || l.lineId})`).join(", ")
    );
  }

  const badCusip = ticket.lines.filter((l) => l.instrument.cusip && !isValidCusip(l.instrument.cusip));
  if (badCusip.length) {
    errors.push(
      `${badCusip.length} line(s) carry a CUSIP that fails its check digit: ` +
      badCusip.map((l) => `${l.instrument.cusip} (${l.instrument.name || l.lineId})`).join(", ")
    );
  }

  // Both identifiers present and individually valid is NOT enough — they must
  // describe the SAME security. A custodian cannot catch this; it would simply
  // book whichever one the wire format carries.
  for (const l of ticket.lines) {
    const agree = checkIdentifierAgreement(l.instrument.cusip || "", l.instrument.isin || "");
    if (!agree.ok) errors.push(`${l.instrument.name || l.lineId}: ${agree.conflict}`);
  }

  // A hard server-side ceiling. checkTicket re-derives the total from the
  // lines, which proves the ticket is internally COHERENT — it does not prove
  // the amounts are authorized, because the server has no proposal of record
  // to compare against. Any internally-consistent set of numbers a client
  // sends would otherwise be forwarded, so this ceiling is the only
  // authorization boundary on size, and it is set where a browser cannot
  // reach it.
  const cap = connection.maxTicketAmount;
  if (cap != null && Number.isFinite(cap) && cap > 0 && ticket.totals.amount > cap) {
    errors.push(
      `ticket total ${round2(ticket.totals.amount).toFixed(2)} ${ticket.totals.currency} exceeds this ` +
      `connection's per-ticket limit of ${round2(cap).toFixed(2)} ${connection.currency}`
    );
  }

  const dupIds = new Set<string>();
  for (const l of ticket.lines) {
    if (dupIds.has(l.lineId)) { errors.push(`duplicate lineId "${l.lineId}"`); break; }
    dupIds.add(l.lineId);
  }

  const alloc = ticket.lines.reduce((s, l) => s + l.weightPct, 0);
  if (alloc > 100.5) errors.push(`allocation totals ${alloc.toFixed(1)}% — over 100%`);

  if (!connection.account) errors.push("this connection has no custody account configured");

  // Normalize identifiers so the wire layer and the audit fingerprint agree.
  ticket.lines = ticket.lines.map((l) => ({
    ...l,
    instrument: {
      ...l.instrument,
      isin: (l.instrument.isin || "").toUpperCase(),
      cusip: normalizeCusip(l.instrument.cusip || ""),
      ticker: (l.instrument.ticker || "").toUpperCase(),
    },
    amount: round2(l.amount),
  }));
  ticket.totals = { ...ticket.totals, amount: round2(derived) };

  return { ok: errors.length === 0, errors, ticket };
}

// ISIN/CUSIP arithmetic lives in ./identifiers — re-exported so existing
// importers of this module keep working.
export { isValidIsin, isValidCusip } from "./identifiers";

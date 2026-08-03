// ─────────────────────────────────────────────────────────────────
// POST   /api/orders/<id>  — PLACE: validate a wa.order/v1 ticket and
//                            forward it to the PM/OMS, which stages it.
// GET    /api/orders/<id>  — the connection + its recent ticket history
// PATCH  /api/orders/<id>  — update a connection
// DELETE /api/orders/<id>  — remove one
//
// The outbound mirror of /api/feeds/<id>. It exists for the same two
// reasons: a PM endpoint rarely sends CORS headers, and no bank will
// bless a long-lived OMS credential sitting in a browser.
//
// It differs in what a mistake costs. A bad feed shows a wrong number on
// a screen; a bad order buys the wrong securities with a client's money.
// So this route does NOT trust the ticket it is handed:
//   • the custody account comes from the CONNECTION, never the payload
//   • line amounts are re-summed and checked against the stated total
//   • idempotency is enforced HERE, in Postgres, not delegated to a
//     header the upstream may or may not honour
//   • the attempt is recorded BEFORE the upstream call, so a crash
//     mid-flight still leaves evidence something was sent
//
// Every outbound request goes through lib/feeds/ssrf.ts safePost, which
// refuses to follow redirects — see that function for why.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { decryptSecret, FeedCryptoError } from "@/lib/feeds/crypto";
import { safePost, FeedFetchError } from "@/lib/feeds/ssrf";
import { redact, HTTP_FOR } from "@/lib/feeds/redact";
import { orderConnectionPatch, orderTicketSchema, checkTicket, fieldErrors, toPublic } from "@/lib/orders/schema";
import { ticketToWire, readPlacementResponse } from "@/lib/orders/adapters";
import { ticketFingerprint, stripIdentity, type OrderFormat, type OrderTicket } from "@/lib/orders/model";
import { checkOrderHost } from "@/lib/orders/allowlist";
import { recordEvent } from "@/lib/audit/record";
import { encryptSecret, encryptionAvailable } from "@/lib/feeds/crypto";
import { listHouseholds } from "@/lib/tenancy/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAFE_COLUMNS = "id, name, url, format, auth, header, account, custodian, currency, max_ticket_amount, send_client_identity, secret_ciphertext, last_sent_at, last_status, created_at, household_id, org_id";

interface Ctx { params: Promise<{ id: string }> }

/**
 * Placing orders is rate-limited harder than reading feeds. This endpoint
 * makes our server send money instructions on the user's behalf, so a stuck
 * retry loop is far more costly than a noisy read.
 */
const SENDS = new Map<string, number[]>();
const SEND_WINDOW_MS = 60_000;
const SEND_LIMIT = 10;
function throttled(userId: string): boolean {
  const now = Date.now();
  const hits = (SENDS.get(userId) ?? []).filter((t) => now - t < SEND_WINDOW_MS);
  hits.push(now);
  SENDS.set(userId, hits);
  if (SENDS.size > 5000) for (const [k, v] of SENDS) if (!v.some((t) => now - t < SEND_WINDOW_MS)) SENDS.delete(k);
  return hits.length > SEND_LIMIT;
}

/**
 * Access is by HOUSEHOLD, not by creator. Two advisors sharing a client
 * share that client's OMS connection — which is the whole point of 008's
 * idempotency re-key: it is only meaningful if both of them route through
 * the same connection and therefore collide on the same ticket id.
 */
async function loadOwned(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;

  const { data, error } = await supabase
    .from("order_connections")
    .select(SAFE_COLUMNS)
    .eq("id", id)
    .maybeSingle();

  if (error) return { error: NextResponse.json({ error: error.message }, { status: 500 }) } as const;
  // 404 (not 403) for a row outside the caller's book — don't confirm it exists.
  if (!data) return { error: NextResponse.json({ error: "Connection not found" }, { status: 404 }) } as const;

  const visible = await listHouseholds(supabase);
  if (!visible.some((h) => h.id === String(data.household_id))) {
    return { error: NextResponse.json({ error: "Connection not found" }, { status: 404 }) } as const;
  }
  return {
    supabase, user, row: data,
    householdId: String(data.household_id),
    orgId: String(data.org_id),
  } as const;
}

// ─── PLACE AN ORDER ───────────────────────────────────────────────
export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const owned = await loadOwned(id);
  if ("error" in owned) return owned.error;
  const { supabase, user, row, householdId, orgId } = owned;

  if (throttled(user.id)) {
    return NextResponse.json(
      { error: `Too many order placements — the relay allows ${SEND_LIMIT} per minute.`, code: "rate_limited" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON", code: "bad_request" }, { status: 400 }); }

  const parsed = orderTicketSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid order ticket", code: "invalid_ticket", fieldErrors: fieldErrors(parsed.error) },
      { status: 400 },
    );
  }

  // Semantic checks: arithmetic, identity, currency, account.
  const checked = checkTicket(parsed.data as OrderTicket, {
    account: String(row.account ?? ""),
    currency: String(row.currency ?? ""),
    maxTicketAmount: row.max_ticket_amount == null ? null : Number(row.max_ticket_amount),
  });
  if (!checked.ok) {
    return NextResponse.json(
      { error: "This ticket cannot be sent", code: "invalid_ticket", reasons: checked.errors },
      { status: 422 },
    );
  }
  const ticket = checked.ticket;
  const fingerprint = ticketFingerprint(ticket);

  // ── Idempotency, enforced in Postgres ──
  // The unique index on (household_id, ticket_id) is the actual guarantee.
  // Insert first: if it succeeds we own this placement, if it collides the
  // ticket was already sent — by anyone advising this client — and we must
  // NOT send it again. Keyed on the household rather than the actor, because
  // under the old (user_id, ticket_id) index two advisors on one client had
  // separate namespaces and both BUYs reached the OMS. See 008.
  const { data: claimed, error: claimErr } = await supabase
    .from("order_tickets")
    .insert({
      user_id: user.id,
      household_id: householdId,
      org_id: orgId,
      connection_id: id,
      ticket_id: ticket.ticketId,
      fingerprint,
      account: ticket.account.id,
      currency: ticket.totals.currency,
      positions: ticket.lines.length,
      total_amount: ticket.totals.amount,
      payload: ticket,
      status: "sending",
    })
    .select("id")
    .single();

  if (claimErr) {
    // 23505 = unique_violation → this ticketId was already used.
    if (claimErr.code === "23505") {
      // Look the prior attempt up on the SAME key the index enforces. On
      // user_id it would miss a colleague's send on this client — the exact
      // case that makes a duplicate dangerous — and report "no prior row"
      // for a collision that certainly happened.
      const { data: prior } = await supabase
        .from("order_tickets")
        .select("fingerprint, status, http_status, upstream_ref, detail, created_at, positions, total_amount")
        .eq("household_id", householdId)
        .eq("ticket_id", ticket.ticketId)
        .maybeSingle();

      if (prior && prior.fingerprint !== fingerprint) {
        // The same key with different instructions is NOT a retry. Returning
        // the earlier result would silently discard a corrected order.
        return NextResponse.json({
          error: "This ticket reference was already used for a DIFFERENT order. " +
                 "Rebuild the ticket so it gets a new reference, then send again.",
          code: "ticket_conflict",
        }, { status: 409 });
      }
      await recordEvent(supabase, user.id, {
        action: "order.duplicate_blocked", source: "order",
        summary: `Duplicate submission of ticket ${ticket.ticketId} blocked — not sent again`,
        refType: "order_ticket", refId: ticket.ticketId,
        householdId, orgId,
      });
      return NextResponse.json({
        duplicate: true,
        code: "already_sent",
        message: prior?.status === "staged"
          ? "This ticket was already staged in the PM system — not sending it again."
          : "This ticket was already submitted; not sending it again.",
        result: {
          state: (prior?.status === "staged" ? "staged"
                : prior?.status === "rejected" ? "rejected"
                : "unknown") as "staged" | "rejected" | "unknown",
          ok: prior?.status === "staged",
          ref: prior?.upstream_ref ?? "",
          accepted: null,
          rejected: prior?.detail ? [prior.detail] : [],
          httpStatus: prior?.http_status ?? 0,
        },
        sentAt: prior?.created_at ?? null,
      }, { status: 200 });
    }
    return NextResponse.json({ error: claimErr.message }, { status: 500 });
  }

  const rowId = claimed.id as string;
  const finish = async (
    status: "staged" | "rejected" | "failed" | "unknown",
    httpStatus: number,
    ref: string,
    detail: string,
    summary: string,
  ) => {
    try {
      await supabase.from("order_tickets")
        .update({ status, http_status: httpStatus || null, upstream_ref: ref || null, detail: detail.slice(0, 500) || null })
        .eq("id", rowId).eq("household_id", householdId);
      // last_status is rendered in the connections list and is NOT per-ticket.
      // Upstream error bodies routinely echo the request — custody account,
      // client name, ISINs, sometimes the Authorization header — so only a
      // code and counts go here. The detail lives on the ticket row, which is
      // owner-scoped and shown per ticket.
      await supabase.from("order_connections")
        .update({ last_sent_at: new Date().toISOString(), last_status: summary.slice(0, 300) })
        .eq("id", id).eq("household_id", householdId);
    } catch { /* audit is best-effort; never mask the real outcome */ }
  };

  // ── Credential ──
  let secret = "";
  try {
    secret = row.secret_ciphertext ? decryptSecret(String(row.secret_ciphertext)) : "";
  } catch (e) {
    const msg = e instanceof FeedCryptoError ? e.message : "could not read the stored credential";
    await finish("failed", 0, "", msg, "failed: credential unreadable");
    return NextResponse.json({ error: msg, code: "credential" }, { status: 500 });
  }
  if (row.auth && row.auth !== "none" && !secret) {
    const msg = `This connection is set to ${row.auth} authentication but has no stored credential.`;
    await finish("failed", 0, "", msg, "failed: no credential stored");
    return NextResponse.json({ error: msg, code: "no_credential" }, { status: 400 });
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    "User-Agent": "WealthAnalyzer-OrderRelay/1.0",
    // Forwarded as a courtesy so a PM system that dedupes can. Our own
    // guarantee does not depend on it.
    "Idempotency-Key": ticket.ticketId,
    "X-Idempotency-Key": ticket.ticketId,
  };
  if (row.auth === "bearer") headers.Authorization = `Bearer ${secret}`;
  else if (row.auth === "apikey") headers[String(row.header || "X-API-Key")] = secret;
  else if (row.auth === "basic") headers.Authorization = `Basic ${Buffer.from(secret, "utf8").toString("base64")}`;

  // Host pinning, re-checked at send time as well as save time — the
  // allowlist can change, and DNS certainly can. See lib/orders/allowlist.ts
  // for why a POST path cannot inherit the GET path's residual-risk acceptance.
  const pinned = checkOrderHost(String(row.url));
  if (!pinned.ok) {
    await finish("failed", 0, "", pinned.reason, "failed: endpoint host not permitted");
    return NextResponse.json({ error: pinned.reason, code: "blocked", state: "failed" }, { status: 400 });
  }

  // Client identity is opt-in per connection: a mistyped endpoint should
  // leak what was bought, not who bought it.
  const outbound = row.send_client_identity ? ticket : stripIdentity(ticket);
  const wire = ticketToWire(outbound, (row.format || "wa") as OrderFormat);

  let sent;
  try {
    sent = await safePost(String(row.url), headers, JSON.stringify(wire));
  } catch (e) {
    const err = e instanceof FeedFetchError ? e : null;
    const raw = err ? err.message : e instanceof Error ? e.message : "order request failed";
    const msg = redact(raw, secret);
    const status = HTTP_FOR[err?.code ?? "network"] ?? 502;
    // A timeout or a dropped connection is genuinely AMBIGUOUS: the request
    // may have reached the PM system and staged the ticket before the socket
    // died. Recording that as "failed" would read as "nothing happened" and
    // invite a resend — which is how one model portfolio becomes two. Only a
    // request the guard refused to make at all is a true failure.
    const ambiguous = err?.code === "timeout" || err?.code === "network";
    await finish(
      ambiguous ? "unknown" : "failed", 0, "", msg,
      ambiguous ? `unknown: ${err?.code} — outcome unconfirmed` : `failed: ${err?.code ?? "network"}`,
    );
    return NextResponse.json({
      error: msg,
      code: err?.code ?? "network",
      state: ambiguous ? "unknown" : "failed",
      ambiguous,
      ...(ambiguous ? {
        message: "The request did not complete, so the PM system may or may not have received this " +
                 "ticket. Check there before resending. Resending this same ticket is safe — the relay " +
                 "recognises it as a duplicate and will not send it twice.",
      } : {}),
    }, { status });
  }

  let parsedBody: unknown = sent.body;
  let jsonParsed = false;
  try { parsedBody = JSON.parse(sent.body); jsonParsed = true; } catch { /* keep as text */ }
  const result = readPlacementResponse(
    jsonParsed ? parsedBody : sent.body,
    sent.status,
    sent.contentType,
  );
  const detail = redact([result.uncertainty ?? "", ...result.rejected].filter(Boolean).join(" · "), secret);

  // The connection-level summary carries a code and counts only — never
  // upstream body text, which routinely echoes the account, the client name
  // and sometimes the credential.
  const summary = result.state === "staged"
    ? `staged: ${ticket.lines.length} line(s) (HTTP ${sent.status})`
    : result.state === "rejected"
      ? `rejected: ${result.rejected.length} of ${ticket.lines.length} line(s) (HTTP ${sent.status})`
      : `unknown: unconfirmed response (HTTP ${sent.status})`;

  await finish(result.state, sent.status, result.ref, detail, summary);

  // order_tickets is the instruction of record; this puts the OUTCOME on the
  // same timeline as plan edits and feed runs, so a review reads one story.
  await recordEvent(supabase, user.id, {
    action: result.state === "staged" ? "order.staged"
          : result.state === "rejected" ? "order.rejected" : "order.unknown",
    source: "order",
    summary: `${summary} to ${row.name}`,
    netWorthAfter: null,
    currency: ticket.totals.currency,
    detail: detail || result.uncertainty || null,
    refType: "order_ticket", refId: ticket.ticketId,
    householdId, orgId,
    changes: ticket.lines.slice(0, 60).map((l) => ({
      section: "order", action: "added" as const,
      label: `${l.instrument.name || l.lineId}`.slice(0, 120),
      after: `${l.currency} ${l.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    })),
  });

  // An unconfirmed outcome is NOT a 200. It must not read as success to any
  // client that only checks the status code.
  const httpOut = result.state === "staged" ? 200 : result.state === "unknown" ? 502 : 502;

  return NextResponse.json({
    ok: result.ok,
    state: result.state,
    ticketId: ticket.ticketId,
    result: {
      ...result,
      uncertainty: result.uncertainty ? redact(result.uncertainty, secret) : undefined,
      rejected: result.rejected.map((r) => redact(r, secret)),
    },
    totals: ticket.totals,
  }, { status: httpOut, headers: { "Cache-Control": "no-store" } });
}

// ─── READ ─────────────────────────────────────────────────────────
export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const owned = await loadOwned(id);
  if ("error" in owned) return owned.error;
  const { supabase, row, householdId } = owned;

  // The client's order history, not the caller's. A colleague's sends on
  // this client belong on the same timeline — that is what a review reads.
  const { data: tickets } = await supabase
    .from("order_tickets")
    .select("ticket_id, account, currency, positions, total_amount, status, http_status, upstream_ref, detail, created_at")
    .eq("household_id", householdId)
    .eq("connection_id", id)
    .order("created_at", { ascending: false })
    .limit(25);

  return NextResponse.json({ connection: toPublic(row), tickets: tickets ?? [] });
}

// ─── UPDATE ───────────────────────────────────────────────────────
export async function PATCH(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const owned = await loadOwned(id);
  if ("error" in owned) return owned.error;
  const { supabase, row } = owned;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = orderConnectionPatch.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid connection", fieldErrors: fieldErrors(parsed.error) }, { status: 400 });
  }
  const c = parsed.data;

  // Same invariant POST enforces, evaluated against the state the row will
  // END UP in — otherwise it is reachable in two steps.
  const nextAuth = c.auth ?? row.auth ?? "none";
  const nextHasSecret = c.secret !== undefined ? c.secret !== "" : !!row.secret_ciphertext;
  if (nextAuth !== "none" && !nextHasSecret) {
    return NextResponse.json({
      error: `A connection using ${nextAuth} authentication needs a credential.`,
      fieldErrors: { secret: ["Required for this authentication type"] },
    }, { status: 400 });
  }
  if (nextAuth === "basic" && c.secret && !c.secret.includes(":")) {
    return NextResponse.json({
      error: "Basic authentication expects the credential as user:password.",
      fieldErrors: { secret: ["Expected user:password"] },
    }, { status: 400 });
  }

  const patch: Record<string, unknown> = {};
  if (c.name !== undefined) patch.name = c.name;
  if (c.url !== undefined) patch.url = c.url;
  if (c.format !== undefined) patch.format = c.format;
  if (c.auth !== undefined) patch.auth = c.auth;
  if (c.header !== undefined) patch.header = c.header;
  if (c.account !== undefined) patch.account = c.account;
  if (c.custodian !== undefined) patch.custodian = c.custodian;
  if (c.currency !== undefined) patch.currency = c.currency;
  if (c.maxTicketAmount !== undefined) patch.max_ticket_amount = c.maxTicketAmount;
  if (c.sendClientIdentity !== undefined) patch.send_client_identity = c.sendClientIdentity;
  if (c.secret !== undefined) {
    if (c.secret === "") patch.secret_ciphertext = null;
    else if (!encryptionAvailable()) {
      return NextResponse.json({ error: "Server is not configured to store credentials — set FEEDS_ENCRYPTION_KEY." }, { status: 503 });
    } else patch.secret_ciphertext = encryptSecret(c.secret);
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { data, error } = await supabase
    .from("order_connections").update(patch).eq("id", id).select(SAFE_COLUMNS).single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ connection: toPublic(data) });
}

// ─── DELETE ───────────────────────────────────────────────────────
export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const owned = await loadOwned(id);
  if ("error" in owned) return owned.error;

  // order_tickets.connection_id is ON DELETE SET NULL, so the audit trail
  // outlives the connection it was sent through.
  const { error } = await owned.supabase.from("order_connections").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

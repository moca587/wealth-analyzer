// ─────────────────────────────────────────────────────────────────
// GET    /api/feeds/<id>  — RUN the relay: fetch upstream with the
//                           server-held credential, normalize, and
//                           return a wa.feed/v1 envelope.
// PATCH  /api/feeds/<id>  — update a connection
// DELETE /api/feeds/<id>  — remove one
//
// This is the piece the browser cannot do itself: custodian APIs rarely
// send CORS headers, and putting a long-lived custodian credential in a
// browser is not something a bank will bless. The relay holds the
// credential server-side and answers with the same model the
// single-file app's "Data feeds" panel already consumes, so that panel
// works against this endpoint unchanged.
//
// Every outbound request goes through lib/feeds/ssrf.ts — see that file
// for why (this handler fetches a URL the user controls, from inside our
// network).
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { feedConnectionPatch, fieldErrors, toPublic } from "@/lib/feeds/schema";
import { encryptSecret, decryptSecret, encryptionAvailable, FeedCryptoError } from "@/lib/feeds/crypto";
import { safeFetch, FeedFetchError } from "@/lib/feeds/ssrf";
import { adaptFeed, FeedFormatError } from "@/lib/feeds/adapters";
import { countRecords, type FeedFormat } from "@/lib/feeds/model";
import { redact, HTTP_FOR } from "@/lib/feeds/redact";
import { recordEvent } from "@/lib/audit/record";
import { listHouseholds } from "@/lib/tenancy/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";   // a relay run must never be cached

const SAFE_COLUMNS = "id, name, url, kind, format, auth, header, default_country, secret_ciphertext, last_run_at, last_status, created_at, household_id, org_id";

interface Ctx { params: Promise<{ id: string }> }

/**
 * Per-user throttle on relay runs.
 *
 * The relay makes OUR server fetch a URL the user chose, so an authenticated
 * account is otherwise a free, attributable request amplifier. This is
 * per-instance memory: it bounds a single runaway client (a stuck retry loop,
 * a script) but is not a distributed limiter — a real deployment should also
 * rate-limit at the edge.
 */
const RUNS = new Map<string, number[]>();
const RUN_WINDOW_MS = 60_000;
const RUN_LIMIT = 30;
function throttled(userId: string): boolean {
  const now = Date.now();
  const hits = (RUNS.get(userId) ?? []).filter((t) => now - t < RUN_WINDOW_MS);
  hits.push(now);
  RUNS.set(userId, hits);
  if (RUNS.size > 5000) for (const [k, v] of RUNS) if (!v.some((t) => now - t < RUN_WINDOW_MS)) RUNS.delete(k);
  return hits.length > RUN_LIMIT;
}

/**
 * Auth + access in one step; returns the row or an error response.
 *
 * Access is by HOUSEHOLD, not by creator: a colleague who shares the
 * client must be able to run and edit the client's feeds, and the advisor
 * who created it must not reach it from a different client's context.
 * RLS already enforces this, so the second check below only ever fires if
 * a policy regressed — which is precisely when it is worth having.
 */
async function loadOwned(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;

  const { data, error } = await supabase
    .from("feed_connections")
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
  return { supabase, user, row: data } as const;
}

// ─── RUN THE RELAY ────────────────────────────────────────────────
export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const owned = await loadOwned(id);
  if ("error" in owned) return owned.error;
  const { supabase, user, row } = owned;

  if (throttled(user.id)) {
    return NextResponse.json(
      { error: `Too many feed runs — the relay allows ${RUN_LIMIT} per minute.`, code: "rate_limited" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  // Build upstream auth from the decrypted credential.
  const headers: Record<string, string> = {
    Accept: "application/json, application/xml, text/csv, text/plain, */*",
    "User-Agent": "WealthAnalyzer-FeedRelay/1.0",
  };
  let secret = "";
  try {
    secret = row.secret_ciphertext ? decryptSecret(row.secret_ciphertext) : "";
  } catch (e) {
    const msg = e instanceof FeedCryptoError ? e.message : "could not read the stored credential";
    await recordRun(supabase, id, `error: ${msg}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  // A connection configured for auth but holding no credential must NOT fetch
  // anonymously. It used to: the header was simply omitted, the custodian
  // answered with its HTML login page, and the adapter tried to normalize that
  // into the client's plan. Fail loudly instead.
  if (row.auth && row.auth !== "none" && !secret) {
    const msg = `This connection is set to ${row.auth} authentication but has no stored credential.`;
    await recordRun(supabase, id, `error: ${msg}`);
    return NextResponse.json({ error: msg, code: "no_credential" }, { status: 400 });
  }
  if (row.auth === "bearer" && secret) headers.Authorization = `Bearer ${secret}`;
  else if (row.auth === "apikey" && secret) headers[row.header || "X-API-Key"] = secret;
  // RFC 7617: the user-pass token is UTF-8 before base64, so a credential with
  // an umlaut or accent encodes correctly rather than being mangled.
  else if (row.auth === "basic" && secret) headers.Authorization = `Basic ${Buffer.from(secret, "utf8").toString("base64")}`;

  let fetched;
  try {
    fetched = await safeFetch(row.url, headers);
  } catch (e) {
    const err = e instanceof FeedFetchError ? e : null;
    const raw = err ? err.message : e instanceof Error ? e.message : "upstream request failed";
    const msg = redact(raw, secret);
    const status = HTTP_FOR[err?.code ?? "network"] ?? 502;
    await recordRun(supabase, id, `error: ${msg}`);
    return NextResponse.json({ error: msg, code: err?.code ?? "network" }, { status });
  }

  let envelope, format;
  try {
    const adapted = adaptFeed(fetched.body, (row.format || "auto") as FeedFormat, row.name, {
      contentType: fetched.contentType,
      defaultCountry: row.default_country || "CH",
    });
    envelope = adapted.envelope;
    format = adapted.format;
  } catch (e) {
    const raw = e instanceof FeedFormatError ? e.message : e instanceof Error ? e.message : "could not normalize the payload";
    // The adapter quotes payload fragments; an authenticated payload can carry
    // the credential back, so scrub before this is stored or shown.
    const msg = redact(raw, secret);
    await recordRun(supabase, id, `error: ${msg}`);
    return NextResponse.json({ error: msg, code: "format" }, { status: 422 });
  }

  const records = countRecords(envelope);
  envelope.source = {
    system: row.name,
    kind: (row.kind as "custodian" | "crm") ?? "custodian",
    generatedAt: new Date().toISOString(),
    ...envelope.source,
  };
  await recordRun(supabase, id, `ok: ${records} record${records === 1 ? "" : "s"} (${format})`);
  // last_status keeps only the latest run; the audit trail keeps all of them.
  await recordEvent(supabase, user.id, {
    action: "feed.run", source: "feed",
    summary: `Fetched ${records} record${records === 1 ? "" : "s"} from ${row.name} (${format})`,
    refType: "feed_connection", refId: id,
    householdId: String(row.household_id), orgId: String(row.org_id),
  });

  return NextResponse.json(envelope, {
    headers: { "Cache-Control": "no-store" },
  });
}

/** Best-effort audit stamp — never fail a run because the stamp failed. */
async function recordRun(
  supabase: Awaited<ReturnType<typeof createClient>>,
  id: string,
  status: string
) {
  try {
    await supabase
      .from("feed_connections")
      .update({ last_run_at: new Date().toISOString(), last_status: status.slice(0, 300) })
      .eq("id", id);
  } catch { /* audit only */ }
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

  const parsed = feedConnectionPatch.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid connection", fieldErrors: fieldErrors(parsed.error) }, { status: 400 });
  }
  const c = parsed.data;

  // POST refuses a connection that declares auth but carries no credential.
  // PATCH validates only the fields present, so the invariant was reachable in
  // two steps: switch auth to `bearer` without sending a secret, or clear the
  // secret while auth stays `bearer`. Check the state the row will END UP in.
  const nextAuth = c.auth ?? row.auth ?? "none";
  const nextHasSecret = c.secret !== undefined ? c.secret !== "" : !!row.secret_ciphertext;
  if (nextAuth !== "none" && !nextHasSecret) {
    return NextResponse.json({
      error: `A connection using ${nextAuth} authentication needs a credential. ` +
             `Provide one, or set authentication to "none".`,
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
  if (c.kind !== undefined) patch.kind = c.kind;
  if (c.format !== undefined) patch.format = c.format;
  if (c.auth !== undefined) patch.auth = c.auth;
  if (c.header !== undefined) patch.header = c.header;
  if (c.defaultCountry !== undefined) patch.default_country = c.defaultCountry;
  if (c.secret !== undefined) {
    if (c.secret === "") patch.secret_ciphertext = null;          // explicit clear
    else if (!encryptionAvailable()) {
      return NextResponse.json({ error: "Server is not configured to store credentials — set FEEDS_ENCRYPTION_KEY." }, { status: 503 });
    } else patch.secret_ciphertext = encryptSecret(c.secret);
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  const { data, error } = await supabase
    .from("feed_connections").update(patch).eq("id", id).select(SAFE_COLUMNS).single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ connection: toPublic(data) });
}

// ─── DELETE ───────────────────────────────────────────────────────
export async function DELETE(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const owned = await loadOwned(id);
  if ("error" in owned) return owned.error;

  const { error } = await owned.supabase.from("feed_connections").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

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

export const runtime = "nodejs";
export const dynamic = "force-dynamic";   // a relay run must never be cached

const SAFE_COLUMNS = "id, name, url, kind, format, auth, header, default_country, secret_ciphertext, last_run_at, last_status, created_at";

interface Ctx { params: Promise<{ id: string }> }

/** Auth + ownership in one step; returns the row or an error response. */
async function loadOwned(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;

  const { data, error } = await supabase
    .from("feed_connections")
    .select(SAFE_COLUMNS)
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) return { error: NextResponse.json({ error: error.message }, { status: 500 }) } as const;
  // 404 (not 403) for someone else's row — don't confirm it exists.
  if (!data) return { error: NextResponse.json({ error: "Connection not found" }, { status: 404 }) } as const;
  return { supabase, user, row: data } as const;
}

// ─── RUN THE RELAY ────────────────────────────────────────────────
export async function GET(_request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const owned = await loadOwned(id);
  if ("error" in owned) return owned.error;
  const { supabase, row } = owned;

  // Build upstream auth from the decrypted credential.
  const headers: Record<string, string> = {
    Accept: "application/json, application/xml, text/csv, text/plain, */*",
    "User-Agent": "WealthAnalyzer-FeedRelay/1.0",
  };
  try {
    const secret = row.secret_ciphertext ? decryptSecret(row.secret_ciphertext) : "";
    if (row.auth === "bearer" && secret) headers.Authorization = `Bearer ${secret}`;
    else if (row.auth === "apikey" && secret) headers[row.header || "X-API-Key"] = secret;
    else if (row.auth === "basic" && secret) headers.Authorization = `Basic ${Buffer.from(secret).toString("base64")}`;
  } catch (e) {
    const msg = e instanceof FeedCryptoError ? e.message : "could not read the stored credential";
    await recordRun(supabase, id, `error: ${msg}`);
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  let fetched;
  try {
    fetched = await safeFetch(row.url, headers);
  } catch (e) {
    const err = e instanceof FeedFetchError ? e : null;
    const msg = err ? err.message : e instanceof Error ? e.message : "upstream request failed";
    // A blocked URL is the caller's mistake (400); anything else is upstream (502).
    const status = err?.code === "blocked" ? 400 : 502;
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
    const msg = e instanceof FeedFormatError ? e.message : e instanceof Error ? e.message : "could not normalize the payload";
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
  const { supabase } = owned;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = feedConnectionPatch.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid connection", fieldErrors: fieldErrors(parsed.error) }, { status: 400 });
  }
  const c = parsed.data;

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

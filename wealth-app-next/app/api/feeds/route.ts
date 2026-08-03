// ─────────────────────────────────────────────────────────────────
// GET  /api/feeds  — the connections for one client (never any secret)
// POST /api/feeds  — create one
//
// Scoped on the HOUSEHOLD, not the user. A custodian feed belongs to the
// client whose statements it pulls, so a colleague who shares that client
// must see it — and an advisor's other clients must not. RLS on
// feed_connections enforces exactly that (008); the explicit household
// filter here is belt-and-braces.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { feedConnectionInput, fieldErrors, toPublic } from "@/lib/feeds/schema";
import { encryptSecret, encryptionAvailable } from "@/lib/feeds/crypto";
import { resolveHousehold } from "@/lib/tenancy/context";

// node:crypto + node:dns are required by the crypto/SSRF layers.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAFE_COLUMNS = "id, name, url, kind, format, auth, header, default_country, secret_ciphertext, last_run_at, last_status, created_at";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hh = await resolveHousehold(supabase, request);
  if (!hh.ok) {
    return NextResponse.json({ error: hh.error, code: hh.code, households: hh.households }, { status: hh.status });
  }

  const { data, error } = await supabase
    .from("feed_connections")
    .select(SAFE_COLUMNS)
    .eq("household_id", hh.household.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // toPublic() maps secret_ciphertext → hasSecret:boolean, so the
  // ciphertext itself never crosses the wire.
  return NextResponse.json({ connections: (data ?? []).map(toPublic), household: hh.household });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hh = await resolveHousehold(supabase, request);
  if (!hh.ok) {
    return NextResponse.json({ error: hh.error, code: hh.code, households: hh.households }, { status: hh.status });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = feedConnectionInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid connection", fieldErrors: fieldErrors(parsed.error) }, { status: 400 });
  }
  const c = parsed.data;

  if (c.secret && !encryptionAvailable()) {
    return NextResponse.json({
      error: "Server is not configured to store credentials — set FEEDS_ENCRYPTION_KEY (openssl rand -base64 32).",
    }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("feed_connections")
    .insert({
      user_id: user.id,
      household_id: hh.household.id,
      org_id: hh.household.orgId,
      name: c.name, url: c.url, kind: c.kind, format: c.format,
      auth: c.auth, header: c.header, default_country: c.defaultCountry,
      secret_ciphertext: c.secret ? encryptSecret(c.secret) : null,
    })
    .select(SAFE_COLUMNS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ connection: toPublic(data) }, { status: 201 });
}

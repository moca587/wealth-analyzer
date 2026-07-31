// ─────────────────────────────────────────────────────────────────
// GET  /api/feeds  — list the caller's connections (never any secret)
// POST /api/feeds  — create one
//
// RLS on feed_connections means a user can only ever see or write their
// own rows even if this handler were bypassed; the explicit user_id
// filters here are belt-and-braces.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { feedConnectionInput, fieldErrors, toPublic } from "@/lib/feeds/schema";
import { encryptSecret, encryptionAvailable } from "@/lib/feeds/crypto";

// node:crypto + node:dns are required by the crypto/SSRF layers.
export const runtime = "nodejs";

const SAFE_COLUMNS = "id, name, url, kind, format, auth, header, default_country, secret_ciphertext, last_run_at, last_status, created_at";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("feed_connections")
    .select(SAFE_COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // toPublic() maps secret_ciphertext → hasSecret:boolean, so the
  // ciphertext itself never crosses the wire.
  return NextResponse.json({ connections: (data ?? []).map(toPublic) });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

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
      name: c.name, url: c.url, kind: c.kind, format: c.format,
      auth: c.auth, header: c.header, default_country: c.defaultCountry,
      secret_ciphertext: c.secret ? encryptSecret(c.secret) : null,
    })
    .select(SAFE_COLUMNS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ connection: toPublic(data) }, { status: 201 });
}

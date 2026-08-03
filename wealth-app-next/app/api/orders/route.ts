// ─────────────────────────────────────────────────────────────────
// GET  /api/orders — the PM/OMS connections for one client
// POST /api/orders — create one
//
// Mirrors /api/feeds, and is household-scoped for a sharper reason: a
// connection carries the CUSTODY ACCOUNT an order books into. Listing
// one client's connection while another client's proposal is on screen
// is how a ticket reaches the wrong account.
//
// Secrets go in and are encrypted immediately; no route ever selects
// them back out to a client (toPublic maps the ciphertext to
// `hasSecret`).
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { orderConnectionInput, fieldErrors, toPublic } from "@/lib/orders/schema";
import { encryptSecret, encryptionAvailable } from "@/lib/feeds/crypto";
import { resolveHousehold } from "@/lib/tenancy/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SAFE_COLUMNS = "id, name, url, format, auth, header, account, custodian, currency, max_ticket_amount, send_client_identity, secret_ciphertext, last_sent_at, last_status, created_at";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hh = await resolveHousehold(supabase, request);
  if (!hh.ok) {
    return NextResponse.json({ error: hh.error, code: hh.code, households: hh.households }, { status: hh.status });
  }

  const { data, error } = await supabase
    .from("order_connections")
    .select(SAFE_COLUMNS)
    .eq("household_id", hh.household.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
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

  const parsed = orderConnectionInput.safeParse(body);
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
    .from("order_connections")
    .insert({
      user_id: user.id,
      household_id: hh.household.id,
      org_id: hh.household.orgId,
      name: c.name, url: c.url, format: c.format,
      auth: c.auth, header: c.header,
      account: c.account, custodian: c.custodian || null, currency: c.currency,
      max_ticket_amount: c.maxTicketAmount, send_client_identity: c.sendClientIdentity,
      secret_ciphertext: c.secret ? encryptSecret(c.secret) : null,
    })
    .select(SAFE_COLUMNS)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ connection: toPublic(data) }, { status: 201 });
}

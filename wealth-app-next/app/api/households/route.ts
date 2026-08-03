// ─────────────────────────────────────────────────────────────────
// GET  /api/households — every client the caller may see
// POST /api/households — create one
//
// This is the endpoint that makes a second client reachable, and it is
// where the "a login is a household" assumption finally goes away.
//
// Creation goes through the `create_household` RPC rather than a plain
// insert, because the safe version writes TWO rows — the household and
// the creator's assignment to it — and a policy cannot make that atomic.
// An advisor who inserted only the first would create a client they
// immediately could not see. See 009_household_management.sql.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { listHouseholds } from "@/lib/tenancy/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const createInput = z.object({
  name: z.string().trim().min(1, "Client name is required").max(200),
  reference: z.string().trim().max(100).optional(),
  currency: z.string().trim().length(3).toUpperCase().optional(),
  /** Which firm. Omitted, the caller's only writable organisation is used. */
  orgId: z.string().uuid().optional(),
});

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const households = await listHouseholds(supabase);

  // The org roster too, so the UI can label a household with its firm and
  // know where a new one may be created without a second round-trip.
  const { data: memberships } = await supabase
    .from("org_members")
    .select("org_id, role")
    .eq("user_id", user.id);

  const { data: orgs } = await supabase
    .from("organizations")
    .select("id, name, kind");

  const roleFor = new Map((memberships ?? []).map((m) => [String(m.org_id), String(m.role)]));

  return NextResponse.json({
    households,
    organizations: (orgs ?? []).map((o) => ({
      id: String(o.id), name: String(o.name), kind: String(o.kind),
      role: roleFor.get(String(o.id)) ?? "advisor",
      canCreate: ["owner", "admin", "advisor"].includes(roleFor.get(String(o.id)) ?? ""),
    })),
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = createInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({
      error: "Invalid client",
      fieldErrors: parsed.error.flatten().fieldErrors,
    }, { status: 400 });
  }
  const input = parsed.data;

  let orgId = input.orgId;
  if (!orgId) {
    const { data: mine } = await supabase
      .from("org_members")
      .select("org_id, role")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin", "advisor"]);
    const writable = mine ?? [];
    // Same rule as household resolution: with more than one candidate, ask
    // rather than pick. Creating a client in the wrong firm puts their
    // position in front of the wrong people.
    if (writable.length !== 1) {
      return NextResponse.json({
        error: writable.length === 0
          ? "This account cannot create clients in any organisation."
          : "You belong to several organisations — say which one this client is for (orgId).",
        code: writable.length === 0 ? "no_org" : "org_required",
        organizations: writable.map((m) => ({ id: String(m.org_id), role: String(m.role) })),
      }, { status: writable.length === 0 ? 403 : 400 });
    }
    orgId = String(writable[0].org_id);
  }

  const { data, error } = await supabase.rpc("create_household", {
    p_org: orgId,
    p_name: input.name,
    p_reference: input.reference ?? null,
    p_currency: input.currency ?? "CHF",
  });

  if (error) {
    // The RPC raises `insufficient_privilege` for both "not your org" and
    // "no such org"; keep them indistinguishable here too.
    const denied = /insufficient_privilege|not a member|not authenticated/i.test(
      `${error.code ?? ""} ${error.message}`);
    // A duplicate client reference is a user error, not a server one.
    const dupe = error.code === "23505";
    return NextResponse.json({
      error: dupe
        ? "Another client in this organisation already uses that reference."
        : denied ? "Organisation not found" : error.message,
    }, { status: dupe ? 409 : denied ? 404 : 500 });
  }

  const id = String(data);
  const all = await listHouseholds(supabase);
  const created = all.find((h) => h.id === id);

  return NextResponse.json(
    { household: created ?? { id, orgId, name: input.name, currency: input.currency ?? "CHF" } },
    { status: 201 },
  );
}

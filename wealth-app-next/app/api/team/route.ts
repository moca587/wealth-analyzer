// ─────────────────────────────────────────────────────────────────
// GET   /api/team — the firm: roster, invitations, seats
// POST  /api/team — invite someone
// PATCH /api/team — change a member's role
// DELETE /api/team — remove a member, or revoke an invitation
//
// Every write here is an RPC call, not a table write. `org_members` has
// no client INSERT/UPDATE/DELETE grant (007) and `org_invites` has none
// either (011), on purpose: any policy wide enough to let a user add
// themselves to an organisation is a self-promotion-to-owner primitive.
// The SECURITY DEFINER functions in 011 are the only way in, and each
// re-checks the caller's role, the seat cap and the last-owner rule.
//
// EMAIL DELIVERY IS DELIBERATELY NOT HERE. Sending mail would need the
// service-role key, which this app does not use and which bypasses every
// RLS policy in 006-011. So the invitation LINK is returned to the
// administrator, once, and they send it however their firm already sends
// things. For a product whose buyer is a ten-person EAM that is not a
// compromise — it is one fewer sub-processor on the DPA.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { resolveOrg, listMembers, listInvites, ADMIN_ROLES, type OrgRole } from "@/lib/tenancy/org";
import { recordEvent } from "@/lib/audit/record";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const roleEnum = z.enum(["owner", "admin", "compliance", "advisor"]);

const inviteInput = z.object({
  email: z.string().trim().email("Enter a valid email address").max(320),
  role: roleEnum.default("advisor"),
  ttlDays: z.number().int().min(1).max(60).optional(),
});

const patchInput = z.object({
  userId: z.string().uuid(),
  role: roleEnum,
});

/** Maps a plpgsql RAISE onto an HTTP status the UI can act on. */
function rpcStatus(message: string): number {
  if (/not found|not authenticated|only an owner|sign in first/i.test(message)) return 403;
  if (/already a member/i.test(message)) return 409;
  if (/seats in use|no seat available|last owner|unknown role|valid email/i.test(message)) return 400;
  return 500;
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await resolveOrg(supabase, request);
  if (!org.ok) {
    return NextResponse.json({ error: org.error, code: org.code, organizations: org.organizations },
      { status: org.status });
  }

  const canAdmin = ADMIN_ROLES.includes(org.org.role);
  // Invitations are admin-only at the RLS level too; asking as an advisor
  // simply returns nothing rather than erroring.
  const [members, invites] = await Promise.all([
    listMembers(supabase, org.org.id),
    canAdmin ? listInvites(supabase, org.org.id) : Promise.resolve([]),
  ]);

  return NextResponse.json({
    organization: org.org,
    you: { userId: user.id, role: org.org.role, canAdmin },
    members,
    invites,
  }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await resolveOrg(supabase, request);
  if (!org.ok) {
    return NextResponse.json({ error: org.error, code: org.code }, { status: org.status });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = inviteInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid invitation", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 });
  }

  const { data, error } = await supabase.rpc("create_invite", {
    p_org: org.org.id,
    p_email: parsed.data.email,
    p_role: parsed.data.role,
    p_ttl_days: parsed.data.ttlDays ?? 14,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: rpcStatus(error.message) });
  }

  // The RPC returns a single row: (invite_id, token, expires_at).
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.token) {
    return NextResponse.json({ error: "The invitation could not be created." }, { status: 500 });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
  const link = `${base.replace(/\/$/, "")}/accept?token=${encodeURIComponent(row.token)}`;

  const audit = await recordEvent(supabase, user.id, {
    action: "member.invited", source: "web",
    // The EMAIL is fine to record; the token is not, and is never logged.
    summary: `Invited ${parsed.data.email} as ${parsed.data.role}`,
    refType: "org_invite", refId: String(row.invite_id),
    orgId: org.org.id,
  });

  return NextResponse.json({
    invite: { id: row.invite_id, email: parsed.data.email, role: parsed.data.role, expiresAt: row.expires_at },
    // Returned ONCE. Only the hash is stored, so this cannot be recovered
    // later — a lost link means sending a fresh invitation.
    link,
    // An audit gap on a membership change is exactly the gap a compliance
    // review asks about. Surface it rather than returning a clean 201.
    ...(audit.ok ? {} : { auditWarning: audit.warning }),
  }, { status: 201, headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await resolveOrg(supabase, request);
  if (!org.ok) return NextResponse.json({ error: org.error, code: org.code }, { status: org.status });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = patchInput.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid change", fieldErrors: parsed.error.flatten().fieldErrors },
      { status: 400 });
  }

  const { error } = await supabase.rpc("set_member_role", {
    p_org: org.org.id, p_user: parsed.data.userId, p_role: parsed.data.role,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: rpcStatus(error.message) });

  const audit = await recordEvent(supabase, user.id, {
    action: "member.role_changed", source: "web",
    summary: `Changed a member's role to ${parsed.data.role}`,
    refType: "org_member", refId: parsed.data.userId,
    orgId: org.org.id,
  });

  return NextResponse.json({ ok: true, ...(audit.ok ? {} : { auditWarning: audit.warning }) });
}

export async function DELETE(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await resolveOrg(supabase, request);
  if (!org.ok) return NextResponse.json({ error: org.error, code: org.code }, { status: org.status });

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  const inviteId = url.searchParams.get("inviteId");

  if (inviteId) {
    const { error } = await supabase.rpc("revoke_invite", { p_invite: inviteId });
    if (error) return NextResponse.json({ error: error.message }, { status: rpcStatus(error.message) });
    return NextResponse.json({ ok: true });
  }

  if (!userId) {
    return NextResponse.json({ error: "Give either userId or inviteId" }, { status: 400 });
  }

  const { error } = await supabase.rpc("remove_member", { p_org: org.org.id, p_user: userId });
  if (error) return NextResponse.json({ error: error.message }, { status: rpcStatus(error.message) });

  const audit = await recordEvent(supabase, user.id, {
    action: "member.removed", source: "web",
    // Worth spelling out in the trail: 010 made this survivable — the
    // firm's orders, feeds and audit history no longer die with the person.
    summary: "Removed a member from the organisation",
    refType: "org_member", refId: userId,
    orgId: org.org.id,
  });

  return NextResponse.json({ ok: true, ...(audit.ok ? {} : { auditWarning: audit.warning }) });
}

// ─────────────────────────────────────────────────────────────────
// POST /api/team/accept — redeem an invitation token.
//
// The invitee is not a member of anything yet: they cannot see
// `org_invites` (admin-only RLS) and cannot write `org_members` (no
// grant). So the whole operation is `accept_invite`, a SECURITY DEFINER
// function, and this route is a thin shell around it.
//
// The check that matters lives in that function: the invitation is bound
// to an EMAIL, and redeeming it requires being signed in as that address.
// Invitation mail gets forwarded — to a personal account, to an assistant
// — and without that binding, whoever opens the message gets a seat
// inside a firm holding its clients' entire financial position.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { recordEvent } from "@/lib/audit/record";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Not an error the invitee can act on without context, so say what to do.
    return NextResponse.json({
      error: "Sign in with the address this invitation was sent to, then open the link again.",
      code: "sign_in_required",
    }, { status: 401 });
  }

  let token = "";
  try {
    const body = await request.json();
    token = typeof body?.token === "string" ? body.token.trim() : "";
  } catch { /* handled below */ }

  if (!token) return NextResponse.json({ error: "No invitation token." }, { status: 400 });

  const { data, error } = await supabase.rpc("accept_invite", { p_token: token });

  if (error) {
    // A wrong-account message names both addresses and is genuinely
    // useful; every other failure is deliberately one indistinguishable
    // message so this endpoint is not an oracle for probing tokens.
    const wrongAccount = /signed in as/i.test(error.message);
    return NextResponse.json({
      error: error.message,
      code: wrongAccount ? "wrong_account" : "invalid_invite",
    }, { status: 403 });
  }

  const orgId = String(data);
  const { data: org } = await supabase
    .from("organizations").select("name").eq("id", orgId).maybeSingle();

  const audit = await recordEvent(supabase, user.id, {
    action: "member.joined", source: "web",
    summary: `Joined ${org?.name ?? "the organisation"}`,
    orgId,
  });

  return NextResponse.json({
    ok: true,
    organization: { id: orgId, name: org?.name ?? null },
    ...(audit.ok ? {} : { auditWarning: audit.warning }),
  }, { headers: { "Cache-Control": "no-store" } });
}

// ─────────────────────────────────────────────────────────────────
// POST   /api/households/<id>/advisors — put an advisor on this client
// DELETE /api/households/<id>/advisors?userId=… — take them off
//
// `set_advisor` has existed and been tested since migration 009 with no
// caller at all, which meant an owner could not actually give a colleague
// a client through the product. This is that caller.
//
// Owner/admin only, enforced inside the function: any INSERT policy on
// `household_advisors` wide enough to let an advisor claim their own new
// client is also wide enough to let them claim someone else's, which
// erases the point of the advisor role. The function also refuses a
// target outside the organisation — otherwise an admin could hand a
// client's book to any user id they can guess.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { listHouseholds } from "@/lib/tenancy/context";
import { recordEvent } from "@/lib/audit/record";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface Ctx { params: Promise<{ id: string }> }

const input = z.object({ userId: z.string().uuid() });

function rpcStatus(message: string): number {
  if (/not found|not authenticated/i.test(message)) return 404;
  if (/not a member of this organisation/i.test(message)) return 400;
  return 500;
}

/** The household must be one the caller can already see, or this 404s. */
async function scope(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) } as const;

  const visible = await listHouseholds(supabase);
  const household = visible.find((h) => h.id === id);
  // 404 rather than 403 — do not confirm a household in another firm exists.
  if (!household) {
    return { error: NextResponse.json({ error: "Client not found" }, { status: 404 }) } as const;
  }
  return { supabase, user, household } as const;
}

export async function POST(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const s = await scope(id);
  if ("error" in s) return s.error;

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = input.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Give a userId" }, { status: 400 });
  }

  const { error } = await s.supabase.rpc("set_advisor", {
    p_household: id, p_user: parsed.data.userId, p_assign: true,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: rpcStatus(error.message) });

  await recordEvent(s.supabase, s.user.id, {
    action: "advisor.assigned", source: "web",
    summary: `Assigned an advisor to ${s.household.name}`,
    refType: "org_member", refId: parsed.data.userId,
    householdId: id, orgId: s.household.orgId,
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const s = await scope(id);
  if ("error" in s) return s.error;

  const userId = new URL(request.url).searchParams.get("userId") ?? "";
  if (!z.string().uuid().safeParse(userId).success) {
    return NextResponse.json({ error: "Give a userId" }, { status: 400 });
  }

  const { error } = await s.supabase.rpc("set_advisor", {
    p_household: id, p_user: userId, p_assign: false,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: rpcStatus(error.message) });

  await recordEvent(s.supabase, s.user.id, {
    action: "advisor.unassigned", source: "web",
    summary: `Removed an advisor from ${s.household.name}`,
    refType: "org_member", refId: userId,
    householdId: id, orgId: s.household.orgId,
  });

  return NextResponse.json({ ok: true });
}

// ─────────────────────────────────────────────────────────────────
// The firm: its roster, its seats, and who the caller is inside it.
//
// Everything here reads. Every WRITE goes through a SECURITY DEFINER
// function in migration 011, because org_members has no client INSERT
// path by design — any policy wide enough to let someone add themselves
// to an organisation is a self-promotion-to-owner primitive.
// ─────────────────────────────────────────────────────────────────

import type { SupabaseClient } from "@supabase/supabase-js";

export type OrgRole = "owner" | "admin" | "compliance" | "advisor";

export const ROLE_LABEL: Record<OrgRole, string> = {
  owner: "Owner",
  admin: "Administrator",
  compliance: "Compliance",
  advisor: "Advisor",
};

export const ROLE_DESCRIPTION: Record<OrgRole, string> = {
  owner: "Everything, including billing, seats and other owners.",
  admin: "Manage people and every client in the firm. Not billing.",
  compliance: "Read every client in the firm and their full audit trail. Cannot change a plan or send an order.",
  advisor: "Only the clients they are assigned to.",
};

/** Roles that may administer membership. Mirrors auth_admin_org_ids(). */
export const ADMIN_ROLES: OrgRole[] = ["owner", "admin"];

export interface OrgRef {
  id: string;
  name: string;
  kind: string;
  role: OrgRole;
  seats: number;
  seatsUsed: number;
  isPaid: boolean;
}

/**
 * The organisations the caller belongs to, with THEIR role in each.
 *
 * The `user_id` filter is load-bearing, not defensive. `org_members_self_select`
 * (006) is org-WIDE on purpose — listMembers needs to read the whole roster —
 * so without it this returns one row per MEMBER, and a two-person firm looks
 * like two organisations. `resolveOrg` then falls past its `length === 1`
 * shortcut and 400s "which organisation?" on every team call, with no picker
 * in the UI to answer it.
 */
export async function listOrgs(
  supabase: SupabaseClient,
  userId?: string,
): Promise<OrgRef[]> {
  const uid = userId ?? (await supabase.auth.getUser()).data.user?.id;
  if (!uid) return [];

  const { data: memberships } = await supabase
    .from("org_members").select("org_id, role").eq("user_id", uid);
  if (!memberships?.length) return [];

  const { data: orgs } = await supabase
    .from("organizations").select("id, name, kind, seats, is_paid");

  const byId = new Map((orgs ?? []).map((o) => [String(o.id), o]));
  const out: OrgRef[] = [];

  for (const m of memberships) {
    const o = byId.get(String(m.org_id));
    if (!o) continue;
    // org_seats_used() counts members plus LIVE invitations — a pending
    // invite holds a seat, or a 3-seat firm invites five people and the
    // overage surfaces at renewal instead of at the moment it happens.
    // Returns null for a non-member (012 added the membership check), which
    // cannot happen here — but falling back to the member count keeps a
    // null from rendering as "0 of 5 seats" on a firm that has people in it.
    const { data: used } = await supabase.rpc("org_seats_used", { p_org: o.id });
    out.push({
      id: String(o.id),
      name: String(o.name),
      kind: String(o.kind),
      role: String(m.role) as OrgRole,
      seats: Number(o.seats ?? 1),
      seatsUsed: used == null ? memberships.length : Number(used),
      isPaid: !!o.is_paid,
    });
  }
  return out;
}

/**
 * The single organisation an admin request is about.
 *
 * Same shape of decision as household resolution: with one candidate, use
 * it; with several, ask. Unlike households there is no cookie — team
 * administration is rare enough that an explicit `?org=` is fine.
 */
export async function resolveOrg(
  supabase: SupabaseClient,
  request: Request,
): Promise<
  | { ok: true; org: OrgRef }
  | { ok: false; status: number; error: string; code: string; organizations?: OrgRef[] }
> {
  const explicit = new URL(request.url).searchParams.get("org") ?? "";
  const all = await listOrgs(supabase);

  if (explicit) {
    const hit = all.find((o) => o.id === explicit);
    // 404 rather than 403: confirming another firm exists is a leak.
    if (!hit) return { ok: false, status: 404, code: "no_org", error: "Organisation not found" };
    return { ok: true, org: hit };
  }
  if (all.length === 1) return { ok: true, org: all[0] };
  if (all.length === 0) {
    return { ok: false, status: 409, code: "no_org", error: "This account is not in any organisation." };
  }
  return {
    ok: false, status: 400, code: "org_required",
    error: `You belong to ${all.length} organisations — say which one (?org=<id>).`,
    organizations: all,
  };
}

export interface MemberRow {
  userId: string;
  role: OrgRole;
  displayName: string | null;
  joinedAt: string;
  /** Households this member is explicitly assigned to (advisors only). */
  households: string[];
}

/**
 * The roster. Note it reads `profiles`, not `auth.users`: a client-side
 * Supabase client cannot see the auth schema, and it should not — the
 * display name is all the UI needs.
 */
export async function listMembers(
  supabase: SupabaseClient,
  orgId: string,
): Promise<MemberRow[]> {
  const { data: members } = await supabase
    .from("org_members").select("user_id, role, created_at").eq("org_id", orgId);
  if (!members?.length) return [];

  const ids = members.map((m) => String(m.user_id));
  const { data: profiles } = await supabase
    .from("profiles").select("id, display_name").in("id", ids);
  const nameOf = new Map((profiles ?? []).map((p) => [String(p.id), p.display_name as string | null]));

  const { data: assignments } = await supabase
    .from("household_advisors").select("user_id, household_id").eq("org_id", orgId);
  const assignedTo = new Map<string, string[]>();
  for (const a of assignments ?? []) {
    const k = String(a.user_id);
    assignedTo.set(k, [...(assignedTo.get(k) ?? []), String(a.household_id)]);
  }

  return members.map((m) => ({
    userId: String(m.user_id),
    role: String(m.role) as OrgRole,
    displayName: nameOf.get(String(m.user_id)) ?? null,
    joinedAt: String(m.created_at),
    households: assignedTo.get(String(m.user_id)) ?? [],
  }));
}

export interface InviteRow {
  id: string;
  email: string;
  role: OrgRole;
  expiresAt: string;
  createdAt: string;
  state: "pending" | "accepted" | "revoked" | "expired";
}

export async function listInvites(
  supabase: SupabaseClient,
  orgId: string,
): Promise<InviteRow[]> {
  const { data } = await supabase
    .from("org_invites")
    .select("id, email, role, expires_at, created_at, accepted_at, revoked_at")
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .limit(100);

  const now = Date.now();
  return (data ?? []).map((r) => ({
    id: String(r.id),
    email: String(r.email),
    role: String(r.role) as OrgRole,
    expiresAt: String(r.expires_at),
    createdAt: String(r.created_at),
    // token_hash is deliberately NOT selected. It is the only secret on
    // this row and no route has a reason to read it back.
    state: r.accepted_at ? "accepted"
      : r.revoked_at ? "revoked"
      : new Date(String(r.expires_at)).getTime() <= now ? "expired"
      : "pending",
  }));
}

// ─────────────────────────────────────────────────────────────────
// Reading and writing a household's plan, as versions.
//
// This replaces the single `profiles.plan` column, and the change is a
// bug fix as much as a structural one. The old PUT was a
// read-modify-write: SELECT the old plan, UPSERT the new one, then diff.
// Two tabs — or a feed-apply racing a manual save — silently lost one
// save AND wrote an audit entry describing a change that never happened,
// which corrupts the one record compliance relies on.
//
// Here every save INSERTs `version + 1` against
// `unique (household_id, version)`. Two concurrent saves both compute the
// same next version, one wins, and the loser gets a conflict it can
// surface instead of a silent overwrite.
// ─────────────────────────────────────────────────────────────────

import type { SupabaseClient } from "@supabase/supabase-js";
import { parsePlan } from "@/lib/plan/schema";
import type { WealthPlan } from "@/lib/engine/types";

export interface PlanVersion {
  version: number;
  plan: WealthPlan;
  createdAt: string;
  createdBy: string | null;
}

/** Postgres unique_violation — a concurrent save took this version. */
export const PG_UNIQUE_VIOLATION = "23505";

/**
 * The current plan for a household, or null when none has been saved.
 * Returns `invalid` rather than throwing when stored JSONB no longer
 * satisfies the schema, so the UI can show a recoverable error instead of
 * being handed a broken plan.
 */
export async function currentPlan(
  supabase: SupabaseClient,
  householdId: string,
): Promise<
  | { state: "none" }
  | { state: "ok"; version: PlanVersion }
  | { state: "invalid"; version: number; fieldErrors: Record<string, string> }
> {
  const { data } = await supabase
    .from("plans")
    .select("version, plan, created_at, created_by")
    .eq("household_id", householdId)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return { state: "none" };

  const parsed = parsePlan(data.plan);
  if (!parsed.ok) {
    return { state: "invalid", version: Number(data.version), fieldErrors: parsed.fieldErrors };
  }
  return {
    state: "ok",
    version: {
      version: Number(data.version),
      plan: parsed.plan,
      createdAt: String(data.created_at),
      createdBy: (data.created_by as string | null) ?? null,
    },
  };
}

export type SaveResult =
  | { ok: true; version: number }
  | { ok: false; conflict: true; currentVersion: number }
  | { ok: false; conflict: false; error: string };

/**
 * Append a new plan version.
 *
 * `baseVersion` is the version the client edited. When supplied it is
 * checked, so an edit against a stale copy is refused before it is
 * written. When omitted the insert still races on the unique index, so a
 * concurrent save is caught either way — the explicit form just produces a
 * better message.
 */
export async function savePlanVersion(
  supabase: SupabaseClient,
  args: {
    householdId: string;
    orgId: string;
    userId: string;
    plan: WealthPlan;
    baseVersion?: number | null;
  },
): Promise<SaveResult> {
  const cur = await currentPlan(supabase, args.householdId);
  const latest = cur.state === "none" ? 0
    : cur.state === "ok" ? cur.version.version
    : cur.version;

  if (args.baseVersion != null && args.baseVersion !== latest) {
    return { ok: false, conflict: true, currentVersion: latest };
  }

  const { error } = await supabase.from("plans").insert({
    household_id: args.householdId,
    org_id: args.orgId,
    version: latest + 1,
    plan: args.plan,
    created_by: args.userId,
  });

  if (error) {
    if (error.code === PG_UNIQUE_VIOLATION) {
      // Someone else wrote latest+1 between our read and our insert. This is
      // the race the old upsert lost silently.
      const now = await currentPlan(supabase, args.householdId);
      const v = now.state === "none" ? latest : now.state === "ok" ? now.version.version : now.version;
      return { ok: false, conflict: true, currentVersion: v };
    }
    return { ok: false, conflict: false, error: error.message };
  }
  return { ok: true, version: latest + 1 };
}

// ─────────────────────────────────────────────────────────────────
// GET /api/plan  — the current plan for a household
// PUT /api/plan  — append a new version
//
// Both take an optional `?household=<uuid>` (or `x-household-id`). An
// advisor with one client can omit it; one with several must say which,
// because defaulting would silently edit the wrong client's plan. That
// is the same rule 008's `resolve_default_household()` applies inside
// the database, so the two layers never disagree.
//
// The plan now lives in `plans` as versions, not in `profiles.plan`.
// That is a bug fix as much as a structural change: the old PUT was a
// read-modify-write, so two tabs silently lost one save AND wrote an
// audit entry describing a change that never happened.
//
// Both directions still run through wealthPlanSchema — the column is
// untyped JSONB, so a hand-edited row or a malformed payload can
// otherwise reach the UI or Postgres unchecked.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parsePlan } from "@/lib/plan/schema";
import { recordEvent } from "@/lib/audit/record";
import { diffPlans, planHash } from "@/lib/audit/diff";
import type { AuditSource } from "@/lib/audit/types";
import { resolveHousehold } from "@/lib/tenancy/context";
import { currentPlan, savePlanVersion } from "@/lib/tenancy/plans";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hh = await resolveHousehold(supabase, request);
  if (!hh.ok) {
    return NextResponse.json(
      { error: hh.error, code: hh.code, households: hh.households },
      { status: hh.status },
    );
  }

  const cur = await currentPlan(supabase, hh.household.id);

  if (cur.state === "none") {
    return NextResponse.json({
      plan: null,
      version: 0,
      household: hh.household,
    });
  }
  if (cur.state === "invalid") {
    // A distinct "corrupted" state, so the UI shows a recoverable error
    // rather than being handed broken JSONB.
    return NextResponse.json({
      plan: null,
      invalid: true,
      version: cur.version,
      fieldErrors: cur.fieldErrors,
      household: hh.household,
    });
  }

  return NextResponse.json({
    plan: cur.version.plan,
    version: cur.version.version,
    updated_at: cur.version.createdAt,
    household: hh.household,
  });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hh = await resolveHousehold(supabase, request);
  if (!hh.ok) {
    return NextResponse.json(
      { error: hh.error, code: hh.code, households: hh.households },
      { status: hh.status },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // The version the client edited may ride in an envelope or as a header.
  // A bare plan (no envelope) is still accepted, so an older client keeps
  // working — it just gets last-write-wins instead of a 409.
  const env = (body && typeof body === "object" ? body : {}) as Record<
    string,
    unknown
  >;
  const hasEnvelope = "plan" in env;
  const rawBase = hasEnvelope
    ? env.baseVersion
    : request.headers.get("x-base-version");
  const baseVersion =
    rawBase === undefined || rawBase === null || rawBase === ""
      ? null
      : Number(rawBase);
  if (baseVersion !== null && !Number.isInteger(baseVersion)) {
    return NextResponse.json(
      { error: "baseVersion must be an integer" },
      { status: 400 },
    );
  }

  const parsed = parsePlan(hasEnvelope ? env.plan : body);
  // if (!parsed.ok) {
  //   return NextResponse.json({ error: "Invalid plan", fieldErrors: parsed.fieldErrors }, { status: 400 });
  // }
  if (!parsed.ok) {
    console.error("PLAN VALIDATION FAILED:", parsed.fieldErrors);

    console.dir(parsed.fieldErrors, {
      depth: null,
    });

    return NextResponse.json(
      {
        error: "Invalid plan",
        fieldErrors: parsed.fieldErrors,
      },
      { status: 400 },
    );
  }

  // The previous version, for the audit diff. Unlike the old route this
  // reads immutable history rather than the row about to be overwritten,
  // so the diff always describes something that actually happened.
  const before = await currentPlan(supabase, hh.household.id);
  const beforePlan = before.state === "ok" ? before.version.plan : null;

  const saved = await savePlanVersion(supabase, {
    householdId: hh.household.id,
    orgId: hh.household.orgId,
    userId: user.id,
    plan: parsed.plan,
    baseVersion,
  });

  if (!saved.ok) {
    if (saved.conflict) {
      return NextResponse.json(
        {
          error:
            "This plan was changed by someone else while you were editing it. " +
            "Reload to see the current version before saving again.",
          code: "version_conflict",
          currentVersion: saved.currentVersion,
        },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: saved.error }, { status: 500 });
  }

  // The save has already succeeded. An audit failure must not undo it, but
  // it must not be hidden either, so the warning rides back on the response.
  const diff = diffPlans(beforePlan, parsed.plan);
  const src = (new URL(request.url).searchParams.get("source") ||
    "web") as AuditSource;
  const audit = await recordEvent(supabase, user.id, {
    action: "plan.updated",
    source: ["web", "feed", "import", "api"].includes(src) ? src : "web",
    summary: diff.summary,
    changes: diff.changes,
    netWorthBefore: beforePlan ? diff.netWorthBefore : null,
    netWorthAfter: diff.netWorthAfter,
    currency: diff.currency,
    hashBefore: beforePlan ? planHash(beforePlan) : null,
    hashAfter: planHash(parsed.plan),
    detail: diff.truncated
      ? `${diff.truncated} further change(s) not itemised`
      : null,
    householdId: hh.household.id,
    orgId: hh.household.orgId,
  });

  return NextResponse.json({
    ok: true,
    version: saved.version,
    household: hh.household,
    ...(audit.ok ? {} : { auditWarning: audit.warning }),
  });
}

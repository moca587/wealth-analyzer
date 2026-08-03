// ─────────────────────────────────────────────────────────────────
// API route: GET /api/plan   — read current user's plan
//            PUT /api/plan   — replace it with the JSON body
// RLS on the profiles table means a user can only see/write their
// own row even if they bypassed this endpoint.
//
// Both directions run through wealthPlanSchema — the DB column is
// untyped JSONB, so a hand-edited row, a stale schema version, or a
// malformed client payload can otherwise reach the UI or Postgres
// unchecked.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { parsePlan } from "@/lib/plan/schema";
import { recordEvent } from "@/lib/audit/record";
import { diffPlans, planHash } from "@/lib/audit/diff";
import type { AuditSource } from "@/lib/audit/types";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data, error } = await supabase
    .from("profiles")
    .select("plan, updated_at")
    .eq("id", user.id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // No plan saved yet (fresh signup row) — not an error, just empty.
  if (!data.plan || typeof data.plan !== "object" || Object.keys(data.plan).length === 0) {
    return NextResponse.json({ plan: null, updated_at: data.updated_at });
  }

  const parsed = parsePlan(data.plan);
  if (!parsed.ok) {
    // Surface a distinct "corrupted" state so the UI can show a recoverable
    // error instead of silently handing broken JSONB to the form.
    return NextResponse.json(
      { plan: null, invalid: true, fieldErrors: parsed.fieldErrors, updated_at: data.updated_at },
      { status: 200 }
    );
  }

  return NextResponse.json({ plan: parsed.plan, updated_at: data.updated_at });
}

export async function PUT(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const parsed = parsePlan(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: "Invalid plan", fieldErrors: parsed.fieldErrors }, { status: 400 });
  }

  // Read the CURRENT plan before overwriting it. profiles.plan is a single
  // JSONB column with no history, so this is the only moment the previous
  // state exists — after the upsert it is gone for good.
  const { data: existing } = await supabase
    .from("profiles").select("plan").eq("id", user.id).maybeSingle();
  const beforeRaw = existing?.plan && typeof existing.plan === "object" && Object.keys(existing.plan).length
    ? existing.plan : null;
  const beforeParsed = beforeRaw ? parsePlan(beforeRaw) : null;
  const beforePlan = beforeParsed?.ok ? beforeParsed.plan : null;

  // upsert (not update): a user whose signup trigger never ran, or whose row
  // was deleted, would otherwise silently match zero rows and lose the save.
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: user.id, plan: parsed.plan }, { onConflict: "id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // The save has already succeeded. An audit failure must not undo it — but
  // it must not be hidden either, so the warning rides back on the response.
  const diff = diffPlans(beforePlan, parsed.plan);
  const url = new URL(request.url);
  const src = (url.searchParams.get("source") || "web") as AuditSource;
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
    detail: diff.truncated ? `${diff.truncated} further change(s) not itemised` : null,
  });

  return NextResponse.json({ ok: true, ...(audit.ok ? {} : { auditWarning: audit.warning }) });
}

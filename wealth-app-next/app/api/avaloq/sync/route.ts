// ─────────────────────────────────────────────────────────────────
// POST /api/avaloq/sync
//
// Pulls the authenticated user's household balance sheet from Avaloq,
// maps it into the WealthPlan model, merges it onto their existing plan
// (preserving user-entered goals/expenses/children), and persists the
// result to Supabase `profiles.plan`.
//
// Body: { "partnerIds": ["<avaloq-partner-id>", ...] }  (1 or 2)
//
// Responses:
//   200 { ok, counts, warnings }   — synced & saved
//   400 { error }                  — bad/missing partnerIds
//   401 { error }                  — not signed in
//   501 { error }                  — Avaloq not configured on this deploy
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getAvaloqDataSource } from "@/lib/avaloq";
import type { WealthPlan } from "@/lib/engine/types";

/** A minimal, valid empty plan used when the user has none yet. */
function emptyPlan(nowIso: string): WealthPlan {
  return {
    version: 1,
    currency: "USD",
    inflationRate: 0.03,
    clients: [],
    children: [],
    incomes: [],
    expenses: [],
    assets: [],
    loans: [],
    goals: [],
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

export async function POST(request: Request) {
  const source = getAvaloqDataSource();
  if (!source) {
    return NextResponse.json(
      {
        error:
          "Avaloq integration is not configured on this deployment. " +
          "Set AVALOQ_* env vars to enable it.",
      },
      { status: 501 },
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── parse + validate body ──
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const partnerIds = (body as { partnerIds?: unknown })?.partnerIds;
  if (
    !Array.isArray(partnerIds) ||
    partnerIds.length === 0 ||
    partnerIds.length > 2 ||
    !partnerIds.every((p) => typeof p === "string" && p.length > 0)
  ) {
    return NextResponse.json(
      { error: "Body must be { partnerIds: string[] } with 1 or 2 ids." },
      { status: 400 },
    );
  }

  const nowIso = new Date().toISOString();

  // ── load existing plan (or start from empty) ──
  const { data: row, error: readErr } = await supabase
    .from("profiles")
    .select("plan")
    .eq("id", user.id)
    .single();
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });

  const existing: WealthPlan =
    row?.plan && typeof row.plan === "object" && Object.keys(row.plan).length > 0
      ? (row.plan as WealthPlan)
      : emptyPlan(nowIso);

  // ── pull from Avaloq + merge ──
  let result;
  try {
    result = await source.sync(existing, { partnerIds: partnerIds as string[], nowIso });
  } catch (e) {
    return NextResponse.json(
      { error: `Avaloq sync failed: ${e instanceof Error ? e.message : String(e)}` },
      { status: 502 },
    );
  }

  // ── persist ──
  const { error: writeErr } = await supabase
    .from("profiles")
    .update({ plan: result.plan })
    .eq("id", user.id);
  if (writeErr) return NextResponse.json({ error: writeErr.message }, { status: 500 });

  return NextResponse.json({
    ok: true,
    counts: result.counts,
    warnings: result.warnings,
  });
}

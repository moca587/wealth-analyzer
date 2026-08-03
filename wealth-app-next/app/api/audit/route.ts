// ─────────────────────────────────────────────────────────────────
// GET /api/audit        — the caller's audit trail, newest first
// GET /api/audit?format=csv — the same, as a file a reviewer can keep
//
// Read-only by construction. There is no POST here: events are written by
// the routes that perform the action, so a client cannot fabricate
// history. There is no DELETE either — see 004_audit.sql.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AuditEventRow, AuditFieldChange } from "@/lib/audit/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COLUMNS =
  "id, created_at, action, source, summary, changes, net_worth_before, net_worth_after, " +
  "currency, hash_before, hash_after, detail, ref_type, ref_id";

const MAX_LIMIT = 500;

/** RFC 4180: quote everything, double embedded quotes. */
function csvCell(v: unknown): string {
  const s = v == null ? "" : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

function toCsv(rows: AuditEventRow[]): string {
  const head = [
    "timestamp", "action", "source", "summary",
    "net_worth_before", "net_worth_after", "currency",
    "hash_before", "hash_after", "detail", "ref_type", "ref_id", "changes",
  ];
  const lines = [head.map(csvCell).join(",")];
  for (const r of rows) {
    const changes = (r.changes ?? [])
      .map((c: AuditFieldChange) =>
        `${c.section}/${c.action}: ${c.label}` +
        (c.before !== undefined || c.after !== undefined ? ` (${c.before ?? "—"} → ${c.after ?? "—"})` : ""))
      .join(" | ");
    lines.push([
      r.created_at, r.action, r.source, r.summary,
      r.net_worth_before, r.net_worth_after, r.currency,
      r.hash_before, r.hash_after, r.detail, r.ref_type, r.ref_id, changes,
    ].map(csvCell).join(","));
  }
  // Excel opens a UTF-8 CSV as mojibake without a BOM, and these files carry
  // client names — so the BOM is not cosmetic.
  return "﻿" + lines.join("\r\n") + "\r\n";
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const since = url.searchParams.get("since");
  const until = url.searchParams.get("until");
  const format = url.searchParams.get("format");
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number(url.searchParams.get("limit")) || 100));

  let q = supabase
    .from("audit_events")
    .select(COLUMNS)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(format === "csv" ? MAX_LIMIT : limit);

  if (action) q = q.eq("action", action);
  if (since) q = q.gte("created_at", since);
  if (until) q = q.lte("created_at", until);

  const { data, error } = await q;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const rows = (data ?? []) as unknown as AuditEventRow[];

  if (format === "csv") {
    const stamp = new Date().toISOString().slice(0, 10);
    return new NextResponse(toCsv(rows), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="audit-trail-${stamp}.csv"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json({ events: rows, count: rows.length, limit }, {
    headers: { "Cache-Control": "no-store" },
  });
}

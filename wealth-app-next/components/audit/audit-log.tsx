"use client";

// ─────────────────────────────────────────────────────────────────
// The audit trail viewer.
//
// Built for the question a reviewer actually arrives with: "what happened
// to this client, and when did the numbers move". So the default view is
// chronological with the net-worth change on the row, and the per-event
// detail expands rather than living on another screen.
//
// Read-only by construction — there is no edit or delete affordance here
// because there is no endpoint behind one.
// ─────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import type { AuditEventRow, AuditFieldChange } from "@/lib/audit/types";

const ACTION_LABEL: Record<string, string> = {
  "plan.updated": "Plan updated",
  "feed.run": "Feed fetched",
  "feed.applied": "Feed applied to plan",
  "order.staged": "Order staged",
  "order.rejected": "Order rejected",
  "order.unknown": "Order outcome unconfirmed",
  "order.duplicate_blocked": "Duplicate order blocked",
  "report.exported": "Report exported",
};

const ACTION_STYLE: Record<string, string> = {
  "plan.updated": "bg-sky-500/10 text-sky-600",
  "feed.run": "bg-muted text-muted-foreground",
  "feed.applied": "bg-sky-500/10 text-sky-600",
  "order.staged": "bg-emerald-500/10 text-emerald-600",
  "order.rejected": "bg-red-500/10 text-red-600",
  "order.unknown": "bg-amber-500/10 text-amber-700",
  "order.duplicate_blocked": "bg-amber-500/10 text-amber-700",
  "report.exported": "bg-muted text-muted-foreground",
};

const CHANGE_STYLE: Record<string, string> = {
  added: "text-emerald-600",
  removed: "text-red-600",
  changed: "text-sky-600",
};

async function readJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text().catch(() => "");
  if (!text) return res.ok ? {} : { error: `Server returned an empty response (HTTP ${res.status})` };
  try { return JSON.parse(text) as Record<string, unknown>; }
  catch { return { error: `Server returned an unexpected response (HTTP ${res.status} ${res.statusText})`.trim() }; }
}

const money = (v: number | string | null, ccy: string | null) => {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  return `${ccy ? ccy + " " : ""}${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export function AuditLog() {
  const [events, setEvents] = useState<AuditEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [action, setAction] = useState("");
  // A Set, not a single id: a reviewer comparing two entries needs both open,
  // and an accordion silently closes the one they were reading.
  const [open, setOpen] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams({ limit: "200" });
      if (action) qs.set("action", action);
      const res = await fetch(`/api/audit?${qs}`, { cache: "no-store" });
      const json = await readJson(res);
      if (!res.ok) { setError(String(json.error ?? `HTTP ${res.status}`)); setEvents([]); }
      else { setError(""); setEvents((json.events as AuditEventRow[]) ?? []); setOpen(new Set()); }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load the audit trail");
    } finally {
      setLoading(false);
    }
  }, [action]);

  useEffect(() => { void load(); }, [load]);

  const exportCsv = () => {
    const qs = new URLSearchParams({ format: "csv" });
    if (action) qs.set("action", action);
    window.location.href = `/api/audit?${qs}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="audit-action" className="mb-1 block text-xs font-medium text-muted-foreground">
            Filter
          </label>
          <Select id="audit-action" value={action} onChange={(e) => setAction(e.target.value)}>
            <option value="">All activity</option>
            {Object.entries(ACTION_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </Select>
        </div>
        <Button variant="outline" onClick={exportCsv} disabled={!events.length}>
          Export CSV
        </Button>
        <Button variant="outline" onClick={() => void load()}>Refresh</Button>
        <span className="ml-auto text-xs text-muted-foreground">
          {loading ? "Loading…" : `${events.length} event${events.length === 1 ? "" : "s"}`}
        </span>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && !events.length && (
        <Card><CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">
            Nothing recorded yet. Saving a plan, running a feed or sending an order all appear here.
          </p>
        </CardContent></Card>
      )}

      <div className="space-y-2">
        {events.map((e) => {
          const before = money(e.net_worth_before, e.currency);
          const after = money(e.net_worth_after, e.currency);
          const moved = before && after && before !== after;
          const expanded = open.has(e.id);
          const changes = (e.changes ?? []) as AuditFieldChange[];
          return (
            <Card key={e.id}>
              <CardContent className="pt-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={"rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider " +
                        (ACTION_STYLE[e.action] ?? "bg-muted text-muted-foreground")}>
                        {ACTION_LABEL[e.action] ?? e.action}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(e.created_at).toLocaleString()}
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        via {e.source}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm">{e.summary}</p>
                    {moved && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        Net worth <span className="font-mono">{before}</span> → <span className="font-mono">{after}</span>
                      </p>
                    )}
                  </div>
                  {(changes.length > 0 || e.detail || e.hash_after) && (
                    <Button size="sm" variant="outline" onClick={() => setOpen((o) => {
                      const n = new Set(o);
                      if (n.has(e.id)) n.delete(e.id); else n.add(e.id);
                      return n;
                    })}>
                      {expanded ? "Hide" : "Detail"}
                    </Button>
                  )}
                </div>

                {expanded && (
                  <div className="mt-3 space-y-2 border-t border-border pt-3">
                    {e.detail && <p className="text-xs text-muted-foreground">{e.detail}</p>}
                    {changes.length > 0 && (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[520px] text-xs">
                          <thead>
                            <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                              <th className="py-1 pr-3">Section</th>
                              <th className="py-1 pr-3">Change</th>
                              <th className="py-1 pr-3">Item</th>
                              <th className="py-1 pr-3">Before</th>
                              <th className="py-1">After</th>
                            </tr>
                          </thead>
                          <tbody>
                            {changes.map((c, i) => (
                              <tr key={i} className="border-t border-border">
                                <td className="py-1 pr-3 text-muted-foreground">{c.section}</td>
                                <td className={"py-1 pr-3 font-medium " + (CHANGE_STYLE[c.action] ?? "")}>{c.action}</td>
                                <td className="py-1 pr-3">{c.label}</td>
                                <td className="py-1 pr-3 font-mono text-muted-foreground">{c.before ?? "—"}</td>
                                <td className="py-1 font-mono">{c.after ?? "—"}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                    {(e.hash_before || e.hash_after) && (
                      <p className="text-[11px] text-muted-foreground">
                        Plan fingerprint{" "}
                        <span className="font-mono">{e.hash_before ?? "—"}</span> →{" "}
                        <span className="font-mono">{e.hash_after ?? "—"}</span>
                        {e.ref_id && <> · ref <span className="font-mono">{e.ref_id}</span></>}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

"use client";

// ─────────────────────────────────────────────────────────────────
// Feed connection manager — the UI over /api/feeds.
//
// Deliberately never holds a credential in component state after it is
// submitted: the secret input is cleared on save, and the API only ever
// tells us whether a secret EXISTS (hasSecret), never what it is. So a
// React DevTools inspection or an error boundary serializing props
// cannot leak a custodian token.
// ─────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { FeedConnectionPublic } from "@/lib/feeds/schema";
import { FEED_BUCKETS, type FeedEnvelope } from "@/lib/feeds/model";
import { diffPlan, applyChanges, summarize, type PlanChange } from "@/lib/feeds/apply";
import { parsePlan } from "@/lib/plan/schema";
import type { WealthPlan } from "@/lib/engine/types";

const KIND_LABEL: Record<string, string> = { custodian: "Custodian", crm: "CRM" };
const FORMAT_LABEL: Record<string, string> = {
  auto: "Auto-detect",
  wa: "wa.feed/v1 JSON (native)",
  crm: "CRM contact JSON",
  camt: "ISO 20022 camt.052/053/054",
  ofx: "OFX / QFX",
  csv: "CSV",
};
const AUTH_LABEL: Record<string, string> = {
  none: "None / public",
  bearer: "Bearer token",
  apikey: "API key header",
  basic: "Basic (user:password)",
};

interface FormState {
  name: string; url: string; kind: string; format: string;
  auth: string; header: string; secret: string; defaultCountry: string;
}
const BLANK: FormState = {
  name: "", url: "", kind: "custodian", format: "auto",
  auth: "none", header: "X-API-Key", secret: "", defaultCountry: "CH",
};

type RunState =
  | { status: "idle" }
  | { status: "running"; id: string }
  | { status: "ok"; id: string; envelope: FeedEnvelope }
  | { status: "error"; id: string; message: string };

/**
 * Read a response body that is *supposed* to be JSON without assuming it is.
 * Gateways, proxies and framework error pages answer with HTML, and a raw
 * res.json() there throws `Unexpected token '<'` — a meaningless message to
 * show an advisor. Fall back to reporting the actual HTTP status.
 */
async function readJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text().catch(() => "");
  if (!text) return res.ok ? {} : { error: `Server returned an empty response (HTTP ${res.status})` };
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { error: `Server returned an unexpected response (HTTP ${res.status} ${res.statusText})`.trim() };
  }
}

export function FeedsManager() {
  const [connections, setConnections] = useState<FeedConnectionPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [form, setForm] = useState<FormState>(BLANK);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [run, setRun] = useState<RunState>({ status: "idle" });
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch("/api/feeds");
      const body = await readJson(res);
      if (!res.ok) throw new Error(String(body.error || `Failed to load (HTTP ${res.status})`));
      setConnections((body.connections as FeedConnectionPublic[]) ?? []);
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load connections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const set = (patch: Partial<FormState>) => {
    setForm((f) => ({ ...f, ...patch }));
    setFormError(null);
    setFieldErrors({});
  };

  const resetForm = () => { setForm(BLANK); setEditingId(null); setFormError(null); setFieldErrors({}); };

  function startEdit(c: FeedConnectionPublic) {
    // secret intentionally blank — the server never returns it. Leaving the
    // field empty on save keeps the stored credential untouched.
    setForm({
      name: c.name, url: c.url, kind: c.kind, format: c.format,
      auth: c.auth, header: c.header || "X-API-Key", secret: "",
      defaultCountry: c.defaultCountry || "CH",
    });
    setEditingId(c.id);
    setFormError(null);
    setFieldErrors({});
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save() {
    setSaving(true);
    setFormError(null);
    setFieldErrors({});
    try {
      const payload: Record<string, unknown> = {
        name: form.name, url: form.url, kind: form.kind, format: form.format,
        auth: form.auth, header: form.header, defaultCountry: form.defaultCountry,
      };
      // On edit, an empty secret means "leave it alone" rather than "clear it".
      if (form.secret) payload.secret = form.secret;
      else if (!editingId) payload.secret = "";

      const res = await fetch(editingId ? `/api/feeds/${editingId}` : "/api/feeds", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await readJson(res);
      if (!res.ok) {
        setFieldErrors((body.fieldErrors as Record<string, string>) ?? {});
        throw new Error(String(body.error || `Save failed (HTTP ${res.status})`));
      }
      resetForm();
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not save the connection");
    } finally {
      setSaving(false);
    }
  }

  async function remove(c: FeedConnectionPublic) {
    if (!window.confirm(`Delete the connection “${c.name}”? Its stored credential is deleted too.`)) return;
    setBusyId(c.id);
    try {
      const res = await fetch(`/api/feeds/${c.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await readJson(res);
        throw new Error(String(body.error || `Delete failed (HTTP ${res.status})`));
      }
      if (editingId === c.id) resetForm();
      if (run.status !== "idle" && "id" in run && run.id === c.id) setRun({ status: "idle" });
      await load();
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not delete the connection");
    } finally {
      setBusyId(null);
    }
  }

  async function testRun(c: FeedConnectionPublic) {
    setRun({ status: "running", id: c.id });
    try {
      const res = await fetch(`/api/feeds/${c.id}`);
      const body = await readJson(res);
      if (!res.ok) throw new Error(String(body.error || `Run failed (HTTP ${res.status})`));
      setRun({ status: "ok", id: c.id, envelope: body as unknown as FeedEnvelope });
    } catch (e) {
      setRun({ status: "error", id: c.id, message: e instanceof Error ? e.message : "The run failed" });
    } finally {
      void load();   // refresh the last-run stamp
    }
  }

  return (
    <div className="space-y-6">
      {/* ─── Saved connections ─── */}
      <Card>
        <CardHeader>
          <CardTitle>Connections</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading && <p className="text-sm text-muted-foreground">Loading…</p>}

          {loadError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {loadError}
            </div>
          )}

          {!loading && !connections.length && !loadError && (
            <p className="text-sm text-muted-foreground italic">
              No connections yet — add one below. Your custodian or CRM only needs an endpoint that
              returns positions, balances or contact records.
            </p>
          )}

          {connections.map((c) => (
            <div key={c.id} className="rounded-lg border border-border bg-muted/30 p-4">
              <div className="flex flex-wrap items-start gap-3">
                <span className={
                  "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider " +
                  (c.kind === "crm" ? "bg-purple-500/10 text-purple-600" : "bg-sky-500/10 text-sky-600")
                }>
                  {KIND_LABEL[c.kind] ?? c.kind}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-sm">{c.name}</div>
                  <div className="truncate text-xs text-muted-foreground" title={c.url}>{c.url}</div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span>{FORMAT_LABEL[c.format] ?? c.format}</span>
                    <span>·</span>
                    <span>{AUTH_LABEL[c.auth] ?? c.auth}{c.auth !== "none" && (c.hasSecret ? " · credential stored" : " · ⚠ no credential")}</span>
                    <span>·</span>
                    <span>{c.lastRunAt ? `last run ${new Date(c.lastRunAt).toLocaleString()}` : "never run"}</span>
                  </div>
                  {c.lastStatus && (
                    <div className={
                      "mt-1 text-[11px] " +
                      (c.lastStatus.startsWith("ok") ? "text-emerald-600" : "text-destructive")
                    }>
                      {c.lastStatus}
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => testRun(c)}
                          disabled={run.status === "running" || busyId === c.id}>
                    {run.status === "running" && run.id === c.id ? "Fetching…" : "Test fetch"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => startEdit(c)} disabled={busyId === c.id}>Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => remove(c)} disabled={busyId === c.id}
                          className="text-destructive hover:text-destructive">
                    {busyId === c.id ? "…" : "Delete"}
                  </Button>
                </div>
              </div>

              {run.status !== "idle" && "id" in run && run.id === c.id && (
                <div className="mt-3 border-t border-border pt-3">
                  {run.status === "error" && (
                    <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                      <strong>Fetch failed.</strong> {run.message}
                    </div>
                  )}
                  {run.status === "ok" && (
                    <>
                      <RunPreview envelope={run.envelope} />
                      <ApplyPanel envelope={run.envelope} />
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ─── Add / edit ─── */}
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit connection" : "Add a connection"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {formError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {formError}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" error={fieldErrors.name}>
              <Input value={form.name} onChange={(e) => set({ name: e.target.value })}
                     placeholder="Swissquote positions" />
            </Field>
            <Field label="System type">
              <Select value={form.kind} onChange={(e) => set({ kind: e.target.value })}>
                <option value="custodian">Custodian / bank</option>
                <option value="crm">CRM / client records</option>
              </Select>
            </Field>
          </div>

          <Field label="Endpoint URL" error={fieldErrors.url}
                 hint="Must be a public https endpoint. Private, loopback and cloud-metadata addresses are refused.">
            <Input value={form.url} onChange={(e) => set({ url: e.target.value })}
                   placeholder="https://api.custodian.com/v1/positions" />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Payload format">
              <Select value={form.format} onChange={(e) => set({ format: e.target.value })}>
                {Object.entries(FORMAT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
            <Field label="Default country"
                   hint="Used when a payload omits one (camt, OFX, CSV).">
              <Input value={form.defaultCountry} maxLength={2}
                     onChange={(e) => set({ defaultCountry: e.target.value.toUpperCase() })}
                     placeholder="CH" />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Authentication">
              <Select value={form.auth} onChange={(e) => set({ auth: e.target.value })}>
                {Object.entries(AUTH_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
            {form.auth === "apikey" && (
              <Field label="Header name">
                <Input value={form.header} onChange={(e) => set({ header: e.target.value })} placeholder="X-API-Key" />
              </Field>
            )}
          </div>

          {form.auth !== "none" && (
            <Field
              label={form.auth === "basic" ? "Credential (user:password)" : "Credential"}
              error={fieldErrors.secret}
              hint={
                editingId
                  ? "Leave blank to keep the stored credential. It is encrypted on the server and never sent back to this page."
                  : "Encrypted on the server with a key held only in the server environment, and never returned to the browser."
              }
            >
              <Input type="password" autoComplete="new-password" value={form.secret}
                     onChange={(e) => set({ secret: e.target.value })}
                     placeholder={editingId ? "•••••••• (unchanged)" : "token / key / user:password"} />
            </Field>
          )}

          <div className="flex flex-wrap gap-3 pt-1">
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Add connection"}
            </Button>
            {editingId && <Button variant="outline" onClick={resetForm} disabled={saving}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Result preview ───────────────────────────────────────────────
function RunPreview({ envelope }: { envelope: FeedEnvelope }) {
  const buckets = useMemo(
    () => FEED_BUCKETS
      .map((b) => ({ name: b, rows: (envelope[b] as unknown[]) ?? [] }))
      .filter((b) => b.rows.length > 0),
    [envelope]
  );
  const total = buckets.reduce((n, b) => n + b.rows.length, 0);

  if (!total) {
    return (
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-700">
        Connected successfully, but the payload contained no positions, balances or contacts.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="text-sm">
        <span className="font-semibold text-emerald-600">✓ {total} record{total === 1 ? "" : "s"}</span>
        <span className="text-muted-foreground"> normalized to wa.feed/v1</span>
        {envelope.source?.system && <span className="text-muted-foreground"> from {envelope.source.system}</span>}
      </div>
      <div className="flex flex-wrap gap-2">
        {buckets.map((b) => (
          <span key={b.name} className="rounded-md border border-border bg-background px-2 py-1 text-[11px]">
            <strong>{b.rows.length}</strong> {b.name}
          </span>
        ))}
      </div>
      <details className="text-xs">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          Preview the normalized records
        </summary>
        <pre className="mt-2 max-h-64 overflow-auto rounded-lg border border-border bg-muted/40 p-3 text-[11px] leading-relaxed">
{JSON.stringify(
  Object.fromEntries(buckets.map((b) => [b.name, b.rows.slice(0, 3)])),
  null, 2
)}
        </pre>
      </details>
      <p className="text-[11px] text-muted-foreground">
        This is a connection test — nothing has been written to your plan.
      </p>
    </div>
  );
}

// ─── Apply to plan ────────────────────────────────────────────────
// Loads the saved plan, diffs the envelope against it, lets the advisor
// choose what to write, then PUTs the merged plan. The pre-apply plan is
// kept in memory so a mistaken apply can be reverted in one click.
type ApplyState =
  | { phase: "idle" }
  | { phase: "loading" }
  | { phase: "review"; plan: WealthPlan; changes: PlanChange[] }
  | { phase: "saving"; plan: WealthPlan; changes: PlanChange[] }
  | { phase: "done"; applied: number; previous: WealthPlan }
  | { phase: "reverting"; previous: WealthPlan }
  | { phase: "reverted" }
  | { phase: "error"; message: string };

const SECTION_LABEL: Record<string, string> = {
  clients: "Household", children: "Dependents", incomes: "Income", expenses: "Expenses",
  assets: "Accounts & holdings", loans: "Liabilities", goals: "Goals", retirement: "Retirement",
};

function ApplyPanel({ envelope }: { envelope: FeedEnvelope }) {
  const [state, setState] = useState<ApplyState>({ phase: "idle" });
  const [selected, setSelected] = useState<Set<string>>(new Set());

  async function review() {
    setState({ phase: "loading" });
    try {
      const res = await fetch("/api/plan");
      const body = await readJson(res);
      if (!res.ok) throw new Error(String(body.error || `Could not load your plan (HTTP ${res.status})`));

      // A never-saved plan comes back null — start from a blank one so a feed
      // can populate a fresh account. A stored-but-invalid plan is NOT merged
      // into: overwriting it could destroy data the advisor can still recover.
      const raw = body.plan;
      let base: WealthPlan;
      if (raw) {
        const parsed = parsePlan(raw);
        if (!parsed.ok) throw new Error("Your saved plan couldn't be read safely, so nothing was merged into it. Open Your plan first to repair it.");
        base = parsed.plan;
      } else {
        base = (await import("@/lib/plan/default-plan")).emptyPlan();
      }

      const changes = diffPlan(base, envelope);
      // Pre-select everything that would actually change something.
      // Rows the merge flagged as risky start UNCHECKED. They are the ones the
      // engine could not resolve safely on its own — a foreign-currency amount
      // with no conversion, a loan with no rate or term, a retirement block
      // missing the age it needs. Pre-ticking those would let an advisor apply
      // a number nobody verified by clicking through the default.
      setSelected(new Set(changes.filter((c) => c.kind !== "unchanged" && !c.risky).map((c) => c.key)));
      setState({ phase: "review", plan: base, changes });
    } catch (e) {
      setState({ phase: "error", message: e instanceof Error ? e.message : "Could not prepare the merge" });
    }
  }

  async function save(plan: WealthPlan, changes: PlanChange[]) {
    setState({ phase: "saving", plan, changes });
    try {
      const merged = applyChanges(plan, changes, selected);
      const check = parsePlan(merged);
      if (!check.ok) {
        // Refuse to write something the schema rejects rather than let the
        // API bounce it back with a field path the advisor can't act on.
        throw new Error("The merged plan failed validation, so nothing was saved. Please report this feed payload.");
      }
      const res = await fetch("/api/plan", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(merged),
      });
      const body = await readJson(res);
      if (!res.ok) throw new Error(String(body.error || `Save failed (HTTP ${res.status})`));
      const applied = changes.filter((c) => selected.has(c.key) && c.kind !== "unchanged").length;
      setState({ phase: "done", applied, previous: plan });
    } catch (e) {
      setState({ phase: "error", message: e instanceof Error ? e.message : "Could not save the plan" });
    }
  }

  async function revert(previous: WealthPlan) {
    setState({ phase: "reverting", previous });
    try {
      const res = await fetch("/api/plan", {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(previous),
      });
      const body = await readJson(res);
      if (!res.ok) throw new Error(String(body.error || `Undo failed (HTTP ${res.status})`));
      setState({ phase: "reverted" });
    } catch (e) {
      setState({ phase: "error", message: e instanceof Error ? e.message : "Could not undo" });
    }
  }

  if (state.phase === "idle") {
    return (
      <div className="mt-3">
        <Button size="sm" variant="outline" onClick={review}>Review &amp; apply to plan…</Button>
      </div>
    );
  }
  if (state.phase === "loading") return <p className="mt-3 text-sm text-muted-foreground">Loading your plan…</p>;

  if (state.phase === "error") {
    return (
      <div className="mt-3 space-y-2">
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {state.message}
        </div>
        <Button size="sm" variant="outline" onClick={() => setState({ phase: "idle" })}>Back</Button>
      </div>
    );
  }

  if (state.phase === "done") {
    return (
      <div className="mt-3 space-y-2">
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-700">
          <strong>Applied {state.applied} change{state.applied === 1 ? "" : "s"} to your plan.</strong>{" "}
          Open <em>Your plan</em> to review, or undo to restore the previous version.
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => revert(state.previous)}>Undo this apply</Button>
          <Button size="sm" variant="outline" onClick={() => setState({ phase: "idle" })}>Done</Button>
        </div>
      </div>
    );
  }
  if (state.phase === "reverting") return <p className="mt-3 text-sm text-muted-foreground">Restoring…</p>;
  if (state.phase === "reverted") {
    return (
      <div className="mt-3 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm">
        Your plan has been restored to the version from before this apply.
      </div>
    );
  }

  // review / saving
  const { changes, plan } = state;
  const counts = summarize(changes);
  const actionable = changes.filter((c) => c.kind !== "unchanged");
  const sections = Array.from(new Set(changes.map((c) => c.section)));
  const chosen = actionable.filter((c) => selected.has(c.key)).length;

  const toggle = (key: string) =>
    setSelected((s) => { const n = new Set(s); if (n.has(key)) n.delete(key); else n.add(key); return n; });

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-border bg-background p-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-semibold">Review changes</span>
        <span className="text-xs text-muted-foreground">
          {counts.create} new · {counts.update} updated · {counts.unchanged} already current
        </span>
        {actionable.length > 0 && (
          <button type="button"
                  className="text-xs text-accent underline underline-offset-2"
                  onClick={() => setSelected(selected.size === actionable.length ? new Set() : new Set(actionable.map((c) => c.key)))}>
            {selected.size === actionable.length ? "Clear all" : "Select all"}
          </button>
        )}
      </div>

      {!actionable.length && (
        <p className="text-sm text-muted-foreground">
          Your plan already matches this feed — there is nothing to apply.
        </p>
      )}

      {sections.map((section) => {
        const rows = changes.filter((c) => c.section === section);
        if (!rows.length) return null;
        return (
          <div key={section} className="space-y-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              {SECTION_LABEL[section] ?? section}
            </div>
            {rows.map((c) => (
              <label key={c.key}
                     className={"flex items-start gap-2 rounded-md px-2 py-1.5 text-sm " +
                       (c.kind === "unchanged" ? "opacity-50" : "hover:bg-muted/50 cursor-pointer")}>
                <input type="checkbox" className="mt-1" disabled={c.kind === "unchanged"}
                       checked={selected.has(c.key)} onChange={() => toggle(c.key)} />
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{c.label}</span>
                  <span className={"ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase " +
                    (c.kind === "create" ? "bg-emerald-500/10 text-emerald-600"
                      : c.kind === "update" ? "bg-amber-500/10 text-amber-700"
                      : "bg-muted text-muted-foreground")}>
                    {c.kind === "create" ? "new" : c.kind === "update" ? "update" : "current"}
                  </span>
                  {c.risky && (
                    <span className="ml-1.5 rounded bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-orange-700">
                      check
                    </span>
                  )}
                  <span className="block text-xs text-muted-foreground">
                    {c.before !== undefined && c.kind === "update" ? `${c.before} → ${c.after}` : c.after}
                  </span>
                  {c.warning && (
                    <span className="mt-0.5 block text-xs text-orange-700">{c.warning}</span>
                  )}
                </span>
              </label>
            ))}
          </div>
        );
      })}

      <div className="flex flex-wrap gap-2 pt-1">
        <Button size="sm" onClick={() => save(plan, changes)}
                disabled={state.phase === "saving" || !chosen}>
          {state.phase === "saving" ? "Applying…" : `Apply ${chosen} change${chosen === 1 ? "" : "s"}`}
        </Button>
        <Button size="sm" variant="outline" onClick={() => setState({ phase: "idle" })}
                disabled={state.phase === "saving"}>
          Cancel
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground">
        Applying never deletes anything: records are added or updated, and you can undo immediately afterwards.
      </p>
    </div>
  );
}

function Field({ label, hint, error, children }: {
  label: string; hint?: string; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
      {!error && hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

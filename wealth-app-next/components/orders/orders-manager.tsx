"use client";

// ─────────────────────────────────────────────────────────────────
// Order connection manager — the UI over /api/orders.
//
// Same credential discipline as the feed manager: the secret input is
// cleared on save and the API only ever reports whether one EXISTS, so no
// OMS credential is ever held in React state or serialized into props.
//
// One thing this screen does that the feed screen does not: it shows the
// TICKET HISTORY. An order relay's audit trail is the point — an advisor
// needs to see what was staged, when, and whether the PM system took it,
// without leaving the app to find out.
// ─────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/tenancy/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrderConnectionPublic } from "@/lib/orders/schema";

const FORMAT_LABEL: Record<string, string> = {
  wa: "wa.order/v1 JSON (native)",
  avaloq: "Avaloq order entry",
  generic: "Generic REST JSON",
};
const AUTH_LABEL: Record<string, string> = {
  none: "None / public",
  bearer: "Bearer token",
  apikey: "API key header",
  basic: "Basic (user:password)",
};

interface TicketRow {
  ticket_id: string;
  account: string;
  currency: string;
  positions: number;
  total_amount: number | string;
  status: string;
  http_status: number | null;
  upstream_ref: string | null;
  detail: string | null;
  created_at: string;
}

interface FormState {
  name: string; url: string; format: string; auth: string;
  header: string; secret: string; account: string; custodian: string; currency: string;
  maxTicketAmount: string; sendClientIdentity: boolean;
}
const BLANK: FormState = {
  name: "", url: "", format: "wa", auth: "none",
  header: "X-API-Key", secret: "", account: "", custodian: "", currency: "CHF",
  maxTicketAmount: "100000", sendClientIdentity: false,
};

/** See feeds-manager: a gateway HTML error page must not surface as a parse error. */
async function readJson(res: Response): Promise<Record<string, unknown>> {
  const text = await res.text().catch(() => "");
  if (!text) return res.ok ? {} : { error: `Server returned an empty response (HTTP ${res.status})` };
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { error: `Server returned an unexpected response (HTTP ${res.status} ${res.statusText})`.trim() };
  }
}

const money = (n: number | string, ccy: string) => {
  const v = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(v)) return "—";
  return `${ccy} ${v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const STATUS_STYLE: Record<string, string> = {
  staged: "bg-emerald-500/10 text-emerald-600",
  rejected: "bg-red-500/10 text-red-600",
  failed: "bg-red-500/10 text-red-600",
  sending: "bg-amber-500/10 text-amber-700",
};

export function OrdersManager() {
  const [connections, setConnections] = useState<OrderConnectionPublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [form, setForm] = useState<FormState>(BLANK);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [fieldErrs, setFieldErrs] = useState<Record<string, string[]>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [tickets, setTickets] = useState<Record<string, TicketRow[]>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/orders", { cache: "no-store" });
      const json = await readJson(res);
      if (!res.ok) { setLoadError(String(json.error ?? `HTTP ${res.status}`)); setConnections([]); }
      else { setLoadError(""); setConnections((json.connections as OrderConnectionPublic[]) ?? []); }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Could not load order connections");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const set = (k: keyof FormState, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const resetForm = () => { setForm(BLANK); setEditingId(null); setFormError(""); setFieldErrs({}); };

  const save = async () => {
    setSaving(true); setFormError(""); setFieldErrs({});
    try {
      const payload: Record<string, unknown> = {
        name: form.name, url: form.url, format: form.format, auth: form.auth,
        header: form.header, account: form.account, custodian: form.custodian,
        currency: form.currency.toUpperCase(),
        sendClientIdentity: form.sendClientIdentity,
      };
      const cap = Number(form.maxTicketAmount);
      if (Number.isFinite(cap) && cap > 0) payload.maxTicketAmount = cap;
      // On edit a blank secret means "keep the stored one" — sending "" would
      // clear it, which is never what leaving a password field alone means.
      if (form.secret || !editingId) payload.secret = form.secret;

      const res = await apiFetch(editingId ? `/api/orders/${editingId}` : "/api/orders", {
        method: editingId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await readJson(res);
      if (!res.ok) {
        setFormError(String(json.error ?? `HTTP ${res.status}`));
        setFieldErrs((json.fieldErrors as Record<string, string[]>) ?? {});
        return;
      }
      resetForm();
      await load();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
      setForm((f) => ({ ...f, secret: "" }));   // never linger in state
    }
  };

  const edit = (c: OrderConnectionPublic) => {
    setEditingId(c.id);
    setForm({
      name: c.name, url: c.url, format: c.format, auth: c.auth,
      header: c.header ?? "X-API-Key", secret: "",
      account: c.account, custodian: c.custodian ?? "", currency: c.currency,
      maxTicketAmount: String(c.maxTicketAmount ?? 100000),
      sendClientIdentity: !!c.sendClientIdentity,
    });
    setFormError(""); setFieldErrs({});
  };

  const remove = async (id: string) => {
    const res = await apiFetch(`/api/orders/${id}`, { method: "DELETE" });
    if (res.ok) { if (editingId === id) resetForm(); await load(); }
  };

  const toggleHistory = async (id: string) => {
    if (openId === id) { setOpenId(null); return; }
    setOpenId(id);
    const res = await apiFetch(`/api/orders/${id}`, { cache: "no-store" });
    const json = await readJson(res);
    if (res.ok) setTickets((t) => ({ ...t, [id]: (json.tickets as TicketRow[]) ?? [] }));
  };

  const err = (k: string) => fieldErrs[k]?.[0];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{editingId ? "Edit connection" : "Add a PM / OMS connection"}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="ord-name">Name</Label>
              <Input id="ord-name" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Avaloq production" />
              {err("name") && <p className="mt-1 text-xs text-red-600">{err("name")}</p>}
            </div>
            <div>
              <Label htmlFor="ord-url">Order endpoint URL</Label>
              <Input id="ord-url" value={form.url} onChange={(e) => set("url", e.target.value)} placeholder="https://pm.example.com/api/orders" />
              {err("url") && <p className="mt-1 text-xs text-red-600">{err("url")}</p>}
            </div>
            <div>
              <Label htmlFor="ord-account">Custody account / portfolio ID</Label>
              <Input id="ord-account" value={form.account} onChange={(e) => set("account", e.target.value)} placeholder="CH-8842-01" />
              {err("account") && <p className="mt-1 text-xs text-red-600">{err("account")}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                Every ticket sent through this connection books here. Set on the server so a
                browser payload can never redirect an order to a different account.
              </p>
            </div>
            <div>
              <Label htmlFor="ord-custodian">Custodian</Label>
              <Input id="ord-custodian" value={form.custodian} onChange={(e) => set("custodian", e.target.value)} placeholder="optional" />
            </div>
            <div>
              <Label htmlFor="ord-format">Payload format</Label>
              <Select id="ord-format" value={form.format} onChange={(e) => set("format", e.target.value)}>
                {Object.entries(FORMAT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="ord-currency">Order currency</Label>
              <Input id="ord-currency" value={form.currency} maxLength={3}
                     onChange={(e) => set("currency", e.target.value.toUpperCase())} placeholder="CHF" />
              {err("currency") && <p className="mt-1 text-xs text-red-600">{err("currency")}</p>}
            </div>
            <div>
              <Label htmlFor="ord-auth">Authentication</Label>
              <Select id="ord-auth" value={form.auth} onChange={(e) => set("auth", e.target.value)}>
                {Object.entries(AUTH_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="ord-cap">Maximum per ticket ({form.currency || "CHF"})</Label>
              <Input id="ord-cap" type="number" min="1" value={form.maxTicketAmount}
                     onChange={(e) => set("maxTicketAmount", e.target.value)} />
              {err("maxTicketAmount") && <p className="mt-1 text-xs text-red-600">{err("maxTicketAmount")}</p>}
              <p className="mt-1 text-xs text-muted-foreground">
                A hard ceiling the browser cannot raise. The relay checks a ticket&apos;s arithmetic
                is self-consistent, but it has no proposal of record to check the amounts
                <em> against</em> — so this is the only bound on ticket size.
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="mt-1" checked={form.sendClientIdentity}
                       onChange={(e) => set("sendClientIdentity", e.target.checked)} />
                <span>
                  Send the client&apos;s name to the PM system
                  <span className="block text-xs text-muted-foreground">
                    Off by default. The PM system needs the account, instruments and amounts to
                    stage an order — not who the client is. Leaving this off means a mistyped
                    endpoint leaks what was bought, never whose it is.
                  </span>
                </span>
              </label>
            </div>
            {form.auth === "apikey" && (
              <div>
                <Label htmlFor="ord-header">Header name</Label>
                <Input id="ord-header" value={form.header} onChange={(e) => set("header", e.target.value)} placeholder="X-API-Key" />
              </div>
            )}
            {form.auth !== "none" && (
              <div>
                <Label htmlFor="ord-secret">Credential</Label>
                <Input id="ord-secret" type="password" value={form.secret}
                       onChange={(e) => set("secret", e.target.value)}
                       placeholder={editingId ? "leave blank to keep the stored one" : "token / key"} />
                {err("secret") && <p className="mt-1 text-xs text-red-600">{err("secret")}</p>}
              </div>
            )}
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <div className="flex gap-2">
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving…" : editingId ? "Save changes" : "Add connection"}
            </Button>
            {editingId && <Button variant="outline" onClick={resetForm}>Cancel</Button>}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {loading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {loadError && <p className="text-sm text-red-600">{loadError}</p>}
        {!loading && !loadError && !connections.length && (
          <p className="text-sm text-muted-foreground">No order connections yet.</p>
        )}

        {connections.map((c) => (
          <Card key={c.id}>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{c.name}</span>
                    <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {FORMAT_LABEL[c.format] ?? c.format}
                    </span>
                    {c.hasSecret && (
                      <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-600">
                        credential stored
                      </span>
                    )}
                  </div>
                  <p className="mt-1 break-all text-xs text-muted-foreground">{c.url}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Books to <code className="text-[11px]">{c.account}</code> · {c.currency}
                    {c.custodian ? ` · ${c.custodian}` : ""}
                    {c.maxTicketAmount ? ` · max ${money(c.maxTicketAmount, c.currency)}/ticket` : ""}
                  </p>
                  {c.lastStatus && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Last: {c.lastStatus}
                      {c.lastSentAt ? ` · ${new Date(c.lastSentAt).toLocaleString()}` : ""}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="sm" variant="outline" onClick={() => toggleHistory(c.id)}>
                    {openId === c.id ? "Hide tickets" : "Tickets"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => edit(c)}>Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => remove(c.id)}>Delete</Button>
                </div>
              </div>

              {openId === c.id && (
                <div className="mt-4 border-t border-border pt-3">
                  {!tickets[c.id]?.length ? (
                    <p className="text-xs text-muted-foreground">No tickets sent through this connection yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[640px] text-xs">
                        <thead>
                          <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                            <th className="py-1.5 pr-3">When</th>
                            <th className="py-1.5 pr-3">Ticket</th>
                            <th className="py-1.5 pr-3 text-right">Lines</th>
                            <th className="py-1.5 pr-3 text-right">Amount</th>
                            <th className="py-1.5 pr-3">Status</th>
                            <th className="py-1.5">Reference</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tickets[c.id].map((t) => (
                            <tr key={t.ticket_id} className="border-t border-border">
                              <td className="py-1.5 pr-3 text-muted-foreground">{new Date(t.created_at).toLocaleString()}</td>
                              <td className="py-1.5 pr-3 font-mono text-[11px]">{t.ticket_id}</td>
                              <td className="py-1.5 pr-3 text-right">{t.positions}</td>
                              <td className="py-1.5 pr-3 text-right">{money(t.total_amount, t.currency)}</td>
                              <td className="py-1.5 pr-3">
                                <span className={"rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase " + (STATUS_STYLE[t.status] ?? "bg-muted text-muted-foreground")}>
                                  {t.status}
                                </span>
                                {t.detail && <span className="ml-1 text-muted-foreground">{t.detail}</span>}
                              </td>
                              <td className="py-1.5 font-mono text-[11px]">{t.upstream_ref ?? "—"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

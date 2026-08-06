"use client";

// ─────────────────────────────────────────────────────────────────
// The Investment Proposal builder.
//
// An advisor lists the positions they want to buy, sets weights and a
// target amount, picks the PM/OMS connection to route through, and presses
// BUY. That builds a wa.order/v1 ticket (lib/orders/proposal.ts) and POSTs
// it to /api/orders/<connectionId>, the hardened relay that re-validates,
// enforces idempotency in Postgres, and forwards it as a STAGE-only
// instruction. Nothing here executes a trade.
//
// Three things this screen is careful about, each because the alternative
// costs client money:
//
//  • A 2xx is NOT success. The route returns a THREE-state result
//    (staged / rejected / unknown). "unknown" — a timeout, a dropped
//    socket — may have staged the order, so it is shown as "check the PM
//    system", never as failure, and resending is offered as safe BECAUSE
//    the ticket id is reused and the server dedupes it.
//  • Retry reuses the ticket id. A fresh id on every press turns one model
//    portfolio into two. The id is held until a clean "staged".
//  • The account is NOT chosen here. It comes from the connection, on the
//    server. The proposal only says what to buy and how much.
// ─────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiFetch } from "@/lib/tenancy/client";
import { formatMoney } from "@/lib/engine/financial-math";
import {
  checkProposal, buildTicket, type Proposal, type ProposalPosition,
} from "@/lib/orders/proposal";
import type { OrderConnectionPublic } from "@/lib/orders/schema";
import type { PlacementState } from "@/lib/orders/model";
import { FundPicker } from "./fund-picker";

async function readJson(res: Response): Promise<Record<string, unknown>> {
  try { return await res.json(); } catch { return { error: `HTTP ${res.status}` }; }
}

function newTicketId(): string {
  // 8–80 chars per the schema. crypto.randomUUID is available in every
  // browser this app supports; the fallback keeps SSR/type-checking happy.
  const rnd = typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, "")
    : Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return "wo_" + rnd.slice(0, 32);
}

let seq = 0;
const blankPosition = (): ProposalPosition => ({
  id: "p" + Date.now() + "_" + (seq++), name: "", weightPct: 0,
});

type SendState =
  | { phase: "idle" }
  | { phase: "sending" }
  | { phase: "result"; state: PlacementState | "failed"; message: string; ref?: string; duplicate?: boolean }
  | { phase: "error"; message: string };

export function ProposalBuilder({ clientName }: { clientName?: string }) {
  const [connections, setConnections] = useState<OrderConnectionPublic[]>([]);
  const [connId, setConnId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const [positions, setPositions] = useState<ProposalPosition[]>([blankPosition()]);
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [objective, setObjective] = useState("");
  const [advisor, setAdvisor] = useState("");

  // Held across retries so a resend is idempotent; cleared only on a clean
  // "staged", so a NEW proposal after success gets a NEW id.
  const [ticketId, setTicketId] = useState<string>(newTicketId());
  const [send, setSend] = useState<SendState>({ phase: "idle" });

  // Which position (if any) the fund picker is filling.
  const [pickingFor, setPickingFor] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const res = await apiFetch("/api/orders", { cache: "no-store" });
      const body = await readJson(res);
      if (res.ok) {
        const conns = (body.connections as OrderConnectionPublic[]) ?? [];
        setConnections(conns);
        if (conns.length) setConnId(conns[0].id);
      }
      setLoading(false);
    })();
  }, []);

  const conn = connections.find((c) => c.id === connId);
  const currency = conn?.currency ?? "CHF";

  const proposal: Proposal = useMemo(() => ({
    positions,
    targetAmount,
    currency,
    clientName,
    advisor: advisor || undefined,
    objective: objective || undefined,
  }), [positions, targetAmount, currency, clientName, advisor, objective]);

  const problems = useMemo(() => checkProposal(proposal), [proposal]);
  const errors = problems.filter((p) => p.level === "error");
  const problemFor = (id: string) => problems.filter((p) => p.positionId === id);
  const weightSum = positions.reduce((s, p) => s + (Number(p.weightPct) || 0), 0);

  const setPos = (id: string, patch: Partial<ProposalPosition>) =>
    setPositions((ps) => ps.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  const addPos = () => setPositions((ps) => [...ps, blankPosition()]);
  const removePos = (id: string) => setPositions((ps) => ps.filter((p) => p.id !== id));

  // Even-split helper: the most common thing an advisor does first.
  const distributeEvenly = () => {
    if (!positions.length) return;
    const each = Math.floor((100 / positions.length) * 100) / 100;
    setPositions((ps) => ps.map((p, i) => ({
      ...p,
      // Last line absorbs the residue so the sum is exactly 100.
      weightPct: i === ps.length - 1
        ? Math.round((100 - each * (ps.length - 1)) * 100) / 100
        : each,
    })));
  };

  const amountFor = (w: number) =>
    targetAmount > 0 ? Math.round(targetAmount * ((Number(w) || 0) / 100) * 100) / 100 : 0;

  const canSend = !!conn && errors.length === 0 && targetAmount > 0 && send.phase !== "sending";
  const overCeiling = !!conn && targetAmount > conn.maxTicketAmount;

  const place = useCallback(async () => {
    if (!conn) return;
    setSend({ phase: "sending" });
    const ticket = buildTicket(proposal, {
      ticketId,
      account: conn.account,
      custodian: conn.custodian || undefined,
      createdAt: new Date().toISOString(),
    });

    const res = await apiFetch(`/api/orders/${conn.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(ticket),
    });
    const body = await readJson(res);

    // A validation refusal (422) lists reasons; surface them.
    if (res.status === 422 && Array.isArray(body.reasons)) {
      setSend({ phase: "error", message: (body.reasons as string[]).join(" · ") });
      return;
    }
    if (body.duplicate) {
      const r = (body.result ?? {}) as { state?: PlacementState; ref?: string };
      setSend({
        phase: "result", state: r.state ?? "unknown", duplicate: true,
        message: String(body.message ?? "This ticket was already submitted; not sent again."),
        ref: r.ref,
      });
      return;
    }
    if (!res.ok && !body.state) {
      setSend({ phase: "error", message: String(body.error ?? `HTTP ${res.status}`) });
      return;
    }

    const state = (body.state as PlacementState | "failed") ?? "failed";
    const result = (body.result ?? {}) as { ref?: string; uncertainty?: string; rejected?: string[] };
    if (state === "staged") {
      // Clean success: a NEW proposal from here should get a NEW id.
      setSend({ phase: "result", state, message: "Staged in the PM system.", ref: result.ref });
      setTicketId(newTicketId());
    } else if (state === "unknown") {
      setSend({
        phase: "result", state,
        message: String(body.message ?? result.uncertainty ??
          "The outcome is unconfirmed — the PM system may or may not have received this. Check there before resending. Resending this same ticket is safe; the relay recognises it as a duplicate."),
      });
    } else {
      setSend({
        phase: "result", state: state as PlacementState,
        message: (result.rejected ?? []).join(" · ") || "The PM system rejected this ticket.",
      });
    }
  }, [conn, proposal, ticketId]);

  if (loading) return <p className="text-sm text-muted-foreground">Loading…</p>;

  if (!connections.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-3">
          <p className="text-muted-foreground">
            No PM / OMS connection yet. Add one under <strong>Orders</strong> — it holds the
            custody account and credential this proposal routes to.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* ─── Route + target ─── */}
      <Card>
        <CardHeader><CardTitle>Route and amount</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="pb-conn">Send through</Label>
            <Select id="pb-conn" value={connId} onChange={(e) => setConnId(e.target.value)}>
              {connections.map((c) => (
                <option key={c.id} value={c.id}>{c.name} · {c.account} ({c.currency})</option>
              ))}
            </Select>
            {conn && (
              <p className="text-[11px] text-muted-foreground">
                Books to <strong>{conn.account}</strong>. Ceiling {formatMoney(conn.maxTicketAmount, conn.currency)}.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pb-amount">Target amount ({currency})</Label>
            <Input
              id="pb-amount" type="number" min={0} value={targetAmount || ""}
              onChange={(e) => setTargetAmount(Math.max(0, Number(e.target.value) || 0))}
              placeholder="100000"
            />
            {overCeiling && (
              <p className="text-[11px] text-destructive">
                Over this connection&apos;s ceiling — the server will refuse it.
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pb-advisor">Advisor (optional)</Label>
            <Input id="pb-advisor" value={advisor} onChange={(e) => setAdvisor(e.target.value)} placeholder="Your name" />
          </div>
        </CardContent>
      </Card>

      {/* ─── Positions ─── */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Positions</CardTitle>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={distributeEvenly}>Even split</Button>
            <Button type="button" size="sm" onClick={addPos}>Add position</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {positions.map((p) => {
            const probs = problemFor(p.id);
            return (
              <div key={p.id} className="rounded-lg border border-border p-3 space-y-2">
                <div className="grid gap-2 sm:grid-cols-12 items-end">
                  <div className="sm:col-span-4 space-y-1">
                    <div className="flex items-center justify-between">
                      <Label>Instrument</Label>
                      <button
                        type="button"
                        className="text-[11px] text-accent hover:underline"
                        onClick={() => setPickingFor(p.id)}
                      >
                        From fund list
                      </button>
                    </div>
                    <Input value={p.name} onChange={(e) => setPos(p.id, { name: e.target.value })} placeholder="e.g. iShares Core MSCI World" />
                  </div>
                  <div className="sm:col-span-3 space-y-1">
                    <Label>ISIN</Label>
                    <Input value={p.isin ?? ""} onChange={(e) => setPos(p.id, { isin: e.target.value })} placeholder="IE00B4L5Y983" />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label>Valor / CUSIP / ticker</Label>
                    <Input
                      value={p.valor ?? p.cusip ?? p.ticker ?? ""}
                      onChange={(e) => {
                        // One box, three identifier kinds — route by shape so an
                        // advisor doesn't need to pick the field first.
                        const v = e.target.value.trim();
                        if (/^\d{5,9}$/.test(v)) setPos(p.id, { valor: v, cusip: "", ticker: "" });
                        else if (/^[0-9A-Za-z]{9}$/.test(v)) setPos(p.id, { cusip: v.toUpperCase(), valor: "", ticker: "" });
                        else setPos(p.id, { ticker: v.toUpperCase(), valor: "", cusip: "" });
                      }}
                      placeholder="1234567 / AAPL"
                    />
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <Label>Weight %</Label>
                    <Input type="number" min={0} max={100} value={p.weightPct || ""} onChange={(e) => setPos(p.id, { weightPct: Number(e.target.value) || 0 })} />
                  </div>
                  <div className="sm:col-span-1 flex items-end">
                    <Button type="button" variant="ghost" size="sm" className="text-destructive" onClick={() => removePos(p.id)} disabled={positions.length === 1}>✕</Button>
                  </div>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="text-muted-foreground">
                    {targetAmount > 0 && p.weightPct > 0 ? formatMoney(amountFor(p.weightPct), currency) : "—"}
                  </span>
                  <div className="flex flex-col items-end gap-0.5">
                    {probs.map((x, i) => (
                      <span key={i} className={x.level === "error" ? "text-destructive" : "text-amber-600"}>
                        {x.level === "error" ? "✕ " : "! "}{x.message}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}

          <div className="flex items-center justify-between text-sm border-t border-border pt-3">
            <span className={Math.abs(weightSum - 100) > 0.1 ? "text-destructive" : "text-muted-foreground"}>
              Weights total {Math.round(weightSum * 100) / 100}%
            </span>
            <span className="font-medium">
              {targetAmount > 0 ? formatMoney(targetAmount, currency) : "Set a target amount"}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* ─── Objective + send ─── */}
      <Card>
        <CardHeader><CardTitle>Review &amp; send</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="pb-obj">Objective (optional, sent with the ticket)</Label>
            <Input id="pb-obj" value={objective} onChange={(e) => setObjective(e.target.value)} placeholder="Rebalance to strategic allocation" />
          </div>

          {errors.filter((e) => e.positionId === null).map((e, i) => (
            <p key={i} className="text-sm text-destructive">✕ {e.message}</p>
          ))}

          {send.phase === "result" && (
            <div className={`rounded-lg border px-4 py-3 text-sm ${
              send.state === "staged" ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-700"
              : send.state === "unknown" ? "border-amber-500/30 bg-amber-500/5 text-amber-700"
              : "border-destructive/30 bg-destructive/5 text-destructive"}`}>
              <strong>
                {send.state === "staged" ? "✓ Staged"
                  : send.state === "unknown" ? "⚠ Outcome unconfirmed"
                  : send.duplicate ? "Already submitted" : "✕ Rejected"}
              </strong>
              <div className="mt-1">{send.message}{send.ref ? ` (ref ${send.ref})` : ""}</div>
            </div>
          )}
          {send.phase === "error" && (
            <p className="text-sm text-destructive">✕ {send.message}</p>
          )}

          <div className="flex items-center gap-3">
            <Button
              onClick={place}
              disabled={!canSend || overCeiling}
              size="lg"
            >
              {send.phase === "sending" ? "Sending…" : "BUY — stage in PM system"}
            </Button>
            {send.phase === "result" && send.state !== "staged" && (
              // Retry reuses the same ticketId, so the relay dedupes it — this
              // is safe even after an "unknown", which is the whole point.
              <Button variant="outline" onClick={place} disabled={send.phase !== "result"}>
                Retry this ticket
              </Button>
            )}
            <span className="text-xs text-muted-foreground">
              Stages only — a person with trading authority executes in the PM system.
            </span>
          </div>
        </CardContent>
      </Card>

      {pickingFor && (
        <FundPicker
          onClose={() => setPickingFor(null)}
          onPick={(f) => {
            // Fill name/ticker/class only. NOT an identifier — the universe
            // carries none and guessing one is the failure the order path
            // exists to prevent. Clear any stale identifier so a picked fund
            // doesn't inherit the previous instrument's ISIN.
            setPos(pickingFor, {
              name: f.name, ticker: f.ticker, cls: f.cls, vehicle: f.vehicle,
              isin: "", cusip: "", valor: "",
            });
          }}
        />
      )}
    </div>
  );
}

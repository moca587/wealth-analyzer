"use client";

// ─────────────────────────────────────────────────────────────────
// The billing screen. Shows whether the firm is entitled and, for an
// owner, the button to start or manage a subscription.
//
// Deliberately honest about the deployment it is running in: if Stripe is
// not configured (a pilot billed by invoice, a self-hosted install), it
// says so rather than showing a dead "Subscribe" button. The gate
// (lib/billing/gate.ts) treats those deployments as entitled, so the
// product works; this screen explains why there is nothing to click.
// ─────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface BillingState {
  organization: { id: string; name: string };
  role: string;
  billingEnforced: boolean;
  stripeConfigured: boolean;
  isPaid: boolean;
  status: string;
  seats: number;
  seatsUsed: number;
}

async function readJson(res: Response): Promise<Record<string, unknown>> {
  try { return await res.json(); } catch { return { error: `HTTP ${res.status}` }; }
}

export function BillingManager() {
  const [state, setState] = useState<BillingState | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/billing", { cache: "no-store" });
    const body = await readJson(res);
    if (!res.ok) { setError(String(body.error ?? `HTTP ${res.status}`)); return; }
    setState(body as unknown as BillingState);
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function act(action: "checkout" | "portal") {
    setBusy(true); setError("");
    const res = await fetch("/api/billing", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const body = await readJson(res);
    setBusy(false);
    if (!res.ok) { setError(String(body.error ?? `HTTP ${res.status}`)); return; }
    // Stripe-hosted pages; a full navigation, not a fetch.
    if (typeof body.url === "string") window.location.href = body.url;
  }

  if (error && !state) {
    return <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>;
  }
  if (!state) return <p className="text-sm text-muted-foreground">Loading…</p>;

  const isOwner = state.role === "owner";

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">{error}</div>
      )}

      <Card>
        <CardHeader><CardTitle>{state.organization.name}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!state.billingEnforced ? (
            <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm">
              <strong>Billing is not enforced on this deployment.</strong>
              <p className="text-muted-foreground mt-1">
                Every feature is available. {state.stripeConfigured
                  ? "You can still start a subscription below."
                  : "This instance is billed by agreement rather than by card."}
              </p>
            </div>
          ) : state.isPaid ? (
            <div className="flex items-center gap-3">
              <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              <div>
                <div className="font-medium">Active subscription</div>
                <div className="text-xs text-muted-foreground">
                  Status: {state.status} · {state.seats} seat{state.seats === 1 ? "" : "s"} ·
                  {" "}{state.seatsUsed} in use
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-800">
              <strong>No active subscription.</strong>
              <p className="mt-1">
                You can capture plans, simulate and generate reports. Pulling live custodian
                feeds and staging orders needs a subscription.
              </p>
            </div>
          )}

          {state.stripeConfigured && isOwner && (
            <div className="flex gap-3">
              {state.isPaid ? (
                <Button onClick={() => act("portal")} disabled={busy} variant="outline">
                  Manage subscription
                </Button>
              ) : (
                <Button onClick={() => act("checkout")} disabled={busy}>
                  {busy ? "Starting…" : "Subscribe"}
                </Button>
              )}
            </div>
          )}
          {state.stripeConfigured && !isOwner && state.billingEnforced && !state.isPaid && (
            <p className="text-xs text-muted-foreground">Ask an owner of this firm to start a subscription.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

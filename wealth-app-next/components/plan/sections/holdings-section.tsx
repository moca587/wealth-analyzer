"use client";

// ─────────────────────────────────────────────────────────────────
// Editing the holdings layer by hand.
//
// Holdings usually arrive from a custodian feed or a legacy import; this
// lets an advisor add or correct them directly. The section is careful to
// say what a holding IS, because the mental model matters: a holding is a
// security POSITION used for the portfolio allocation and cost/yield
// analysis — it does NOT change net worth, which comes from the accounts
// under Assets. Entering both a holding and its account is the same money
// at two granularities and is correct (they are never double-counted).
//
// The fund picker fills a row's name / ticker / class and, unlike the
// proposal builder, its expense ratio and yield too — the whole point of a
// holding is the cost figure.
// ─────────────────────────────────────────────────────────────────

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FundPicker } from "@/components/orders/fund-picker";
import { formatMoney } from "@/lib/engine/financial-math";
import { CLASS_LABEL, ASSET_CLASSES, type AssetClass } from "@/lib/portfolio/asset-class";
import type { Holding } from "@/lib/engine/types";
import type { SectionProps } from "./section-props";
import { blankHolding, parseNumField, applyFundPick } from "./holding-edit";

export function HoldingsSection({ plan, update }: SectionProps) {
  const holdings = plan.holdings ?? [];
  const [pickingFor, setPickingFor] = useState<string | null>(null);

  const setHoldings = (next: Holding[]) => update({ holdings: next });

  const addHolding = () => setHoldings([...holdings, blankHolding()]);

  const updateHolding = (id: string, patch: Partial<Holding>) =>
    setHoldings(holdings.map((h) => (h.id === id ? { ...h, ...patch } : h)));

  const removeHolding = (id: string) => setHoldings(holdings.filter((h) => h.id !== id));

  const total = holdings.reduce((s, h) => s + (Number.isFinite(h.value) ? h.value : 0), 0);
  const ccy = plan.currency || "USD";

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Holdings</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={addHolding}>+ Add</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          The securities inside the investable accounts — used for the portfolio
          allocation and blended cost/yield, <strong>not</strong> net worth (that comes
          from Assets). Usually imported from a custodian feed; add or correct them here.
        </p>

        {holdings.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            None yet. Add a position, or import a client&apos;s book from a data feed.
          </p>
        )}

        {holdings.map((h) => (
          <div key={h.id} className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Name</Label>
                <Input value={h.name} onChange={(e) => updateHolding(h.id, { name: e.target.value })}
                  placeholder="e.g. FTSE All-World UCITS ETF" />
              </div>
              <div className="space-y-1.5">
                <Label>Ticker</Label>
                <Input value={h.ticker ?? ""} onChange={(e) => updateHolding(h.id, { ticker: e.target.value.trim() || undefined })}
                  placeholder="VWRL" />
              </div>
              <div className="space-y-1.5">
                <Label>Asset class</Label>
                <Select value={h.cls || "equity"} onChange={(e) => updateHolding(h.id, { cls: e.target.value as AssetClass })}>
                  {ASSET_CLASSES.map((c) => <option key={c} value={c}>{CLASS_LABEL[c]}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Value ({ccy})</Label>
                <Input type="number" value={h.value}
                  onChange={(e) => { const v = e.target.value.trim(); updateHolding(h.id, { value: v === "" ? 0 : (Number.isFinite(+v) ? +v : h.value) }); }} />
              </div>
              <div className="space-y-1.5">
                <Label>Expense ratio %</Label>
                <Input type="number" step="0.01" value={h.er ?? ""}
                  onChange={(e) => updateHolding(h.id, { er: parseNumField(e.target.value, h.er) })}
                  placeholder="0.22" />
              </div>
              <div className="space-y-1.5">
                <Label>Yield %</Label>
                <Input type="number" step="0.01" value={h.yld ?? ""}
                  onChange={(e) => updateHolding(h.id, { yld: parseNumField(e.target.value, h.yld) })}
                  placeholder="1.9" />
              </div>
              <div className="space-y-1.5">
                <Label>Region</Label>
                <Input value={h.region ?? ""} onChange={(e) => updateHolding(h.id, { region: e.target.value.trim() || undefined })}
                  placeholder="Global / US / CH…" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" size="sm" onClick={() => setPickingFor(h.id)}>
                From fund list
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeHolding(h.id)}
                className="text-destructive ml-auto">
                Remove
              </Button>
            </div>
          </div>
        ))}

        {holdings.length > 0 && (
          <div className="flex justify-between border-t border-border pt-3 text-sm">
            <span className="text-muted-foreground">{holdings.length} position(s)</span>
            <span className="font-medium">{formatMoney(total, ccy)}</span>
          </div>
        )}
      </CardContent>

      {pickingFor && (
        <FundPicker
          onClose={() => setPickingFor(null)}
          onPick={(f) => {
            setHoldings(holdings.map((h) => (h.id === pickingFor ? applyFundPick(h, f) : h)));
            setPickingFor(null);
          }}
        />
      )}
    </Card>
  );
}

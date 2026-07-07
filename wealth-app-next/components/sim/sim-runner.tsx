"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { runMonteCarlo } from "@/lib/engine/monte-carlo";
import { formatMoney } from "@/lib/engine/financial-math";
import { SimChart } from "./sim-chart";
import type { WealthPlan, SimulationResult } from "@/lib/engine/types";

export function SimRunner({ plan }: { plan: WealthPlan }) {
  const [sims, setSims] = useState<200 | 500 | 1000>(1000);
  const [years, setYears] = useState(30);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [running, setRunning] = useState(false);

  function run() {
    setRunning(true);
    // Use a short timeout so the UI updates before the JS-bound MC runs
    setTimeout(() => {
      try {
        const r = runMonteCarlo({ plan, sims, years });
        setResult(r);
      } finally {
        setRunning(false);
      }
    }, 30);
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Run simulation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paths</label>
            <Select value={sims} onChange={(e) => setSims(+e.target.value as 200|500|1000)} className="w-32">
              <option value={200}>200 (fast)</option>
              <option value={500}>500</option>
              <option value={1000}>1,000 (recommended)</option>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Years</label>
            <Select value={years} onChange={(e) => setYears(+e.target.value)} className="w-32">
              {[10, 20, 30, 40].map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
          </div>
          <Button onClick={run} disabled={running} size="lg">
            {running ? "Running…" : "Run Monte Carlo"}
          </Button>
          {result && <span className="text-xs text-muted-foreground">Ran in {result.runMs}ms</span>}
        </CardContent>
      </Card>

      {result && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Net worth projection — {sims.toLocaleString()} paths, {years} years</CardTitle>
            </CardHeader>
            <CardContent>
              <SimChart result={result} currency={plan.currency} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { k: "Median (P50)", v: result.final.p50, cls: "text-foreground" },
              { k: "P25",          v: result.final.p25, cls: "text-muted-foreground" },
              { k: "P75",          v: result.final.p75, cls: "text-muted-foreground" },
              { k: "P10 (worst)",  v: result.final.p10, cls: "text-destructive" },
              { k: "P90 (best)",   v: result.final.p90, cls: "text-emerald-600" }
            ].map((s) => (
              <Card key={s.k}>
                <CardContent className="p-4">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">{s.k}</div>
                  <div className={`font-display text-2xl ${s.cls}`}>{formatMoney(s.v, plan.currency)}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {result.goalSuccess.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Goal probability of success</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {result.goalSuccess.map((g) => (
                  <div key={g.goalId}>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <span className="font-medium">{g.goalName || "(unnamed goal)"}</span>
                      <span className={`font-display text-lg ${g.probability >= 0.8 ? "text-emerald-600" : g.probability >= 0.5 ? "text-amber-500" : "text-destructive"}`}>
                        {(g.probability * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${g.probability >= 0.8 ? "bg-emerald-500" : g.probability >= 0.5 ? "bg-amber-500" : "bg-destructive"}`}
                        style={{ width: `${Math.min(100, Math.max(0, g.probability * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="text-xs text-muted-foreground border-t border-border pt-4">
            <strong>Important:</strong> Monte Carlo results are illustrative projections based on the inputs you provided
            and assumed risk/return parameters. They are not predictions, guarantees, or financial advice. Real outcomes
            will differ. Consult a licensed advisor before making decisions.
          </div>
        </>
      )}
    </div>
  );
}

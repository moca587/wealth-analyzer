"use client";

// ─────────────────────────────────────────────────────────────────
// Current book vs proposed target — the panel an advisor reviews before
// pressing BUY.
//
// Self-contained: give it the client's plan and the live proposal and it
// lazy-loads the fund universe (like the picker), builds both portfolios,
// enriches cost/yield by ticker, and renders. All the arithmetic lives in
// lib/portfolio/*; this is presentation only.
//
// The comparison is allocation-based (percent of each side), because the
// current book and the proposed target need not be the same size. The one
// CHF figure shown per class — "to reach the target mix" — rebalances the
// current book and is labelled as such.
// ─────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useState } from "react";
import type { WealthPlan } from "@/lib/engine/types";
import type { Proposal } from "@/lib/orders/proposal";
import type { Fund } from "@/lib/data/fund-universe";
import { portfolioFromPlan, portfolioFromProposal } from "@/lib/portfolio/model";
import { comparePortfolios, type Comparison } from "@/lib/portfolio/compare";
import { fundLookup } from "@/lib/portfolio/enrich";
import { CLASS_COLOR, CLASS_LABEL, ASSET_CLASSES, type AssetClass } from "@/lib/portfolio/asset-class";

function fmtMoney(n: number, ccy: string): string {
  return `${ccy} ${Math.round(n).toLocaleString("en-US")}`;
}
function fmtPct(n: number, digits = 1): string {
  return `${n.toFixed(digits)}%`;
}
function fmtDrift(n: number): string {
  return `${n > 0 ? "+" : ""}${n.toFixed(1)}pp`;
}

/** A donut built from stroke-dasharray arcs — crisp, no arc-path math, no
 *  chart library. Slices in canonical class order so current and proposed
 *  read consistently. */
function Donut({ slices, size = 132 }: { slices: { cls: AssetClass; pct: number }[]; size?: number }) {
  const stroke = 16;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  const drawable = slices.filter((s) => s.pct > 0);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" role="img"
      aria-label="Allocation by asset class">
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`}>
        {/* track */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
          strokeOpacity={0.12} strokeWidth={stroke} />
        {drawable.map((s) => {
          const len = (s.pct / 100) * c;
          const el = (
            <circle key={s.cls} cx={size / 2} cy={size / 2} r={r} fill="none"
              stroke={CLASS_COLOR[s.cls]} strokeWidth={stroke}
              strokeDasharray={`${len} ${c - len}`} strokeDashoffset={-offset} />
          );
          offset += len;
          return el;
        })}
      </g>
    </svg>
  );
}

function donutSlices(byClass: Comparison["byClass"], side: "current" | "proposed") {
  return ASSET_CLASSES.map((cls) => {
    const row = byClass.find((r) => r.cls === cls);
    return { cls, pct: row ? (side === "current" ? row.currentPct : row.proposedPct) : 0 };
  }).filter((s) => s.pct > 0);
}

function Stat({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "good" | "bad" }) {
  const toneCls = tone === "good" ? "text-emerald-600" : tone === "bad" ? "text-destructive" : "text-foreground";
  return (
    <div className="min-w-[120px]">
      <div className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className={`font-display text-xl ${toneCls}`}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground">{sub}</div>}
    </div>
  );
}

export function AllocationCompare({ plan, proposal }: { plan: WealthPlan | null; proposal: Proposal }) {
  const [funds, setFunds] = useState<Fund[] | null>(null);
  const [investableOnly, setInvestableOnly] = useState(true);

  useEffect(() => {
    let live = true;
    import("@/lib/data/fund-universe").then((m) => { if (live) setFunds(m.FUND_UNIVERSE); }).catch(() => {});
    return () => { live = false; };
  }, []);

  const hasProposal = (proposal.positions ?? []).some((p) => (p.weightPct ?? 0) > 0) && proposal.targetAmount > 0;

  const comparison = useMemo<Comparison | null>(() => {
    if (!hasProposal) return null;
    const lookup = fundLookup(funds ?? []);
    const current = plan ? portfolioFromPlan(plan, { lookup, investableOnly }) : { positions: [], total: 0, currency: proposal.currency };
    const proposed = portfolioFromProposal(proposal, lookup);
    return comparePortfolios(current, proposed);
  }, [plan, proposal, funds, investableOnly, hasProposal]);

  if (!hasProposal) {
    return (
      <p className="text-sm text-muted-foreground">
        Add positions with weights and a target amount to compare this proposal against the client&apos;s
        current portfolio.
      </p>
    );
  }
  if (!comparison) return null;

  const { byClass, summary } = comparison;
  const ccy = summary.currency;
  const noCurrent = summary.currentTotal <= 0;

  const terDelta = summary.currentTer != null && summary.proposedTer != null
    ? summary.proposedTer - summary.currentTer : null;

  return (
    <div className="space-y-6">
      {/* Summary strip */}
      <div className="flex flex-wrap gap-x-8 gap-y-4">
        <Stat label="Current book" value={noCurrent ? "—" : fmtMoney(summary.currentTotal, ccy)}
          sub={noCurrent ? "new client" : `${summary.currentClassCount} class(es)`} />
        <Stat label="Proposed" value={fmtMoney(summary.proposedTotal, ccy)}
          sub={`${summary.proposedClassCount} class(es)`} />
        <Stat label="Blended cost"
          value={summary.proposedTer != null ? fmtPct(summary.proposedTer, 2) : "—"}
          sub={summary.currentTer != null ? `was ${fmtPct(summary.currentTer, 2)}` : "no fee data on current"}
          tone={terDelta == null ? undefined : terDelta < -0.001 ? "good" : terDelta > 0.001 ? "bad" : undefined} />
        <Stat label="Blended yield"
          value={summary.proposedYield != null ? fmtPct(summary.proposedYield, 2) : "—"}
          sub={summary.currentYield != null ? `was ${fmtPct(summary.currentYield, 2)}` : undefined} />
        <Stat label="Top position"
          value={fmtPct(summary.proposedTopWeight, 0)}
          sub={noCurrent ? undefined : `was ${fmtPct(summary.currentTopWeight, 0)}`} />
      </div>

      {/* Donuts */}
      <div className="flex flex-wrap items-center gap-8">
        <div className="flex flex-col items-center gap-2">
          <Donut slices={donutSlices(byClass, "current")} />
          <div className="text-xs font-medium text-muted-foreground">
            {noCurrent ? "No current book" : "Current"}
          </div>
        </div>
        <div className="text-2xl text-muted-foreground select-none">→</div>
        <div className="flex flex-col items-center gap-2">
          <Donut slices={donutSlices(byClass, "proposed")} />
          <div className="text-xs font-medium text-muted-foreground">Proposed</div>
        </div>

        {/* Legend */}
        <ul className="flex-1 min-w-[180px] space-y-1">
          {byClass.map((r) => (
            <li key={r.cls} className="flex items-center gap-2 text-xs">
              <span className="inline-block h-3 w-3 rounded-sm shrink-0" style={{ background: CLASS_COLOR[r.cls] }} />
              <span className="flex-1">{CLASS_LABEL[r.cls]}</span>
              <span className="tabular-nums text-muted-foreground">{fmtPct(r.currentPct, 0)} → {fmtPct(r.proposedPct, 0)}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Toggle */}
      {plan && (plan.assets ?? []).some((a) => !a.liquid) && (
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input type="checkbox" checked={investableOnly} onChange={(e) => setInvestableOnly(e.target.checked)} />
          Compare marketable assets only (exclude property and locked pensions)
        </label>
      )}

      {/* Drift table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="py-2 pr-3 font-semibold">Asset class</th>
              <th className="py-2 px-3 font-semibold text-right">Current</th>
              <th className="py-2 px-3 font-semibold text-right">Proposed</th>
              <th className="py-2 px-3 font-semibold text-right">Drift</th>
              <th className="py-2 pl-3 font-semibold text-right">To reach target</th>
            </tr>
          </thead>
          <tbody>
            {byClass.map((r) => (
              <tr key={r.cls} className="border-b border-border/50">
                <td className="py-2 pr-3">
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: CLASS_COLOR[r.cls] }} />
                    {CLASS_LABEL[r.cls]}
                  </span>
                </td>
                <td className="py-2 px-3 text-right tabular-nums text-muted-foreground">{fmtPct(r.currentPct)}</td>
                <td className="py-2 px-3 text-right tabular-nums">{fmtPct(r.proposedPct)}</td>
                <td className={`py-2 px-3 text-right tabular-nums ${
                  r.driftPct > 0.05 ? "text-emerald-600" : r.driftPct < -0.05 ? "text-destructive" : "text-muted-foreground"
                }`}>{fmtDrift(r.driftPct)}</td>
                <td className="py-2 pl-3 text-right tabular-nums">
                  {noCurrent ? "—" : (
                    <span className={r.rebalanceValue > 0 ? "text-emerald-600" : r.rebalanceValue < 0 ? "text-destructive" : "text-muted-foreground"}>
                      {r.rebalanceValue > 0 ? "buy " : r.rebalanceValue < 0 ? "trim " : ""}
                      {fmtMoney(Math.abs(r.rebalanceValue), ccy)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Allocation shown as a share of each side. <strong>To reach target</strong> rebalances the
        current book to the proposed mix — it assumes no new cash, and is a class-level guide, not an
        order. Cost and yield are blended over the positions with reference data.
      </p>
    </div>
  );
}

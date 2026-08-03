// ─────────────────────────────────────────────────────────────────
// What changed between two versions of a plan.
//
// Pure — no DB, no clock, no randomness — so the summary a reviewer reads
// is reproducible from the two plans alone.
//
// Deliberately a SUMMARY, not a snapshot diff. Storing both plans on every
// save would duplicate a client's entire financial position per keystroke;
// what a review needs is which rows moved, by how much, and what the net
// worth did. Everything is capped so one pathological save cannot bloat the
// table.
// ─────────────────────────────────────────────────────────────────

import type { WealthPlan, Asset, Loan, IncomeStream, ExpenseCategory, Goal } from "@/lib/engine/types";
import { AUDIT_MAX_CHANGES, AUDIT_MAX_LABEL, AUDIT_MAX_SUMMARY, type AuditFieldChange } from "./types";

const clip = (s: string, n = AUDIT_MAX_LABEL) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

/** Money for a reviewer: exact, with the ISO code. Never abbreviated. */
export function auditMoney(n: number | null | undefined, ccy = ""): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const body = n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return ccy ? `${ccy} ${body}` : body;
}

/**
 * Net worth as the audit trail reports it: assets minus loan balances.
 *
 * Deliberately simple and independent of the simulation engine — a
 * compliance figure should not move because a projection model changed.
 */
export function planNetWorth(plan: WealthPlan | null | undefined): number {
  if (!plan) return 0;
  const assets = (plan.assets ?? []).reduce((s, a) => s + (Number.isFinite(a.value) ? a.value : 0), 0);
  const debt = (plan.loans ?? []).reduce((s, l) => s + (Number.isFinite(l.bal) ? l.bal : 0), 0);
  return Math.round((assets - debt + Number.EPSILON) * 100) / 100;
}

/**
 * A stable content hash of the plan.
 *
 * Not cryptographic and not claimed to be: it settles "was this the same
 * plan" cheaply and deterministically, and it is stored alongside the event
 * so a later dispute has something to test against. FNV-1a over a
 * key-sorted serialization.
 */
export function planHash(plan: unknown): string {
  const canon = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(canon);
    if (v && typeof v === "object") {
      const o = v as Record<string, unknown>;
      const out: Record<string, unknown> = {};
      for (const k of Object.keys(o).sort()) out[k] = canon(o[k]);
      return out;
    }
    return v;
  };
  const s = JSON.stringify(canon(plan) ?? null);
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, "0");
}

type Keyed = { id?: string };
const byId = <T extends Keyed>(rows: T[] | undefined) => {
  const m = new Map<string, T>();
  for (const r of rows ?? []) if (r?.id) m.set(r.id, r);
  return m;
};

interface SectionSpec<T extends Keyed> {
  section: string;
  rows: (p: WealthPlan) => T[] | undefined;
  label: (r: T) => string;
  /** The value a reviewer cares about; undefined means "not a money row". */
  value?: (r: T) => number | undefined;
  /** Non-money fields worth reporting a change in. */
  fields?: (r: T) => Record<string, unknown>;
}

function diffSection<T extends Keyed>(
  before: WealthPlan, after: WealthPlan, spec: SectionSpec<T>, ccy: string,
): AuditFieldChange[] {
  const out: AuditFieldChange[] = [];
  const a = byId(spec.rows(before)), b = byId(spec.rows(after));

  for (const [id, row] of b) {
    const prev = a.get(id);
    if (!prev) {
      out.push({
        section: spec.section, action: "added", label: clip(spec.label(row)),
        after: spec.value ? auditMoney(spec.value(row), ccy) : undefined,
      });
      continue;
    }
    const pv = spec.value?.(prev), nv = spec.value?.(row);
    if (pv !== undefined && nv !== undefined && Math.abs(pv - nv) >= 0.005) {
      out.push({
        section: spec.section, action: "changed", label: clip(spec.label(row)),
        before: auditMoney(pv, ccy), after: auditMoney(nv, ccy),
      });
      continue;
    }
    // Non-money edits (a renamed account, a changed rate) still matter.
    if (spec.fields) {
      const pf = spec.fields(prev), nf = spec.fields(row);
      for (const k of Object.keys(nf)) {
        if (JSON.stringify(pf[k]) !== JSON.stringify(nf[k])) {
          out.push({
            section: spec.section, action: "changed", label: clip(`${spec.label(row)} · ${k}`),
            before: pf[k] == null || pf[k] === "" ? "—" : String(pf[k]),
            after: nf[k] == null || nf[k] === "" ? "—" : String(nf[k]),
          });
          break;                        // one line per row is enough to review
        }
      }
    }
  }
  for (const [id, row] of a) {
    if (!b.has(id)) {
      out.push({
        section: spec.section, action: "removed", label: clip(spec.label(row)),
        before: spec.value ? auditMoney(spec.value(row), ccy) : undefined,
      });
    }
  }
  return out;
}

export interface PlanDiff {
  changes: AuditFieldChange[];
  summary: string;
  netWorthBefore: number;
  netWorthAfter: number;
  currency: string;
  /** True when nothing a reviewer would care about moved. */
  unchanged: boolean;
  /** How many changes were dropped by the cap, if any. */
  truncated: number;
}

/** Compare two plans and describe the difference for an audit reader. */
export function diffPlans(before: WealthPlan | null, after: WealthPlan): PlanDiff {
  const prev: WealthPlan = before ?? ({ ...after, assets: [], loans: [], incomes: [], expenses: [], goals: [], clients: [], children: [] } as WealthPlan);
  const ccy = after.currency || prev.currency || "";

  const all: AuditFieldChange[] = [
    ...diffSection<Asset>(prev, after, {
      section: "assets", rows: (p) => p.assets, label: (r) => r.label || r.type || "Account",
      value: (r) => r.value, fields: (r) => ({ label: r.label, type: r.type, liquid: r.liquid }),
    }, ccy),
    ...diffSection<Loan>(prev, after, {
      section: "loans", rows: (p) => p.loans, label: (r) => r.label || r.type || "Loan",
      value: (r) => r.bal, fields: (r) => ({ rate: r.rate, yrs: r.yrs }),
    }, ccy),
    ...diffSection<IncomeStream>(prev, after, {
      section: "income", rows: (p) => p.incomes, label: (r) => r.source || "Income",
      value: (r) => r.amount,
    }, ccy),
    ...diffSection<ExpenseCategory>(prev, after, {
      section: "expenses", rows: (p) => p.expenses, label: (r) => r.name || "Expense",
      value: (r) => r.amount,
    }, ccy),
    ...diffSection<Goal>(prev, after, {
      section: "goals", rows: (p) => p.goals, label: (r) => r.name || "Goal",
      value: (r) => r.amt, fields: (r) => ({ startYear: r.startYear, endYear: r.endYear }),
    }, ccy),
    ...diffSection<{ id?: string; first?: string; last?: string; dob?: string; risk?: string }>(prev, after, {
      section: "clients", rows: (p) => p.clients, label: (r) => `${r.first ?? ""} ${r.last ?? ""}`.trim() || "Client",
      fields: (r) => ({ dob: r.dob, risk: r.risk }),
    }, ccy),
  ];

  // Retirement is a single settings object, not a keyed list.
  const rb = prev.retirement, ra = after.retirement;
  if (JSON.stringify(rb ?? null) !== JSON.stringify(ra ?? null)) {
    const fmt = (r: typeof ra) => r ? `age ${r.retirementAge}, ${auditMoney(r.annualSpending, ccy)}/yr to ${r.planToAge ?? 90}` : "not set";
    all.push({ section: "retirement", action: "changed", label: "Retirement plan", before: fmt(rb), after: fmt(ra) });
  }

  const truncated = Math.max(0, all.length - AUDIT_MAX_CHANGES);
  const changes = all.slice(0, AUDIT_MAX_CHANGES);

  const nwB = planNetWorth(before), nwA = planNetWorth(after);
  const counts = new Map<string, number>();
  for (const c of all) counts.set(c.section, (counts.get(c.section) ?? 0) + 1);
  const parts = [...counts.entries()].map(([s, n]) => `${n} ${s}`);

  let summary: string;
  if (!all.length) {
    summary = "Saved with no material change";
  } else {
    summary = parts.join(", ");
    if (truncated) summary += ` (+${truncated} more)`;
    if (Math.abs(nwA - nwB) >= 0.005) {
      summary += ` · net worth ${auditMoney(nwB, ccy)} → ${auditMoney(nwA, ccy)}`;
    }
  }

  return {
    changes, summary: clip(summary, AUDIT_MAX_SUMMARY),
    netWorthBefore: nwB, netWorthAfter: nwA, currency: ccy,
    unchanged: all.length === 0, truncated,
  };
}

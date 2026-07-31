// ─────────────────────────────────────────────────────────────────
// Applying a wa.feed/v1 envelope to a WealthPlan.
//
// Split into two pure steps so the risky part is provable:
//   diffPlan(plan, envelope)      → the proposed changes, classified
//   applyChanges(plan, changes)   → a NEW plan with the selected ones
//
// Rules that protect the advisor's data:
//   • Nothing is destructive. A feed can create or update records; it can
//     never delete one, and an "update" only writes fields the feed
//     actually supplied — a payload missing `rate` will not blank the
//     rate on an existing loan.
//   • Re-running a feed is idempotent. Records are matched on a
//     normalized natural key, so the second run reports "unchanged"
//     instead of creating duplicates.
//   • The caller chooses. Every change is individually selectable, and
//     applyChanges is a pure function of (plan, changes, selection) — the
//     UI can preview exactly what it is about to write.
// ─────────────────────────────────────────────────────────────────

import type {
  WealthPlan, Asset, AssetClass, Loan, Goal, Client, Child,
  IncomeStream, ExpenseCategory, CountryCode,
} from "@/lib/engine/types";
import type {
  FeedEnvelope, FeedAsset, FeedHolding, FeedLiability, FeedHousehold, FeedIncome,
} from "./model";

export type ChangeSection =
  | "clients" | "children" | "incomes" | "expenses"
  | "assets" | "loans" | "goals" | "retirement";

export type ChangeKind = "create" | "update" | "unchanged";

export interface PlanChange {
  /** Stable key for selection + React lists. */
  key: string;
  section: ChangeSection;
  kind: ChangeKind;
  /** What the record is, in the advisor's words. */
  label: string;
  /** Current value, when this is an update. */
  before?: string;
  /** Value after applying. */
  after: string;
  /** Provenance from the feed (_src). */
  source?: string;
  /** Existing record id for updates; absent for creates. */
  targetId?: string;
  /** Fields to write (already merged for updates). */
  patch: Record<string, unknown>;
}

// ─── helpers ──────────────────────────────────────────────────────
const norm = (s: unknown) => String(s ?? "").toLowerCase().replace(/[\s\-_.]+/g, " ").trim();
const money = (n: number, ccy?: string) =>
  `${ccy ? ccy + " " : ""}${Math.round(n).toLocaleString("en-US")}`;
const sameMoney = (a: number, b: number) => Math.abs(a - b) < 0.005;
const newId = () => "fd_" + Math.random().toString(36).slice(2, 10);

/** Account-type hints that mean "locked until retirement". */
const LOCKED = /pension|retirement|401|403b|ira|rrsp|superannu|bvg|lpp|pillar|vorsorge|freiz[uü]g|sipp|pens/i;
/** Hints that map onto an asset class. */
function inferClass(hint: string, fallback: AssetClass = "mixed"): AssetClass {
  const h = hint.toLowerCase();
  if (/cash|saving|checking|current|privatkonto|sparkonto|money market|deposit|settlement/.test(h)) return "cash";
  if (/bond|fixed income|obligation|anleihe/.test(h)) return "fixed_income";
  if (/propert|real estate|immobil|home|house/.test(h)) return "real_estate";
  if (/crypto|bitcoin|digital asset/.test(h)) return "crypto";
  if (/commodit|gold|silver/.test(h)) return "commodity";
  if (/equit|stock|share|aktie/.test(h)) return "equity";
  return fallback;
}
function feedClassToPlan(cls: string | undefined, fallback: AssetClass): AssetClass {
  const valid: AssetClass[] = ["equity", "fixed_income", "real_estate", "commodity", "cash", "mixed", "alternative", "crypto"];
  if (cls && (valid as string[]).includes(cls)) return cls as AssetClass;
  // Feed classes the plan model folds into "alternative".
  if (cls && /hedge|private_equity|structured/.test(cls)) return "alternative";
  return fallback;
}

/** Only keep fields the feed actually supplied — never blank existing data. */
function definedOnly(o: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v !== undefined && v !== null && v !== "") out[k] = v;
  }
  return out;
}

/** True when applying `patch` would leave `existing` unchanged. */
function isNoop(existing: Record<string, unknown>, patch: Record<string, unknown>): boolean {
  return Object.entries(patch).every(([k, v]) => {
    const cur = existing[k];
    if (typeof v === "number" && typeof cur === "number") return sameMoney(v, cur);
    return norm(cur) === norm(v);
  });
}

// ─── diff ─────────────────────────────────────────────────────────
export function diffPlan(plan: WealthPlan, envelope: FeedEnvelope, ccy?: string): PlanChange[] {
  const changes: PlanChange[] = [];
  const currency = ccy || plan.currency || "";
  let seq = 0;
  const key = (section: string) => `${section}:${seq++}`;

  // ── Household → clients / children ──
  (envelope.household ?? []).forEach((h: FeedHousehold) => {
    if (h.role === "child") {
      const existing = plan.children.find((c) => norm(`${c.first} ${c.last}`) === norm(`${h.first} ${h.last}`));
      const patch = definedOnly({ first: h.first, last: h.last, dob: h.dob });
      if (!patch.first && !patch.last) return;
      const label = `${h.first ?? ""} ${h.last ?? ""}`.trim() || "Child";
      if (!existing) {
        changes.push({ key: key("children"), section: "children", kind: "create", label,
          after: h.dob ? `born ${h.dob}` : "new dependent", source: h._src, patch });
      } else {
        const noop = isNoop(existing as unknown as Record<string, unknown>, patch);
        changes.push({ key: key("children"), section: "children", kind: noop ? "unchanged" : "update",
          label, before: existing.dob || "—", after: h.dob || "—", source: h._src,
          targetId: existing.id, patch });
      }
      return;
    }

    const idx = h.role === "client2" ? 1 : 0;
    const existing: Client | undefined = plan.clients[idx];
    const patch = definedOnly({
      first: h.first, last: h.last, dob: h.dob, city: h.city, zip: h.postal,
      state: h.state, country: h.country as CountryCode | undefined,
      risk: h.riskTolerance, horizon: h.timeHorizon,
    });
    if (!Object.keys(patch).length) return;
    const label = `${h.first ?? ""} ${h.last ?? ""}`.trim() || (idx === 1 ? "Client 2" : "Client 1");
    const summary = [h.city, h.country, h.riskTolerance].filter(Boolean).join(" · ") || "client details";
    if (!existing) {
      changes.push({ key: key("clients"), section: "clients", kind: "create",
        label: `${label} (client ${idx + 1})`, after: summary, source: h._src, patch: { ...patch, _index: idx } });
    } else {
      const noop = isNoop(existing as unknown as Record<string, unknown>, patch);
      changes.push({ key: key("clients"), section: "clients", kind: noop ? "unchanged" : "update",
        label: `${label} (client ${idx + 1})`,
        before: [existing.city, existing.country, existing.risk].filter(Boolean).join(" · ") || "—",
        after: summary, source: h._src, targetId: existing.id, patch: { ...patch, _index: idx } });
    }
  });

  // ── Income ──
  (envelope.income ?? []).forEach((r: FeedIncome) => {
    const amount = typeof r.primary === "number" ? r.primary : null;
    if (amount == null) return;
    const clientIdx = r.who === "client2" ? 1 : 0;
    const clientId = plan.clients[clientIdx]?.id ?? plan.clients[0]?.id ?? "";
    const source = "Feed income";
    const existing = plan.incomes.find((i) => i.clientId === clientId && norm(i.source) === norm(source));
    // Carry the INDEX, not just the id: applyChanges re-resolves it against
    // the plan it is actually writing to, so an income can never end up
    // pointing at a client that doesn't exist there (which Zod rejects).
    const patch = { clientId, source, amount, _clientIndex: clientIdx };
    if (!existing) {
      changes.push({ key: key("incomes"), section: "incomes", kind: "create",
        label: `${source} (client ${clientIdx + 1})`, after: money(amount, currency), source: r._src, patch });
    } else {
      const noop = sameMoney(existing.amount, amount);
      changes.push({ key: key("incomes"), section: "incomes", kind: noop ? "unchanged" : "update",
        label: `${source} (client ${clientIdx + 1})`, before: money(existing.amount, currency),
        after: money(amount, currency), source: r._src, targetId: existing.id, patch });
    }
  });

  // ── Expenses ──
  // Feed rows are {name, amount, period?}. The plan stores MONTHLY amounts,
  // so an annual figure is converted rather than silently 12x-ing the plan.
  (envelope.expenses ?? []).forEach((raw) => {
    const r = raw as Record<string, unknown>;
    const rawAmount = typeof r.amount === "number" ? r.amount : null;
    if (rawAmount == null) return;
    const period = String(r.period ?? "monthly").toLowerCase();
    const amount = period.startsWith("ann") || period.startsWith("year") ? rawAmount / 12 : rawAmount;
    const name = String(r.name ?? "Feed expenses");
    const existing = plan.expenses.find((e) => norm(e.name) === norm(name));
    const patch = { name, amount };
    if (!existing) {
      changes.push({ key: key("expenses"), section: "expenses", kind: "create",
        label: name, after: `${money(amount, currency)}/mo`, source: r._src as string, patch });
    } else {
      const noop = sameMoney(existing.amount, amount);
      changes.push({ key: key("expenses"), section: "expenses", kind: noop ? "unchanged" : "update",
        label: name, before: `${money(existing.amount, currency)}/mo`, after: `${money(amount, currency)}/mo`,
        source: r._src as string, targetId: existing.id, patch });
    }
  });

  // ── Assets (accounts) ──
  (envelope.assets ?? []).forEach((a: FeedAsset) => {
    if (typeof a.value !== "number" || !Number.isFinite(a.value)) return;
    const label = a.label || a.accountTypeHint || "Account";
    const country = (a.country as CountryCode | undefined) ?? plan.clients[0]?.country;
    // Country only DISAMBIGUATES same-named accounts — when either side
    // doesn't record one, the label alone matches. (Requiring both to agree
    // made an existing country-less account look new and duplicated it.)
    const existing = plan.assets.find((x) => {
      if (norm(x.label) !== norm(label)) return false;
      const xc = norm(x.country ?? ""), fc = norm(country ?? "");
      return !xc || !fc || xc === fc;
    });
    const hint = a.accountTypeHint || label;
    const patch = definedOnly({
      label, value: a.value, type: a.accountTypeHint || "account",
      country, cls: inferClass(hint), liquid: !LOCKED.test(hint),
    });
    if (!existing) {
      changes.push({ key: key("assets"), section: "assets", kind: "create", label,
        after: money(a.value, a.ccy || currency), source: a._src, patch });
    } else {
      const noop = sameMoney(existing.value, a.value);
      changes.push({ key: key("assets"), section: "assets", kind: noop ? "unchanged" : "update",
        label, before: money(existing.value, a.ccy || currency), after: money(a.value, a.ccy || currency),
        source: a._src, targetId: existing.id,
        // On update only the value moves — never re-classify an account the
        // advisor may have corrected by hand.
        patch: { value: a.value } });
    }
  });

  // ── Holdings → assets ──
  (envelope.holdings ?? []).forEach((h: FeedHolding) => {
    if (typeof h.val !== "number" || !Number.isFinite(h.val)) return;
    const label = h.name || h.tkr || "Position";
    const existing = plan.assets.find(
      (x) => norm(x.label) === norm(label) || (!!h.tkr && norm(x.type) === norm(h.tkr))
    );
    const patch = definedOnly({
      label, value: h.val, type: h.tkr || h.type || "holding",
      cls: feedClassToPlan(h.cls, inferClass(`${h.name} ${h.type ?? ""}`, "equity")),
      liquid: true, country: plan.clients[0]?.country,
    });
    if (!existing) {
      changes.push({ key: key("assets"), section: "assets", kind: "create",
        label: h.tkr ? `${label} (${h.tkr})` : label, after: money(h.val, currency), source: h._src, patch });
    } else {
      const noop = sameMoney(existing.value, h.val);
      changes.push({ key: key("assets"), section: "assets", kind: noop ? "unchanged" : "update",
        label: h.tkr ? `${label} (${h.tkr})` : label, before: money(existing.value, currency),
        after: money(h.val, currency), source: h._src, targetId: existing.id, patch: { value: h.val } });
    }
  });

  // ── Liabilities → loans ──
  (envelope.liabilities ?? []).forEach((l: FeedLiability) => {
    if (typeof l.balance !== "number" || !Number.isFinite(l.balance)) return;
    const label = l.label || l.type || "Loan";
    const existing = plan.loans.find((x) => norm(x.label) === norm(label));
    const patch = definedOnly({
      label, bal: l.balance, type: l.type || "other",
      rate: typeof l.ratePct === "number" ? l.ratePct : undefined,
      yrs: typeof l.years === "number" ? l.years : undefined,
    });
    if (!existing) {
      changes.push({ key: key("loans"), section: "loans", kind: "create", label,
        after: money(l.balance, currency), source: l._src,
        // A loan needs numeric rate/term to simulate; default rather than NaN.
        patch: { rate: 0, yrs: 0, ...patch } });
    } else {
      const noop = isNoop(existing as unknown as Record<string, unknown>, patch);
      changes.push({ key: key("loans"), section: "loans", kind: noop ? "unchanged" : "update",
        label, before: money(existing.bal, currency), after: money(l.balance, currency),
        source: l._src, targetId: existing.id, patch });
    }
  });

  // ── Goals ──
  (envelope.goals ?? []).forEach((raw) => {
    const g = raw as Record<string, unknown>;
    const amt = typeof g.amt === "number" ? g.amt : null;
    const name = String(g.name ?? "").trim();
    if (amt == null || !name) return;
    const existing = plan.goals.find((x) => norm(x.name) === norm(name));
    const patch = definedOnly({
      name, amt,
      startYear: typeof g.startYear === "number" ? g.startYear : undefined,
      endYear: typeof g.endYear === "number" ? g.endYear : undefined,
      cat: g.cat as string | undefined, tier: g.tier as Goal["tier"],
    });
    const span = g.startYear ? `${g.startYear}–${g.endYear ?? g.startYear}` : "";
    if (!existing) {
      const year = new Date().getFullYear();
      changes.push({ key: key("goals"), section: "goals", kind: "create", label: name,
        after: `${money(amt, currency)}/yr ${span}`.trim(), source: g._src as string,
        patch: { startYear: year, endYear: year, ...patch } });
    } else {
      const noop = isNoop(existing as unknown as Record<string, unknown>, patch);
      changes.push({ key: key("goals"), section: "goals", kind: noop ? "unchanged" : "update",
        label: name, before: `${money(existing.amt, currency)}/yr ${existing.startYear}–${existing.endYear}`,
        after: `${money(amt, currency)}/yr ${span}`.trim(), source: g._src as string,
        targetId: existing.id, patch });
    }
  });

  // ── Retirement ──
  (envelope.retirement ?? []).forEach((raw) => {
    const r = raw as Record<string, unknown>;
    const patch = definedOnly({
      retirementAge: typeof r.retirementAge === "number" ? r.retirementAge : undefined,
      annualSpending: typeof r.annualSpending === "number" ? r.annualSpending : undefined,
      planToAge: typeof r.planToAge === "number" ? r.planToAge : undefined,
    });
    if (!Object.keys(patch).length) return;
    const cur = plan.retirement;
    const describe = (x?: Record<string, unknown> | null) =>
      x ? `retire ${x.retirementAge ?? "—"}, spend ${typeof x.annualSpending === "number" ? money(x.annualSpending, currency) : "—"}` : "—";
    const noop = !!cur && isNoop(cur as unknown as Record<string, unknown>, patch);
    changes.push({ key: key("retirement"), section: "retirement", kind: cur ? (noop ? "unchanged" : "update") : "create",
      label: "Retirement settings", before: cur ? describe(cur as unknown as Record<string, unknown>) : undefined,
      after: describe(patch), source: r._src as string, patch });
  });

  return changes;
}

// ─── apply ────────────────────────────────────────────────────────
/**
 * Returns a NEW plan with the selected changes applied. Pure: the input
 * plan is never mutated, so the caller can keep it as the undo snapshot.
 */
export function applyChanges(plan: WealthPlan, changes: PlanChange[], selectedKeys: Set<string>): WealthPlan {
  const next: WealthPlan = {
    ...plan,
    clients: plan.clients.map((c) => ({ ...c })),
    children: plan.children.map((c) => ({ ...c })),
    incomes: plan.incomes.map((c) => ({ ...c })),
    expenses: plan.expenses.map((c) => ({ ...c })),
    assets: plan.assets.map((c) => ({ ...c })),
    loans: plan.loans.map((c) => ({ ...c })),
    goals: plan.goals.map((c) => ({ ...c })),
    retirement: plan.retirement ? { ...plan.retirement } : undefined,
    updatedAt: new Date().toISOString(),
  };

  for (const ch of changes) {
    if (!selectedKeys.has(ch.key) || ch.kind === "unchanged") continue;
    const patch = { ...ch.patch };

    switch (ch.section) {
      case "clients": {
        const idx = Number(patch._index ?? 0);
        delete patch._index;
        if (next.clients[idx]) next.clients[idx] = { ...next.clients[idx], ...patch } as Client;
        else next.clients[idx] = { id: newId(), first: "", last: "", ...patch } as Client;
        break;
      }
      case "children": {
        if (ch.targetId) {
          next.children = next.children.map((c) => (c.id === ch.targetId ? { ...c, ...patch } as Child : c));
        } else {
          next.children.push({ id: newId(), first: "", last: "", dob: "", ...patch } as Child);
        }
        break;
      }
      case "incomes": {
        // Re-resolve the owning client against THIS plan — the diff may have
        // been computed against a different (or since-edited) copy.
        const wantIdx = Number(patch._clientIndex ?? 0);
        delete patch._clientIndex;
        const owner = next.clients[wantIdx] ?? next.clients[0];
        if (!owner) break;                       // no client to attach income to
        patch.clientId = owner.id;
        if (ch.targetId) next.incomes = next.incomes.map((i) => (i.id === ch.targetId ? { ...i, ...patch } as IncomeStream : i));
        else next.incomes.push({ id: newId(), source: "", amount: 0, ...patch } as IncomeStream);
        break;
      }
      case "expenses": {
        if (ch.targetId) next.expenses = next.expenses.map((e) => (e.id === ch.targetId ? { ...e, ...patch } as ExpenseCategory : e));
        else next.expenses.push({ id: newId(), name: "", amount: 0, ...patch } as ExpenseCategory);
        break;
      }
      case "assets": {
        if (ch.targetId) next.assets = next.assets.map((a) => (a.id === ch.targetId ? { ...a, ...patch } as Asset : a));
        else next.assets.push({ id: newId(), type: "account", value: 0, liquid: true, ...patch } as Asset);
        break;
      }
      case "loans": {
        if (ch.targetId) next.loans = next.loans.map((l) => (l.id === ch.targetId ? { ...l, ...patch } as Loan : l));
        else next.loans.push({ id: newId(), type: "other", bal: 0, rate: 0, yrs: 0, ...patch } as Loan);
        break;
      }
      case "goals": {
        if (ch.targetId) next.goals = next.goals.map((g) => (g.id === ch.targetId ? { ...g, ...patch } as Goal : g));
        else next.goals.push({ id: newId(), name: "", amt: 0, startYear: new Date().getFullYear(), endYear: new Date().getFullYear(), ...patch } as Goal);
        break;
      }
      case "retirement": {
        next.retirement = {
          enabled: next.retirement?.enabled ?? true,
          retirementAge: next.retirement?.retirementAge ?? 65,
          annualSpending: next.retirement?.annualSpending ?? 0,
          ...next.retirement, ...patch,
        } as WealthPlan["retirement"];
        break;
      }
    }
  }
  return next;
}

/** Counts for the summary line. */
export function summarize(changes: PlanChange[]) {
  return {
    create: changes.filter((c) => c.kind === "create").length,
    update: changes.filter((c) => c.kind === "update").length,
    unchanged: changes.filter((c) => c.kind === "unchanged").length,
    total: changes.length,
  };
}

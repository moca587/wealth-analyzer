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
  /**
   * Applying this row would put a WRONG number in the plan, so the UI leaves it
   * unselected: a foreign-currency amount stored as plan currency, an account
   * total that duplicates the positions in the same feed, a retirement age the
   * feed never sent.
   *
   * Deliberately narrower than `warning`. An incomplete-but-correct row — a
   * mortgage balance with no rate — is NOT risky: leaving a CHF 840,000 debt
   * out of the plan is a bigger error than carrying it without a rate, and an
   * unticked-by-default row is one an advisor will miss. Those get a `warning`
   * and stay selected.
   */
  risky?: boolean;
  /** Shown on the review row whenever the merge had to make a judgement call. */
  warning?: string;
}

// ─── helpers ──────────────────────────────────────────────────────
const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .normalize("NFKD").replace(/[̀-ͯ]/g, "")   // Zürich === Zurich
    .replace(/[^a-z0-9]+/g, " ")                          // punctuation-insensitive
    .trim();

/**
 * A matching key that is safe to compare. Returns "" for anything that
 * normalizes away entirely (blank, whitespace, punctuation-only) — and an
 * empty key must NEVER match, or a junk feed label silently overwrites the
 * first plan record that happens to have no label.
 */
const matchKey = (s: unknown) => {
  const n = norm(s);
  return n.length ? n : "";
};
const money = (n: number, ccy?: string) =>
  `${ccy ? ccy + " " : ""}${Math.round(n).toLocaleString("en-US")}`;
const sameMoney = (a: number, b: number) => Math.abs(a - b) < 0.005;
const newId = () => "fd_" + Math.random().toString(36).slice(2, 10);

/** Account-type hints that mean "locked until retirement". */
const LOCKED = /pension|retirement|401|403b|ira|rrsp|superannu|bvg|lpp|pillar|vorsorge|freiz[uü]g|s[aä]ule|sipp|pens/i;
/**
 * Words that appear in `type` on ordinary records and are NOT tickers.
 * Matching a feed ticker against `type` without this let a fund whose symbol
 * happened to be a generic token overwrite an unrelated account.
 */
const GENERIC_TYPE = /^(account|holding|position|other|etf|fund|stock|bond|cash|savings|deposit|depot|konto|security)$/;
/**
 * Signals that a plan record is a bank/custody ACCOUNT rather than a security
 * position. A holding row is never allowed to match one of these by name:
 * a CHF 5,000 cash line called "Pensionskasse UBS" arriving in a positions
 * file otherwise overwrote a CHF 480,000 pension account with the cash figure.
 */
const ACCOUNT_LIKE = /account|konto|conto|compte|cuenta|depot|dep[oó]sito|savings|checking|current|bank|iban|portfolio|custody|wallet/i;
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

  // Records already claimed by an earlier row of THIS payload, so two feed
  // rows can never both write the same plan record (which silently made the
  // last one win) and a repeated label can't create twin plan records.
  const claimed = new Set<string>();
  // Keys created during this diff, so a payload containing the same account
  // twice produces ONE create, not a pair that can never converge.
  const createdKeys = new Set<string>();

  /**
   * Resolve a feed row against the plan, trying each finder in priority order.
   *
   * The three outcomes must stay distinct. Folding "every match is already
   * taken" into "no match" is what made a duplicated row create a second plan
   * record on every subsequent sync: run 1 collapsed the pair into one record,
   * then run 2 matched it with the first row and CREATED for the second, so the
   * plan grew by one phantom account per refresh and never converged.
   */
  const resolve = <T extends { id: string }>(finders: Array<() => T[]>): { rec?: T; dupe?: boolean } => {
    let sawClaimed = false;
    for (const find of finders) {
      for (const cand of find()) {
        if (claimed.has(cand.id)) { sawClaimed = true; continue; }
        claimed.add(cand.id);
        return { rec: cand };
      }
    }
    return sawClaimed ? { dupe: true } : {};
  };


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
    // A date we would not guess at. Everything else on the row is still good,
    // so this warns rather than blocking — but it must be said out loud,
    // because a client with no DOB has no retirement horizon.
    const dobNote = h.dobRaw && !h.dob && !existing?.dob
      ? { warning: `Date of birth "${h.dobRaw}" is ambiguous (day/month order) — enter it on the Household tab.` }
      : {};
    if (!existing) {
      changes.push({ key: key("clients"), section: "clients", kind: "create",
        label: `${label} (client ${idx + 1})`, after: summary, source: h._src,
        patch: { ...patch, _index: idx }, ...dobNote });
    } else {
      const noop = isNoop(existing as unknown as Record<string, unknown>, patch);
      changes.push({ key: key("clients"), section: "clients", kind: noop ? "unchanged" : "update",
        label: `${label} (client ${idx + 1})`,
        before: [existing.city, existing.country, existing.risk].filter(Boolean).join(" · ") || "—",
        after: summary, source: h._src, targetId: existing.id,
        patch: { ...patch, _index: idx }, ...dobNote });
    }
  });

  // ── Income ──
  (envelope.income ?? []).forEach((r: FeedIncome) => {
    const amount = typeof r.primary === "number" ? r.primary : null;
    if (amount == null) return;
    const clientIdx = r.who === "client2" ? 1 : 0;
    // NO fallback to client 1. When the same payload is also creating client 2,
    // that client has no income yet by definition — falling back made both
    // people's salaries resolve to client 1's single record, so the second row
    // overwrote the first and the household silently lost an entire income
    // (CHF 435,000 of salary arrived as CHF 285,000).
    const targetClient = plan.clients[clientIdx];
    const mine = targetClient ? plan.incomes.filter((i) => i.clientId === targetClient.id) : [];
    // A CRM salary is the SAME salary the advisor already captured. Keying on
    // a synthetic "Feed income" source guaranteed it never matched, so every
    // sync added a second full salary and doubled the household's income.
    const { rec: existing, dupe } = resolve<IncomeStream>([
      () => mine.filter((i) => norm(i.source) === "salary"),
      () => mine.filter((i) => /salary|income|wage|lohn|gehalt|salaire/.test(norm(i.source))),
      () => (mine.length === 1 ? mine : []),
    ]);
    if (dupe) return;   // two feed rows for one stream
    const clientId = targetClient?.id ?? "";
    const source = existing?.source || "Salary";
    // Carry the INDEX, not just the id: applyChanges re-resolves it against
    // the plan it is actually writing to, so an income can never end up
    // pointing at a client that doesn't exist there (which Zod rejects).
    const patch = { clientId, source, amount, _clientIndex: clientIdx };
    const who = `client ${clientIdx + 1}`;
    if (!existing) {
      // Creating alongside existing streams would add to, not replace, the
      // household's income — make that visible rather than silent.
      const others = mine.length > 0;
      changes.push({ key: key("incomes"), section: "incomes", kind: "create",
        label: `${source} (${who})`, after: money(amount, currency), source: r._src, patch,
        ...(others ? { risky: true, warning: `This client already has ${mine.length} income stream(s) totalling ${money(mine.reduce((s, i) => s + i.amount, 0), currency)}; applying ADDS to that total.` } : {}) });
    } else {
      const noop = sameMoney(existing.amount, amount);
      changes.push({ key: key("incomes"), section: "incomes", kind: noop ? "unchanged" : "update",
        label: `${source} (${who})`, before: money(existing.amount, currency),
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

  const foreign = (recCcy?: string) =>
    recCcy && currency && norm(recCcy) !== norm(currency) ? recCcy : "";

  /**
   * A custodian feed routinely carries BOTH a custody account's total AND the
   * positions held inside it. Applying both counts the same money twice — an
   * CHF 850,000 portfolio lands as CHF 1.7m, and every downstream number
   * (net worth, goal success, retirement probability) is wrong by a factor
   * the advisor has no reason to suspect.
   *
   * There is no way to tell from the wire which the user wants, so this does
   * not silently drop either side: it flags the ACCOUNT row, because the
   * positions are the more useful record (the engine models them per asset
   * class) and the flagged row starts unticked in the review UI.
   */
  const holdingsTotal = (envelope.holdings ?? [])
    .reduce((s, h) => s + (typeof h.val === "number" && Number.isFinite(h.val) ? h.val : 0), 0);
  const holdingCount = (envelope.holdings ?? []).length;
  const overlapsHoldings = (v: number) =>
    holdingCount > 0 && holdingsTotal > 0 && v > 0 &&
    Math.abs(v - holdingsTotal) <= Math.max(1, holdingsTotal * 0.005);   // within 0.5%

  // ── Assets (accounts) ──
  (envelope.assets ?? []).forEach((a: FeedAsset) => {
    if (typeof a.value !== "number" || !Number.isFinite(a.value)) return;
    const label = (a.label || a.accountTypeHint || "").trim() || "Account";
    const country = (a.country as CountryCode | undefined) ?? plan.clients[0]?.country;
    const ref = a.accountRef ? `acct:${matchKey(a.accountRef)}` : "";
    const lk = matchKey(label);

    // Identity first (survives a renamed account), then label — but only
    // against records that are accounts, never against a security position.
    const { rec: existing, dupe } = resolve<Asset>([
      () => (ref ? plan.assets.filter((x) => x.feedRef === ref) : []),
      () => (lk ? plan.assets.filter((x) =>
        !String(x.feedRef ?? "").startsWith("hold:") &&
        matchKey(x.label) === lk &&
        (() => { const xc = matchKey(x.country ?? ""), fc = matchKey(country ?? ""); return !xc || !fc || xc === fc; })()
      ) : []),
    ]);
    if (dupe) return;   // the same account twice in one payload

    const hint = `${a.accountTypeHint || ""} ${label}`.trim();
    const fx = foreign(a.ccy);
    const patch = definedOnly({
      label, value: a.value, type: a.accountTypeHint || "account",
      country, cls: inferClass(hint), liquid: !LOCKED.test(hint),
      feedRef: ref || (lk ? `acct:${lk}` : undefined),
    });
    const shown = money(a.value, a.ccy || currency);
    const warnings: string[] = [];
    if (fx) warnings.push(`Amount is in ${fx}; the plan is kept in ${currency} and no conversion is applied.`);
    if (overlapsHoldings(a.value)) {
      warnings.push(
        `This total matches the ${holdingCount} position${holdingCount === 1 ? "" : "s"} in the same feed — ` +
        `applying both would count the money twice. Apply the positions, or this account, not both.`
      );
    }
    const risk = warnings.length ? { risky: true, warning: warnings.join(" ") } : {};

    if (!existing) {
      const dupKey = `assets:${ref || lk}`;
      if (dupKey !== "assets:" && createdKeys.has(dupKey)) return;   // same account twice in one payload
      createdKeys.add(dupKey);
      changes.push({ key: key("assets"), section: "assets", kind: "create", label,
        after: shown, source: a._src, patch, ...risk });
    } else {
      const noop = sameMoney(existing.value, a.value);
      changes.push({ key: key("assets"), section: "assets", kind: noop ? "unchanged" : "update",
        label, before: money(existing.value, a.ccy || currency), after: shown,
        source: a._src, targetId: existing.id,
        // On update only the value (and the identity marker) move — never
        // re-classify an account the advisor may have corrected by hand.
        patch: { value: a.value, ...(patch.feedRef ? { feedRef: patch.feedRef } : {}) }, ...risk });
    }
  });

  // ── Holdings → assets ──
  (envelope.holdings ?? []).forEach((h: FeedHolding) => {
    if (typeof h.val !== "number" || !Number.isFinite(h.val)) return;
    const name = (h.name || h.tkr || "").trim() || "Position";
    const tk = matchKey(h.tkr);
    const nk = matchKey(name);
    const ref = tk ? `hold:${tk}` : nk ? `hold:${nk}` : "";

    // A position matches a position — never a bank account. Matching a
    // holding NAME against any asset label let a small cash line called
    // "Pensionskasse UBS" overwrite a CHF 480,000 pension account.
    const isPositionRecord = (x: Asset) => {
      const fr = String(x.feedRef ?? "");
      if (fr.startsWith("hold:")) return true;    // known position
      if (fr.startsWith("acct:")) return false;   // known account
      // Hand-entered, so there is no provenance to trust: refuse anything that
      // reads like an account or a locked vehicle.
      const sig = `${x.type ?? ""} ${x.label ?? ""}`;
      return !LOCKED.test(sig) && !ACCOUNT_LIKE.test(sig);
    };
    const { rec: existing, dupe } = resolve<Asset>([
      () => (ref ? plan.assets.filter((x) => x.feedRef === ref) : []),
      () => (nk ? plan.assets.filter((x) => isPositionRecord(x) && matchKey(x.label) === nk) : []),
      // Ticker may be stored in `type` on hand-entered rows — but only when it
      // is a real ticker, never a generic word like "account" or "holding".
      () => (tk && !GENERIC_TYPE.test(tk)
        ? plan.assets.filter((x) => isPositionRecord(x) && matchKey(x.type) === tk)
        : []),
    ]);
    if (dupe) return;

    const fx = foreign((h as { ccy?: string }).ccy);
    const patch = definedOnly({
      label: name, value: h.val, type: h.tkr || h.type || "holding",
      cls: feedClassToPlan(h.cls, inferClass(`${h.name} ${h.type ?? ""}`, "equity")),
      liquid: true, country: plan.clients[0]?.country,
      feedRef: ref || undefined,
    });
    const shownLabel = h.tkr ? `${name} (${h.tkr})` : name;
    const risk = fx ? { risky: true, warning: `Amount is in ${fx}; the plan is kept in ${currency} and no conversion is applied.` } : {};

    if (!existing) {
      const dupKey = `assets:${ref || nk}`;
      if (dupKey !== "assets:" && createdKeys.has(dupKey)) return;
      createdKeys.add(dupKey);
      changes.push({ key: key("assets"), section: "assets", kind: "create",
        label: shownLabel, after: money(h.val, currency), source: h._src, patch, ...risk });
    } else {
      const noop = sameMoney(existing.value, h.val);
      changes.push({ key: key("assets"), section: "assets", kind: noop ? "unchanged" : "update",
        label: shownLabel, before: money(existing.value, currency),
        after: money(h.val, currency), source: h._src, targetId: existing.id,
        patch: { value: h.val, ...(patch.feedRef ? { feedRef: patch.feedRef } : {}) }, ...risk });
    }
  });

  // ── Liabilities → loans ──
  (envelope.liabilities ?? []).forEach((l: FeedLiability) => {
    if (typeof l.balance !== "number" || !Number.isFinite(l.balance)) return;
    const label = (l.label || l.type || "").trim() || "Loan";
    const ref = l.accountRef ? `acct:${matchKey(l.accountRef)}` : "";
    const lk = matchKey(label);
    const existing =
      (ref ? plan.loans.find((x) => x.feedRef === ref) : undefined) ??
      (lk ? plan.loans.find((x) => matchKey(x.label) === lk) : undefined);

    const hasTerms = typeof l.ratePct === "number" || typeof l.years === "number";
    const fx = foreign((l as { ccy?: string }).ccy);
    const patch = definedOnly({
      label, bal: l.balance, type: l.type || "other",
      rate: typeof l.ratePct === "number" ? l.ratePct : undefined,
      yrs: typeof l.years === "number" ? l.years : undefined,
      feedRef: ref || (lk ? `acct:${lk}` : undefined),
    });
    // Foreign currency puts a wrong NUMBER in the plan → risky, unselected.
    // A missing rate/term leaves the balance CORRECT but unamortized → warn,
    // and keep it selected: a mortgage silently absent from the plan overstates
    // net worth by its full balance, which is the worse of the two errors.
    const missingTerms = !hasTerms && !existing;
    const warnings = [
      fx ? `Amount is in ${fx}; no conversion is applied.` : "",
      missingTerms ? "The feed sent no interest rate or term, so this is carried as a balance with no repayment schedule — set them on the plan afterwards." : "",
    ].filter(Boolean);
    const risk = warnings.length
      ? { ...(fx ? { risky: true } : {}), warning: warnings.join(" ") }
      : {};

    if (!existing) {
      const dupKey = `loans:${ref || lk}`;
      if (dupKey !== "loans:" && createdKeys.has(dupKey)) return;
      createdKeys.add(dupKey);
      changes.push({ key: key("loans"), section: "loans", kind: "create", label,
        after: money(l.balance, currency), source: l._src,
        // A loan needs numeric rate/term to simulate; default rather than NaN.
        patch: { rate: 0, yrs: 0, ...patch }, ...risk });
    } else {
      const noop = isNoop(existing as unknown as Record<string, unknown>, patch);
      changes.push({ key: key("loans"), section: "loans", kind: noop ? "unchanged" : "update",
        label, before: money(existing.bal, currency), after: money(l.balance, currency),
        source: l._src, targetId: existing.id, patch, ...risk });
    }
  });

  // ── A feed account that has returned to credit clears its old loan ──
  // Without this, a repaid overdraft stayed on the plan forever: the credit
  // balance arrives as an asset and can never match the liability record.
  (envelope.assets ?? []).forEach((a: FeedAsset) => {
    const ref = a.accountRef ? `acct:${matchKey(a.accountRef)}` : "";
    if (!ref || typeof a.value !== "number" || a.value < 0) return;
    const stale = plan.loans.find((x) => x.feedRef === ref && x.bal > 0);
    if (!stale) return;
    changes.push({
      key: key("loans"), section: "loans", kind: "update",
      label: stale.label || "Overdraft",
      before: money(stale.bal, currency), after: money(0, currency),
      source: a._src, targetId: stale.id, patch: { bal: 0 },
      warning: "This account is back in credit, so the recorded overdraft is cleared.",
    });
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
    // Creating a retirement block needs a real retirement age. Defaulting to
    // 65 switched the whole plan into decumulation on an age the feed never
    // stated, while the preview still read "retire —".
    if (!cur && patch.retirementAge == null) {
      changes.push({ key: key("retirement"), section: "retirement", kind: "create",
        label: "Retirement settings", after: "needs a retirement age",
        source: r._src as string, patch, risky: true,
        warning: "The feed sent retirement spending but no retirement age, and the plan has no retirement block yet. Set the age on the plan first, then re-run this feed." });
      return;
    }
    const describe = (x?: Record<string, unknown> | null) =>
      x ? `retire ${x.retirementAge ?? cur?.retirementAge ?? "—"}, spend ${typeof x.annualSpending === "number" ? money(x.annualSpending, currency) : (cur ? money(cur.annualSpending, currency) : "—")}` : "—";
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
/**
 * Write a patch onto the record with `targetId`, or append a new one.
 *
 * If the target has vanished (the diff was built against a different or
 * since-edited copy of the plan) the change is CREATED rather than dropped —
 * previously it was silently discarded while still being counted as applied,
 * so an advisor was told a balance had been written that never was.
 */
function upsert<T extends { id: string }>(
  list: T[],
  targetId: string | undefined,
  patch: Record<string, unknown>,
  blank: () => T
): void {
  if (targetId) {
    const i = list.findIndex((x) => x.id === targetId);
    if (i >= 0) { list[i] = { ...list[i], ...patch } as T; return; }
  }
  list.push({ ...blank(), ...patch } as T);
}

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
        upsert(next.children, ch.targetId, patch, () => ({ id: newId(), first: "", last: "", dob: "" } as Child));
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
        upsert(next.incomes, ch.targetId, patch, () => ({ id: newId(), clientId: owner.id, source: "", amount: 0 } as IncomeStream));
        break;
      }
      case "expenses": {
        upsert(next.expenses, ch.targetId, patch, () => ({ id: newId(), name: "", amount: 0 } as ExpenseCategory));
        break;
      }
      case "assets": {
        upsert(next.assets, ch.targetId, patch, () => ({ id: newId(), type: "account", value: 0, liquid: true } as Asset));
        break;
      }
      case "loans": {
        upsert(next.loans, ch.targetId, patch, () => ({ id: newId(), type: "other", bal: 0, rate: 0, yrs: 0 } as Loan));
        break;
      }
      case "goals": {
        const y = new Date().getFullYear();
        upsert(next.goals, ch.targetId, patch, () => ({ id: newId(), name: "", amt: 0, startYear: y, endYear: y } as Goal));
        break;
      }
      case "retirement": {
        // Never invent a retirement age the feed didn't state (see diffPlan).
        if (!next.retirement && patch.retirementAge == null) break;
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
  return sanitizePlan(next);
}

// ─── output guarantee ─────────────────────────────────────────────
const COUNTRIES = new Set(["US","CA","GB","AU","CH","EU","JP","SG","HK","CN","TW","KR","IN","ID","MX","BR","SA","ZA","OTHER",
  "DE","FR","IT","ES","NL","BE","AT","IE","PT","LU","FI","GR","CY","HR","EE","LV","LT","SK","SI","MT"]);
const RISKS = new Set(["very_conservative","conservative","moderately_conservative","moderate","moderately_aggressive","aggressive","very_aggressive"]);
const HORIZONS = new Set(["0_5","5_10","10_15","15_plus"]);
const CLASSES = new Set(["equity","fixed_income","real_estate","commodity","cash","mixed","alternative","crypto"]);
const TIERS = new Set(["essential","important","aspirational"]);

const num = (v: unknown, fallback: number, min: number, max: number): number => {
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, n));
};
const enumOr = <T extends string>(v: unknown, allowed: Set<string>, fallback?: T): T | undefined =>
  typeof v === "string" && allowed.has(v) ? (v as T) : fallback;

/**
 * Final guarantee that whatever a feed contributed leaves a plan the schema
 * still accepts. A feed is external data: it can carry a negative balance, a
 * NaN, a country code the app doesn't know, a 400% interest rate or a goal
 * that ends before it starts. Without this the merge produced plans that Zod
 * rejected wholesale, and the advisor got an error naming no row and lost the
 * entire import.
 *
 * Values are clamped or dropped — never is an existing record removed.
 */
export function sanitizePlan(plan: WealthPlan): WealthPlan {
  const clientIds = new Set(plan.clients.map((c) => c.id));
  const fallbackClient = plan.clients[0]?.id;
  const thisYear = new Date().getFullYear();

  return {
    ...plan,
    clients: plan.clients.map((c) => ({
      ...c,
      id: c.id || newId(),
      first: String(c.first ?? ""), last: String(c.last ?? ""),
      country: enumOr(c.country, COUNTRIES),
      risk: enumOr(c.risk, RISKS),
      horizon: enumOr(c.horizon, HORIZONS),
      dob: typeof c.dob === "string" && /^\d{4}-\d{2}-\d{2}$/.test(c.dob) ? c.dob : undefined,
    })),
    children: plan.children.map((c) => ({
      ...c,
      id: c.id || newId(),
      first: String(c.first ?? ""), last: String(c.last ?? ""),
      dob: typeof c.dob === "string" ? c.dob : "",     // required by the schema
    })),
    incomes: plan.incomes
      .map((i) => ({
        ...i,
        id: i.id || newId(),
        // An income pointing at a client that no longer exists fails validation.
        clientId: clientIds.has(i.clientId) ? i.clientId : (fallbackClient ?? i.clientId),
        source: String(i.source ?? ""),
        amount: num(i.amount, 0, 0, Number.MAX_SAFE_INTEGER),
      }))
      .filter((i) => !!i.clientId),
    expenses: plan.expenses.map((e) => ({
      ...e, id: e.id || newId(), name: String(e.name ?? ""),
      amount: num(e.amount, 0, 0, Number.MAX_SAFE_INTEGER),
    })),
    assets: plan.assets.map((a) => ({
      ...a,
      id: a.id || newId(),
      type: String(a.type ?? "") || "account",
      value: num(a.value, 0, 0, Number.MAX_SAFE_INTEGER),
      liquid: typeof a.liquid === "boolean" ? a.liquid : true,
      country: enumOr(a.country, COUNTRIES),
      cls: enumOr(a.cls, CLASSES),
      label: a.label == null ? undefined : String(a.label),
      feedRef: a.feedRef == null ? undefined : String(a.feedRef).slice(0, 200),
    })),
    loans: plan.loans.map((l) => ({
      ...l,
      id: l.id || newId(),
      type: String(l.type ?? "") || "other",
      bal: num(l.bal, 0, 0, Number.MAX_SAFE_INTEGER),
      rate: num(l.rate, 0, 0, 100),
      yrs: num(l.yrs, 0, 0, 100),
      label: l.label == null ? undefined : String(l.label),
      feedRef: l.feedRef == null ? undefined : String(l.feedRef).slice(0, 200),
    })),
    goals: plan.goals.map((g) => {
      const start = Math.round(num(g.startYear, thisYear, 1900, 2200));
      const end = Math.round(num(g.endYear, start, 1900, 2200));
      return {
        ...g,
        id: g.id || newId(),
        name: String(g.name ?? ""),
        amt: num(g.amt, 0, 0, Number.MAX_SAFE_INTEGER),
        startYear: start,
        endYear: Math.max(start, end),      // schema: endYear >= startYear
        tier: enumOr(g.tier, TIERS) as Goal["tier"],
      };
    }),
    retirement: plan.retirement
      ? (() => {
          const age = Math.round(num(plan.retirement!.retirementAge, 65, 30, 100));
          const planTo = Math.round(num(plan.retirement!.planToAge ?? 90, 90, 50, 120));
          return {
            ...plan.retirement!,
            retirementAge: age,
            annualSpending: num(plan.retirement!.annualSpending, 0, 0, Number.MAX_SAFE_INTEGER),
            // schema: planToAge must be strictly greater than retirementAge
            planToAge: Math.max(planTo, age + 1),
          };
        })()
      : undefined,
  };
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

// ─────────────────────────────────────────────────────────────────
// Audit trail — the record of what happened to a client's plan.
//
// The question a compliance review actually asks is "who changed this
// client's position, when, and from what to what". Today `profiles.plan`
// is a single JSONB blob overwritten on every save, so that question has
// no answer at all. This module gives it one.
//
// Design constraints, all of which follow from it being an AUDIT trail:
//
//  • APPEND-ONLY, enforced by the database. RLS grants SELECT and INSERT
//    and nothing else, and a trigger rejects DELETE outright and permits
//    exactly one UPDATE — nulling the actor on erasure. A future policy
//    mistake, or a service-role key, still cannot rewrite history.
//    (005 fixed the first cut of this: an unconditional DELETE trigger
//    plus an ON DELETE CASCADE actor FK made every user who had saved a
//    plan undeletable, because the cascade tripped the trigger.)
//  • BOUNDED. A full plan snapshot per save would duplicate every client's
//    financial position on every keystroke-save. Events carry a summary,
//    a capped list of changed fields, and the two numbers a reviewer wants
//    (net worth before/after) — plus hashes, so a later dispute about what
//    the plan contained can at least be tested.
//  • HONEST ABOUT ITS OWN FAILURES. See recordEvent(): an audit write that
//    fails is surfaced, never swallowed.
// ─────────────────────────────────────────────────────────────────

/** What happened. Kept coarse — a taxonomy nobody maintains is worse than none. */
export type AuditAction =
  | "plan.updated"
  | "feed.run"
  | "feed.applied"
  | "order.staged"
  | "order.rejected"
  | "order.unknown"
  | "order.duplicate_blocked"
  | "report.exported"
  // Money-routing configuration (010). PATCH /api/orders/<id> can repoint
  // the custody account every ticket books into; before these existed it
  // wrote nothing, which undercut "the account comes from the CONNECTION".
  | "connection.created" | "connection.updated" | "connection.deleted"
  // Tenancy (010/011) — the question a compliance officer asks is "who
  // gained access to this client, and when".
  | "household.created" | "household.updated"
  | "advisor.assigned" | "advisor.unassigned"
  | "member.invited" | "member.joined" | "member.removed" | "member.role_changed";

/** Where the change came from. Distinguishes a human edit from an automated one. */
export type AuditSource = "web" | "feed" | "order" | "import" | "api";

export interface AuditFieldChange {
  /** "assets" | "loans" | "incomes" | "goals" | "retirement" | "clients" | … */
  section: string;
  action: "added" | "removed" | "changed";
  /** Human label for the row, e.g. an account name. */
  label: string;
  /** Money or setting values, pre-formatted for display. Absent when N/A. */
  before?: string;
  after?: string;
}

export interface AuditEventInput {
  action: AuditAction;
  source: AuditSource;
  /** One line a reviewer can scan. Always present. */
  summary: string;
  /** Capped, ordered list of what actually moved. */
  changes?: AuditFieldChange[];
  /** The number a compliance reviewer looks for first. */
  netWorthBefore?: number | null;
  netWorthAfter?: number | null;
  currency?: string;
  /** Tamper evidence — cheap, and settles "was this the plan at the time". */
  hashBefore?: string | null;
  hashAfter?: string | null;
  /** Free-form, redacted, bounded. Never raw upstream bodies. */
  detail?: string | null;
  /** Correlates an event with the thing it acted on (ticket id, connection id). */
  refType?: string | null;
  refId?: string | null;
  /**
   * WHOSE money this concerns — distinct from the actor, who is passed
   * separately. 008 split the two because `user_id` answered "who did
   * this" while a compliance review asks "what happened to this client".
   * Omitted, the database trigger derives it from the actor, but only
   * while that actor has exactly one household; passing it explicitly is
   * what keeps that path from raising once they have two.
   */
  householdId?: string | null;
  orgId?: string | null;
}

export interface AuditEvent extends AuditEventInput {
  id: string;
  createdAt: string;
}

/** A row as the API returns it. */
export interface AuditEventRow {
  id: string;
  created_at: string;
  /** Null once the actor has been erased; the event itself survives. */
  user_id?: string | null;
  action: string;
  source: string;
  summary: string;
  changes: AuditFieldChange[] | null;
  net_worth_before: number | string | null;
  net_worth_after: number | string | null;
  currency: string | null;
  hash_before: string | null;
  hash_after: string | null;
  detail: string | null;
  ref_type: string | null;
  ref_id: string | null;
}

/** Hard caps, so one pathological save cannot bloat the table. */
export const AUDIT_MAX_CHANGES = 60;
export const AUDIT_MAX_SUMMARY = 300;
export const AUDIT_MAX_DETAIL = 500;
export const AUDIT_MAX_LABEL = 120;

// ─────────────────────────────────────────────────────────────────
// Writing to the audit trail.
//
// The tension this module resolves: an audit trail that silently drops
// events is worthless, but blocking a user's plan save because an audit
// insert failed is worse than the gap it leaves. So the writer never
// throws, and always REPORTS. Callers decide what a failure means:
//
//   • Money-moving paths (orders) already write their own immutable row
//     BEFORE the upstream call, and treat a failure there as fatal.
//   • Everything else surfaces `auditWarning` in the response so the gap
//     is visible rather than silent.
//
// The one thing it must never do is claim success it did not have.
// ─────────────────────────────────────────────────────────────────

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  AUDIT_MAX_CHANGES, AUDIT_MAX_DETAIL, AUDIT_MAX_SUMMARY,
  type AuditEventInput,
} from "./types";

export interface AuditWriteResult {
  ok: boolean;
  /** Present when the event could not be recorded. Surface it; don't swallow it. */
  warning?: string;
}

/**
 * Append one event. Never throws.
 *
 * `user` is passed explicitly rather than re-read from the session so the
 * caller cannot accidentally attribute an event to the wrong account.
 */
export async function recordEvent(
  supabase: SupabaseClient,
  userId: string,
  event: AuditEventInput,
): Promise<AuditWriteResult> {
  try {
    const row = {
      user_id: userId,
      action: event.action,
      source: event.source,
      summary: String(event.summary || "(no summary)").slice(0, AUDIT_MAX_SUMMARY),
      changes: event.changes?.length ? event.changes.slice(0, AUDIT_MAX_CHANGES) : null,
      net_worth_before: event.netWorthBefore ?? null,
      net_worth_after: event.netWorthAfter ?? null,
      currency: event.currency ? event.currency.slice(0, 3).toUpperCase() : null,
      hash_before: event.hashBefore ?? null,
      hash_after: event.hashAfter ?? null,
      detail: event.detail ? String(event.detail).slice(0, AUDIT_MAX_DETAIL) : null,
      ref_type: event.refType ?? null,
      ref_id: event.refId ?? null,
    };
    const { error } = await supabase.from("audit_events").insert(row);
    if (error) {
      return { ok: false, warning: `This action succeeded but was not recorded in the audit trail: ${error.message}` };
    }
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    return { ok: false, warning: `This action succeeded but was not recorded in the audit trail: ${msg}` };
  }
}

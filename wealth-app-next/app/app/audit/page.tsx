// ─────────────────────────────────────────────────────────────────
// Audit trail — what happened to this client's plan, and when.
//
// The layout above enforces auth; /api/audit re-checks the session
// server-side, so this page holds no authorization logic of its own.
// ─────────────────────────────────────────────────────────────────

import { AuditLog } from "@/components/audit/audit-log";

export const metadata = {
  title: "Audit trail — Wealth Analyzer",
  description: "An append-only record of plan changes, feed runs and order placements.",
};

export default function AuditPage() {
  return (
    <div className="container max-w-5xl py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">Audit trail</h1>
        <p className="text-muted-foreground">
          Every plan change, feed run and order placement, in one timeline — with the
          net-worth movement on each entry and a CSV export for a compliance file.
        </p>
      </div>

      <AuditLog />

      <div className="mt-8 rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground">Append-only, enforced by the database.</strong>{" "}
        Row-level security grants <code>SELECT</code> and <code>INSERT</code> and nothing else — there is
        deliberately no update policy and no delete policy — and a trigger rejects{" "}
        <code>UPDATE</code> and <code>DELETE</code> whoever is asking, so neither a service-role key nor a
        future policy mistake can rewrite history. An audit trail the operator can edit is not one.
        <br /><br />
        <strong className="text-foreground">What each entry holds.</strong>{" "}
        A summary, the rows that moved with their before and after values, net worth on each side of
        the change, and a fingerprint of the plan before and after. Deliberately not a full snapshot:
        storing the whole plan on every save would duplicate the client&apos;s entire position each time.
        The fingerprint still lets you test later whether a given plan was the one in force.
        <br /><br />
        <strong className="text-foreground">Gaps are visible, not silent.</strong>{" "}
        If an action succeeds but its audit entry cannot be written, the response says so rather than
        reporting a clean save — a trail with unreported holes is worse than a short one.
      </div>
    </div>
  );
}

// Dev/preview-only — renders the audit viewer outside the auth gate for
// design review, matching preview/feeds and preview/orders. The API still
// requires a session, so this exposes no data. 404s in production.
import { notFound } from "next/navigation";
import { AuditLog } from "@/components/audit/audit-log";

export default function PreviewAuditPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="container max-w-5xl py-10">
      <div className="report-noprint mb-4 inline-block rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-600">
        Preview · not auth-gated
      </div>
      <h1 className="font-display text-4xl mb-2">Audit trail</h1>
      <p className="text-muted-foreground mb-8">
        Every plan change, feed run and order placement, in one timeline.
      </p>
      <AuditLog />
    </div>
  );
}

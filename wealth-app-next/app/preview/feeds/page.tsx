// Dev/preview-only — renders the feed manager outside the auth gate for
// design review, matching preview/plan and preview/report. The API it calls
// still requires a session, so this exposes no data: unauthenticated it
// simply shows the manager's load-error state. 404s in production.
import { notFound } from "next/navigation";
import { FeedsManager } from "@/components/feeds/feeds-manager";

export default function PreviewFeedsPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="container max-w-5xl py-10">
      <div className="report-noprint mb-4 inline-block rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-600">
        Preview · not auth-gated
      </div>
      <h1 className="font-display text-4xl mb-2">Data feeds</h1>
      <p className="text-muted-foreground mb-8">
        Connect a custodian or CRM once, and pull positions, balances and client records
        straight into your plan.
      </p>
      <FeedsManager />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Data feeds — manage custodian & CRM connections.
//
// The layout above this route already enforces auth (and middleware
// before that); every /api/feeds call re-checks the session server-side,
// so this page holds no authorization logic of its own.
// ─────────────────────────────────────────────────────────────────

import { FeedsManager } from "@/components/feeds/feeds-manager";

export const metadata = {
  title: "Data feeds — Wealth Analyzer",
  description: "Connect custodian and CRM systems through the wa.feed/v1 data model.",
};

export default function FeedsPage() {
  return (
    <div className="container max-w-5xl py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">Data feeds</h1>
        <p className="text-muted-foreground">
          Connect a custodian or CRM once, and pull positions, balances and client records
          straight into your plan. Credentials are held on the server — never in your browser —
          and every connector normalizes into the same <code className="text-xs">wa.feed/v1</code> model.
        </p>
      </div>

      <FeedsManager />

      <div className="mt-8 rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground">Supported payloads.</strong>{" "}
        Native <code>wa.feed/v1</code> JSON; generic CRM contact JSON (Salesforce, HubSpot and
        OData-style records); ISO 20022 <code>camt.052/053/054</code> statements; OFX/QFX; and CSV
        matched by column header. Auto-detect handles most endpoints — set the format explicitly
        if your provider sends an unusual content type.
        <br /><br />
        <strong className="text-foreground">Security.</strong>{" "}
        The relay only reaches public internet addresses: private, loopback, link-local and
        cloud-metadata ranges are refused, redirects are re-checked at every hop, and responses
        are capped in size and time. Stored credentials are encrypted with a key that lives only
        in the server environment and are never sent back to this page.
      </div>
    </div>
  );
}

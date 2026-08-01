// ─────────────────────────────────────────────────────────────────
// Order routing — manage PM/OMS connections that stage BUY tickets.
//
// The layout above this route enforces auth (and middleware before it);
// every /api/orders call re-checks the session server-side, so this page
// holds no authorization logic of its own.
// ─────────────────────────────────────────────────────────────────

import { OrdersManager } from "@/components/orders/orders-manager";

export const metadata = {
  title: "Order routing — Wealth Analyzer",
  description: "Send approved proposal positions to a portfolio-management system as staged orders.",
};

export default function OrdersPage() {
  return (
    <div className="container max-w-5xl py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">Order routing</h1>
        <p className="text-muted-foreground">
          Send an approved investment proposal to your PM or OMS as a{" "}
          <code className="text-xs">wa.order/v1</code> ticket. The orders arrive as pending
          instructions for someone with trading authority to execute — nothing is executed here.
        </p>
      </div>

      <OrdersManager />

      <div className="mt-8 rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground leading-relaxed">
        <strong className="text-foreground">Staged, never executed.</strong>{" "}
        Every dialect carries that through to the wire: Avaloq orders are sent{" "}
        <code>PENDING_APPROVAL</code>, the generic REST payload sets <code>execute: false</code>,
        and the native ticket carries <code>intent: &quot;stage&quot;</code>.
        <br /><br />
        <strong className="text-foreground">What the relay checks before sending.</strong>{" "}
        Line amounts are re-summed on the server and must match the ticket total — a ticket whose
        own arithmetic disagrees is refused rather than sent. Every line needs an ISIN or ticker,
        every line must be in the ticket currency, and the custody account comes from this
        connection, not from the payload.
        <br /><br />
        <strong className="text-foreground">No double-buys.</strong>{" "}
        Each ticket reference is claimed in the database before the upstream call, so a
        double-click, a second tab, or a retry after a timeout is recognised and not sent twice.
        Reusing a reference for a <em>different</em> order is rejected outright rather than
        silently returning the earlier result.
        <br /><br />
        <strong className="text-foreground">Network.</strong>{" "}
        Order endpoints are SSRF-checked the same way feeds are — private, loopback, link-local
        and cloud-metadata ranges are refused. Unlike a feed read, redirects are <em>not</em>{" "}
        followed: replaying an order body to whatever a <code>Location</code> header names would
        hand client buy instructions to an unconfigured host.
      </div>
    </div>
  );
}

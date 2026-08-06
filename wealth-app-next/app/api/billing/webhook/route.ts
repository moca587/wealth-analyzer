// ─────────────────────────────────────────────────────────────────
// POST /api/billing/webhook — Stripe → entitlement.
//
// The ONLY writer of `organizations.is_paid`. It runs unauthenticated
// (Stripe has no session) and writes a column no user may write, so it is
// also the only route that uses the service-role client.
//
// Its correctness rests on three things, in order:
//   1. SIGNATURE. The body is verified against STRIPE_WEBHOOK_SECRET before
//      anything is read from it. A forged POST here would set is_paid=true
//      for free, so an unverified body is never trusted — and with no
//      secret configured, verification cannot pass and every call is
//      rejected (fail closed).
//   2. IDEMPOTENCY. Stripe delivers at least once and retries on any
//      non-2xx. The event id is inserted into stripe_events FIRST; a
//      duplicate delivery collides and is acknowledged without re-applying.
//   3. RESOLUTION. The org is taken from the event's metadata.org_id, set
//      when the checkout session was created; failing that, from the Stripe
//      customer id already bound to an org. An event we cannot attribute is
//      acknowledged (so Stripe stops retrying) but changes nothing.
//
// It must READ THE RAW BODY — re-serialising the JSON changes the bytes and
// the signature fails. Next gives us request.text() for that.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createAdminClient, serviceRoleAvailable } from "@/lib/supabase/admin";
import { verifyWebhook, webhookConfigured, StripeError } from "@/lib/billing/stripe";
import { eventToEntitlement } from "@/lib/billing/entitlement";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!webhookConfigured() || !serviceRoleAvailable()) {
    // Not an error the caller can fix, but returning 200 would make Stripe
    // consider the endpoint healthy while it silently drops every event.
    // 503 makes Stripe retry, and the operator sees the misconfiguration.
    return NextResponse.json(
      { error: "billing webhook is not configured (STRIPE_WEBHOOK_SECRET / service role)" },
      { status: 503 },
    );
  }

  const raw = await request.text();
  const sig = request.headers.get("stripe-signature");

  let event;
  try {
    event = verifyWebhook(raw, sig);
  } catch (e) {
    const msg = e instanceof StripeError ? e.message : "verification failed";
    // 400 — do NOT retry a body that failed to verify; it will never verify.
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const admin = createAdminClient();
  const change = eventToEntitlement(event);

  // Not a lifecycle event we act on (Stripe sends dozens we ignore). Ack so
  // Stripe stops retrying; nothing is ledgered because there is nothing to
  // apply and nothing to dedupe.
  if (!change) {
    return NextResponse.json({ received: true, applied: false });
  }

  const orgId = change.orgId ?? (await resolveOrgByCustomer(admin, change.customerId));

  // Actionable but not yet attributable — e.g. a subscription created in the
  // Stripe dashboard before its customer is bound to an org. Do NOT ack: a
  // 200 here would consume the event permanently. A non-2xx lets Stripe
  // retry (for ~3 days), by which time the binding may exist.
  if (!orgId) {
    return NextResponse.json(
      { error: "event not yet attributable to an organisation", code: "unresolved" },
      { status: 409 },
    );
  }

  // Ledger + watermark + entitlement, all in one transaction inside the
  // function, so "seen" and "applied" cannot diverge and out-of-order
  // deliveries cannot regress a paying firm.
  const { data: result, error: applyErr } = await admin.rpc("apply_stripe_event", {
    p_event_id: event.id,
    p_event_type: event.type,
    p_event_created: event.created,
    p_org: orgId,
    p_is_paid: change.isPaid,
    p_status: change.status,
    p_seats: change.seats,
    p_customer: change.customerId,
    p_subscription: change.subscriptionId,
  });
  if (applyErr) {
    // Nothing committed (the ledger insert is in the same transaction), so a
    // 500 lets Stripe retry cleanly. A customer-collision is the one case we
    // never want retried forever, but it is also a genuine operator problem,
    // so surfacing it as a 500 that alerts is the right call.
    return NextResponse.json({ error: applyErr.message }, { status: 500 });
  }

  return NextResponse.json({ received: true, result });
}

/** Find the org a Stripe customer is already bound to. */
async function resolveOrgByCustomer(
  admin: ReturnType<typeof createAdminClient>,
  customerId: string | null | undefined,
): Promise<string | null> {
  if (!customerId) return null;
  const { data } = await admin
    .from("organizations")
    .select("id")
    .eq("stripe_customer_id", customerId)
    .maybeSingle();
  return data ? String(data.id) : null;
}

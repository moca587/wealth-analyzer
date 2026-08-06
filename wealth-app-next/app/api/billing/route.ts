// ─────────────────────────────────────────────────────────────────
// GET  /api/billing — the caller's org billing state (for the UI)
// POST /api/billing — start checkout, or open the billing portal
//
// Owner-only for the write actions: starting or managing a subscription is
// a commercial act, the same class as set_org_seats. The GET is readable by
// any member so the UI can show whether the firm is entitled and gate its
// own controls.
//
// Creating a checkout session needs a Stripe customer. The first purchase
// has none, so we pass the owner's email and let Checkout create the
// customer; the webhook binds that customer id to the org (via
// apply_stripe_event) when checkout.session.completed arrives. No
// pre-create round-trip, and the binding is guarded against collisions in
// the function.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";
import { resolveOrg } from "@/lib/tenancy/org";
import { billingEnforced } from "@/lib/billing/gate";
import {
  stripeConfigured, createCheckoutSession, createPortalSession, StripeError,
} from "@/lib/billing/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await resolveOrg(supabase, request);
  if (!org.ok) {
    return NextResponse.json({ error: org.error, code: org.code, organizations: org.organizations }, { status: org.status });
  }

  // is_paid and subscription_status are readable by members (006); the
  // Stripe ids are not selected — the UI has no use for them and they are
  // operator data.
  const { data } = await supabase
    .from("organizations")
    .select("is_paid, subscription_status, seats")
    .eq("id", org.org.id)
    .maybeSingle();

  return NextResponse.json({
    organization: { id: org.org.id, name: org.org.name },
    role: org.org.role,
    billingEnforced: billingEnforced(),
    stripeConfigured: stripeConfigured(),
    isPaid: !!data?.is_paid,
    status: String(data?.subscription_status ?? "none"),
    seats: Number(data?.seats ?? org.org.seats),
    seatsUsed: org.org.seatsUsed,
  }, { headers: { "Cache-Control": "no-store" } });
}

const postInput = z.object({
  action: z.enum(["checkout", "portal"]),
  /** For checkout: how many seats to buy. Defaults to seats in use. */
  quantity: z.number().int().min(1).max(10000).optional(),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const org = await resolveOrg(supabase, request);
  if (!org.ok) return NextResponse.json({ error: org.error, code: org.code }, { status: org.status });

  // Only an owner may transact for the firm.
  if (org.org.role !== "owner") {
    return NextResponse.json({ error: "Only an owner can manage billing." }, { status: 403 });
  }
  if (!stripeConfigured()) {
    return NextResponse.json({ error: "Billing is not configured on this deployment." }, { status: 503 });
  }

  let body: unknown;
  try { body = await request.json(); }
  catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const parsed = postInput.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const { data: orgRow } = await supabase
    .from("organizations")
    .select("stripe_customer_id")
    .eq("id", org.org.id)
    .maybeSingle();
  const customerId = orgRow?.stripe_customer_id ? String(orgRow.stripe_customer_id) : undefined;

  const base = (process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin).replace(/\/$/, "");
  const priceId = (process.env.STRIPE_PRICE_ID || "").trim();

  try {
    if (parsed.data.action === "portal") {
      if (!customerId) {
        return NextResponse.json({ error: "No subscription to manage yet." }, { status: 400 });
      }
      const { url } = await createPortalSession({ customerId, returnUrl: `${base}/app/billing` });
      return NextResponse.json({ url });
    }

    // checkout
    if (!priceId) {
      return NextResponse.json({ error: "No STRIPE_PRICE_ID configured on this deployment." }, { status: 503 });
    }
    const { url } = await createCheckoutSession({
      priceId,
      quantity: parsed.data.quantity ?? Math.max(1, org.org.seatsUsed),
      customerId,
      customerEmail: customerId ? undefined : (user.email ?? undefined),
      orgId: org.org.id,
      successUrl: `${base}/app/billing?checkout=success`,
      cancelUrl: `${base}/app/billing?checkout=cancelled`,
    });
    return NextResponse.json({ url });
  } catch (e) {
    const msg = e instanceof StripeError ? e.message : "Could not reach Stripe.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}

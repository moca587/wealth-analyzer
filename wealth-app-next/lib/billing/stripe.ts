// ─────────────────────────────────────────────────────────────────
// Stripe, without the SDK.
//
// The whole Stripe surface this app touches is: verify a webhook
// signature, create a Checkout session, create a Billing Portal session.
// All three are a documented HTTP/HMAC contract, so they are implemented
// against `node:crypto` and `fetch` directly — no `stripe` dependency.
//
// Why no SDK: the deployment target is a customer's Avaloq container, and
// every dependency is a supply-chain question their security team asks.
// The webhook verification in particular is the security boundary — a
// forged event sets `is_paid = true` for free — so it is worth having in
// code we can read rather than behind an import, with a constant-time
// comparison and an explicit replay window.
//
// FAIL CLOSED: with no STRIPE_WEBHOOK_SECRET, verification cannot succeed
// and the webhook rejects everything, rather than trusting an unsigned
// body. With no STRIPE_SECRET_KEY, checkout/portal creation refuses rather
// than calling Stripe unauthenticated.
// ─────────────────────────────────────────────────────────────────

import { createHmac, timingSafeEqual } from "node:crypto";

export class StripeError extends Error {
  constructor(message: string, readonly code: string) { super(message); this.name = "StripeError"; }
}

export function stripeConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY || "").trim();
}
export function webhookConfigured(): boolean {
  return !!(process.env.STRIPE_WEBHOOK_SECRET || "").trim();
}

/**
 * Verify a Stripe webhook signature and return the parsed event.
 *
 * Implements the documented scheme: the `Stripe-Signature` header is
 * `t=<unix>,v1=<hex hmac>[,v1=<hex hmac>…]`, where the HMAC is
 * SHA-256 over `"<t>.<rawBody>"` keyed by the endpoint secret. The raw
 * body bytes must be used verbatim — re-serialising the JSON would change
 * them and every signature would fail.
 *
 * Throws StripeError on any failure; never returns an unverified event.
 */
export function verifyWebhook(
  rawBody: string,
  signatureHeader: string | null,
  opts: { secret?: string; toleranceSec?: number; nowSec?: number } = {},
): { id: string; type: string; created: number; data: { object: Record<string, unknown> } } {
  const secret = (opts.secret ?? process.env.STRIPE_WEBHOOK_SECRET ?? "").trim();
  if (!secret) throw new StripeError("STRIPE_WEBHOOK_SECRET is not set — cannot verify webhooks", "no_secret");
  if (!signatureHeader) throw new StripeError("missing Stripe-Signature header", "no_signature");

  // Parse the header into t and the list of v1 signatures.
  let t = "";
  const v1: string[] = [];
  for (const part of signatureHeader.split(",")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    const k = part.slice(0, eq).trim();
    const v = part.slice(eq + 1).trim();
    if (k === "t") t = v;
    else if (k === "v1") v1.push(v);
  }
  if (!t || !v1.length) throw new StripeError("malformed Stripe-Signature header", "bad_signature");

  // Replay window. Stripe's default tolerance is 5 minutes; a captured
  // request replayed later must not verify.
  const tolerance = opts.toleranceSec ?? 300;
  const now = opts.nowSec ?? Math.floor(realNowMs() / 1000);
  const ts = Number(t);
  if (!Number.isFinite(ts) || Math.abs(now - ts) > tolerance) {
    throw new StripeError("timestamp outside tolerance — possible replay", "timestamp");
  }

  const expected = createHmac("sha256", secret).update(`${t}.${rawBody}`, "utf8").digest("hex");
  const expectedBuf = Buffer.from(expected, "hex");
  // Any of the provided v1 signatures matching (Stripe may send several
  // during a secret rotation) is a pass. Constant-time per candidate.
  const ok = v1.some((sig) => {
    let sigBuf: Buffer;
    try { sigBuf = Buffer.from(sig, "hex"); } catch { return false; }
    return sigBuf.length === expectedBuf.length && timingSafeEqual(sigBuf, expectedBuf);
  });
  if (!ok) throw new StripeError("signature mismatch", "bad_signature");

  let event: { id?: string; type?: string; created?: number; data?: { object?: Record<string, unknown> } };
  try { event = JSON.parse(rawBody); }
  catch { throw new StripeError("event body is not JSON", "bad_body"); }
  if (!event.id || !event.type || !event.data?.object) {
    throw new StripeError("event body missing id/type/data", "bad_body");
  }
  // `created` (unix seconds) is the ordering key the webhook uses as a
  // watermark, since Stripe does not deliver in order. Absent/garbage → 0,
  // which makes an unstamped event the oldest possible (never regresses a
  // stamped one).
  const created = typeof event.created === "number" && Number.isFinite(event.created) ? event.created : 0;
  return { id: event.id, type: event.type, created, data: { object: event.data.object } };
}

// new Date() / Date.now() are unavailable in workflow scripts but fine in
// a route; isolate the one call so tests can inject `nowSec`.
function realNowMs(): number {
  return Date.now();
}

// ─── Stripe REST calls (form-encoded, Bearer secret) ────────────────

async function stripePost(path: string, form: Record<string, string>): Promise<Record<string, unknown>> {
  const key = (process.env.STRIPE_SECRET_KEY ?? "").trim();
  if (!key) throw new StripeError("STRIPE_SECRET_KEY is not set", "no_key");

  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(form).toString(),
  });
  const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const err = (body.error as { message?: string })?.message ?? `Stripe returned ${res.status}`;
    throw new StripeError(err, "stripe_api");
  }
  return body;
}

/** Create a Checkout session for a subscription; returns the redirect URL. */
export async function createCheckoutSession(args: {
  priceId: string;
  quantity: number;
  customerId?: string;
  customerEmail?: string;
  orgId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{ url: string }> {
  const form: Record<string, string> = {
    mode: "subscription",
    "line_items[0][price]": args.priceId,
    "line_items[0][quantity]": String(Math.max(1, args.quantity)),
    success_url: args.successUrl,
    cancel_url: args.cancelUrl,
    // Carried back on the completed event so the webhook knows which org.
    "metadata[org_id]": args.orgId,
    "subscription_data[metadata][org_id]": args.orgId,
    allow_promotion_codes: "true",
  };
  if (args.customerId) form.customer = args.customerId;
  else if (args.customerEmail) form.customer_email = args.customerEmail;

  const session = await stripePost("checkout/sessions", form);
  const url = typeof session.url === "string" ? session.url : "";
  if (!url) throw new StripeError("Stripe did not return a checkout URL", "no_url");
  return { url };
}

/** Create a Billing Portal session so a customer can manage/cancel. */
export async function createPortalSession(args: {
  customerId: string;
  returnUrl: string;
}): Promise<{ url: string }> {
  const session = await stripePost("billing_portal/sessions", {
    customer: args.customerId,
    return_url: args.returnUrl,
  });
  const url = typeof session.url === "string" ? session.url : "";
  if (!url) throw new StripeError("Stripe did not return a portal URL", "no_url");
  return { url };
}

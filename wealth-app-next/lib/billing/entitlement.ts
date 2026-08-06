// ─────────────────────────────────────────────────────────────────
// What a Stripe event means for a firm's entitlement.
//
// Pure: a Stripe event object in, an entitlement change out. The webhook
// route does the I/O; this decides. Kept separate so the mapping — which
// is where "did we just give someone the product for free" lives — is
// testable without a database or a network.
//
// The states that matter, and what each does to `is_paid`:
//   active, trialing            → paid
//   past_due, unpaid,           → NOT paid, but the subscription still
//   incomplete, incomplete_expired  exists (grace / dunning is Stripe's
//                                job; we simply stop granting the product)
//   canceled                    → NOT paid
//
// Deliberately conservative: any status we do not recognise maps to NOT
// paid. Granting the product on an unknown status is the expensive
// mistake; denying it on one is a support ticket.
// ─────────────────────────────────────────────────────────────────

export interface EntitlementChange {
  orgId: string | null;
  /**
   * true → grant, false → revoke, null → DO NOT CHANGE is_paid (only bind
   * ids). Null is how an unpaid/unsettled checkout records the customer
   * without granting the product before the money arrives.
   */
  isPaid: boolean | null;
  status: string;
  seats: number | null;
  customerId: string | null;
  subscriptionId: string | null;
}

const PAID_STATUSES = new Set(["active", "trialing"]);

/** The subscription statuses that grant the product. */
export function statusIsPaid(status: string | undefined | null): boolean {
  return !!status && PAID_STATUSES.has(status);
}

/** Pull `metadata.org_id` off whichever object carries it. */
function orgIdFrom(obj: Record<string, unknown>): string | null {
  const meta = obj.metadata as Record<string, unknown> | undefined;
  const fromMeta = meta && typeof meta.org_id === "string" ? meta.org_id : null;
  return fromMeta || null;
}

function str(v: unknown): string | null {
  return typeof v === "string" && v ? v : null;
}

/**
 * Map a verified Stripe event to an entitlement change, or null when the
 * event type is not one we act on (Stripe sends dozens we ignore).
 *
 * We act on the subscription lifecycle and the checkout completion:
 *   checkout.session.completed          — first purchase; bind customer
 *   customer.subscription.created       — subscription now exists
 *   customer.subscription.updated       — plan/seat/status change
 *   customer.subscription.deleted       — cancelled
 */
export function eventToEntitlement(
  event: { type: string; data: { object: Record<string, unknown> } },
): EntitlementChange | null {
  const obj = event.data.object;

  switch (event.type) {
    case "checkout.session.completed": {
      // `status` is ALWAYS "complete" when this event fires, so it says
      // nothing about payment — the earlier version keyed is_paid on it and
      // granted the product before funds settled, which for the delayed-
      // settlement methods common in the CH/EU launch market (SEPA/ACH)
      // means days of free access. Grant ONLY on a settled payment_status;
      // otherwise bind the ids (isPaid: null = do not change) and let the
      // authoritative customer.subscription.* event grant when it settles.
      const ps = str(obj.payment_status);
      const settled = ps === "paid" || ps === "no_payment_required";
      return {
        orgId: orgIdFrom(obj),
        isPaid: settled ? true : null,
        status: str(obj.status) ?? "complete",
        seats: quantityFrom(obj),
        customerId: str(obj.customer),
        subscriptionId: str(obj.subscription),
      };
    }
    case "customer.subscription.created":
    case "customer.subscription.updated": {
      const status = str(obj.status) ?? "";
      return {
        orgId: orgIdFrom(obj),
        isPaid: statusIsPaid(status),
        status,
        seats: quantityFrom(obj),
        customerId: str(obj.customer),
        subscriptionId: str(obj.id),
      };
    }
    case "customer.subscription.deleted": {
      return {
        orgId: orgIdFrom(obj),
        isPaid: false,
        status: str(obj.status) ?? "canceled",
        seats: null,
        customerId: str(obj.customer),
        subscriptionId: str(obj.id),
      };
    }
    default:
      return null;
  }
}

/** The seat count = the subscription's line-item quantity, when present. */
function quantityFrom(obj: Record<string, unknown>): number | null {
  // subscription object: items.data[0].quantity
  const items = obj.items as { data?: Array<{ quantity?: unknown }> } | undefined;
  const q = items?.data?.[0]?.quantity;
  if (typeof q === "number" && q > 0) return Math.floor(q);
  // checkout session: no items here in the minimal payload — leave null and
  // let the subscription event set seats.
  return null;
}

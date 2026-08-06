// Event → entitlement. Where "did we just give the product away for free"
// is decided. The conservative default (unknown status ⇒ not paid) is the
// property worth pinning hardest.

import { describe, it, expect } from "vitest";
import { eventToEntitlement, statusIsPaid } from "../entitlement";

const sub = (over: Record<string, unknown> = {}) => ({
  type: "customer.subscription.updated",
  data: { object: {
    id: "sub_1", customer: "cus_1", status: "active",
    metadata: { org_id: "org-1" },
    items: { data: [{ quantity: 5 }] },
    ...over,
  } },
});

describe("statusIsPaid", () => {
  it("grants only active and trialing", () => {
    expect(statusIsPaid("active")).toBe(true);
    expect(statusIsPaid("trialing")).toBe(true);
    for (const s of ["past_due", "unpaid", "incomplete", "incomplete_expired", "canceled", "paused", "", null, undefined]) {
      expect(statusIsPaid(s as string), `${s} must NOT be paid`).toBe(false);
    }
  });
});

describe("eventToEntitlement", () => {
  it("maps an active subscription to paid, with seats and ids", () => {
    const c = eventToEntitlement(sub())!;
    expect(c).toMatchObject({ orgId: "org-1", isPaid: true, status: "active", seats: 5, customerId: "cus_1", subscriptionId: "sub_1" });
  });

  it("maps past_due to NOT paid, but keeps the subscription", () => {
    const c = eventToEntitlement(sub({ status: "past_due" }))!;
    expect(c.isPaid).toBe(false);
    expect(c.status).toBe("past_due");
    expect(c.subscriptionId).toBe("sub_1");
  });

  it("maps an UNKNOWN status conservatively to NOT paid", () => {
    // Granting on an unrecognised status is the expensive mistake.
    const c = eventToEntitlement(sub({ status: "some_new_stripe_status" }))!;
    expect(c.isPaid).toBe(false);
  });

  it("maps subscription.deleted to not paid", () => {
    const c = eventToEntitlement({
      type: "customer.subscription.deleted",
      data: { object: { id: "sub_1", customer: "cus_1", status: "canceled", metadata: { org_id: "org-1" } } },
    })!;
    expect(c.isPaid).toBe(false);
    expect(c.orgId).toBe("org-1");
  });

  it("grants on a SETTLED checkout, binding ids", () => {
    const c = eventToEntitlement({
      type: "checkout.session.completed",
      data: { object: {
        status: "complete", payment_status: "paid",
        customer: "cus_9", subscription: "sub_9", metadata: { org_id: "org-9" },
      } },
    })!;
    expect(c.orgId).toBe("org-9");
    expect(c.customerId).toBe("cus_9");
    expect(c.subscriptionId).toBe("sub_9");
    expect(c.isPaid).toBe(true);
  });

  it("M1: an UNSETTLED checkout binds ids but does NOT grant (isPaid null)", () => {
    // `status` is always 'complete' when this event fires. A delayed-
    // settlement method (SEPA/ACH) reports payment_status 'unpaid', and
    // granting on 'complete' alone gave days of free product. isPaid must be
    // null (do-not-change), leaving the grant to the subscription event.
    const c = eventToEntitlement({
      type: "checkout.session.completed",
      data: { object: {
        status: "complete", payment_status: "unpaid",
        customer: "cus_x", subscription: "sub_x", metadata: { org_id: "org-x" },
      } },
    })!;
    expect(c.isPaid).toBeNull();
    expect(c.customerId, "the customer is still bound for future events").toBe("cus_x");
  });

  it("grants a no-payment-required checkout (100% coupon / trial)", () => {
    const c = eventToEntitlement({
      type: "checkout.session.completed",
      data: { object: { status: "complete", payment_status: "no_payment_required", metadata: { org_id: "o" } } },
    })!;
    expect(c.isPaid).toBe(true);
  });

  it("returns null for event types we do not act on", () => {
    expect(eventToEntitlement({ type: "invoice.created", data: { object: {} } })).toBeNull();
    expect(eventToEntitlement({ type: "customer.updated", data: { object: {} } })).toBeNull();
  });

  it("returns a null orgId when metadata is absent (webhook resolves by customer)", () => {
    const c = eventToEntitlement(sub({ metadata: {} }))!;
    expect(c.orgId).toBeNull();
    expect(c.customerId).toBe("cus_1"); // still available for customer-id resolution
  });

  it("does not invent a seat count when the subscription has no items", () => {
    const c = eventToEntitlement(sub({ items: undefined }))!;
    expect(c.seats).toBeNull();
  });
});

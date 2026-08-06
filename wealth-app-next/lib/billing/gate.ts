// ─────────────────────────────────────────────────────────────────
// The entitlement gate: what a firm cannot do until it pays.
//
// The product line: evaluate free, pay to operate. A firm can capture
// plans, simulate, and generate reports without a subscription — that is
// the evaluation. The OPERATIONAL, production actions — pulling live
// custodian feeds and staging real orders — require `is_paid`.
//
// This is read through the normal (RLS-bound) client: a member may read
// their own org's entitlement (006's organizations_member_select), so no
// service role is involved on the read path. The service role only ever
// WRITES is_paid, from the webhook.
//
// It fails OPEN on a read error, deliberately: a transient database blip
// must not block a paying firm from placing an order it is entitled to.
// The write path (the webhook) is where correctness is enforced; this is a
// gate, not the source of truth, and a gate that jams shut on a hiccup is
// worse than one that occasionally lets a lapsed firm through until the
// next request.
// ─────────────────────────────────────────────────────────────────

import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Billing is only enforced when Stripe is configured. A deployment with no
 * STRIPE_SECRET_KEY (a pilot, a self-hosted install billed by invoice)
 * treats every org as entitled — otherwise turning billing on would be a
 * prerequisite for the product working at all, which is the wrong default
 * for a product that ships before its billing does.
 */
export function billingEnforced(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY || "").trim()
    && process.env.BILLING_ENFORCED !== "false";
}

export interface EntitlementResult {
  ok: boolean;
  /** Present when not ok. */
  reason?: string;
  status?: string;
}

export async function checkOrgEntitlement(
  supabase: SupabaseClient,
  orgId: string,
): Promise<EntitlementResult> {
  if (!billingEnforced()) return { ok: true };

  const { data, error } = await supabase
    .from("organizations")
    .select("is_paid, subscription_status")
    .eq("id", orgId)
    .maybeSingle();

  // Fail open on a read error — see the header. A paying firm must not be
  // blocked by a blip.
  if (error || !data) return { ok: true };

  if (data.is_paid) return { ok: true, status: String(data.subscription_status ?? "") };
  return {
    ok: false,
    status: String(data.subscription_status ?? "none"),
    reason: "This action needs an active subscription. An owner can start one under Billing.",
  };
}

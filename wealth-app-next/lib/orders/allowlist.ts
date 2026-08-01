// ─────────────────────────────────────────────────────────────────
// Host pinning for order endpoints.
//
// The SSRF guard in lib/feeds/ssrf.ts documents an accepted residual risk:
// a TOCTOU window between the DNS check and the connect, where a rebinding
// attacker could land a request on an internal address. That risk was
// accepted on GET-specific grounds — "exposure is limited to READING
// responses from hosts that are already reachable".
//
// That reasoning does not transfer to this path. On a POST the bypass
// delivers an attacker-influenced JSON body to an arbitrary internal
// endpoint — an internal admin API, a PostgREST instance, anything in the
// VPC that acts on a POST. Reading is recoverable; writing is not.
//
// So order endpoints are PINNED to named hosts. DNS rebinding cannot help
// an attacker whose target host was never on the list.
//
// Required in production, optional in development, because a first-run
// local demo should not need infrastructure config — but a deployment that
// can place real orders must declare where they may go.
// ─────────────────────────────────────────────────────────────────

export interface AllowlistCheck { ok: boolean; reason: string }

function entries(): string[] {
  return (process.env.ORDERS_HOST_ALLOWLIST || "")
    .split(",").map((s) => s.trim().toLowerCase().replace(/\.$/, "")).filter(Boolean);
}

/** True when a pin list is configured at all. */
export function orderAllowlistConfigured(): boolean {
  return entries().length > 0;
}

/**
 * Is this URL's host allowed to receive order tickets?
 *
 * Matches the host exactly, or as a subdomain of a listed entry, after
 * normalising a trailing dot (`pm.example.com.` and `pm.example.com` are the
 * same host to DNS, and treating them differently is a classic bypass).
 */
export function checkOrderHost(rawUrl: string): AllowlistCheck {
  const list = entries();
  const production = process.env.NODE_ENV === "production";

  if (!list.length) {
    if (production) {
      return {
        ok: false,
        reason:
          "ORDERS_HOST_ALLOWLIST is not set. Order endpoints must be pinned to named hosts in " +
          "production — this relay POSTs client buy instructions, so an unpinned destination is " +
          "not something it will do. Set it to a comma-separated list, e.g. " +
          "ORDERS_HOST_ALLOWLIST=pm.example.com,oms.bank.example",
      };
    }
    return { ok: true, reason: "" };   // dev convenience only
  }

  let host: string;
  try { host = new URL(rawUrl).hostname.toLowerCase().replace(/\.$/, ""); }
  catch { return { ok: false, reason: "not a valid URL" }; }

  const allowed = list.some((e) => host === e || host.endsWith(`.${e}`));
  if (!allowed) {
    // Name the host but not the list — the list is infrastructure detail.
    return { ok: false, reason: `host "${host}" is not in ORDERS_HOST_ALLOWLIST` };
  }
  return { ok: true, reason: "" };
}

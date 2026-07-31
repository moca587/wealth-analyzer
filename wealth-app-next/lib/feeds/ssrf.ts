// ─────────────────────────────────────────────────────────────────
// SSRF guard for the feed relay.
//
// The relay fetches a URL the USER supplies, from OUR server, with OUR
// network position. Without this module that is a server-side request
// forgery primitive: an attacker could point a "custodian feed" at
// http://169.254.169.254/ (AWS/GCP/Azure instance metadata — cloud
// credentials), at http://127.0.0.1:54321 (the local Supabase/API
// surface), or at any host inside the deployment VPC, and read the
// response body straight out of the relay.
//
// Defence in depth, in order:
//   1. scheme allowlist (http/https only — no file:, gopher:, data:)
//   2. no embedded credentials (http://user:pass@host strips oddly across
//      parsers and is never needed for a feed)
//   3. DNS resolution, then EVERY resolved address checked against the
//      blocked-range table (a public hostname can legitimately resolve to
//      127.0.0.1 — "DNS rebinding" — so the name alone proves nothing)
//   4. redirects followed MANUALLY, re-validating each hop (a 302 to
//      169.254.169.254 bypasses any check done only on the first URL)
//   5. hard timeout + response-size cap so a hostile endpoint cannot
//      hold a serverless invocation open or stream us out of memory
//
// Known residual risk: between the DNS check and the socket connect there
// is a TOCTOU window a determined rebinding attack could exploit. Closing
// it fully requires pinning the connection to the validated IP via a
// custom agent/lookup, which undici in Next's runtime does not currently
// expose cleanly. The exposure is limited to reading responses from hosts
// that are already reachable; the size/time caps and the fact that output
// is normalized (never echoed raw) keep the blast radius small. Deployments
// that need a hard guarantee should set FEEDS_HOST_ALLOWLIST.
// ─────────────────────────────────────────────────────────────────

import { lookup } from "node:dns/promises";

export const FEED_FETCH_TIMEOUT_MS = 15_000;
export const FEED_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const MAX_REDIRECTS = 3;

export class FeedFetchError extends Error {
  constructor(message: string, readonly code: "blocked" | "network" | "http" | "too_large" | "timeout") {
    super(message);
    this.name = "FeedFetchError";
  }
}

// ─── IP range checks ──────────────────────────────────────────────
function ipv4ToInt(ip: string): number | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  let out = 0;
  for (const p of parts) {
    if (!/^\d{1,3}$/.test(p)) return null;
    const n = Number(p);
    if (n > 255) return null;
    out = (out << 8) | n;
  }
  return out >>> 0;
}

/** CIDR blocks that must never be reachable through the relay. */
const BLOCKED_V4: Array<[string, number, string]> = [
  ["0.0.0.0", 8, "unspecified"],
  ["10.0.0.0", 8, "private"],
  ["100.64.0.0", 10, "carrier-grade NAT"],
  ["127.0.0.0", 8, "loopback"],
  ["169.254.0.0", 16, "link-local / cloud metadata"],
  ["172.16.0.0", 12, "private"],
  ["192.0.0.0", 24, "IETF protocol assignments"],
  ["192.0.2.0", 24, "documentation"],
  ["192.168.0.0", 16, "private"],
  ["198.18.0.0", 15, "benchmarking"],
  ["198.51.100.0", 24, "documentation"],
  ["203.0.113.0", 24, "documentation"],
  ["224.0.0.0", 4, "multicast"],
  ["240.0.0.0", 4, "reserved"],
];

function v4Reason(ip: string): string | null {
  const addr = ipv4ToInt(ip);
  if (addr === null) return "unparseable address";
  for (const [base, bits, label] of BLOCKED_V4) {
    const baseInt = ipv4ToInt(base)!;
    const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
    if ((addr & mask) === (baseInt & mask)) return label;
  }
  return null;
}

/** Expand an IPv6 address to its 8 hextets, or null if malformed. */
function v6Hextets(ip: string): number[] | null {
  let s = ip.trim().toLowerCase();
  if (s.startsWith("[") && s.endsWith("]")) s = s.slice(1, -1);
  const zone = s.indexOf("%");
  if (zone >= 0) s = s.slice(0, zone);

  // Embedded IPv4 tail (::ffff:1.2.3.4 / 64:ff9b::1.2.3.4)
  let tail: number[] = [];
  const v4m = s.match(/(\d{1,3}(?:\.\d{1,3}){3})$/);
  if (v4m) {
    const n = ipv4ToInt(v4m[1]);
    if (n === null) return null;
    tail = [(n >>> 16) & 0xffff, n & 0xffff];
    s = s.slice(0, s.length - v4m[1].length).replace(/:$/, "") || "::";
  }

  const dbl = s.split("::");
  if (dbl.length > 2) return null;
  const head = dbl[0] ? dbl[0].split(":").filter(Boolean) : [];
  const rest = dbl.length === 2 && dbl[1] ? dbl[1].split(":").filter(Boolean) : [];
  const parse = (g: string[]) => {
    const out: number[] = [];
    for (const h of g) {
      if (!/^[0-9a-f]{1,4}$/.test(h)) return null;
      out.push(parseInt(h, 16));
    }
    return out;
  };
  const h = parse(head), r = parse(rest);
  if (!h || !r) return null;
  const known = h.length + r.length + tail.length;
  if (dbl.length === 2) {
    if (known > 8) return null;
    return [...h, ...new Array(8 - known).fill(0), ...r, ...tail];
  }
  const full = [...h, ...r, ...tail];
  return full.length === 8 ? full : null;
}

function v6Reason(ip: string): string | null {
  const x = v6Hextets(ip);
  if (!x) return "unparseable address";
  const isZero = x.every((n) => n === 0);
  if (isZero) return "unspecified";
  if (x.slice(0, 7).every((n) => n === 0) && x[7] === 1) return "loopback";
  // IPv4-mapped (::ffff:a.b.c.d) and NAT64 (64:ff9b::/96) — judge the inner v4
  const inner = () => {
    const v4 = `${(x[6] >> 8) & 0xff}.${x[6] & 0xff}.${(x[7] >> 8) & 0xff}.${x[7] & 0xff}`;
    return v4Reason(v4) ?? null;
  };
  if (x.slice(0, 5).every((n) => n === 0) && x[5] === 0xffff) return inner() ?? null;
  if (x[0] === 0x0064 && x[1] === 0xff9b) return inner() ?? "NAT64";
  if (x[0] === 0x2002) {
    // 6to4 — embedded v4 sits in hextets 1-2
    const v4 = `${(x[1] >> 8) & 0xff}.${x[1] & 0xff}.${(x[2] >> 8) & 0xff}.${x[2] & 0xff}`;
    return v4Reason(v4) ?? null;
  }
  if ((x[0] & 0xfe00) === 0xfc00) return "unique local";
  if ((x[0] & 0xffc0) === 0xfe80) return "link-local";
  if ((x[0] & 0xff00) === 0xff00) return "multicast";
  return null;
}

/**
 * True when the string is an IP literal rather than a hostname. Anything
 * else must go through DNS before it can be judged — `example.com` is not
 * "an unparseable address", it is a name we have not resolved yet.
 */
export function isIpLiteral(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, "");
  return h.includes(":") || /^\d{1,3}(\.\d{1,3}){3}$/.test(h);
}

/**
 * Why this literal IP is unsafe, or null if it's fine.
 * Only meaningful for IP literals — callers must gate on isIpLiteral().
 */
export function blockedIpReason(ip: string): string | null {
  const h = ip.replace(/^\[|\]$/g, "");
  return h.includes(":") ? v6Reason(h) : v4Reason(h);
}

// ─── URL + host validation ────────────────────────────────────────
function allowlist(): string[] {
  return (process.env.FEEDS_HOST_ALLOWLIST || "")
    .split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

/**
 * Validate the URL's shape. Pure/synchronous — no DNS — so it is cheap
 * enough to run at save time as well as fetch time.
 */
export function validateFeedUrl(raw: string): { ok: true; url: URL } | { ok: false; reason: string } {
  let url: URL;
  try { url = new URL(raw); }
  catch { return { ok: false, reason: "not a valid URL" }; }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: `scheme ${url.protocol} is not allowed — use http or https` };
  }
  if (url.username || url.password) {
    return { ok: false, reason: "credentials embedded in the URL are not allowed — use the authentication fields" };
  }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, "");
  if (!host) return { ok: false, reason: "missing host" };

  const allowed = allowlist();
  if (allowed.length && !allowed.some((h) => host === h || host.endsWith("." + h))) {
    return { ok: false, reason: `host ${host} is not in FEEDS_HOST_ALLOWLIST` };
  }

  // Literal IPs can be judged immediately; names need DNS (see assertHostAllowed).
  if (isIpLiteral(host)) {
    const literal = blockedIpReason(host);
    if (literal) return { ok: false, reason: `address ${host} is not reachable through the relay (${literal})` };
  }

  // Obvious internal names, blocked even before DNS.
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".internal") || host.endsWith(".local")) {
    return { ok: false, reason: `host ${host} is internal` };
  }
  return { ok: true, url };
}

/** Resolve the hostname and reject if ANY resolved address is internal. */
export async function assertHostAllowed(hostname: string): Promise<void> {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  // A literal IP was already judged by validateFeedUrl — no DNS to do.
  if (isIpLiteral(host)) {
    const reason = blockedIpReason(host);
    if (reason) throw new FeedFetchError(`address ${host} is not reachable through the relay (${reason})`, "blocked");
    return;
  }
  let addrs: Array<{ address: string }>;
  try {
    addrs = await lookup(host, { all: true, verbatim: true });
  } catch {
    throw new FeedFetchError(`could not resolve ${host}`, "network");
  }
  if (!addrs.length) throw new FeedFetchError(`could not resolve ${host}`, "network");
  for (const a of addrs) {
    const reason = blockedIpReason(a.address);
    if (reason) {
      throw new FeedFetchError(
        `${host} resolves to ${a.address}, which is not reachable through the relay (${reason})`,
        "blocked"
      );
    }
  }
}

// ─── Guarded fetch ────────────────────────────────────────────────
export interface SafeFetchResult { body: string; contentType: string; finalUrl: string; }

/**
 * Fetch with the full guard chain: validated URL, vetted DNS, manual
 * redirects (each re-validated), timeout, and a streaming size cap.
 */
export async function safeFetch(rawUrl: string, headers: Record<string, string>): Promise<SafeFetchResult> {
  let current = rawUrl;

  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const v = validateFeedUrl(current);
    if (!v.ok) throw new FeedFetchError(v.reason, "blocked");
    await assertHostAllowed(v.url.hostname);

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FEED_FETCH_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch(v.url, {
        method: "GET",
        headers,
        redirect: "manual",     // we re-validate every hop ourselves
        signal: controller.signal,
        cache: "no-store",
      });
    } catch (e) {
      clearTimeout(timer);
      const msg = e instanceof Error ? e.message : String(e);
      throw new FeedFetchError(
        controller.signal.aborted ? `request timed out after ${FEED_FETCH_TIMEOUT_MS / 1000}s` : msg,
        controller.signal.aborted ? "timeout" : "network"
      );
    }

    // Redirect: validate the next hop on the next loop iteration.
    if (res.status >= 300 && res.status < 400) {
      clearTimeout(timer);
      const loc = res.headers.get("location");
      if (!loc) throw new FeedFetchError(`upstream returned ${res.status} without a Location header`, "http");
      current = new URL(loc, v.url).toString();
      continue;
    }

    if (!res.ok) {
      clearTimeout(timer);
      throw new FeedFetchError(`upstream returned HTTP ${res.status} ${res.statusText}`.trim(), "http");
    }

    // Enforce the size cap while streaming so an endless body can't OOM us.
    const declared = Number(res.headers.get("content-length") || 0);
    if (declared && declared > FEED_MAX_BYTES) {
      clearTimeout(timer);
      throw new FeedFetchError(`response is ${(declared / 1048576).toFixed(1)} MB — the relay caps feeds at 5 MB`, "too_large");
    }
    try {
      const reader = res.body?.getReader();
      if (!reader) { clearTimeout(timer); return { body: "", contentType: res.headers.get("content-type") || "", finalUrl: v.url.toString() }; }
      const chunks: Uint8Array[] = [];
      let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          total += value.byteLength;
          if (total > FEED_MAX_BYTES) {
            try { await reader.cancel(); } catch { /* already closed */ }
            throw new FeedFetchError("response exceeded the relay's 5 MB cap", "too_large");
          }
          chunks.push(value);
        }
      }
      const buf = new Uint8Array(total);
      let off = 0;
      for (const c of chunks) { buf.set(c, off); off += c.byteLength; }
      return {
        body: new TextDecoder("utf-8", { fatal: false }).decode(buf),
        contentType: res.headers.get("content-type") || "",
        finalUrl: v.url.toString(),
      };
    } finally {
      clearTimeout(timer);
    }
  }
  throw new FeedFetchError(`too many redirects (max ${MAX_REDIRECTS})`, "network");
}

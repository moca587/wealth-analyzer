// ─────────────────────────────────────────────────────────────────
// Scrubbing for anything a relay run reports back.
//
// A feed error message is written to `feed_connections.last_status` AND
// returned to the browser, so it is an egress path. Three distinct leaks
// converge on it:
//
//  1. Upstream errors quote the request URL, and plenty of custodian URLs
//     carry the key in the query string (`?api_key=…`).
//  2. The SSRF guard names the address it resolved and blocked, which turns
//     a rejected request into an internal-network scanner: point a
//     connection at `foo.internal` and read the reason to learn whether it
//     resolves, and to what.
//  3. An upstream that echoes a bad Authorization header back in its error
//     body puts the credential itself into the message.
//
// Lives outside the route handler so it can be unit-tested directly.
// ─────────────────────────────────────────────────────────────────

/** Upstream failure codes → the status the client should actually see. */
export const HTTP_FOR: Record<string, number> = {
  blocked: 400,     // the URL is the caller's mistake, not an upstream fault
  too_large: 413,
  timeout: 504,
  http: 502,
  network: 502,
};

const MAX_LEN = 300;   // matches the last_status column budget

/**
 * Remove credentials, query strings, and resolved IP literals from a message.
 * `secret` is the decrypted credential for this run, when one exists.
 */
export function redact(msg: string, secret?: string): string {
  let out = String(msg ?? "");

  // The credential itself, first — before any other rewrite can split it.
  // Short secrets are skipped: a 1–3 char string would match everywhere.
  if (secret && secret.length >= 4) {
    out = out.split(secret).join("«redacted»");
    // basic auth stores user:password but travels base64; catch both halves.
    const [, pass] = secret.split(":");
    if (pass && pass.length >= 4) out = out.split(pass).join("«redacted»");
    const b64 = Buffer.from(secret, "utf8").toString("base64");
    if (b64.length >= 8) out = out.split(b64).join("«redacted»");
  }

  // Query strings — the value is the sensitive part, so drop the lot.
  out = out.replace(/(https?:\/\/[^\s"'<>]*?)\?[^\s"'<>]*/gi, "$1?«redacted»");

  // Bare IP literals, v4 and v6, so a blocked-host reason can't map our VPC.
  out = out.replace(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g, "«address»");
  out = out.replace(/\b(?:[0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}\b/g, "«address»");

  return out.slice(0, MAX_LEN);
}

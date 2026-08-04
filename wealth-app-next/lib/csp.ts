// ─────────────────────────────────────────────────────────────────
// The Content-Security-Policy, built at REQUEST time.
//
// It lived in next.config.mjs `headers()` first, which is evaluated when
// the app is BUILT. That produced a policy whose `connect-src` named
// whatever NEXT_PUBLIC_SUPABASE_URL happened to be during the build —
// caught by smoke-testing the container: an image built with a
// placeholder emitted `connect-src https://placeholder-project.supabase.co`
// and then, at runtime with a real project configured, silently blocked
// every auth call. The app renders perfectly and nobody can sign in.
//
// That is the same build-time/runtime split lib/env.ts warns about, and
// the CSP had it too. Building the policy per request removes the class
// of bug entirely rather than documenting it.
//
// The policy itself is tight because this app loads nothing third-party:
// no CDN scripts, no external fonts, no remote images.
// ─────────────────────────────────────────────────────────────────

/** The Supabase origin, plus its websocket form for realtime. */
function supabaseOrigins(url: string | undefined): string[] {
  try {
    const origin = new URL(url || "").origin;
    return [origin, origin.replace(/^http/, "ws")];
  } catch {
    // No configured project: emit nothing rather than a wildcard. Auth is
    // already broken in that state, and lib/env.ts refuses to boot on it in
    // production — a permissive CSP would only hide it.
    return [];
  }
}

export function buildCsp(env: NodeJS.ProcessEnv = process.env): string {
  const dev = env.NODE_ENV !== "production";
  const connect = ["'self'", ...supabaseOrigins(env.NEXT_PUBLIC_SUPABASE_URL)];

  return [
    "default-src 'self'",
    // Next's runtime needs inline bootstrap; dev additionally needs eval for HMR.
    dev ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'" : "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    `connect-src ${connect.join(" ")}`,
    "object-src 'none'",
    // Belt and braces with X-Frame-Options; this is the one modern browsers
    // actually honour.
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

/** Headers applied to every response. */
export function securityHeaders(env: NodeJS.ProcessEnv = process.env): Record<string, string> {
  return {
    "Content-Security-Policy": buildCsp(env),
    // Two years, subdomains included. Browsers exempt localhost.
    "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    // A path can carry a household id; never hand it to a third party.
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
    "Cross-Origin-Opener-Policy": "same-origin",
  };
}

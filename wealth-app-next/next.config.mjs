/** @type {import('next').NextConfig} */

// ─────────────────────────────────────────────────────────────────
// Security headers.
//
// This app renders a client's full financial position and, on
// /app/orders, a control that sends real money instructions to a PM
// system. Shipping that with no framing protection is page one of any
// pen-test report, and the buyer is a regulated firm whose IT will run
// exactly that scan before signing.
//
// The CSP is deliberately tight: this app loads no third-party scripts,
// no external fonts and no remote images. `connect-src` needs the
// Supabase project origin, which is only known at build time — so it is
// derived from NEXT_PUBLIC_SUPABASE_URL rather than left as a wildcard.
// ─────────────────────────────────────────────────────────────────

const supabaseOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || "").origin;
  } catch {
    return "";
  }
})();

// Supabase realtime uses wss:// on the same host.
const supabaseWs = supabaseOrigin.replace(/^https:/, "wss:").replace(/^http:/, "ws:");

const csp = [
  "default-src 'self'",
  // Next's runtime needs inline bootstrap; dev additionally needs eval for HMR.
  process.env.NODE_ENV === "production"
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin} ${supabaseWs}`.replace(/\s+/g, " ").trim(),
  "object-src 'none'",
  // Belt and braces with X-Frame-Options below; this is the one modern
  // browsers actually honour.
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

const nextConfig = {
  reactStrictMode: true,
  // typedRoutes defaults to false and graduated out of `experimental` in Next 15.

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: csp },
          // Two years, subdomains included. Browsers exempt localhost.
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          // A path can carry a household id; never hand it to a third party.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
        ],
      },
      {
        // Nothing under /api is cacheable: every response is one client's
        // financial data, so a shared cache would be a leak BETWEEN
        // households, not merely a stale page.
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, no-cache, must-revalidate" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;

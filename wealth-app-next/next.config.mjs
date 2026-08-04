import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// NOTE: the Content-Security-Policy and the other per-response security
// headers are NOT here. `headers()` is evaluated at BUILD time, so a CSP
// naming the Supabase origin froze whatever NEXT_PUBLIC_SUPABASE_URL was
// set during the build — an image built with a placeholder silently blocked
// every auth call at runtime. They live in middleware.ts (lib/csp.ts), which
// runs per request. Only the cache rule below is build-time safe.

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // typedRoutes defaults to false and graduated out of `experimental` in Next 15.

  // Emit a self-contained server (.next/standalone) with only the modules
  // actually reached, so the app can run as a plain container on someone
  // else's infrastructure rather than only on a Vercel-shaped host.
  //
  // This is not premature: the deployment target is a Swiss EAM's Avaloq
  // environment, and a partner app that can only run on a US-headquartered
  // PaaS fails the first question their IT asks. It also decouples the
  // hosting decision from the data-residency promise in legal/PRIVACY-EN.md.
  output: "standalone",

  // Without this, Next infers the trace root from the nearest lockfile
  // ABOVE this directory and nests the standalone build under the full
  // host path — `.next/standalone/.claude/worktrees/<name>/wealth-app-next/
  // server.js` instead of `.next/standalone/server.js`. The Dockerfile
  // copies the directory, so the image builds and then fails to start.
  // Caught by actually running the build; the warning had been printing
  // for a while and reading as cosmetic.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),

  // Trim the response header that advertises the framework and version.
  poweredByHeader: false,

  async headers() {
    return [
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

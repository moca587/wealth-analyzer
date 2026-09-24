/**
 * Wealth Analyzer — free market-data proxy (Cloudflare Worker)
 * ------------------------------------------------------------
 * Yahoo Finance (and similar free sources) can't be called directly from a
 * browser because they don't send CORS headers. This tiny Worker fetches them
 * server-side and adds the missing header, so the static demo can read live
 * quotes with NO API key.
 *
 * It is NOT an open proxy: it only forwards to an allowlist of finance hosts,
 * and it edge-caches responses for 30s to stay well inside the free tier.
 *
 * DEPLOY (either way is free):
 *   A) Dashboard: Cloudflare → Workers & Pages → Create → Worker →
 *      replace the code with this file → Deploy. Copy the
 *      https://<name>.<subdomain>.workers.dev URL.
 *   B) CLI:  npm i -g wrangler && wrangler deploy wa-price-proxy.worker.js
 *
 * Then in the demo: Current Portfolio → Live Prices → paste that URL.
 *
 * Call shape used by the app:  https://<worker>/?url=<url-encoded target>
 */

const ALLOW = new Set([
  "query1.finance.yahoo.com",
  "query2.finance.yahoo.com",
  "stooq.com",
  "stooq.pl",
  "api.frankfurter.app",   // FX (ECB), CORS-open — harmless to include
  "api.coingecko.com",     // crypto
]);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method !== "GET") return json({ error: "GET only" }, 405);

    const target = new URL(request.url).searchParams.get("url");
    if (!target) return json({ error: "Missing ?url=" }, 400);

    let t;
    try { t = new URL(target); } catch { return json({ error: "Bad url" }, 400); }
    if (t.protocol !== "https:") return json({ error: "https only" }, 400);
    if (!ALLOW.has(t.hostname)) return json({ error: "Host not allowed: " + t.hostname }, 403);

    try {
      const upstream = await fetch(t.toString(), {
        headers: {
          // Yahoo returns 429/403 to obvious bots; a normal UA + Accept is enough.
          "User-Agent": "Mozilla/5.0 (compatible; WealthAnalyzer/1.0)",
          "Accept": "application/json,text/csv,*/*",
        },
        cf: { cacheTtl: 30, cacheEverything: true },
      });
      const body = await upstream.arrayBuffer();
      const headers = new Headers(CORS);
      headers.set("Content-Type", upstream.headers.get("Content-Type") || "application/json");
      headers.set("Cache-Control", "public, max-age=30");
      return new Response(body, { status: upstream.status, headers });
    } catch (e) {
      return json({ error: "Upstream fetch failed", detail: String(e) }, 502);
    }
  },
};

function json(obj, status) {
  return new Response(JSON.stringify(obj), {
    status: status || 200,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

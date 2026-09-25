/**
 * Wealth Analyzer — free market-data proxy (Cloudflare Worker)
 * ------------------------------------------------------------
 * Yahoo Finance, OpenFIGI and the research RSS feeds can't be called directly
 * from a browser because they don't send CORS headers. This tiny Worker fetches
 * them server-side and adds the missing header, so the static demo can read
 * live quotes, resolve tickers/ISINs and refresh research with NO API key.
 *
 * Why it's required: the public corsproxy.io fallback the app used to lean on
 * stopped accepting anonymous requests in 2026 (403 "keyless_legacy_url").
 *
 * It is NOT an open proxy: it only forwards to an allowlist of hosts, POST is
 * allowed only for OpenFIGI's two lookup endpoints, and GET responses are
 * edge-cached for 30s to stay well inside the free tier.
 *
 * DEPLOY (either way is free):
 *   A) Dashboard: Cloudflare → Workers & Pages → Create → Worker →
 *      replace the code with this file → Deploy. Copy the
 *      https://<name>.<subdomain>.workers.dev URL.
 *   B) CLI:  npm i -g wrangler && wrangler deploy wa-price-proxy.worker.js
 *
 * Then: Admin console → Market Data → "Live Prices — data proxy URL" → paste
 * that URL. (Or have it baked into the build as DEFAULT_DATA_PROXY so the demo
 * works on every device without anyone pasting anything.)
 *
 * Call shape used by the app:  https://<worker>/?url=<url-encoded target>
 */

// GET-only hosts.
const ALLOW_GET = new Set([
  // Quotes / fund performance / instrument search
  "query1.finance.yahoo.com",
  "query2.finance.yahoo.com",
  // FX + crypto (CORS-open already; harmless to include as a fallback)
  "api.frankfurter.dev",
  "api.frankfurter.app",
  "api.coingecko.com",
  // Admin → Research Library RSS/Atom feeds
  "seekingalpha.com",
  "feeds.megaphone.fm",
  "www.morningstar.com",
  "www.morganstanley.com",
  "www.eatonvance.com",
  "www.bloomberg.com",
  "feeds.bloomberg.com",
  "www.blackrock.com",
  "newsroom.bankofamerica.com",
  "insight.factset.com",
  "feeds.feedburner.com",
  "am.jpmorgan.com",
  "news.google.com",
]);

// POST is allowed only for these exact host+path pairs (ticker/ISIN/CUSIP lookup).
const ALLOW_POST = new Set([
  "api.openfigi.com/v3/mapping",
  "api.openfigi.com/v3/search",
]);
const MAX_POST_BYTES = 32 * 1024;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (request.method !== "GET" && request.method !== "POST") return json({ error: "GET or POST only" }, 405);

    const target = new URL(request.url).searchParams.get("url");
    if (!target) return json({ error: "Missing ?url=" }, 400);

    let t;
    try { t = new URL(target); } catch { return json({ error: "Bad url" }, 400); }
    if (t.protocol !== "https:") return json({ error: "https only" }, 400);

    const isPost = request.method === "POST";
    if (isPost) {
      if (!ALLOW_POST.has(t.hostname + t.pathname)) return json({ error: "POST not allowed for " + t.hostname + t.pathname }, 403);
    } else if (!ALLOW_GET.has(t.hostname)) {
      return json({ error: "Host not allowed: " + t.hostname }, 403);
    }

    let body;
    if (isPost) {
      body = await request.arrayBuffer();
      if (body.byteLength > MAX_POST_BYTES) return json({ error: "Request body too large" }, 413);
    }

    try {
      const upstream = await fetch(t.toString(), {
        method: request.method,
        headers: {
          // Yahoo returns 429/403 to obvious bots; a normal UA + Accept is enough.
          "User-Agent": "Mozilla/5.0 (compatible; WealthAnalyzer/1.0)",
          "Accept": "application/json,application/xml,application/rss+xml,text/xml,text/csv,*/*",
          ...(isPost ? { "Content-Type": "application/json" } : {}),
        },
        body,
        // Cache GETs briefly at the edge; never cache POST lookups.
        ...(isPost ? {} : { cf: { cacheTtl: 30, cacheEverything: true } }),
      });
      const out = await upstream.arrayBuffer();
      const headers = new Headers(CORS);
      headers.set("Content-Type", upstream.headers.get("Content-Type") || "application/json");
      headers.set("Cache-Control", isPost ? "no-store" : "public, max-age=30");
      return new Response(out, { status: upstream.status, headers });
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

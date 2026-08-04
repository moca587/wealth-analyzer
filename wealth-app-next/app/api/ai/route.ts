// ─────────────────────────────────────────────────────────────────
// API route: POST /api/ai  — server-side gateway to the AI provider.
//
// The browser used to call api.anthropic.com directly, with the key in
// localStorage and anthropic-dangerous-direct-browser-access:true. That put a
// credential on every adviser's workstation, made the provider an undisclosed
// direct recipient of client documents, and left the firm with no record of
// what was sent.
//
// This route keeps the key server-side, requires an authenticated session,
// caps what may be asked for, and records metadata (never document content)
// so a firm can answer "what went to the AI, when, and for whom".
//
// The single-file build can point at this endpoint instead of the provider;
// see waAiEndpoint() in wealth-analyzer.html.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const PROVIDER_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

// A request body larger than this is not a planning document, it is a mistake
// or an attempt to run someone else's workload through the firm's key.
const MAX_BODY_BYTES = 12 * 1024 * 1024;
const MAX_TOKENS_CAP = 16384;

function allowedModels(): string[] {
  return (process.env.AI_MODEL_ALLOWLIST || "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

export async function POST(req: Request) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    // Fail closed and say so plainly: a misconfigured gateway must not silently
    // fall back to letting the browser hold a credential.
    return NextResponse.json(
      { error: "AI gateway is not configured on the server (ANTHROPIC_API_KEY missing)." },
      { status: 503 },
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const raw = await req.text();
  if (raw.length > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: `Request too large (${raw.length} bytes, limit ${MAX_BODY_BYTES}).` },
      { status: 413 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Body must be JSON." }, { status: 400 });
  }

  const model = typeof body.model === "string" ? body.model : "";
  const allow = allowedModels();
  if (allow.length && !allow.includes(model)) {
    return NextResponse.json(
      { error: `Model "${model}" is not on this deployment's allowlist.` },
      { status: 400 },
    );
  }

  // Cap spend per call regardless of what the client asked for.
  if (typeof body.max_tokens === "number" && body.max_tokens > MAX_TOKENS_CAP) {
    body.max_tokens = MAX_TOKENS_CAP;
  }

  const started = Date.now();
  let upstream: Response;
  try {
    upstream = await fetch(PROVIDER_URL, {
      method: "POST",
      headers: {
        "x-api-key": key,
        "anthropic-version": ANTHROPIC_VERSION,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (e) {
    return NextResponse.json(
      { error: "AI provider unreachable: " + (e instanceof Error ? e.message : String(e)) },
      { status: 502 },
    );
  }

  const text = await upstream.text();

  // Metadata only. Document content and the extracted profile are deliberately
  // never logged - the point of the gateway is to reduce exposure, not add a
  // second copy of the client's financial life to the server logs.
  console.info(
    JSON.stringify({
      at: new Date().toISOString(),
      route: "/api/ai",
      user: user.id,
      model,
      requestBytes: raw.length,
      status: upstream.status,
      ms: Date.now() - started,
    }),
  );

  // Pass the provider response through verbatim so existing client parsing
  // (tool_use blocks, error shapes) keeps working unchanged.
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "content-type": "application/json" },
  });
}

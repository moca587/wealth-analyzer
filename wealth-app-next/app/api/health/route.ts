// ─────────────────────────────────────────────────────────────────
// GET /api/health — is this instance actually able to serve?
//
// Unauthenticated on purpose: a load balancer and an uptime probe have no
// session. So it must answer WITHOUT revealing anything — no version
// string, no env values, no database error text, no counts. It says which
// subsystems are usable and nothing about what they contain.
//
// The distinction that matters: `degraded` means the app runs but some
// capability is off (no encryption key → credentials cannot be stored);
// `unhealthy` means it cannot serve its purpose (no database). A probe
// should take an unhealthy instance out of rotation and leave a degraded
// one in — pulling every instance because ORDERS_HOST_ALLOWLIST is unset
// would turn a configuration warning into an outage.
// ─────────────────────────────────────────────────────────────────

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkEnv } from "@/lib/env";
import { encryptionAvailable } from "@/lib/feeds/crypto";
import { orderAllowlistConfigured } from "@/lib/orders/allowlist";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, "ok" | "degraded" | "down"> = {};

  // Reachability only. A trivially cheap query against a table that always
  // exists after 001 — never a count, which would grow into a slow probe
  // and leak scale.
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("schema_migrations").select("version").limit(1);
    // A permission error still proves the database answered. Only a
    // transport/relation failure is "down".
    checks.database = !error || error.code === "42501" || error.code === "PGRST301" ? "ok" : "down";
  } catch {
    checks.database = "down";
  }

  checks.credentialStore = encryptionAvailable() ? "ok" : "degraded";
  checks.orderEgressPinned = orderAllowlistConfigured() ? "ok" : "degraded";

  // Names only — never the problem text, which quotes configuration.
  const envProblems = checkEnv();
  checks.configuration = envProblems.some((p) => p.level === "fatal")
    ? "down"
    : envProblems.length ? "degraded" : "ok";

  const values = Object.values(checks);
  const status = values.includes("down") ? "unhealthy"
    : values.includes("degraded") ? "degraded"
    : "healthy";

  return NextResponse.json(
    { status, checks },
    {
      status: status === "unhealthy" ? 503 : 200,
      headers: { "Cache-Control": "no-store" },
    },
  );
}

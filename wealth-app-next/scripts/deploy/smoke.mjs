// ─────────────────────────────────────────────────────────────────
// Smoke-test a RUNNING instance. Machine-checkable half of the runbook's
// post-deploy check; prints the human half as a checklist.
//
//   BASE_URL=https://wealth.firm.ch node scripts/deploy/smoke.mjs
//   node scripts/deploy/smoke.mjs http://localhost:3000
//
// /api/health calls lib/env.ts server-side, so a fatal misconfiguration
// (placeholder Supabase URL, missing keys, half-configured billing)
// surfaces here as `configuration: down` — this is the runtime preflight.
// ─────────────────────────────────────────────────────────────────

const base = (process.argv[2] || process.env.BASE_URL || "http://localhost:3000").replace(/\/$/, "");

async function main() {
  process.stdout.write(`Smoke test → ${base}\n\n`);

  let res, body;
  try {
    res = await fetch(`${base}/api/health`, { headers: { Accept: "application/json" } });
    body = await res.json();
  } catch (e) {
    process.stderr.write(`✗ /api/health unreachable: ${e.message}\n` +
      "  The instance is not up, or TLS/DNS is wrong. Nothing else can be checked.\n");
    process.exit(1);
  }

  // Guard against a proxy/CDN/WAF answering 200 with a generic body while
  // the origin is down. Our health endpoint always returns a known status
  // and a checks object naming `database`; anything else is not it.
  const KNOWN = ["healthy", "degraded", "unhealthy"];
  const checks = body?.checks ?? {};
  if (!KNOWN.includes(body?.status) || typeof checks.database !== "string") {
    process.stderr.write(
      `✗ Unexpected /api/health response (HTTP ${res.status}). This is not the app's\n` +
      "  health endpoint — a proxy, CDN, or WAF is likely intercepting it. Do not deploy.\n");
    process.exit(1);
  }

  const label = { ok: "✓", degraded: "!", down: "✗" };
  for (const [k, v] of Object.entries(checks)) {
    process.stdout.write(`  ${label[v] ?? "?"} ${k}: ${v}\n`);
  }
  process.stdout.write(`\nstatus: ${body?.status ?? "unknown"} (HTTP ${res.status})\n`);

  // `down` on any subsystem means the instance cannot serve — do not route
  // traffic to it. `degraded` (e.g. billing off on a pilot) is acceptable.
  const down = Object.values(checks).filter((v) => v === "down");
  if (body?.status === "unhealthy" || down.length) {
    process.stderr.write(
      "\n✗ Instance is UNHEALTHY. Common causes:\n" +
      "  database down    → wrong Supabase URL/keys, or migrations not applied\n" +
      "  configuration down → a fatal env problem; the server logs name it (lib/env.ts)\n");
    process.exit(1);
  }

  process.stdout.write(
    "\n✓ Machine checks passed. Now the human half (runbook §4):\n" +
    "   □ Sign up; the confirmation email link points at this origin, not localhost\n" +
    "   □ Landing on /app shows a NAMED household (the signup trigger fired)\n" +
    "   □ Save a plan twice → versions 1, 2; two tabs saving → the 2nd sees a conflict\n" +
    "   □ Add a second client, switch between them → different figures under each name\n" +
    "   □ /app/feeds → add a credential, Test fetch (proves FEEDS_ENCRYPTION_KEY)\n" +
    "   □ /app/team → invite yourself at a second address, redeem the link\n" +
    "   □ /app/audit → the plan saves and the invite appear\n");
}

main().catch((e) => { process.stderr.write(`✗ ${e.message}\n`); process.exit(1); });

// ─────────────────────────────────────────────────────────────────
// Fail at BOOT, not at the worst possible moment.
//
// Every one of these variables is already checked somewhere — but each
// check fires on the request that needed it, which for this product means:
// FEEDS_ENCRYPTION_KEY surfaces as a 503 when an advisor first saves a
// custodian credential; ORDERS_HOST_ALLOWLIST surfaces when someone
// presses BUY; NEXT_PUBLIC_APP_URL never surfaces at all, it just sends
// confirmation emails pointing at localhost.
//
// A misconfigured deploy that renders perfectly and cannot authenticate is
// the worst failure mode available, because nothing looks wrong. So this
// runs once at startup, says everything that is wrong in one message, and
// in production refuses to start.
//
// It deliberately does NOT read secrets it does not need to validate, and
// it never logs a value — only whether one is present and well-formed.
// ─────────────────────────────────────────────────────────────────

export interface EnvProblem {
  name: string;
  problem: string;
  /** fatal → refuse to boot in production. warn → degraded but runnable. */
  level: "fatal" | "warn";
  fix: string;
}

const PLACEHOLDERS = [
  "your-project-ref", "YOUR-PROJECT-REF", "placeholder", "example.com",
  "your-anon-public-key", "changeme", "xxx",
];

const looksPlaceholder = (v: string) =>
  PLACEHOLDERS.some((p) => v.toLowerCase().includes(p.toLowerCase()));

/**
 * A 32-byte key as 64 hex chars or 43-char base64 — the same rule
 * lib/feeds/crypto.ts enforces. A passphrase is REJECTED there because the
 * old sha256 fallback made fail-closed unreachable; this must agree, or
 * boot would pass and the first save would 503.
 */
const looksLikeKey = (v: string) =>
  /^[0-9a-fA-F]{64}$/.test(v) || /^[A-Za-z0-9+/]{43}=?$/.test(v);

export function checkEnv(env: NodeJS.ProcessEnv = process.env): EnvProblem[] {
  const problems: EnvProblem[] = [];
  const prod = env.NODE_ENV === "production";
  const get = (n: string) => (env[n] ?? "").trim();

  // ─── Supabase ───────────────────────────────────────────────────
  const url = get("NEXT_PUBLIC_SUPABASE_URL");
  if (!url) {
    problems.push({
      name: "NEXT_PUBLIC_SUPABASE_URL", level: "fatal",
      problem: "not set — the app cannot reach its database",
      fix: "Supabase dashboard → Settings → API → Project URL",
    });
  } else if (!/^https:\/\/[^/]+\.supabase\.(co|net)\/?$/.test(url) && !url.startsWith("http://localhost")) {
    problems.push({
      name: "NEXT_PUBLIC_SUPABASE_URL", level: "warn",
      problem: "does not look like a Supabase project URL",
      fix: "expected https://<ref>.supabase.co",
    });
  } else if (looksPlaceholder(url)) {
    // The specific failure CI would otherwise ship: .github/workflows/ci.yml
    // builds with https://placeholder.supabase.co, and NEXT_PUBLIC_* values
    // are inlined at BUILD time — so a deploy reusing that step produces an
    // app that renders perfectly and can never authenticate.
    problems.push({
      name: "NEXT_PUBLIC_SUPABASE_URL", level: "fatal",
      problem: `still the placeholder (${url}) — this value is baked into the browser bundle at build time`,
      fix: "set the real project URL in the BUILD environment, not just at runtime",
    });
  }

  const anon = get("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  if (!anon) {
    problems.push({
      name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", level: "fatal",
      problem: "not set — every request will be unauthenticated",
      fix: "Supabase dashboard → Settings → API → anon public",
    });
  } else if (looksPlaceholder(anon)) {
    problems.push({
      name: "NEXT_PUBLIC_SUPABASE_ANON_KEY", level: "fatal",
      problem: "still the placeholder — baked into the browser bundle at build time",
      fix: "set the real anon key in the BUILD environment",
    });
  }

  // ─── App URL ────────────────────────────────────────────────────
  // Silent when wrong: confirmation and password-reset emails carry it.
  const appUrl = get("NEXT_PUBLIC_APP_URL");
  if (!appUrl) {
    problems.push({
      name: "NEXT_PUBLIC_APP_URL", level: prod ? "fatal" : "warn",
      problem: "not set — confirmation and reset emails will have no valid link",
      fix: "set it to the public origin, e.g. https://app.yourfirm.com",
    });
  } else if (prod && /localhost|127\.0\.0\.1/.test(appUrl)) {
    problems.push({
      name: "NEXT_PUBLIC_APP_URL", level: "fatal",
      problem: `is ${appUrl} in a production build — every confirmation email would link to localhost`,
      fix: "this is inlined at build time; set it in the BUILD environment",
    });
  } else if (prod && !appUrl.startsWith("https://")) {
    problems.push({
      name: "NEXT_PUBLIC_APP_URL", level: "warn",
      problem: "is not https — auth cookies marked Secure will not be sent",
      fix: "use an https origin in production",
    });
  }

  // ─── Credential encryption ──────────────────────────────────────
  const encKey = get("FEEDS_ENCRYPTION_KEY");
  if (!encKey) {
    // Not fatal: the app is usable without feeds/orders, and crypto.ts
    // already refuses to store a secret rather than persisting plaintext.
    // But an operator should learn this at deploy, not from an advisor.
    problems.push({
      name: "FEEDS_ENCRYPTION_KEY", level: prod ? "fatal" : "warn",
      problem: "not set — custodian and OMS credentials cannot be stored (saving one returns 503)",
      fix: "openssl rand -base64 32",
    });
  } else if (!looksLikeKey(encKey)) {
    problems.push({
      name: "FEEDS_ENCRYPTION_KEY", level: "fatal",
      problem: "is not 32 bytes of key material (expected 64 hex chars or 43-char base64)",
      fix: "a passphrase is deliberately rejected — openssl rand -base64 32",
    });
  }

  const prevKey = get("FEEDS_ENCRYPTION_KEY_PREVIOUS");
  if (prevKey && !looksLikeKey(prevKey)) {
    problems.push({
      name: "FEEDS_ENCRYPTION_KEY_PREVIOUS", level: "fatal",
      problem: "is set but is not valid key material, so rotation would fail closed on every stored secret",
      fix: "unset it, or set it to the previous FEEDS_ENCRYPTION_KEY verbatim",
    });
  }
  if (prevKey && prevKey === encKey) {
    problems.push({
      name: "FEEDS_ENCRYPTION_KEY_PREVIOUS", level: "warn",
      problem: "is identical to the current key — rotation has not actually happened",
      fix: "set the current key to a NEW value and keep the old one here until re-encryption finishes",
    });
  }

  // ─── Order egress pinning ───────────────────────────────────────
  // The one variable whose absence is a security posture change rather
  // than a broken feature. See lib/orders/allowlist.ts.
  if (!get("ORDERS_HOST_ALLOWLIST")) {
    problems.push({
      name: "ORDERS_HOST_ALLOWLIST", level: prod ? "fatal" : "warn",
      problem: "not set — order tickets could be POSTed to any public host",
      fix: "comma-separated PM/OMS hostnames, e.g. oms.avaloq.example.com",
    });
  }

  // ─── Billing (optional — a deployment can be billed by agreement) ───
  // Billing is off unless STRIPE_SECRET_KEY is set, so a bare deployment is
  // fine. But a HALF-configured one is dangerous: checkout would succeed
  // and take a customer's money while the webhook — the only writer of
  // is_paid — silently drops every event, so the firm pays and stays
  // locked out. Those gaps are fatal precisely because they are invisible.
  const stripeKey = get("STRIPE_SECRET_KEY");
  if (stripeKey) {
    if (!get("STRIPE_WEBHOOK_SECRET")) {
      problems.push({
        name: "STRIPE_WEBHOOK_SECRET", level: "fatal",
        problem: "STRIPE_SECRET_KEY is set but this is not — checkout would work while entitlement is never written",
        fix: "set the endpoint secret from the Stripe webhook you registered",
      });
    }
    if (!get("SUPABASE_SERVICE_ROLE_KEY")) {
      problems.push({
        name: "SUPABASE_SERVICE_ROLE_KEY", level: "fatal",
        problem: "billing is on but the webhook has no way to write is_paid (needs the service role)",
        fix: "set it in the SERVER env only — it bypasses RLS and must never reach the browser",
      });
    }
    if (!get("STRIPE_PRICE_ID")) {
      problems.push({
        name: "STRIPE_PRICE_ID", level: prod ? "fatal" : "warn",
        problem: "billing is on but there is no price to sell — checkout will refuse",
        fix: "set the recurring price id (price_…) for the subscription",
      });
    }
    // Stripe configured (checkout charges) but the entitlement gate turned
    // off: customers pay and every org is treated as entitled, so the money
    // buys nothing the unpaid firm didn't already have. Almost always a
    // mistake, and invisible without this.
    if (get("BILLING_ENFORCED") === "false") {
      problems.push({
        name: "BILLING_ENFORCED", level: prod ? "fatal" : "warn",
        problem: "is 'false' while Stripe is configured — checkout would charge while the gate lets every org through",
        fix: "unset BILLING_ENFORCED to enforce, or unset STRIPE_SECRET_KEY to bill by agreement",
      });
    }
  }

  return problems;
}

export function formatProblems(problems: EnvProblem[]): string {
  const line = (p: EnvProblem) =>
    `  ${p.level === "fatal" ? "✗" : "!"} ${p.name}\n      ${p.problem}\n      → ${p.fix}`;
  const fatal = problems.filter((p) => p.level === "fatal");
  const warn = problems.filter((p) => p.level === "warn");
  return [
    "",
    "─────────────────────────────────────────────────────────────",
    " Environment check",
    "─────────────────────────────────────────────────────────────",
    ...(fatal.length ? ["", " MUST FIX:", ...fatal.map(line)] : []),
    ...(warn.length ? ["", " WARNINGS:", ...warn.map(line)] : []),
    "",
    " See wealth-app-next/.env.local.example",
    "─────────────────────────────────────────────────────────────",
    "",
  ].join("\n");
}

/**
 * Called once from instrumentation.ts. In production a fatal problem
 * THROWS: a server that boots into a state where it cannot authenticate,
 * or would email localhost links, should not accept traffic and report
 * itself healthy.
 */
export function assertEnv(env: NodeJS.ProcessEnv = process.env): void {
  const problems = checkEnv(env);
  if (!problems.length) return;
  // Never interpolate a value — only names, states and fixes.
  process.stdout.write(formatProblems(problems));
  const fatal = problems.filter((p) => p.level === "fatal");
  if (fatal.length && env.NODE_ENV === "production") {
    throw new Error(
      `Refusing to start: ${fatal.length} environment problem(s) — ${fatal.map((p) => p.name).join(", ")}`
    );
  }
}

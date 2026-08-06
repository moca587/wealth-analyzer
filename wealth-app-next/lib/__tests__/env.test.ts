// The env check has one job: turn a silent misconfiguration into a loud
// one. Each case below is a deploy that would otherwise LOOK fine.

import { describe, it, expect } from "vitest";
import { checkEnv, assertEnv } from "../env";

const OK = {
  NODE_ENV: "production",
  NEXT_PUBLIC_SUPABASE_URL: "https://abcdefghijklm.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.real",
  NEXT_PUBLIC_APP_URL: "https://app.example-firm.ch",
  FEEDS_ENCRYPTION_KEY: "a".repeat(64),
  ORDERS_HOST_ALLOWLIST: "oms.pm.example.com",
} as unknown as NodeJS.ProcessEnv;

const env = (patch: Record<string, string | undefined>) =>
  ({ ...OK, ...patch }) as unknown as NodeJS.ProcessEnv;

const names = (e: NodeJS.ProcessEnv, level?: "fatal" | "warn") =>
  checkEnv(e).filter((p) => !level || p.level === level).map((p) => p.name);

describe("checkEnv", () => {
  it("passes a correctly configured production deploy", () => {
    expect(checkEnv(OK)).toEqual([]);
  });

  it("catches the CI placeholder that would ship a bundle that cannot authenticate", () => {
    // ci.yml builds with https://placeholder.supabase.co. NEXT_PUBLIC_* is
    // inlined at BUILD time, so a pipeline reusing that step produces an app
    // that renders perfectly and can never log anyone in — with no server
    // error to notice.
    const p = checkEnv(env({ NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co" }));
    expect(p.map((x) => x.name)).toContain("NEXT_PUBLIC_SUPABASE_URL");
    expect(p[0].level).toBe("fatal");
    expect(p[0].problem).toMatch(/build time/i);
  });

  it("catches localhost baked into a production APP_URL", () => {
    // The failure mode is an email: every confirmation and reset link
    // points at localhost, and nothing server-side ever errors.
    expect(names(env({ NEXT_PUBLIC_APP_URL: "http://localhost:3000" }), "fatal"))
      .toContain("NEXT_PUBLIC_APP_URL");
  });

  it("refuses a passphrase as an encryption key", () => {
    // crypto.ts rejects one too; if this disagreed, boot would pass and the
    // first credential save would 503.
    expect(names(env({ FEEDS_ENCRYPTION_KEY: "correct horse battery staple" }), "fatal"))
      .toContain("FEEDS_ENCRYPTION_KEY");
  });

  it("accepts both key encodings crypto.ts accepts", () => {
    expect(checkEnv(env({ FEEDS_ENCRYPTION_KEY: "f".repeat(64) }))).toEqual([]);
    expect(checkEnv(env({ FEEDS_ENCRYPTION_KEY: "A".repeat(43) + "=" }))).toEqual([]);
  });

  it("treats an unpinned order egress as fatal in production only", () => {
    expect(names(env({ ORDERS_HOST_ALLOWLIST: "" }), "fatal")).toContain("ORDERS_HOST_ALLOWLIST");
    expect(names(env({ ORDERS_HOST_ALLOWLIST: "", NODE_ENV: "development" }), "fatal"))
      .not.toContain("ORDERS_HOST_ALLOWLIST");
  });

  it("catches a rotation that is not a rotation", () => {
    const same = env({ FEEDS_ENCRYPTION_KEY_PREVIOUS: OK.FEEDS_ENCRYPTION_KEY });
    expect(names(same, "warn")).toContain("FEEDS_ENCRYPTION_KEY_PREVIOUS");
  });

  it("treats a malformed previous key as fatal — it would fail closed on every secret", () => {
    expect(names(env({ FEEDS_ENCRYPTION_KEY_PREVIOUS: "not-a-key" }), "fatal"))
      .toContain("FEEDS_ENCRYPTION_KEY_PREVIOUS");
  });

  it("makes a half-configured billing setup fatal (would charge but never grant)", () => {
    // STRIPE_SECRET_KEY set, but the webhook can't write is_paid → the
    // customer pays and stays locked out.
    const p = names(env({ STRIPE_SECRET_KEY: "sk_live_x", STRIPE_PRICE_ID: "price_1" }), "fatal");
    expect(p).toContain("STRIPE_WEBHOOK_SECRET");
    expect(p).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });

  it("passes a fully-configured billing setup", () => {
    expect(checkEnv(env({
      STRIPE_SECRET_KEY: "sk_live_x",
      STRIPE_WEBHOOK_SECRET: "whsec_x",
      STRIPE_PRICE_ID: "price_1",
      SUPABASE_SERVICE_ROLE_KEY: "service_role_x",
    }))).toEqual([]);
  });

  it("S3: flags Stripe configured WHILE the gate is turned off", () => {
    // Would charge customers while checkOrgEntitlement short-circuits to ok.
    const p = names(env({
      STRIPE_SECRET_KEY: "sk_live_x", STRIPE_WEBHOOK_SECRET: "whsec_x",
      STRIPE_PRICE_ID: "price_1", SUPABASE_SERVICE_ROLE_KEY: "service_role_x",
      BILLING_ENFORCED: "false",
    }), "fatal");
    expect(p).toContain("BILLING_ENFORCED");
  });

  it("does NOT flag billing vars when Stripe is unconfigured (invoice-billed)", () => {
    // A deployment with no STRIPE_SECRET_KEY is a valid, complete config.
    expect(checkEnv(OK)).toEqual([]);
  });

  it("is lenient in development so the UI can still be run", () => {
    const dev = { NODE_ENV: "development" } as unknown as NodeJS.ProcessEnv;
    const p = checkEnv(dev);
    expect(p.length).toBeGreaterThan(0);
    // Missing Supabase config is fatal everywhere; the operational ones
    // degrade to warnings so `npm run dev` still boots.
    expect(p.filter((x) => x.name === "FEEDS_ENCRYPTION_KEY")[0].level).toBe("warn");
    expect(p.filter((x) => x.name === "ORDERS_HOST_ALLOWLIST")[0].level).toBe("warn");
  });

  it("never echoes a secret value", () => {
    const secret = "b".repeat(64);
    const text = JSON.stringify(checkEnv(env({
      FEEDS_ENCRYPTION_KEY: secret,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
    })));
    expect(text).not.toContain(secret);
  });
});

describe("assertEnv", () => {
  it("refuses to start a misconfigured production server", () => {
    // A server that boots into a state where nobody can log in should not
    // accept traffic and report itself healthy.
    expect(() => assertEnv(env({ NEXT_PUBLIC_SUPABASE_ANON_KEY: "" })))
      .toThrow(/Refusing to start/);
  });

  it("does not block development", () => {
    expect(() => assertEnv({ NODE_ENV: "development" } as unknown as NodeJS.ProcessEnv)).not.toThrow();
  });

  it("is silent when everything is right", () => {
    expect(() => assertEnv(OK)).not.toThrow();
  });
});

// The bug this pins: the CSP used to be built in next.config.mjs
// `headers()`, which Next evaluates at BUILD time. A container built with a
// placeholder Supabase URL therefore shipped
// `connect-src https://placeholder-project.supabase.co`, and at runtime —
// with a real project configured — every auth call was blocked by the
// browser. The app rendered perfectly and nobody could sign in.
//
// Found by smoke-testing the standalone build, not by any test, which is
// why there is one now.

import { describe, it, expect } from "vitest";
import { buildCsp, securityHeaders } from "../csp";

const env = (p: Record<string, string | undefined>) => p as unknown as NodeJS.ProcessEnv;

describe("buildCsp", () => {
  it("names the Supabase origin it is given AT CALL TIME", () => {
    const csp = buildCsp(env({
      NODE_ENV: "production",
      NEXT_PUBLIC_SUPABASE_URL: "https://realproject.supabase.co",
    }));
    expect(csp).toContain("connect-src 'self' https://realproject.supabase.co wss://realproject.supabase.co");
  });

  it("changes when the environment changes, without a rebuild", () => {
    const a = buildCsp(env({ NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "https://aaa.supabase.co" }));
    const b = buildCsp(env({ NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "https://bbb.supabase.co" }));
    expect(a).not.toBe(b);
    expect(b).toContain("https://bbb.supabase.co");
    expect(b).not.toContain("aaa.supabase.co");
  });

  it("includes the websocket origin, or realtime breaks", () => {
    const csp = buildCsp(env({ NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" }));
    expect(csp).toContain("wss://x.supabase.co");
  });

  it("emits NO connect-src host when unconfigured, rather than a wildcard", () => {
    // Auth is already broken in that state and lib/env.ts refuses to boot on
    // it in production; a permissive CSP would only hide the real problem.
    const csp = buildCsp(env({ NODE_ENV: "production" }));
    expect(csp).toContain("connect-src 'self'");
    expect(csp).not.toContain("*");
  });

  it("does not allow eval in production", () => {
    const prod = buildCsp(env({ NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" }));
    expect(prod).not.toContain("unsafe-eval");
    const dev = buildCsp(env({ NODE_ENV: "development", NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" }));
    expect(dev, "dev needs eval for HMR").toContain("unsafe-eval");
  });

  it("refuses to be framed, and pins the other directives that matter", () => {
    const csp = buildCsp(env({ NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" }));
    // /app/orders carries the BUY control; clickjacking it is the obvious attack.
    expect(csp).toContain("frame-ancestors 'none'");
    expect(csp).toContain("object-src 'none'");
    expect(csp).toContain("form-action 'self'");
    expect(csp).toContain("base-uri 'self'");
  });

  it("survives a malformed Supabase URL without emitting a broken directive", () => {
    const csp = buildCsp(env({ NEXT_PUBLIC_SUPABASE_URL: "not a url" }));
    expect(csp).toContain("connect-src 'self'");
    expect(csp).not.toContain("not a url");
  });
});

describe("securityHeaders", () => {
  it("ships the full set", () => {
    const h = securityHeaders(env({ NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "https://x.supabase.co" }));
    expect(Object.keys(h).sort()).toEqual([
      "Content-Security-Policy",
      "Cross-Origin-Opener-Policy",
      "Permissions-Policy",
      "Referrer-Policy",
      "Strict-Transport-Security",
      "X-Content-Type-Options",
      "X-Frame-Options",
    ]);
    expect(h["X-Frame-Options"]).toBe("DENY");
    expect(h["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
  });
});

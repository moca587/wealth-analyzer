// ─────────────────────────────────────────────────────────────────
// Connection validation. The UI shows these messages verbatim, and the
// URL rule is a security control, not a convenience — rejecting an
// internal address at SAVE time means a hostile connection never gets
// stored to be run later.
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { feedConnectionInput, feedConnectionPatch, toPublic, fieldErrors } from "../schema";

const base = { name: "Custodian", url: "https://api.custodian.example.com/positions" };

describe("feedConnectionInput", () => {
  it("accepts a minimal public connection and applies defaults", () => {
    const r = feedConnectionInput.safeParse(base);
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data).toMatchObject({ kind: "custodian", format: "auto", auth: "none", defaultCountry: "CH" });
    }
  });

  it("rejects internal and metadata URLs before they can ever be stored", () => {
    for (const url of [
      "http://169.254.169.254/latest/meta-data/",
      "http://127.0.0.1:54321/positions",
      "http://10.0.0.5/positions",
      "http://localhost/positions",
      "file:///etc/passwd",
      "http://2130706433/",
    ]) {
      const r = feedConnectionInput.safeParse({ ...base, url });
      expect(r.success, url).toBe(false);
      if (!r.success) expect(Object.keys(fieldErrors(r.error))).toContain("url");
    }
  });

  it("requires a secret whenever authentication is configured", () => {
    const r = feedConnectionInput.safeParse({ ...base, auth: "bearer" });
    expect(r.success).toBe(false);
    if (!r.success) expect(fieldErrors(r.error).secret).toMatch(/requires a secret/);
  });

  it("insists basic auth looks like user:password", () => {
    const bad = feedConnectionInput.safeParse({ ...base, auth: "basic", secret: "nopassword" });
    expect(bad.success).toBe(false);
    const good = feedConnectionInput.safeParse({ ...base, auth: "basic", secret: "user:pw" });
    expect(good.success).toBe(true);
  });

  it("rejects a blank name and normalizes the country code", () => {
    expect(feedConnectionInput.safeParse({ ...base, name: "   " }).success).toBe(false);
    const r = feedConnectionInput.safeParse({ ...base, defaultCountry: "ch" });
    expect(r.success && r.data.defaultCountry).toBe("CH");
  });

  it("rejects an unknown format or auth mode", () => {
    expect(feedConnectionInput.safeParse({ ...base, format: "xml" }).success).toBe(false);
    expect(feedConnectionInput.safeParse({ ...base, auth: "oauth" }).success).toBe(false);
  });
});

describe("feedConnectionPatch", () => {
  it("allows partial updates but keeps the URL rule", () => {
    expect(feedConnectionPatch.safeParse({ name: "Renamed" }).success).toBe(true);
    expect(feedConnectionPatch.safeParse({ url: "http://169.254.169.254/" }).success).toBe(false);
  });

  it("allows an empty secret, which the route treats as 'clear it'", () => {
    expect(feedConnectionPatch.safeParse({ secret: "" }).success).toBe(true);
  });
});

describe("toPublic", () => {
  it("never leaks the stored credential — only whether one exists", () => {
    const row = {
      id: "abc", name: "C", url: "https://x.example.com", kind: "custodian", format: "auto",
      auth: "bearer", header: "X-API-Key", default_country: "CH",
      secret_ciphertext: "v1.aaa.bbb.ccc-SECRET-CIPHERTEXT",
      last_run_at: null, last_status: null, created_at: "2026-07-31T00:00:00Z",
    };
    const pub = toPublic(row);
    expect(pub.hasSecret).toBe(true);
    expect(JSON.stringify(pub)).not.toContain("SECRET-CIPHERTEXT");
    expect("secret" in pub).toBe(false);
    expect("secret_ciphertext" in pub).toBe(false);
  });

  it("reports hasSecret false when none is stored", () => {
    const pub = toPublic({
      id: "a", name: "n", url: "https://x.example.com", kind: "crm", format: "crm",
      auth: "none", header: null, default_country: null, secret_ciphertext: null,
      last_run_at: null, last_status: null, created_at: "2026-07-31T00:00:00Z",
    });
    expect(pub.hasSecret).toBe(false);
    expect(pub.defaultCountry).toBe("CH");   // sensible fallback
  });
});

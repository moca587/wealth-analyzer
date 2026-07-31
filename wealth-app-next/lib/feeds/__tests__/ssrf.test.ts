// ─────────────────────────────────────────────────────────────────
// SSRF guard — the security boundary of the relay. Every case here is
// an attack that would otherwise let a "custodian feed" read something
// it must never reach: cloud credentials, internal services, the
// container's own loopback.
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { blockedIpReason, validateFeedUrl } from "../ssrf";

describe("blockedIpReason — IPv4", () => {
  it("blocks the cloud metadata address (AWS/GCP/Azure credential theft)", () => {
    expect(blockedIpReason("169.254.169.254")).toBeTruthy();
    expect(blockedIpReason("169.254.170.2")).toBeTruthy();   // ECS task metadata
  });

  it("blocks loopback in all its spellings", () => {
    for (const ip of ["127.0.0.1", "127.1.2.3", "127.255.255.254"]) {
      expect(blockedIpReason(ip), ip).toBeTruthy();
    }
  });

  it("blocks RFC1918 private space", () => {
    for (const ip of ["10.0.0.1", "10.255.255.255", "172.16.0.1", "172.31.255.255", "192.168.1.1"]) {
      expect(blockedIpReason(ip), ip).toBeTruthy();
    }
  });

  it("blocks CGNAT, unspecified, multicast and reserved ranges", () => {
    for (const ip of ["100.64.0.1", "0.0.0.0", "224.0.0.1", "240.0.0.1", "255.255.255.255"]) {
      expect(blockedIpReason(ip), ip).toBeTruthy();
    }
  });

  it("allows genuine public addresses", () => {
    for (const ip of ["8.8.8.8", "1.1.1.1", "93.184.216.34", "172.32.0.1", "11.0.0.1"]) {
      expect(blockedIpReason(ip), ip).toBeNull();
    }
  });

  it("treats 172.15/172.32 as public — the /12 boundary is easy to get wrong", () => {
    expect(blockedIpReason("172.15.255.255")).toBeNull();
    expect(blockedIpReason("172.16.0.0")).toBeTruthy();
    expect(blockedIpReason("172.31.255.255")).toBeTruthy();
    expect(blockedIpReason("172.32.0.0")).toBeNull();
  });
});

describe("blockedIpReason — IPv6", () => {
  it("blocks loopback, unspecified, ULA, link-local and multicast", () => {
    for (const ip of ["::1", "::", "fc00::1", "fd12:3456::1", "fe80::1", "ff02::1"]) {
      expect(blockedIpReason(ip), ip).toBeTruthy();
    }
  });

  it("blocks IPv4-mapped forms of blocked addresses (::ffff:169.254.169.254)", () => {
    expect(blockedIpReason("::ffff:169.254.169.254")).toBeTruthy();
    expect(blockedIpReason("::ffff:127.0.0.1")).toBeTruthy();
    expect(blockedIpReason("::ffff:10.0.0.1")).toBeTruthy();
  });

  it("blocks NAT64 and 6to4 wrappers around blocked v4 space", () => {
    expect(blockedIpReason("64:ff9b::169.254.169.254")).toBeTruthy();
    expect(blockedIpReason("2002:a00:1::")).toBeTruthy();      // 6to4 of 10.0.0.1
  });

  it("allows public IPv6", () => {
    expect(blockedIpReason("2606:4700:4700::1111")).toBeNull();
    expect(blockedIpReason("2001:4860:4860::8888")).toBeNull();
    expect(blockedIpReason("::ffff:8.8.8.8")).toBeNull();
  });
});

describe("validateFeedUrl", () => {
  it("accepts ordinary https endpoints", () => {
    const r = validateFeedUrl("https://api.custodian.example.com/v1/positions?since=2026-01-01");
    expect(r.ok).toBe(true);
  });

  it("rejects non-http schemes used to read local files or pivot", () => {
    for (const u of ["file:///etc/passwd", "gopher://x/1", "ftp://x/y", "data:text/plain,hi", "jar:http://x!/"]) {
      const r = validateFeedUrl(u);
      expect(r.ok, u).toBe(false);
    }
  });

  it("rejects literal internal addresses typed directly", () => {
    for (const u of ["http://169.254.169.254/latest/meta-data/", "http://127.0.0.1:54321/", "http://10.1.2.3/", "http://[::1]:8080/"]) {
      const r = validateFeedUrl(u);
      expect(r.ok, u).toBe(false);
    }
  });

  it("rejects internal hostnames before DNS is even consulted", () => {
    for (const u of ["http://localhost:3000/x", "http://db.internal/x", "http://printer.local/x"]) {
      expect(validateFeedUrl(u).ok, u).toBe(false);
    }
  });

  it("rejects credentials embedded in the URL", () => {
    const r = validateFeedUrl("https://user:pass@api.example.com/feed");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/credential/i);
  });

  it("rejects decimal/octal encodings of 127.0.0.1 that WHATWG normalizes", () => {
    // new URL() canonicalizes these to 127.0.0.1, so the IP check catches them.
    for (const u of ["http://2130706433/", "http://0177.0.0.1/", "http://0x7f.0.0.1/"]) {
      expect(validateFeedUrl(u).ok, u).toBe(false);
    }
  });

  it("honours FEEDS_HOST_ALLOWLIST when set", () => {
    const prev = process.env.FEEDS_HOST_ALLOWLIST;
    process.env.FEEDS_HOST_ALLOWLIST = "custodian.example.com";
    try {
      expect(validateFeedUrl("https://custodian.example.com/f").ok).toBe(true);
      expect(validateFeedUrl("https://api.custodian.example.com/f").ok).toBe(true); // subdomain
      expect(validateFeedUrl("https://evil.example.org/f").ok).toBe(false);
    } finally {
      if (prev === undefined) delete process.env.FEEDS_HOST_ALLOWLIST;
      else process.env.FEEDS_HOST_ALLOWLIST = prev;
    }
  });
});

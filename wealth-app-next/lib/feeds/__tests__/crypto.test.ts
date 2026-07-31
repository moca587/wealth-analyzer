// ─────────────────────────────────────────────────────────────────
// Credential encryption. A feed secret is a live custodian token, so
// the properties that matter are: it round-trips, the ciphertext does
// not contain the plaintext, tampering is DETECTED rather than silently
// returning garbage, and a missing key fails closed instead of storing
// the token in the clear.
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { encryptSecret, decryptSecret, encryptionAvailable, FeedCryptoError } from "../crypto";

const KEY = "TWFrZVN1cmVUaGlzSXNFeGFjdGx5MzJieXRlc0xvbmc=";   // 32 bytes, base64
const prev = process.env.FEEDS_ENCRYPTION_KEY;

beforeEach(() => { process.env.FEEDS_ENCRYPTION_KEY = KEY; });
afterEach(() => {
  if (prev === undefined) delete process.env.FEEDS_ENCRYPTION_KEY;
  else process.env.FEEDS_ENCRYPTION_KEY = prev;
});

describe("feed credential encryption", () => {
  it("round-trips a token", () => {
    const secret = "sk_live_9f3a2b1c-custodian-token";
    expect(decryptSecret(encryptSecret(secret))).toBe(secret);
  });

  it("never leaves the plaintext visible in the stored value", () => {
    const secret = "super-secret-custodian-token";
    const stored = encryptSecret(secret);
    expect(stored).not.toContain(secret);
    expect(stored.startsWith("v1.")).toBe(true);
  });

  it("produces a different ciphertext each time (random nonce)", () => {
    const a = encryptSecret("same-input"), b = encryptSecret("same-input");
    expect(a).not.toBe(b);
    expect(decryptSecret(a)).toBe(decryptSecret(b));
  });

  it("round-trips unicode and long secrets", () => {
    const s = "pässwörd-Zürich-🔐-" + "x".repeat(2000);
    expect(decryptSecret(encryptSecret(s))).toBe(s);
  });

  it("DETECTS tampering instead of returning corrupted plaintext", () => {
    const stored = encryptSecret("token");
    const parts = stored.split(".");
    const flipped = Buffer.from(parts[3], "base64");
    flipped[0] ^= 0xff;                       // corrupt one ciphertext byte
    parts[3] = flipped.toString("base64");
    expect(() => decryptSecret(parts.join("."))).toThrow(FeedCryptoError);
  });

  it("rejects a value encrypted under a different key", () => {
    const stored = encryptSecret("token");
    process.env.FEEDS_ENCRYPTION_KEY = "T3RoZXJLZXlUaGF0SXNBbHNvMzJieXRlc0xvbmchIQ==";
    expect(() => decryptSecret(stored)).toThrow(FeedCryptoError);
  });

  it("fails closed when no key is configured — never stores plaintext", () => {
    delete process.env.FEEDS_ENCRYPTION_KEY;
    expect(encryptionAvailable()).toBe(false);
    expect(() => encryptSecret("token")).toThrow(FeedCryptoError);
  });

  it("accepts hex keys and derives from a passphrase", () => {
    process.env.FEEDS_ENCRYPTION_KEY = "a".repeat(64);           // hex
    expect(decryptSecret(encryptSecret("x"))).toBe("x");
    process.env.FEEDS_ENCRYPTION_KEY = "a short passphrase";     // hashed to 32 bytes
    expect(encryptionAvailable()).toBe(true);
    expect(decryptSecret(encryptSecret("y"))).toBe("y");
  });

  it("treats an empty secret as 'no secret'", () => {
    expect(encryptSecret("")).toBe("");
    expect(decryptSecret("")).toBe("");
  });

  it("rejects a malformed stored value", () => {
    expect(() => decryptSecret("not-encrypted")).toThrow(FeedCryptoError);
    expect(() => decryptSecret("v9.a.b.c")).toThrow(FeedCryptoError);
  });
});

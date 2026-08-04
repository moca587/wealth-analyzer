// ─────────────────────────────────────────────────────────────────
// Key rotation.
//
// Before this there was one key, forever. Rotating or losing
// FEEDS_ENCRYPTION_KEY bricked every stored custodian and OMS credential
// — and you would find out one client at a time: a 500 partway through a
// statement pull, a ticket marked `failed` partway through a placement.
//
// The property that matters is not "rotation works" but "rotation is not
// an outage": during the overlap BOTH keys open a secret, and the moment
// the old key is dropped, anything not yet re-encrypted fails LOUDLY
// rather than returning garbage.
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  encryptSecret, decryptSecret, rotateSecret, activeKeyId,
  encryptionAvailable, FeedCryptoError,
} from "../crypto";

const KEY_A = "a".repeat(64);
const KEY_B = "b".repeat(64);
const SECRET = "custodian-token-4f9a::live";

let saved: Record<string, string | undefined>;

beforeEach(() => {
  saved = {
    FEEDS_ENCRYPTION_KEY: process.env.FEEDS_ENCRYPTION_KEY,
    FEEDS_ENCRYPTION_KEY_PREVIOUS: process.env.FEEDS_ENCRYPTION_KEY_PREVIOUS,
  };
});
afterEach(() => {
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
});

const useKeys = (current: string, previous?: string) => {
  process.env.FEEDS_ENCRYPTION_KEY = current;
  if (previous) process.env.FEEDS_ENCRYPTION_KEY_PREVIOUS = previous;
  else delete process.env.FEEDS_ENCRYPTION_KEY_PREVIOUS;
};

describe("rotation", () => {
  it("keeps old credentials readable during the overlap", () => {
    useKeys(KEY_A);
    const sealed = encryptSecret(SECRET);

    // Operator rotates: new key in, old key retained.
    useKeys(KEY_B, KEY_A);
    expect(decryptSecret(sealed), "a not-yet-rotated credential must still work").toBe(SECRET);
  });

  it("still seals NEW secrets under the current key only", () => {
    useKeys(KEY_B, KEY_A);
    const fresh = encryptSecret(SECRET);
    // Drop the old key: the new secret must be unaffected.
    useKeys(KEY_B);
    expect(decryptSecret(fresh)).toBe(SECRET);
  });

  it("fails LOUDLY once the old key is dropped, never silently", () => {
    useKeys(KEY_A);
    const sealed = encryptSecret(SECRET);
    useKeys(KEY_B);   // rotation "finished" prematurely
    expect(() => decryptSecret(sealed)).toThrow(FeedCryptoError);
    // And the message must point at the actual cause.
    expect(() => decryptSecret(sealed)).toThrow(/FEEDS_ENCRYPTION_KEY_PREVIOUS/);
  });

  it("re-seals under the current key, and the result survives the old key's removal", () => {
    useKeys(KEY_A);
    const old = encryptSecret(SECRET);

    useKeys(KEY_B, KEY_A);
    const rotated = rotateSecret(old);
    expect(rotated).toBeTruthy();
    expect(rotated!.ciphertext).not.toBe(old);
    expect(rotated!.keyId).toBe(activeKeyId());

    useKeys(KEY_B);
    expect(decryptSecret(rotated!.ciphertext), "re-encrypted secrets outlive the old key").toBe(SECRET);
  });

  it("gives each key a stable, distinct, non-revealing id", () => {
    useKeys(KEY_A);
    const a1 = activeKeyId();
    useKeys(KEY_A);
    expect(activeKeyId(), "same key → same id, so a rotation can tell what is done").toBe(a1);
    useKeys(KEY_B);
    expect(activeKeyId()).not.toBe(a1);
    // Non-revealing: short, hex, and not the key.
    expect(a1).toMatch(/^[0-9a-f]{8}$/);
    expect(KEY_A).not.toContain(a1);
  });

  it("does not let a garbage previous key break the steady state", () => {
    // An operator typo in the OPTIONAL variable must not take down
    // decryption that the current key handles perfectly well.
    useKeys(KEY_A);
    const sealed = encryptSecret(SECRET);
    process.env.FEEDS_ENCRYPTION_KEY_PREVIOUS = "not-a-key";
    expect(decryptSecret(sealed)).toBe(SECRET);
  });

  it("still rejects a tampered ciphertext under BOTH keys", () => {
    // The fallback must not become a way to smuggle a forged credential
    // past GCM's authentication.
    useKeys(KEY_A);
    const sealed = encryptSecret(SECRET);
    const parts = sealed.split(".");
    const forged = [parts[0], parts[1], parts[2], Buffer.from("evil").toString("base64")].join(".");
    useKeys(KEY_B, KEY_A);
    expect(() => decryptSecret(forged)).toThrow(FeedCryptoError);
  });

  it("keeps fail-closed intact when no key is configured at all", () => {
    delete process.env.FEEDS_ENCRYPTION_KEY;
    delete process.env.FEEDS_ENCRYPTION_KEY_PREVIOUS;
    expect(encryptionAvailable()).toBe(false);
    expect(() => encryptSecret(SECRET)).toThrow(FeedCryptoError);
  });

  it("refuses a passphrase as the previous key too", () => {
    // The old sha256 fallback made fail-closed unreachable. A rotation
    // variable is exactly where that would sneak back in.
    useKeys(KEY_A);
    const sealed = encryptSecret(SECRET);
    useKeys(KEY_B, "correct horse battery staple");
    expect(() => decryptSecret(sealed)).toThrow(FeedCryptoError);
  });
});

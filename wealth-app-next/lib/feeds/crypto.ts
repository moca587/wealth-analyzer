// ─────────────────────────────────────────────────────────────────
// Envelope encryption for feed credentials at rest.
//
// A feed secret is a live custodian/CRM credential. RLS keeps one user
// out of another's rows, but it does not protect against a leaked
// database backup, an over-broad service-role key, or an operator with
// console access — all of which would otherwise expose every client's
// custodian token in plaintext.
//
// AES-256-GCM with a key held only in the server environment. The
// database stores ciphertext; the plaintext exists only in memory during
// a relay run, and is never returned by any API route.
//
// FAIL CLOSED: if FEEDS_ENCRYPTION_KEY is absent or malformed we refuse
// to store secrets rather than silently persisting them in the clear.
// ─────────────────────────────────────────────────────────────────

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const VERSION = "v1";
const IV_BYTES = 12;   // 96-bit nonce, the GCM standard

export class FeedCryptoError extends Error {
  constructor(message: string) { super(message); this.name = "FeedCryptoError"; }
}

function parse(raw: string, varName: string): Buffer {
  if (!raw) {
    throw new FeedCryptoError(
      varName + " is not set — refusing to store a feed credential unencrypted. " +
      "Generate one with: openssl rand -base64 32"
    );
  }
  // Only real key material is accepted: 64 hex chars, or base64 that decodes
  // to exactly 32 bytes.
  //
  // This deliberately REJECTS a passphrase. Hashing one to 32 bytes (the
  // earlier behaviour) meant "fail closed" was never reachable — every string
  // on earth, including `changeme`, produced a usable key. An attacker holding
  // a database dump could then brute-force the phrase offline and decrypt every
  // custodian credential, which is precisely the threat this file exists to
  // stop. A loud 503 at startup is the cheaper failure.
  let buf: Buffer | null = null;
  if (/^[A-Fa-f0-9]{64}$/.test(raw)) {
    buf = Buffer.from(raw, "hex");
  } else if (/^[A-Za-z0-9+/_-]{43}={0,1}$/.test(raw)) {
    const b64 = Buffer.from(raw.replace(/-/g, "+").replace(/_/g, "/"), "base64");
    if (b64.length === 32) buf = b64;
  }
  if (!buf || buf.length !== 32) {
    throw new FeedCryptoError(
      varName + " must be 32 bytes of random key material — 64 hex characters, " +
      "or 43 base64 characters. A passphrase is not accepted. " +
      "Generate one with: openssl rand -base64 32"
    );
  }
  return buf;
}

/** The key that seals NEW secrets. */
function key(): Buffer {
  return parse(process.env.FEEDS_ENCRYPTION_KEY || "", "FEEDS_ENCRYPTION_KEY");
}

/**
 * The previous key, during a rotation. Optional by design: absent, this is
 * exactly the old single-key behaviour.
 */
function previousKey(): Buffer | null {
  const raw = (process.env.FEEDS_ENCRYPTION_KEY_PREVIOUS || "").trim();
  if (!raw) return null;
  try { return parse(raw, "FEEDS_ENCRYPTION_KEY_PREVIOUS"); } catch { return null; }
}

/** True when the server is configured to store secrets at all. */
export function encryptionAvailable(): boolean {
  try { key(); return true; } catch { return false; }
}

/**
 * A short, non-secret fingerprint of the active key.
 *
 * Stored alongside the ciphertext (`secret_key_id`, migration 010) so a
 * rotation can find what it has not re-encrypted yet, and prove it
 * finished. Derived, never configured — an operator cannot get it wrong,
 * and it reveals nothing: 8 hex chars of a SHA-256 over the key is not
 * invertible and not a useful brute-force oracle against a 256-bit key.
 */
export function activeKeyId(): string {
  return createHash("sha256").update(key()).digest("hex").slice(0, 8);
}

/** → "v1.<iv b64>.<tag b64>.<ciphertext b64>" */
export function encryptSecret(plaintext: string): string {
  if (!plaintext) return "";
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [VERSION, iv.toString("base64"), tag.toString("base64"), enc.toString("base64")].join(".");
}

function open(stored: string, k: Buffer): string {
  const parts = stored.split(".");
  const decipher = createDecipheriv("aes-256-gcm", k, Buffer.from(parts[1], "base64"));
  decipher.setAuthTag(Buffer.from(parts[2], "base64"));
  return Buffer.concat([decipher.update(Buffer.from(parts[3], "base64")), decipher.final()]).toString("utf8");
}

/**
 * Decrypt, trying the current key and then the previous one.
 *
 * Before this there was ONE key, forever: `VERSION` is a format tag, not a
 * key id, and decrypt required that exact literal. So rotating or losing
 * FEEDS_ENCRYPTION_KEY permanently bricked every stored custodian and OMS
 * credential — discovered one client at a time, as a 500 mid-statement-pull
 * or a ticket marked `failed` mid-placement.
 *
 * The fallback is what makes rotation a background job rather than an
 * outage: set the new key, keep the old one in
 * FEEDS_ENCRYPTION_KEY_PREVIOUS, re-encrypt at leisure, then drop it. Note
 * the ORDER — the current key is tried first, so the steady state costs
 * nothing, and a forged ciphertext still fails both (GCM authenticates).
 */
export function decryptSecret(stored: string): string {
  if (!stored) return "";
  const parts = stored.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new FeedCryptoError("stored credential is not in the expected encrypted format");
  }
  try {
    return open(stored, key());
  } catch {
    const prev = previousKey();
    if (prev) {
      try {
        return open(stored, prev);
      } catch { /* fall through to the same error either way */ }
    }
    // Wrong key, or the ciphertext/tag was tampered with — GCM catches both.
    throw new FeedCryptoError(
      "could not decrypt the stored credential — the encryption key may have changed. " +
      "If you are rotating, set FEEDS_ENCRYPTION_KEY_PREVIOUS to the old key until " +
      "every credential has been re-encrypted."
    );
  }
}

/**
 * Re-seal a secret under the CURRENT key. Returns null when it is already
 * current, so a rotation job can skip it without a write.
 */
export function rotateSecret(stored: string): { ciphertext: string; keyId: string } | null {
  if (!stored) return null;
  const plaintext = decryptSecret(stored);      // throws if neither key opens it
  const keyId = activeKeyId();
  return { ciphertext: encryptSecret(plaintext), keyId };
}

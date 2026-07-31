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

import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

const VERSION = "v1";
const IV_BYTES = 12;   // 96-bit nonce, the GCM standard

export class FeedCryptoError extends Error {
  constructor(message: string) { super(message); this.name = "FeedCryptoError"; }
}

function key(): Buffer {
  const raw = process.env.FEEDS_ENCRYPTION_KEY || "";
  if (!raw) {
    throw new FeedCryptoError(
      "FEEDS_ENCRYPTION_KEY is not set — refusing to store a feed credential unencrypted. " +
      "Generate one with: openssl rand -base64 32"
    );
  }
  // Accept base64 or hex; anything else is hashed to 32 bytes so a
  // passphrase still yields a valid key rather than a runtime crash.
  let buf: Buffer;
  if (/^[A-Fa-f0-9]{64}$/.test(raw)) buf = Buffer.from(raw, "hex");
  else {
    const b64 = Buffer.from(raw, "base64");
    buf = b64.length === 32 ? b64 : createHash("sha256").update(raw).digest();
  }
  if (buf.length !== 32) throw new FeedCryptoError("FEEDS_ENCRYPTION_KEY must resolve to 32 bytes");
  return buf;
}

/** True when the server is configured to store secrets at all. */
export function encryptionAvailable(): boolean {
  try { key(); return true; } catch { return false; }
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

export function decryptSecret(stored: string): string {
  if (!stored) return "";
  const parts = stored.split(".");
  if (parts.length !== 4 || parts[0] !== VERSION) {
    throw new FeedCryptoError("stored credential is not in the expected encrypted format");
  }
  try {
    const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(parts[1], "base64"));
    decipher.setAuthTag(Buffer.from(parts[2], "base64"));
    return Buffer.concat([decipher.update(Buffer.from(parts[3], "base64")), decipher.final()]).toString("utf8");
  } catch {
    // Wrong key, or the ciphertext/tag was tampered with — GCM catches both.
    throw new FeedCryptoError("could not decrypt the stored credential — the encryption key may have changed");
  }
}

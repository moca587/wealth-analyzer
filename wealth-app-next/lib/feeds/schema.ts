// ─────────────────────────────────────────────────────────────────
// Runtime validation for feed connections. The API body and the
// Postgres row are both untyped at the boundary, so this is the single
// source of truth for what a connection may contain.
// ─────────────────────────────────────────────────────────────────

import { z } from "zod";
import { validateFeedUrl } from "./ssrf";

export const feedFormatEnum = z.enum(["auto", "wa", "crm", "camt", "ofx", "csv"]);
export const feedKindEnum = z.enum(["custodian", "crm"]);
export const feedAuthEnum = z.enum(["none", "bearer", "apikey", "basic"]);

/**
 * URL is validated for SSRF safety at SAVE time as well as fetch time —
 * rejecting `http://169.254.169.254/` when the advisor types it gives a
 * clear error, instead of a confusing failure later during a run.
 * (The fetch-time check still runs: DNS can change under us.)
 */
const safeUrl = z.string().trim().min(1, "endpoint URL is required").superRefine((val, ctx) => {
  const v = validateFeedUrl(val);
  if (!v.ok) ctx.addIssue({ code: z.ZodIssueCode.custom, message: v.reason });
});

export const feedConnectionInput = z.object({
  name: z.string().trim().min(1, "name is required").max(120),
  url: safeUrl,
  kind: feedKindEnum.default("custodian"),
  format: feedFormatEnum.default("auto"),
  auth: feedAuthEnum.default("none"),
  /** Header name for auth = "apikey". */
  header: z.string().trim().max(80).optional().default("X-API-Key"),
  /** Plaintext on the way in only; stored encrypted, never returned. */
  secret: z.string().max(4096).optional().default(""),
  /** Country used when a payload omits one (camt/OFX/CSV). */
  defaultCountry: z.string().trim().length(2).toUpperCase().optional().default("CH"),
}).superRefine((v, ctx) => {
  if (v.auth !== "none" && !v.secret) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["secret"], message: `auth "${v.auth}" requires a secret` });
  }
  if (v.auth === "basic" && v.secret && !v.secret.includes(":")) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["secret"], message: "basic auth expects user:password" });
  }
});

/** PATCH — every field optional, but the same rules when present. */
export const feedConnectionPatch = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  url: safeUrl.optional(),
  kind: feedKindEnum.optional(),
  format: feedFormatEnum.optional(),
  auth: feedAuthEnum.optional(),
  header: z.string().trim().max(80).optional(),
  secret: z.string().max(4096).optional(),
  defaultCountry: z.string().trim().length(2).toUpperCase().optional(),
});

export type FeedConnectionInput = z.infer<typeof feedConnectionInput>;

/** The safe projection returned by the API — no secret, ever. */
export interface FeedConnectionPublic {
  id: string;
  name: string;
  url: string;
  kind: z.infer<typeof feedKindEnum>;
  format: z.infer<typeof feedFormatEnum>;
  auth: z.infer<typeof feedAuthEnum>;
  header: string;
  defaultCountry: string;
  hasSecret: boolean;
  lastRunAt: string | null;
  lastStatus: string | null;
  createdAt: string;
}

interface FeedRow {
  id: string; name: string; url: string; kind: string; format: string;
  auth: string; header: string | null; default_country: string | null;
  secret_ciphertext: string | null; last_run_at: string | null;
  last_status: string | null; created_at: string;
}

export function toPublic(row: FeedRow): FeedConnectionPublic {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    kind: (row.kind as FeedConnectionPublic["kind"]) ?? "custodian",
    format: (row.format as FeedConnectionPublic["format"]) ?? "auto",
    auth: (row.auth as FeedConnectionPublic["auth"]) ?? "none",
    header: row.header ?? "X-API-Key",
    defaultCountry: row.default_country ?? "CH",
    hasSecret: !!row.secret_ciphertext,
    lastRunAt: row.last_run_at,
    lastStatus: row.last_status,
    createdAt: row.created_at,
  };
}

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) out[issue.path.join(".") || "(root)"] = issue.message;
  return out;
}

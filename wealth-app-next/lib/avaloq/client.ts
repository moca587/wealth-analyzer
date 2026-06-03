// ─────────────────────────────────────────────────────────────────
// Avaloq REST API client (server-side only)
//
// Thin wrapper around the Avaloq API gateway with OAuth2
// client-credentials auth and an in-memory access-token cache.
//
// It NEVER returns fabricated data: if the required env vars are
// missing, `isAvaloqConfigured()` is false and constructing the client
// throws. Endpoint PATHS are modelled on Avaloq's documented resource
// model — ⚠️ VERIFY each path/param against your tenant's OpenAPI spec.
//
// SECURITY: import this only from server code (route handlers, server
// actions). The client secret must never reach the browser bundle.
// ─────────────────────────────────────────────────────────────────

import type {
  AvaloqPartner,
  AvaloqAccount,
  AvaloqPosition,
  AvaloqCredit,
  AvaloqInstrument,
  AvaloqHouseholdData,
} from "./types";

export interface AvaloqConfig {
  baseUrl: string; // e.g. https://api.<bank>.avaloq.com/v1
  tokenUrl: string; // OAuth2 token endpoint
  clientId: string;
  clientSecret: string;
  scope?: string;
  /** Optional API version / tenant header some gateways require. */
  apiVersion?: string;
}

/** True only when every required Avaloq env var is present. */
export function isAvaloqConfigured(): boolean {
  return Boolean(
    process.env.AVALOQ_API_BASE_URL &&
      process.env.AVALOQ_TOKEN_URL &&
      process.env.AVALOQ_CLIENT_ID &&
      process.env.AVALOQ_CLIENT_SECRET,
  );
}

export function readAvaloqConfig(): AvaloqConfig {
  if (!isAvaloqConfigured()) {
    throw new Error(
      "Avaloq is not configured. Set AVALOQ_API_BASE_URL, AVALOQ_TOKEN_URL, " +
        "AVALOQ_CLIENT_ID and AVALOQ_CLIENT_SECRET in .env.local.",
    );
  }
  return {
    baseUrl: process.env.AVALOQ_API_BASE_URL!.replace(/\/$/, ""),
    tokenUrl: process.env.AVALOQ_TOKEN_URL!,
    clientId: process.env.AVALOQ_CLIENT_ID!,
    clientSecret: process.env.AVALOQ_CLIENT_SECRET!,
    scope: process.env.AVALOQ_SCOPE || undefined,
    apiVersion: process.env.AVALOQ_API_VERSION || undefined,
  };
}

interface CachedToken {
  accessToken: string;
  expiresAt: number; // epoch ms
}

export class AvaloqClient {
  private cfg: AvaloqConfig;
  private token: CachedToken | null = null;

  constructor(cfg?: AvaloqConfig) {
    this.cfg = cfg ?? readAvaloqConfig();
  }

  // ── auth ──────────────────────────────────────────────────────
  private async getAccessToken(now: number): Promise<string> {
    // 30s safety margin before expiry.
    if (this.token && this.token.expiresAt - 30_000 > now) {
      return this.token.accessToken;
    }
    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.cfg.clientId,
      client_secret: this.cfg.clientSecret,
    });
    if (this.cfg.scope) body.set("scope", this.cfg.scope);

    const res = await fetch(this.cfg.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      // TODO(mTLS): bank-grade Avaloq gateways often require mutual TLS.
      // Node's global fetch can't present a client cert; wire an undici
      // Agent with { connect: { cert, key } } here when your tenant needs it.
    });
    if (!res.ok) {
      throw new Error(`Avaloq OAuth token request failed: ${res.status} ${await safeText(res)}`);
    }
    const json = (await res.json()) as { access_token: string; expires_in?: number };
    const ttl = (json.expires_in ?? 300) * 1000;
    this.token = { accessToken: json.access_token, expiresAt: now + ttl };
    return this.token.accessToken;
  }

  // ── core request ──────────────────────────────────────────────
  private async request<T>(path: string, now: number): Promise<T> {
    const token = await this.getAccessToken(now);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    };
    if (this.cfg.apiVersion) headers["Avaloq-API-Version"] = this.cfg.apiVersion;

    const res = await fetch(`${this.cfg.baseUrl}${path}`, { headers });
    if (!res.ok) {
      throw new Error(`Avaloq API ${path} failed: ${res.status} ${await safeText(res)}`);
    }
    return (await res.json()) as T;
  }

  // ── resources (⚠️ VERIFY paths against tenant OpenAPI) ─────────
  getPartner(partnerId: string, now: number) {
    return this.request<AvaloqPartner>(`/partners/${encodeURIComponent(partnerId)}`, now);
  }

  listAccounts(partnerId: string, now: number) {
    return this.request<{ items: AvaloqAccount[] }>(
      `/partners/${encodeURIComponent(partnerId)}/accounts`,
      now,
    ).then((r) => r.items ?? []);
  }

  listPositions(partnerId: string, now: number) {
    return this.request<{ items: AvaloqPosition[] }>(
      `/partners/${encodeURIComponent(partnerId)}/positions`,
      now,
    ).then((r) => r.items ?? []);
  }

  listCredits(partnerId: string, now: number) {
    return this.request<{ items: AvaloqCredit[] }>(
      `/partners/${encodeURIComponent(partnerId)}/credits`,
      now,
    ).then((r) => r.items ?? []);
  }

  getInstrument(instrumentId: string, now: number) {
    return this.request<AvaloqInstrument>(
      `/instruments/${encodeURIComponent(instrumentId)}`,
      now,
    );
  }

  /**
   * Assemble a full household snapshot for one or two partners.
   * `now` is passed in (not read from Date) so callers control time and
   * the function stays deterministic for testing.
   */
  async fetchHousehold(partnerIds: string[], now: number): Promise<AvaloqHouseholdData> {
    const partners = await Promise.all(partnerIds.map((id) => this.getPartner(id, now)));

    const [accountsByPartner, positionsByPartner, creditsByPartner] = await Promise.all([
      Promise.all(partnerIds.map((id) => this.listAccounts(id, now))),
      Promise.all(partnerIds.map((id) => this.listPositions(id, now))),
      Promise.all(partnerIds.map((id) => this.listCredits(id, now))),
    ]);

    const accounts = accountsByPartner.flat();
    const positions = positionsByPartner.flat();
    const credits = creditsByPartner.flat();

    // Resolve any instruments not embedded in the positions.
    const instruments: Record<string, AvaloqInstrument> = {};
    const missing = Array.from(
      new Set(positions.filter((p) => !p.instrument).map((p) => p.instrumentId)),
    );
    const resolved = await Promise.all(missing.map((id) => this.getInstrument(id, now)));
    for (const inst of resolved) instruments[inst.instrumentId] = inst;

    return { partners, accounts, positions, credits, instruments };
  }
}

async function safeText(res: Response): Promise<string> {
  try {
    return (await res.text()).slice(0, 500);
  } catch {
    return "<no body>";
  }
}

// ─────────────────────────────────────────────────────────────────
// Wealth data-source abstraction
//
// The app's default data source is manual entry persisted in Supabase
// (`profiles.plan`). This abstraction lets an external system of record
// — Avaloq — supply the balance-sheet portion of the plan instead.
//
// Add more sources (Temenos, FNZ, Aladdin, a CSV importer…) by
// implementing `WealthDataSource`.
// ─────────────────────────────────────────────────────────────────

import type { WealthPlan } from "@/lib/engine/types";
import { AvaloqClient, isAvaloqConfigured } from "./client";
import { buildPlanFragmentsFromAvaloq, mergePlan, type MappedAvaloqPlan } from "./mapper";

export interface SyncResult {
  plan: WealthPlan;
  warnings: string[];
  counts: { clients: number; assets: number; loans: number };
}

export interface WealthDataSource {
  readonly id: string;
  /** Whether this source has the config/credentials it needs to run. */
  isAvailable(): boolean;
  /**
   * Pull external data and merge it onto `base`, returning the new plan.
   * `nowIso` is injected so the operation is deterministic/testable.
   */
  sync(base: WealthPlan, opts: { partnerIds: string[]; nowIso: string }): Promise<SyncResult>;
}

export class AvaloqDataSource implements WealthDataSource {
  readonly id = "avaloq";
  private client: AvaloqClient | null;

  constructor(client?: AvaloqClient) {
    this.client = client ?? (isAvaloqConfigured() ? new AvaloqClient() : null);
  }

  isAvailable(): boolean {
    return this.client !== null;
  }

  async sync(
    base: WealthPlan,
    opts: { partnerIds: string[]; nowIso: string },
  ): Promise<SyncResult> {
    if (!this.client) {
      throw new Error("AvaloqDataSource is not configured.");
    }
    if (!opts.partnerIds.length) {
      throw new Error("At least one Avaloq partnerId is required to sync.");
    }
    const nowMs = Date.parse(opts.nowIso);
    const household = await this.client.fetchHousehold(opts.partnerIds, nowMs);
    const mapped: MappedAvaloqPlan = buildPlanFragmentsFromAvaloq(household);
    const plan = mergePlan(base, mapped, opts.nowIso);
    return {
      plan,
      warnings: mapped.warnings,
      counts: {
        clients: mapped.clients.length,
        assets: mapped.assets.length,
        loans: mapped.loans.length,
      },
    };
  }
}

/** Returns the Avaloq data source if configured, otherwise null. */
export function getAvaloqDataSource(): AvaloqDataSource | null {
  const src = new AvaloqDataSource();
  return src.isAvailable() ? src : null;
}

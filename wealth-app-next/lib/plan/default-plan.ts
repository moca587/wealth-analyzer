import { INFLATION_REGIONS } from "@/lib/engine/constants";
import type { Client, WealthPlan } from "@/lib/engine/types";

export const newId = () => "id_" + Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString();

/**
 * The default shape of a brand-new plan. Shared by the API route (to
 * validate/normalize), the plan-capture form (initial state), and tests
 * (a known-good baseline) so all three never drift out of sync.
 */
export function emptyPlan(): WealthPlan {
  const c1: Client = { id: newId(), first: "", last: "", country: "US", risk: "moderate", horizon: "15_plus" };
  return {
    version: 1,
    currency: "USD",
    inflationRate: INFLATION_REGIONS.US.rate,
    inflationRegion: "US",
    clients: [c1],
    children: [],
    incomes: [{ id: newId(), clientId: c1.id, source: "Salary", amount: 0, taxable: true }],
    expenses: [{ id: newId(), name: "Living expenses", amount: 0 }],
    assets: [],
    loans: [],
    goals: [],
    createdAt: today(),
    updatedAt: today(),
  };
}
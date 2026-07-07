import type { WealthPlan } from "@/lib/engine/types";

/**
 * Shared contract for every plan sub-section. `update` merges a shallow patch
 * into the top-level plan (PlanForm owns the state and stamps updatedAt), so
 * sections never hold their own copy — inputs keep focus because rows are
 * keyed by stable id and never remount on keystroke.
 */
export interface SectionProps {
  plan: WealthPlan;
  update: (patch: Partial<WealthPlan>) => void;
}

import { migratePlan } from "./migrate";
import { parsePlan } from "./schema";
import type { WealthPlan } from "@/lib/engine/types";

const EXPORT_VERSION = 1;

/** Serialize a plan to a downloadable JSON string, stamped with a version. */
export function serializePlan(plan: WealthPlan): string {
  return JSON.stringify(
    { schema: "wealth-analyzer-plan", schemaVersion: EXPORT_VERSION, exportedAt: new Date().toISOString(), plan },
    null,
    2
  );
}

/**
 * Parse imported text into a validated plan. Runs the raw JSON through
 * migratePlan (to upgrade legacy/partial shapes) and then Zod validation, so
 * a bad file surfaces field-level errors instead of silently replacing state.
 * Accepts both the wrapped export envelope and a bare plan object.
 */
export function deserializePlan(
  text: string
): { ok: true; plan: WealthPlan } | { ok: false; error: string; fieldErrors?: Record<string, string> } {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: "That file isn't valid JSON." };
  }

  // Unwrap the export envelope if present; otherwise treat the object as a bare plan.
  const candidate =
    raw && typeof raw === "object" && "plan" in (raw as Record<string, unknown>)
      ? (raw as Record<string, unknown>).plan
      : raw;

  const migrated = migratePlan(candidate);
  const result = parsePlan(migrated);
  if (!result.ok) {
    return { ok: false, error: "This plan couldn't be validated after import.", fieldErrors: result.fieldErrors };
  }
  return { ok: true, plan: result.plan };
}

/** Trigger a browser download of the plan as a .json file. */
export function downloadPlan(plan: WealthPlan): void {
  const blob = new Blob([serializePlan(plan)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `wealth-plan-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ─────────────────────────────────────────────────────────────────
// What every gated page needs before it can render anything: WHICH
// client, and what that client's plan currently says.
//
// Factored out because four pages used to open with the same
// `select plan from profiles` and each one is now three questions
// (which household? is it readable? which version?). Answering them in
// four places is how two screens end up showing different clients'
// numbers under the same name in the sidebar.
// ─────────────────────────────────────────────────────────────────

import { createClient } from "@/lib/supabase/server";
import { resolveHouseholdFromCookie, type HouseholdRef } from "./context";
import { currentPlan } from "./plans";
import type { WealthPlan } from "@/lib/engine/types";

export interface PageContext {
  household: HouseholdRef | null;
  /** Set when no single household could be resolved; render the picker. */
  needsChoice: { message: string; candidates: HouseholdRef[] } | null;
  plan: WealthPlan | null;
  version: number;
  /** Stored JSONB that no longer validates. Distinct from "no plan yet". */
  invalid: boolean;
}

export async function loadPageContext(): Promise<PageContext> {
  const supabase = await createClient();
  const hh = await resolveHouseholdFromCookie(supabase);

  if (!hh.ok) {
    return {
      household: null,
      needsChoice: { message: hh.error, candidates: hh.households ?? [] },
      plan: null, version: 0, invalid: false,
    };
  }

  const cur = await currentPlan(supabase, hh.household.id);
  return {
    household: hh.household,
    needsChoice: null,
    plan: cur.state === "ok" ? cur.version.plan : null,
    version: cur.state === "none" ? 0 : cur.state === "ok" ? cur.version.version : cur.version,
    invalid: cur.state === "invalid",
  };
}

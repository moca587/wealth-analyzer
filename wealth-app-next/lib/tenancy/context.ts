// ─────────────────────────────────────────────────────────────────
// Which client is this request about?
//
// Every route that touches a plan, a feed, an order or an audit event
// now needs a household. This resolves it once, the same way the
// database does — and that symmetry is deliberate:
//
//   `resolve_default_household()` in 008 fills household_id on insert
//   ONLY when the actor has exactly one household, and RAISES otherwise
//   rather than guessing. This does the same, so an advisor with two
//   clients gets a clear 400 from the API instead of a database
//   exception surfacing as a 500.
//
// The alternative — defaulting to "their first household" — is the one
// thing that must never happen: it books a custodian feed or an order
// against the wrong client, silently.
// ─────────────────────────────────────────────────────────────────

import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * Where the browser parks the current selection so SERVER components can
 * see it too. A UUID, not a credential: every read re-checks membership,
 * so a forged value produces a 404, never another firm's client.
 */
export const HOUSEHOLD_COOKIE = "wa_household";

export interface HouseholdRef {
  id: string;
  orgId: string;
  name: string;
  currency: string;
}

export type HouseholdResolution =
  | { ok: true; household: HouseholdRef }
  | { ok: false; status: number; error: string; code: string; households?: HouseholdRef[] };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Every household the caller may see. RLS does the filtering. */
export async function listHouseholds(supabase: SupabaseClient): Promise<HouseholdRef[]> {
  const { data } = await supabase
    .from("households")
    .select("id, org_id, name, currency")
    .is("archived_at", null)
    .order("name");
  return (data ?? []).map((h) => ({
    id: String(h.id), orgId: String(h.org_id),
    name: String(h.name), currency: String(h.currency ?? "CHF"),
  }));
}

/** `wa_household` out of a raw Cookie header, without pulling in a parser. */
function cookieHousehold(header: string | null): string {
  if (!header) return "";
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === HOUSEHOLD_COOKIE) {
      return decodeURIComponent(part.slice(eq + 1).trim());
    }
  }
  return "";
}

/**
 * Resolve the household a request is about.
 *
 * Precedence — `?household=` / `x-household-id` (the caller said so), then
 * the cookie the switcher wrote (the browser said so), then the caller's
 * only household. A caller with several and no signal is ASKED, never
 * guessed for; the candidate list rides along on that error so a client can
 * render a picker without a second round-trip.
 */
export async function resolveHousehold(
  supabase: SupabaseClient,
  request: Request,
): Promise<HouseholdResolution> {
  const url = new URL(request.url);
  const explicit =
    url.searchParams.get("household") ??
    request.headers.get("x-household-id") ??
    "";
  const hinted = explicit || cookieHousehold(request.headers.get("cookie"));

  // A malformed EXPLICIT value is an error; a stale cookie is not — the
  // browser can hold one from a previous login, and failing the whole
  // request on it would strand the user with no way to pick again.
  if (explicit && !UUID.test(explicit)) {
    return { ok: false, status: 400, code: "bad_household", error: "household must be a UUID" };
  }

  return pick(await listHouseholds(supabase), UUID.test(hinted) ? hinted : "", !!explicit);
}

/**
 * The same resolution for a SERVER COMPONENT, which has cookies but no
 * Request. Kept beside the request version so the two cannot drift into
 * disagreeing about which client a page is showing.
 */
export async function resolveHouseholdFromCookie(
  supabase: SupabaseClient,
): Promise<HouseholdResolution> {
  const store = await cookies();
  const hinted = store.get(HOUSEHOLD_COOKIE)?.value ?? "";
  return pick(await listHouseholds(supabase), UUID.test(hinted) ? hinted : "", false);
}

function pick(all: HouseholdRef[], hinted: string, wasExplicit: boolean): HouseholdResolution {
  if (hinted) {
    const hit = all.find((h) => h.id === hinted);
    if (hit) return { ok: true, household: hit };
    // An explicit id that resolves to nothing is a 404 — and deliberately the
    // same answer as "not permitted", because confirming a household exists in
    // another firm is itself a leak. A stale COOKIE falls through to the
    // normal choose-a-client path instead.
    if (wasExplicit) {
      return { ok: false, status: 404, code: "no_household", error: "Household not found" };
    }
  }

  if (all.length === 1) return { ok: true, household: all[0] };

  if (all.length === 0) {
    return {
      ok: false, status: 409, code: "no_household",
      error: "This account has no client household yet. Create one first.",
      households: [],
    };
  }

  return {
    ok: false, status: 400, code: "household_required",
    error: `You advise ${all.length} clients — say which one this request is for.`,
    households: all,
  };
}

// ─────────────────────────────────────────────────────────────────
// Which client is the browser looking at?
//
// The server refuses to guess when a caller advises more than one
// household (see lib/tenancy/context.ts). So the browser has to say, and
// every API call from the app has to carry the same answer — otherwise
// the plan on screen and the feed being applied to it can be different
// clients.
//
// The selection is kept in localStorage rather than a cookie so it is
// per-browser and never travels on a request the app did not build. It is
// a UI preference, NOT an authorisation: the server re-checks membership
// on every request, so a tampered value gets a 404, not another client's
// data.
// ─────────────────────────────────────────────────────────────────

export const HOUSEHOLD_KEY = "wa.householdId";
/** Mirrored into a cookie so SERVER components render the same client. */
export const HOUSEHOLD_COOKIE = "wa_household";

export interface HouseholdRef {
  id: string;
  orgId: string;
  name: string;
  currency: string;
}

export function getHouseholdId(): string | null {
  if (typeof window === "undefined") return null;
  try { return window.localStorage.getItem(HOUSEHOLD_KEY) || null; } catch { return null; }
}

export function setHouseholdId(id: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (id) window.localStorage.setItem(HOUSEHOLD_KEY, id);
    else window.localStorage.removeItem(HOUSEHOLD_KEY);
    // The cookie is what lets a SERVER component render the same client the
    // switcher is showing. SameSite=Lax so it does not ride on a cross-site
    // request; it is a selection, not a credential, but there is no reason
    // for another origin's navigation to influence which client is on screen.
    document.cookie = id
      ? `${HOUSEHOLD_COOKIE}=${encodeURIComponent(id)}; path=/; max-age=31536000; SameSite=Lax`
      : `${HOUSEHOLD_COOKIE}=; path=/; max-age=0; SameSite=Lax`;
    // Same-tab listeners; the storage event only fires in OTHER tabs.
    window.dispatchEvent(new CustomEvent(HOUSEHOLD_EVENT, { detail: id }));
  } catch { /* private mode — the app still works, it just re-asks */ }
}

export const HOUSEHOLD_EVENT = "wa:household-changed";

/**
 * Fetch with the current household attached.
 *
 * Sent as a header rather than a query parameter so it survives a URL that
 * already carries its own query string, and so it never lands in an access
 * log alongside the rest of the path.
 */
export function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const id = getHouseholdId();
  const headers = new Headers(init.headers);
  if (id) headers.set("x-household-id", id);
  return fetch(input, { ...init, headers });
}

/**
 * Read the household list and reconcile the stored selection with it.
 *
 * A stored id that is no longer in the list — reassigned, archived, or
 * from a different login on this browser — is dropped rather than sent,
 * so the user gets the "choose a client" state instead of a 404 on every
 * call.
 */
export async function loadHouseholds(): Promise<{
  households: HouseholdRef[];
  selected: string | null;
}> {
  const res = await fetch("/api/households", { cache: "no-store" });
  if (!res.ok) return { households: [], selected: null };
  const body = await res.json().catch(() => ({}));
  const households: HouseholdRef[] = Array.isArray(body.households) ? body.households : [];

  const stored = getHouseholdId();
  let selected = stored && households.some((h) => h.id === stored) ? stored : null;
  if (!selected && households.length === 1) selected = households[0].id;
  if (selected !== stored) setHouseholdId(selected);

  return { households, selected };
}

// ─────────────────────────────────────────────────────────────────
// Which client is this request about?
//
// The one behaviour worth pinning above all others: with more than one
// candidate and no signal, this must REFUSE. A default here does not
// throw an error a user sees — it quietly renders, edits and books
// orders against the wrong client's money.
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { resolveHousehold, HOUSEHOLD_COOKIE } from "../context";
import type { SupabaseClient } from "@supabase/supabase-js";

const A = "11111111-1111-4111-8111-111111111111";
const B = "22222222-2222-4222-8222-222222222222";
const ELSEWHERE = "33333333-3333-4333-8333-333333333333";

/** Stands in for the `households` select. RLS is the real filter; this
 *  returns only what the caller may see, which is what RLS produces. */
function fakeSupabase(visible: Array<{ id: string; name: string }>): SupabaseClient {
  const rows = visible.map((h) => ({ id: h.id, org_id: "org-1", name: h.name, currency: "CHF" }));
  const chain = {
    select: () => chain,
    is: () => chain,
    order: () => Promise.resolve({ data: rows, error: null }),
  };
  return { from: () => chain } as unknown as SupabaseClient;
}

const req = (url: string, headers: Record<string, string> = {}) =>
  new Request(url, { headers });

describe("resolveHousehold", () => {
  it("uses the only household without being asked", async () => {
    const r = await resolveHousehold(fakeSupabase([{ id: A, name: "Keller" }]), req("https://x/api/plan"));
    expect(r.ok && r.household.id).toBe(A);
  });

  it("REFUSES to pick when there are two and nothing says which", async () => {
    const r = await resolveHousehold(
      fakeSupabase([{ id: A, name: "Keller" }, { id: B, name: "Meier" }]),
      req("https://x/api/plan"));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.status).toBe(400);
    expect(r.code).toBe("household_required");
    // The candidates ride along so a client renders a picker without a
    // second round-trip.
    expect(r.households?.map((h) => h.id)).toEqual([A, B]);
  });

  it("takes the query parameter", async () => {
    const r = await resolveHousehold(
      fakeSupabase([{ id: A, name: "Keller" }, { id: B, name: "Meier" }]),
      req(`https://x/api/plan?household=${B}`));
    expect(r.ok && r.household.name).toBe("Meier");
  });

  it("takes the header", async () => {
    const r = await resolveHousehold(
      fakeSupabase([{ id: A, name: "Keller" }, { id: B, name: "Meier" }]),
      req("https://x/api/plan", { "x-household-id": B }));
    expect(r.ok && r.household.name).toBe("Meier");
  });

  it("takes the switcher's cookie, so a page and its API calls agree", async () => {
    const r = await resolveHousehold(
      fakeSupabase([{ id: A, name: "Keller" }, { id: B, name: "Meier" }]),
      req("https://x/api/plan", { cookie: `sb-token=zzz; ${HOUSEHOLD_COOKIE}=${B}; other=1` }));
    expect(r.ok && r.household.id).toBe(B);
  });

  it("lets an explicit value beat the cookie", async () => {
    const r = await resolveHousehold(
      fakeSupabase([{ id: A, name: "Keller" }, { id: B, name: "Meier" }]),
      req(`https://x/api/plan?household=${A}`, { cookie: `${HOUSEHOLD_COOKIE}=${B}` }));
    expect(r.ok && r.household.id).toBe(A);
  });

  it("404s an id outside the caller's book, without confirming it exists", async () => {
    const r = await resolveHousehold(
      fakeSupabase([{ id: A, name: "Keller" }]),
      req(`https://x/api/plan?household=${ELSEWHERE}`));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.status).toBe(404);
    // Same wording a genuinely missing row would get. "Forbidden" would
    // confirm that a household with this id exists in some other firm.
    expect(r.error).toBe("Household not found");
  });

  it("does NOT fail the request on a stale cookie — it asks again", async () => {
    // A cookie can outlive a reassignment, an archive, or a different login
    // on the same browser. Erroring would strand the user with no way to
    // choose; falling through puts them back on the picker.
    const r = await resolveHousehold(
      fakeSupabase([{ id: A, name: "Keller" }, { id: B, name: "Meier" }]),
      req("https://x/api/plan", { cookie: `${HOUSEHOLD_COOKIE}=${ELSEWHERE}` }));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.code).toBe("household_required");
  });

  it("still resolves the single household when the cookie is stale", async () => {
    const r = await resolveHousehold(
      fakeSupabase([{ id: A, name: "Keller" }]),
      req("https://x/api/plan", { cookie: `${HOUSEHOLD_COOKIE}=${ELSEWHERE}` }));
    expect(r.ok && r.household.id).toBe(A);
  });

  it("rejects a non-UUID explicit value before it reaches the database", async () => {
    const r = await resolveHousehold(
      fakeSupabase([{ id: A, name: "Keller" }]),
      req("https://x/api/plan?household=' or 1=1--"));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.status).toBe(400);
    expect(r.code).toBe("bad_household");
  });

  it("tells an account with no client to create one, and does not 500", async () => {
    const r = await resolveHousehold(fakeSupabase([]), req("https://x/api/plan"));
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.status).toBe(409);
    expect(r.code).toBe("no_household");
  });
});

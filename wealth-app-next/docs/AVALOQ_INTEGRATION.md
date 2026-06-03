# Avaloq Integration — Plan & Architecture

> Status: **foundation scaffolded, awaiting tenant credentials & API-spec verification.**
> The app continues to run fully on manual entry; the Avaloq path is additive and
> disabled until `AVALOQ_*` env vars are set.

---

## 1. Goal

Let the Wealth Analyzer pull a household's **balance sheet** (clients, cash
accounts, securities positions, loans) directly from **Avaloq** — the bank's
core-banking system of record — instead of re-typing it by hand. The Monte
Carlo engine then runs on real, current portfolio data.

---

## 2. Which integration model? (this needs your decision)

"Put it on the Avaloq platform" can mean three quite different things. They are
**not** mutually exclusive, but they have very different prerequisites:

| Model | What it means | Needs | Effort |
|---|---|---|---|
| **A. Consume Avaloq APIs** *(built here)* | This app stays where it is (Vercel/own host) and **calls Avaloq's REST API** to read partners/accounts/positions/credits. | Partner-portal API credentials (OAuth2, often mTLS) + sandbox tenant | **Low–Med** |
| **B. Publish to avaloq.one Marketplace** | Package the app as a listed integration/app discoverable inside Avaloq's ecosystem. | Avaloq partnership, Marketplace onboarding, conformance review, app manifest | **High** (commercial + technical) |
| **C. Embed inside the Avaloq workplace** | Run the app *inside* the advisor workbench (e.g. as an embedded panel/widget in Avaloq Wealth / Engage). | Hosting/embedding contract, SSO into the bank IdP, UI framework conformance | **High** |

**Recommendation:** start with **Model A**. It delivers the actual user value
(real data → simulation) fastest, validates the data mapping, and is a
prerequisite for B and C anyway. B and C are largely **commercial/partnership**
tracks that gate on an Avaloq agreement — engineering can't unblock them alone.

The scaffolding in this repo implements **Model A**.

---

## 3. Architecture (Model A, as built)

```
                ┌──────────────────────────────────────────────┐
   Avaloq API   │  POST /api/avaloq/sync   (app/api/avaloq/…)    │
   (OAuth2) ───▶│    1. auth user (Supabase)                     │
                │    2. AvaloqClient.fetchHousehold(partnerIds)  │──▶ Avaloq REST
                │    3. buildPlanFragmentsFromAvaloq(...)         │
                │    4. mergePlan(existing, mapped)              │
                │    5. write profiles.plan (Supabase JSONB)     │
                └──────────────────────────────────────────────┘
                                     │
                                     ▼
              existing app: dashboard / plan editor / simulator
              (unchanged — reads profiles.plan as it always has)
```

### Files added (all under `wealth-app-next/`)

| File | Responsibility |
|---|---|
| `lib/avaloq/types.ts` | Avaloq domain types (Partner, Account, Position, Instrument, Credit). |
| `lib/avaloq/mapper.ts` | **Pure** Avaloq→`WealthPlan` mapping + `mergePlan()`. The testable core. |
| `lib/avaloq/client.ts` | REST client: OAuth2 client-credentials, token cache, resource calls. |
| `lib/avaloq/index.ts` | `WealthDataSource` interface + `AvaloqDataSource` + factory. |
| `app/api/avaloq/sync/route.ts` | The sync endpoint (501 when not configured). |
| `.env.local.example` | Documents the `AVALOQ_*` env vars. |

Nothing in the existing manual-entry flow was modified.

---

## 4. Data mapping (Avaloq → WealthPlan)

| App field (`lib/engine/types.ts`) | Source in Avaloq | Notes |
|---|---|---|
| `Client.first/last/dob` | Partner name & DOB | `partners[0]` = primary, `[1]` = partner. |
| `Client.country/state/city/zip` | Partner domicile / address | Euro-zone ISO codes collapse to `"EU"`. |
| `Client.risk` | Partner `riskClassification` | **VERIFY** code list → 7-level scale in `RISK_MAP`. |
| `Asset` (cash) | Account balance | `cls: "cash"`, `liquid: true`. |
| `Asset` (securities) | Position market value + Instrument class | `cls` from `INSTRUMENT_CLASS_MAP`; real-estate funds → illiquid. |
| `Loan.bal/rate/yrs` | Credit outstanding / rate / term | Feeds the amortization engine directly. |

Synced rows get **`avaloq:`-prefixed ids** so a re-sync refreshes them while
**manual rows the user added are preserved**.

---

## 5. What Avaloq supplies vs. what stays manual

Avaloq is the system of record for the **balance sheet**, but a financial *plan*
needs more. Be explicit about the gap:

| Plan input | From Avaloq? |
|---|---|
| Clients / KYC | ✅ Yes |
| Cash accounts, securities, loans | ✅ Yes |
| Risk profile | ⚠️ Sometimes (if suitability profiling is exposed) |
| **Goals** (retirement, education…) | ❌ No — user-entered (preserved by `mergePlan`) |
| **Monthly expense budget** | ❌ No — user-entered |
| **Children** | ❌ Usually no — user-entered |
| **Income streams** | ⚠️ Partial — salary isn't in core banking; only inferable cashflows |

`mergePlan()` is built around this: it **replaces** clients/assets/loans and
**preserves** goals/expenses/children/income/notes.

---

## 6. Prerequisites & access (the real gating items)

1. **Avaloq partnership / tenant access.** API access is granted per bank tenant
   through the partner portal — not a public signup.
2. **Sandbox tenant** with seeded test partners (do **not** develop against prod).
3. **OAuth2 client** (client_id/secret) scoped to the read resources you need.
4. **mTLS** — bank-grade Avaloq gateways commonly require a **client certificate**
   on top of OAuth. Node's global `fetch` can't present one; see the `TODO(mTLS)`
   in `client.ts` (wire an `undici` Agent with `{ connect: { cert, key } }`).
5. **The tenant's OpenAPI document.** Confirm exact resource paths, pagination,
   and code lists, then reconcile `types.ts` + the maps in `mapper.ts`.

---

## 7. Security

- All `AVALOQ_*` vars are **server-only** (never `NEXT_PUBLIC_`); the secret must
  not enter the browser bundle. `client.ts` is imported only from the route.
- The sync route is **auth-gated** (Supabase user) and writes only that user's
  row (RLS-enforced).
- Client banking data is PII/financial data — confirm the bank's **data-residency
  and retention** rules before persisting `profiles.plan` to Supabase. You may be
  required to keep it in-region or not persist positions at all (compute & drop).
- Add an audit log of who synced which partnerIds when (regulatory expectation).

---

## 8. Phased rollout

- **Phase 0 — Foundation** ✅ *(done)*: types, mapper, client, sync route, config,
  this doc. Compiles; returns 501 until configured.
- **Phase 1 — Sandbox wiring**: obtain sandbox creds, diff OpenAPI vs `types.ts`,
  fix paths/code-lists, run a real `fetchHousehold` against test partners.
- **Phase 2 — Mapping hardening**: FX normalisation to plan currency, risk/horizon
  code-list mapping, instrument-class coverage, unit tests on `mapper.ts`.
- **Phase 3 — UX**: a "Sync from Avaloq" button + partner-id picker in the plan
  editor; show `warnings` to the advisor; mTLS if required.
- **Phase 4 — Compliance & prod**: audit logging, data-residency review, secrets
  management, then production tenant.
- **(Optional) Models B/C** once the commercial partnership is in place.

---

## 9. TODO before production (search the code for these)

- `VERIFY` markers in `types.ts` and `mapper.ts` — reconcile with tenant OpenAPI.
- `TODO(mTLS)` in `client.ts` — add client-cert transport if the gateway needs it.
- **FX**: `buildPlanFragmentsFromAvaloq` only *warns* on mixed currencies; add real
  conversion before trusting aggregate net-worth figures.
- Pagination: list endpoints assume `{ items: [...] }` with no paging — handle
  `next`/cursor if your tenant paginates.
- Tests: add `mapper.test.ts` with fixture payloads (no live API needed).

---

## 10. How to enable locally

1. Copy the Avaloq block from `.env.local.example` into `.env.local` and fill in
   real sandbox values.
2. Restart `npm run dev` (env vars load at boot).
3. `POST /api/avaloq/sync` with `{ "partnerIds": ["<sandbox-partner-id>"] }` while
   signed in. Without credentials it returns **501** by design.

# Conversation Export — Wealth Analyzer Development

**Session date:** April 2026  
**Total iterations:** ~20 exchanges  
**Final deliverable:** `src/wealth-analyzer.html` — single-file browser app

---

## Session Summary

This document records the sequence of decisions and feature additions made during the development conversation that produced the Wealth Analyzer application.

---

## Feature Build Log

### Phase 1 — Concept & initial prototype
- Discussed how to build personal wealth analysis software
- Identified five core modules: net worth tracker, budget/cash flow, investment portfolio, savings projections, reporting
- Recommended tech stack: vanilla HTML/JS for maximum portability
- Built first interactive widget with assets/liabilities input and a bar chart

### Phase 2 — Monte Carlo engine
**Request:** Add Monte Carlo theory, goals, annual expenses, primary/secondary income, liabilities (mortgage, loans, credit card)

**Decisions:**
- Box-Muller transform for normally-distributed random returns
- Log-normal return model: `annRet = (μ − 0.5σ²) + σ·N(0,1)`
- 30% of surplus invested, 70% to cash (conservative default)
- Property appreciation stochastic at `3% ± 2%`
- Debt amortization with real monthly payment math
- Three probability band presets: Standard (10/50/80), Alternative (20/60/90), Custom
- Percentile bands rendered as layered fills on Chart.js line chart

### Phase 3 — Loan types
**Request:** Dropdown for loan type (mortgage, auto, personal, student, business, credit card, etc.) with Add button for multiple loans

**Decisions:**
- 9 loan types with default rate/term presets
- Mortgage split into two sub-options under `<optgroup>`: "Mortgage — primary" and "Mortgage — secondary"
- Primary mortgage defaults: 6.5% / 25 years
- Secondary mortgage defaults: 7.5% / 15 years (higher rate = second-lien risk premium)
- Each loan shows monthly payment estimate inline

### Phase 4 — Global inflation regions
**Request:** Replace zone buttons with dropdown covering US, EU, Switzerland, Japan, UK, Singapore, Australia, Hong Kong, Canada, China & Taiwan, South Korea, Brazil, Indonesia, Mexico, Saudi Arabia, South Africa, India

**Decisions:**
- 17 regions with 50-year historical CPI averages
- Grouped by geography: North America, Europe, Asia Pacific, Middle East & Africa, Latin America
- Each region shows flag emoji, rate, and contextual note
- Brazil and Mexico flagged with caveat: historical rates inflated by crisis eras; recommend manual override
- Switzerland (2.1%) and Japan (2.0%) are world's lowest

### Phase 5 — Client profiles
**Request:** Add client first name, last name, date of birth for client 1 and client 2, with relationship dropdown

**Decisions:**
- Client 2 is optional — hidden until "+ Add Client 2" clicked
- Relationship dropdown with three groups: Partnership (Spouse, Domestic partner, Significant other, Partner, Fiancé/Fiancée), Family (Co-applicant, Dependent, Parent, Sibling), Other (Business partner, Other)
- When named + relationship selected, a badge shows "Alice & Bob — Spouse"
- Income section shows two columns, one per client, that header with client's first name
- Both clients feed into combined household income for simulation

### Phase 6 — Children
**Request:** Add button to add children (name, DOB)

**Decisions:**
- Children section below client cards, same panel
- "+ Add child" button generates a card per child
- Avatar shows initials, age calculated live from DOB
- Children data not directly fed into simulation (potential future: education cost goals)

### Phase 7 — Address fields
**Request:** Add full address field under each client

**Decisions:**
- Address hidden behind collapsible `▶ Address` toggle to keep cards compact
- Fields: Street address, Apt/Suite, City, State/Province, Postal code, Country
- Country dropdown matches the 17 inflation regions + Other
- "Same address" checkbox on relationship connector copies Client 1's address to Client 2
- Client 1's country selection auto-syncs the Asset tab's country selector

### Phase 8 — Risk profile + time horizon
**Request:** Add client risk tolerance and investment time horizon

**Decisions:**
- 7 risk levels: Very conservative → Very aggressive
- Each level has: label, color, background, expected return mean, expected volatility, one-line description
- 7 time horizons: 1–3 yrs → 30+ yrs, grouped Short/Medium/Long
- Risk profile **drives simulation parameters** — selecting a profile auto-populates return mean/vol in Assets tab
- Two-client households blend parameters (average of both profiles)
- Household risk displayed in metric bar as "Blended: Moderate" etc.

### Phase 9 — Country-specific account types
**Request:** Expand assets to typed accounts (checking, savings, 401k, pension, etc.) with country dropdown that updates account types per country

**Decisions:**
- 19 countries supported (all major financial markets)
- Each country has 3–5 account groups with 2–6 accounts each
- ~500 total account type entries
- Each account has: value (ID), label (display name, native script where applicable), note (key facts: insurance limits, contribution caps, tax treatment), liquid (boolean)
- Group color coding: green=banking, blue=investment, purple=pension/retirement, grey=other
- Account type note appears as contextual help text when selected
- Liquid/illiquid tag shown on each added account

**Country-specific highlights:**
- 🇨🇭 Switzerland: Pillar 3a/3b/BVG/LPP/AHV terminology
- 🇯🇵 Japan: NISA, iDeCo with Japanese kanji labels
- 🇸🇬 Singapore: CPF OA/SA/MA/RA + SRS
- 🇦🇺 Australia: Superannuation accumulation/pension/SMSF
- 🇮🇳 India: EPF/PPF/NPS with EEE tax notation
- 🇰🇷 South Korea: NPS, IRP, ISA with KRW limits

### Phase 10 — Probability band selection
**Request:** Add dropdown for 30/50/80% standard and 40/60/90% alternative bands plus custom

**Decisions:**
- Three toggle buttons (not dropdown) for faster switching
- Standard: 30/50/80 — most common financial planning framing
- Alternative: 40/60/90 — for more optimistic conversations
- Custom: three number inputs (Low, Mid, High) with Apply button
- Switching presets redraws chart instantly without re-running simulation
- Legend updates to reflect active band percentiles

### Phase 11 — Code export (three-file version)
**Request:** "Take this into code"

**Output:** `index.html`, `data.js`, `app.js`

**Problems discovered:**
- Load order: `DOMContentLoaded` could fire before `data.js` parsed
- `showTab()` used global `event` object (unreliable)
- Element IDs inconsistent across files
- Layout broken at narrow widths

### Phase 12 — Single-file rebuild
**Request:** "App doesn't work well in browser"

**Decision:** Consolidated all three files into `wealth-analyzer.html`. All bugs resolved. Tab navigation rewritten with explicit `el` parameter. All IDs unified. Layout tested.

### Phase 13 — Three targeted fixes
**Requests:**
1. Fix children field (inputs lose focus when typing)
2. Monte Carlo chart: show calendar years (2030 etc.) not "Yr 5"
3. Fix income field so both clients can enter incomes

**Fixes applied:**
1. `updChild()` never re-renders the card on text input — only updates display spans in-place. `renderChildren()` called only on add/remove.
2. Chart X-axis already used `new Date().getFullYear() + i`. Goals migrated from `{ yr: 25 }` to `{ targetYear: 2050 }`. Goal analysis shows "median in 2050" not "median yr 25". Goal input changed from "In years" to "Target year" (e.g. 2035).
3. Client 2 income block was already present but avatar initials didn't sync. Fixed in `updateDisplays()` to also update `inc-av1` and `inc-av2` elements. `updateIncTotal()` called on every display update.

---

## Design Principles Established

1. **Single-file portability** — Must work via `file://` in any browser, no server required
2. **Country-first data** — Account types and inflation rates are country-specific, not generic
3. **Calendar years over relative years** — Goals always anchor to a real year (2050 not "in 25 years")
4. **Non-destructive DOM updates** — Never re-render an element that contains focused inputs
5. **Risk profile drives simulation** — The client's stated risk tolerance is the primary lever for return assumptions, not manually-entered percentages
6. **Collapsible complexity** — Advanced fields (address, risk profile) are collapsed by default; core fields (name, DOB) are always visible
7. **Household-level simulation** — When two clients exist, all income and risk parameters are combined at household level

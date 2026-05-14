# CLAUDE.md — Wealth Analyzer: Monte Carlo Financial Planner

> This file documents the full design and engineering decisions made during the development of this application. It is intended for use by Claude in future sessions to maintain continuity and avoid re-litigating resolved decisions.

---

## Project Overview

A single-file (`wealth-analyzer.html`) personal wealth analysis web application that runs entirely in the browser with no backend, no build step, and no dependencies beyond two CDN scripts (Chart.js and Google Fonts).

**Core capabilities:**
- Household profile management (1–2 clients + children)
- Multi-country account/asset registry (19 countries, ~500 account types)
- Loan tracking with amortization math
- Financial goal tracking with calendar-year targets
- Monte Carlo simulation (Box-Muller transform, configurable percentile bands)
- Country-aware inflation region presets (50-year historical averages)
- Risk profile + time horizon framework driving simulation parameters

---

## Architecture Decisions

### Single-file HTML
**Decision:** All HTML, CSS, and JavaScript live in one `wealth-analyzer.html` file.

**Rationale:** Earlier in development, the app was split into `index.html`, `data.js`, and `app.js`. This caused loading-order bugs (`DOMContentLoaded` fired before data scripts loaded in some browsers), a broken `showTab()` that relied on the global `event` object, and inconsistent element IDs across files. Consolidating into one file eliminated all of these issues with no downside for a single-page application of this size.

### No framework, no build
**Decision:** Vanilla JS, no React/Vue/Webpack/Vite.

**Rationale:** The app needs to be openable directly from the filesystem (`file://` protocol). Any bundler or module system would require a dev server. Vanilla JS with careful DOM management is perfectly adequate for this scope.

### CDN dependencies only
- `https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js` — charts
- `https://fonts.googleapis.com/css2?family=DM+Serif+Display...` — typography

No other external dependencies. If offline use is required, both can be vendored locally.

---

## UI/UX Decisions

### Dark theme
**Colors:** `#0f0f0f` base, `#161616` panels, `#1e1e1e` inputs, gold accent `#c9a96e`.
**Typography:** DM Serif Display (headings/values) + DM Sans (body/UI).
**Rationale:** Financial tools benefit from a refined, serious aesthetic. The gold accent on dark background signals premium/wealth context.

### Sidebar navigation with persistent metrics bar
The six metric cards (Net Worth, Monthly Surplus, Median Wealth, Goal Success, Total Assets, Household Risk) are always visible at the top regardless of active tab. This gives constant feedback while editing any section.

### Tab-based layout
Seven tabs: Household, Income, Expenses, Assets, Liabilities, Goals, Simulation. Avoids one long scrolling page. The simulation tab auto-activates after running.

### Collapsible address section
Address fields are hidden behind a `▶ Address` toggle to keep client cards compact. They expand inline without re-rendering.

---

## Data Model

### Goals
Goals store a `targetYear` (calendar year, e.g. 2050) rather than "years from now". The simulation converts to a relative index at runtime: `relYr = targetYear - currentYear`. This makes goals stable across time (a goal set for 2050 stays 2050, not "25 years" which would drift).

**Key:** `{ name: string, amt: number, targetYear: number }`

### Loans
```js
{ type: string, label: string, bal: number, rate: number, yrs: number }
```
Monthly payment calculated with standard amortization: `P × (r(1+r)^n) / ((1+r)^n − 1)`. Balances amortize down each simulation year.

### Assets
```js
{ id, type, group, label, baseLabel, value, liquid, country, note }
```
`liquid` flag distinguishes cash/investment accounts from locked accounts (pension, retirement). Used for simulation allocation logic.

### Children
```js
{ id: string, first: string, last: string, dob: string }
```
DOB stored as ISO date string (`YYYY-MM-DD`). Age calculated at render time.

---

## Monte Carlo Engine

### Algorithm
- **Simulations:** 200 / 500 / 1000 (user-selectable)
- **Random returns:** Log-normal via Box-Muller transform
  ```
  annRet = (μ - 0.5σ²) + σ × N(0,1)
  ```
- **Property appreciation:** Stochastic `3% ± 2%` annual growth
- **Debt amortization:** Per-loan annual balance reduction with actual interest math
- **Savings allocation:** 30% of surplus invested, 70% to cash

### Percentile bands
Three presets:
| Preset | Low | Mid | High |
|--------|-----|-----|------|
| Standard | 10th | 50th | 80th |
| Alternative | 20th | 60th | 90th |
| Custom | user | user | user |

Chart renders: outer band (low–high), inner band (25th–75th), median line.

### Return parameters by risk profile
| Profile | Mean return | Volatility |
|---------|-------------|------------|
| Very conservative | 3.5% | 4% |
| Conservative | 4.5% | 7% |
| Moderately conservative | 5.5% | 9% |
| Moderate | 7.0% | 12% |
| Moderately aggressive | 8.5% | 15% |
| Aggressive | 10.0% | 18% |
| Very aggressive | 12.0% | 22% |

When two clients are present, parameters are averaged.

---

## Country & Account System

### Supported countries (19)
US, CA, GB, AU, CH, EU, JP, SG, HK, CN, TW, KR, IN, ID, MX, BR, SA, ZA, OTHER

### Account type structure per country
Each country has `groups[]`, each group has `accounts[]` with:
- `value` — unique identifier
- `label` — display name (native script where applicable, e.g. Japanese kanji)
- `note` — one-line explanation with key facts (insurance limits, contribution caps, tax treatment)
- `liquid` — boolean for simulation classification

### Country → asset sync
Selecting a country in the Client 1 address field automatically updates the Asset tab's country selector and refreshes account types.

---

## Inflation Presets

50-year historical averages (1974–2024) per region:

| Region | Rate | Notes |
|--------|------|-------|
| Switzerland | 2.1% | World's lowest sustained inflation |
| Japan | 2.0% | Deflation era 1998–2012 pulls down |
| Saudi Arabia | 2.5% | Oil-pegged economy |
| Singapore | 2.8% | |
| Euro zone | 3.1% | HICP blended |
| Canada | 3.7% | |
| United States | 3.8% | CPI-U |
| China & Taiwan | 3.9% | Blended |
| Hong Kong | 4.1% | |
| Australia | 4.4% | |
| United Kingdom | 4.8% | RPI/CPI |
| South Korea | 5.2% | High 70s–80s |
| India | 7.4% | |
| South Africa | 8.9% | |
| Indonesia | 11.6% | 1998 spike |
| Mexico | 15.2% | 1980s–90s crisis era |
| Brazil | 58.5% | Hyperinflation pre-1994; recommend manual override to ~7% |

---

## Known Issues & Future Work

### Resolved bugs
- ✅ Children text inputs lost focus on every keystroke (fixed: smart DOM update, no re-render on text input)
- ✅ Goal analysis showed "yr 25" instead of calendar year (fixed: `targetYear` model)
- ✅ Client 2 income block not syncing avatar initials (fixed in `updateDisplays`)
- ✅ Three-file split caused load order bugs (fixed: single file)
- ✅ `showTab()` relied on global `event` object (fixed: explicit `el` parameter)

### Potential enhancements
- [ ] Export to PDF report
- [ ] Save/load household profile (localStorage or file download/upload)
- [ ] Tax modelling per country (capital gains, income brackets)
- [ ] Retirement drawdown phase (after accumulation)
- [ ] Social Security / state pension benefit estimator
- [ ] Currency selector (currently assumes single currency / USD display)
- [ ] Sensitivity analysis: tornado chart showing which inputs move the median most
- [ ] Portfolio rebalancing logic (currently static allocation)
- [ ] Inflation-adjusted vs nominal toggle on chart

---

## File Structure

```
wealth-analyzer-project/
├── CLAUDE.md                    ← this file
├── src/
│   └── wealth-analyzer.html    ← single-file application (production)
├── docs/
│   └── CONVERSATION_EXPORT.md  ← summary of design conversation
└── exports/
    └── (future PDF/JSON exports)
```

---

## Development Notes

### Running locally
```bash
open src/wealth-analyzer.html
# or
python3 -m http.server 8080
# then visit http://localhost:8080/src/wealth-analyzer.html
```

### Editing
All logic is in the `<script>` block at the bottom of `wealth-analyzer.html`. Data is in the large `COUNTRY_ACCOUNTS`, `REGIONS`, `RISK_PROFILES`, and `HORIZON_PROFILES` objects defined at the top of the script block.

Key functions:
| Function | Purpose |
|----------|---------|
| `runSim()` | Main simulation entry point |
| `redrawChart(paths)` | Renders Chart.js projection |
| `refreshAssetTypes()` | Rebuilds account type dropdown for selected country |
| `renderChildren()` | Full re-render of children cards (only on add/remove) |
| `updChild(id, field, val)` | In-place DOM update for child fields (no re-render) |
| `updateDisplays()` | Syncs all name/avatar/income displays across tabs |
| `updateHouseRisk()` | Updates household risk metric card |
| `getReturnParams()` | Returns blended mean/vol from risk profiles |

### CSS class reference
| Class | Purpose |
|-------|---------|
| `.tab` / `.tab.active` | Tab visibility |
| `.panel` | Card container |
| `.ptitle` | Gold section heading with decorative line |
| `.frow` | Form row (label + input) |
| `.mc` / `.mc-val` | Metric card |
| `.client-card` | Household profile card |
| `.coll-toggle` / `.coll-body` | Collapsible section |
| `.band-btn.active` | Active probability band button |

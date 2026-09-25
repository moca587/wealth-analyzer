# Wealth Analyzer Style Guide

| | |
|---|---|
| **Version** | v1.2 release candidate (2026-09-24). Becomes v1.0 when the team signs it off. Rules marked **Standard** in v1.1 came from design review and need the same sign-off |
| **Owner** | The team; **lead: Momir**, who approves changes |
| **Reference implementation** | `wealth-analyzer.html` (the pitch demo) |
| **Applies to** | The demo, `admin.html` (from Phase 2) and `wealth-app-next/` (from Phase 4). Not `index.html` or `wealth-analyzer-avaloq.html` |
| **Plan, gaps and decisions** | [`docs/plans/style-guide-plan.md`](plans/style-guide-plan.md) |

This is the design language of Wealth Analyzer: principles (§3), tokens (§4) and components (§5). It describes the demo **as it is today** and grows as the theme work lands.

**How to read it**

- Section numbers start at §3 and match the plan, so a reference such as "§5.13" in the plan, a task or a PR points here.
- Current CSS names are given first, with the **proposed semantic name** (the Phase 3 target) alongside. Use the semantic names in new code and in conversation.
- **G-xx** (gaps), **Q-xx** (decisions), **P2-/P3-/P4-xx** (tasks) and the phases are defined in the [plan](plans/style-guide-plan.md): gaps in §6, tasks in §7–§9, decisions in §1.1 and §10.
- ⚠ marks a place where the demo today differs from the intended rule; the linked gap says how it will be fixed.
- Line numbers refer to `wealth-analyzer.html` at commit `522b06f` and will drift; the selector is the stable reference.
- 📷 links a screenshot in [`style-guide-assets/`](style-guide-assets/) (index at the end).

**Standards and current state.** The guide describes the demo as it is. Where the team has set a rule the demo doesn't meet yet, the rule is written as the **standard** for new work and the current state is marked ⚠ with its gap. "Not decided" means the value is open; don't pick one in new code without asking the lead.

**Adding to this guide**

- Add a point here **when it is true in the code**, not when it is planned. Planned work stays in the plan until it lands.
- Update this guide **in the same PR** as the code change, and add a line to the [changelog](#changelog).
- A new component gets the next free §5 number, a 📷 screenshot (add it to `capture.mjs`), anatomy, tokens, states, rules and a SaaS target.
- Token renames or removals are a major version; new tokens or components are a minor version.

## Contents

- [Building a new screen](#building-a-new-screen) (checklist)
- §3 [Design principles](#3-design-principles)
- §4 Foundations: [4.1 Colour](#41-colour--core-tokens) · [4.1a Navy](#41a-colour--navy--inverse-palette-the-themes-dark-side) · [4.1b Status](#41b-colour--status-set-success-warning-error-info) · [4.2 Literals](#42-colour--recurring-literals-not-yet-tokens) · [4.3 Data vis](#43-colour--data-visualisation-palettes) · [4.4 Type](#44-typography) · [4.5 Spacing](#45-spacing) · [4.6 Radius](#46-radius) · [4.7 Shadows](#47-elevation-shadows) · [4.8 Motion](#48-motion) · [4.9 Layers](#49-layering-z-index) · [4.10 Accessibility](#410-accessibility-standard) · [4.11 Numbers](#411-number-formatting) · [4.12 Breakpoints](#412-breakpoints-and-supported-widths) · [4.13 States](#413-interaction-states) · [4.14 Voice](#414-content-and-voice)
- §5 Components: [5.1 Shell](#51-app-shell) · [5.2 Panel](#52-panel-card-and-section-title) · [5.3 Collapsible](#53-collapsible-sections) · [5.4 Buttons](#54-buttons) · [5.5 Forms](#55-form-controls) · [5.6 Metric tiles](#56-metric-tiles-kpi) · [5.7 Badges](#57-badges-tags-and-chips) · [5.8 Tables](#58-data-table) · [5.9 Tooltips](#59-tooltip-and-info-popover) · [5.10 Overlays](#510-overlays) · [5.11 Feedback](#511-feedback-states) · [5.12 Charts](#512-charts) · [5.13 Navy hero](#513-feature-surface-navy-hero--part-of-the-theme) · [5.14 Code](#514-code-block-and-inline-code) · [5.15 List rows](#515-list-rows) · [5.16 Bars](#516-progress-and-bar-indicators) · [5.17 Pies](#517-allocation-pie-card) · [5.18 Avatars](#518-avatars) · [5.19 Pill tabs](#519-pill-tabs-switcher) · [5.20 Callouts](#520-callouts-inline-notices) · [5.21 Splash](#521-intro-splash) · [5.22 Icons](#522-icons)
- [Screenshot index](#screenshot-index) · [Changelog](#changelog)

## Building a new screen

Use this before writing any new page or tab, in the demo, the admin console or the SaaS.

1. **Shell:** the page sits in the app shell (§5.1): topbar, sidebar, `.main` canvas. No second navigation.
2. **One light theme:** light canvas, white panels. **At most one** navy feature surface (`.wealth-hero`, §5.13), at the top, for the headline figure. No other dark areas (§3.8).
3. **Panels:** one topic per `.panel`, each starting with a `.ptitle` (§5.2). Inner cards use the tinted nested surface, never a panel in a panel.
4. **Actions:** **one** primary button per panel (§5.4); the rest secondary. Destructive actions use Danger and are confirmed (§5.11).
5. **Colour:** only tokens (§4.1–§4.1b). Status comes from the status set (§4.1b) and is always paired with a word, icon or sign.
6. **Numbers:** formatted with the shared helpers (§4.11), tabular, right-aligned, never wrapping.
7. **Forms:** visible labels, placeholders only as examples, errors inline next to the field (§5.5).
8. **States:** hover, focus, disabled, pending and error states defined for every control (§4.13).
9. **Accessibility:** WCAG 2.1 AA (§4.10). Reachable and operable by keyboard, 24px minimum targets, reduced motion respected.
10. **Width:** check at 1440×900 (the pitch screen) and at 1280px (§4.12).
11. **Record it:** new component or token → this guide, same PR, changelog line, screenshot.

---

## 3. Design principles

These are inferred from how the demo is built. They were checked against the running demo in Phase 0 and are part of v1.0.

1. **Calm, light, trustworthy, anchored in navy.** The page is a light, cool-grey canvas with white cards. One blue carries all emphasis, and deep navy is used for the single headline surface (the hero) and the wordmark. Colour is reserved for meaning (status, category), not decoration.
2. **Numbers first.** Figures use tabular numerals, heavy weights and tight letter-spacing. Labels are small, uppercase and muted so the value dominates.
3. **Soft structure.** Hairline blue-tinted borders, 12px rounded cards, very low shadows at rest, gentle lift on hover.
4. **Rounded controls.** Buttons, chips and toggles are pill-shaped (fully rounded).
5. **Progressive disclosure.** Dense sections (especially Simulation) collapse behind clickable section titles.
6. **Motion is feedback, never a gate.** Short transitions (≤ 0.3s for UI, longer only for ambient effects) and everything is disabled under `prefers-reduced-motion`.
7. **Performance is part of the design.** The demo avoids `backdrop-filter` and caps entrance animations on purpose (see comments at the Hero and topbar rules). New work must respect the same budget.
8. **One light theme.** The whole theme is a light canvas with white panels, plus at most one navy feature surface per page (§5.13) and the launch splash before the app (§5.21). There is no dark mode (Q5), and a page must not add another dark region.

---

## 4. Foundations (design tokens)

### 4.1 Colour — core tokens

Defined in the single `:root` block, `wealth-analyzer.html:28-39`.

| Current name | Value | Role | Proposed semantic name |
|---|---|---|---|
| `--bg` | `#f4f6fb` | Page canvas | `--color-bg-canvas` |
| `--bg2` | `#ffffff` | Card / surface | `--color-bg-surface` |
| `--bg3` | `#eef1f8` | Subtle fill (chips, inner tiles, table header) | `--color-bg-subtle` |
| `--bg4` | `#e2e8f2` | Muted fill (tracks, progress background) | `--color-bg-muted` |
| `--text` | `#16213e` | Primary text, values | `--color-text` |
| `--text2` | `#374151` | Secondary text, labels | `--color-text-secondary` |
| `--text3` | `#9ca3af` | Muted text, captions, uppercase labels | `--color-text-muted` ⚠ contrast, see G-07 |
| `--border` | `rgba(0,87,184,.10)` | Default hairline | `--color-border` |
| `--border2` | `rgba(0,87,184,.22)` | Emphasised border | `--color-border-strong` |
| `--gold` ⚠ | `#0057b8` | **Primary brand colour (blue)** | `--color-primary` |
| `--gold2` ⚠ | `#0069d9` | Primary hover / lighter primary | `--color-primary-hover` |
| `--green` | `#00875a` | Positive / success | `--color-success` |
| `--red` | `#e31837` | Negative / error | `--color-error` |
| `--amber` | `#f59e0b` | Warning | `--color-warning` ⚠ contrast, see G-07 |
| `--blue` | `#5ab8f5` | Informational / secondary accent | `--color-info` |

⚠ `--gold` and `--gold2` hold blue values. The name is left over from an earlier dark/gold theme. The brand colour is blue/navy, and gold is not part of the theme. **Until Phase 3, read `--gold` as "primary".**

**Where the semantic names are live.** Since Phase 2 the admin console's `:root` (`admin.html`) uses the proposed semantic names from §4.1–§4.9 with the demo's values; it is the reference for the target token block. The demo keeps its current names until Phase 3. The admin block also defines a few tokens not listed in the tables above, each for a value the demo already uses: `--color-on-primary` (`#ffffff`), `--color-bg-bar` (topbar, §4.2), `--color-primary-on-inverse-end` (§4.1a), three effect colours (§4.2) and `--shadow-primary-hover`, `--shadow-bar`, `--shadow-inverse` (§4.7).

### 4.1a Colour — navy / inverse palette (the theme's dark side)

The deep navy is the second pillar of the brand, next to the primary blue. Today it exists only as literals in the hero, the wordmark and the insight card. It becomes a first-class token group in Phase 3 (P3-15).

| Value (today, literal) | Where | Role | Proposed semantic name |
|---|---|---|---|
| `#061735` | Hero gradient start (`.wealth-hero`, `:824`), its only use in the repo | Deepest navy, inverse surface | `--color-bg-inverse` |
| `#0a2a5e` | Hero gradient middle | Inverse surface, mid | `--color-bg-inverse-mid` |
| `#0d3f8a` | Hero gradient end | Inverse surface, light end | `--color-bg-inverse-end` |
| `#06173a` | Wordmark gradient start (`.logo`, `:915`), its only use in the repo | Navy for the application name | `--color-brand-ink`, **kept separate** from `--color-bg-inverse` (Q11) |
| `#003d82` / `#003d8f` | Insight card, primary button gradient | Deep primary | `--color-primary-deep` |
| `#ffffff` | Hero values | Text on inverse | `--color-text-on-inverse` |
| `rgba(213,225,245,.60–.74)` | Hero labels, captions | Muted text on inverse | `--color-text-on-inverse-muted` |
| `#bcd8ff`, `#9cc4ff`, `#8fbaff` | Hero title gradient, icons, chips | Primary accent on inverse | `--color-primary-on-inverse` (admin console: `#bcd8ff`; the title gradient's end `#8fbaff` is `--color-primary-on-inverse-end`) |
| `rgba(255,255,255,.07–.15)` | Glass tiles, secondary button on navy | Glass fill | `--color-glass-fill` |
| `rgba(255,255,255,.15–.30)` | Glass tile borders | Glass border | `--color-glass-border` |
| `rgba(77,166,255,.28–.38)` | Aurora glow, net-worth glow | Blue glow | `--color-glow-primary` |
| `rgba(212,175,95,.16)`, `rgba(255,205,100,.38)` | Aurora second glow, "simulation complete" flash, onboarding-complete ring | Warm highlight | **Kept** (Q10) as `--color-highlight-warm`. Never named "gold" |

Where the value column shows a range (for example `.60–.74`), that is what the demo uses today. The single token value is **not decided** and is set in P3-15.

The primary blue (`#0057b8`) and the navy family (`#061735 → #0d3f8a`) are one hue family at different depths. Treat them as one brand ramp, not as two brand colours.

### 4.1b Colour — status set (success, warning, error, info)

The theme defines four status colours. Each has the same five roles, so any component (badge, tile accent, banner, button, table cell, chart band) picks from one table. Today the demo has only the base colours as tokens; the other roles are scattered literals or missing (G-20).

| Role | Success | Warning | Error | Info | Used for |
|---|---|---|---|---|---|
| **Base** (`--color-{status}`) | `#00875a` | `#f59e0b` | `#e31837` | `#5ab8f5` | Fills, bars, left accents, icons, chart series |
| **On base** (`--color-on-{status}`) | `#ffffff` | `#16213e` (dark text; white on amber fails at 2.15:1) | `#ffffff` | `#16213e` | Text/icon on a solid status fill (e.g. danger button, toast) |
| **Text** (`--color-{status}-text`) | `#1b6841` (6.8:1) | `#a8612b` today (4.8:1 on white, **4.4:1 on canvas**, proposed `#b45309` at 4.6:1, confirm in P3-07) | `#a83232` (6.6:1) | none today, proposed `#0369a1` (5.9:1) | Status text on light surfaces |
| **Tint** (`--color-{status}-tint`) | `rgba(0,135,90,.12)` | `rgba(245,158,11,.13)` | `rgba(227,24,55,.10)` | `rgba(90,184,245,.14)` | Badge and banner backgrounds, highlighted rows |
| **Border** (`--color-{status}-border`) | `rgba(0,135,90,.30)` | `rgba(245,158,11,.35)` | `rgba(227,24,55,.30)` | `rgba(90,184,245,.35)` | Badge and banner borders |

Tint and border values are derived from the base colour (base at 10–14% / 30–35% opacity). They replace the old-palette tints listed in G-03 (`rgba(76,175,125,…)`, `rgba(212,149,106,…)`, `rgba(224,92,92,…)`).

**Rules:**
- Use the **text** role, never the base, for status-coloured text on light surfaces. Warning and info bases fail contrast as text (G-07).
- **Error** means "failed / destructive / negative". **Warning** means "needs attention, not failed". Don't use error red for warnings or amber for errors.
- Status is never shown by colour alone: pair it with a label, an icon or a sign (+/−).
- Naming: the token is `error`. The destructive button variant is called `danger` (a component name) and uses the error tokens.

### 4.2 Colour — recurring literals (not yet tokens)

These values show up many times as raw literals. They are part of the look and should become tokens in Phase 3 (G-04). Deep primary (`#003d82` / `#003d8f`) is in §4.1a and the text-safe status colours are in §4.1b; they are not repeated here.

| Proposed token | Proposed value | Observed today | Where |
|---|---|---|---|
| `--color-primary-tint-1` | `rgba(0,87,184,.06)` | `.02`–`.06` | Hover fill on nav items, rows, secondary buttons |
| `--color-primary-tint-2` | `rgba(0,87,184,.08)` | `.07`–`.09` | Active / selected fill (active nav, active band button, chips) |
| `--color-border-subtle` | `rgba(0,87,184,.08)` | `.08` | Card border (`.panel`, `.mc`, `.asset-item`) |
| `--color-border-input` | `rgba(0,87,184,.14)`, 1.5px | `.14` | Input border. ⚠ 1.25:1, below the 3:1 floor for control boundaries (§4.10, G-31) |
| `--shadow-focus` | `0 0 0 4px rgba(0,105,217,.10)` | the only live value | Input focus halo |
| `--color-bg-surface-tinted` | `#f8faff` | `#f8faff` | Nested card fill (`.client-card`, `.asset-item`, `.loan-item`) |
| `--color-primary-light` | `#4da6ff` | `#4da6ff` | Gradient end / light brand blue, favicon |
| `--color-success-bright` | `#39d98a` | `#39d98a` | "Has data" dot, onboarding progress. Kept as a **second success colour** (Q6) |
| `--color-bg-bar` | `rgba(255,255,255,.96)` | `.96` | Topbar fill (near-opaque instead of a blur) |
| `--color-glow-canvas` | `rgba(0,105,217,.05)` | `.05` | Radial glow at the top right of `.main` |
| `--color-hairline-primary` | `rgba(0,105,217,.45)` | `.45` | Gradient hairline on panel hover |
| `--color-sheen` | `rgba(255,255,255,.38)` | `.38` | Primary button sheen |
| `--color-selection` / `--color-focus-ring` | `rgba(0,105,217,.20)` / `.55` | as listed | Text selection, focus outline (§4.10) |
| `--color-overlay` | **not decided** | `.34` (drawer), `.42` (modal) of `rgba(8,20,45,…)` | Modal / drawer overlay: one value or two |

### 4.3 Colour — data visualisation palettes

Defined in JS, not CSS: `CLASS_COLORS` at `wealth-analyzer.html:6006`, `TYPE_COLORS` below it, `REGION_COLORS` at `:6039`. Each palette sticks to **one hue family**, so the three allocation pies drawn side by side (§5.17) stay distinct. 📷 [5.17-allocation-pies](style-guide-assets/5.17-allocation-pies.png)

| Palette | Hue family | Values |
|---|---|---|
| `CLASS_COLORS` (asset class) | Blues / teals / indigos | equity `#0057b8`, fixed income `#14b8a6`, real estate `#0ea5e9`, commodity `#6366f1`, cash `#67e8f9`, mixed `#1e3a8a`, alternative `#8b5cf6`, private equity `#312e81`, hedge fund `#0e7490`, structured `#38bdf8`, crypto `#3b82f6`, other `#94a3b8` |
| `TYPE_COLORS` (instrument type) | Oranges / reds | ETF `#f97316`, mutual fund `#ea580c`, stock `#ef4444`, bond `#f59e0b`, structured `#e11d48`, alternative `#9f1239`, hedge fund `#c2410c`, private equity `#7c2d12`, precious metals `#d4af37`, SMA `#b45309`, futures `#7f1d1d`, cash `#fde68a`, other `#94a3b8` |
| `REGION_COLORS` (region) | Greens | US `#15803d`, developed intl `#22c55e`, emerging `#84cc16`, global `#10b981`, UK `#4d7c0f`, Europe `#34d399`, Asia `#a3e635`, other `#94a3b8` |
| `RISK_PROFILES[*].color` (`:5214`) | Mixed, old palette | very conservative `#7cb6e8`, conservative `#5b9bd5`, moderately conservative `#4caf7d`, moderate `#4caf7d`, moderately aggressive `#1e40af`, aggressive `#d4956a`, very aggressive `#e31837` ⚠ not an ordered scale, and two levels share one colour (G-27) |
| `HORIZON_PROFILES[*].color` (`:5216`) | Mixed, old palette | 1–5 years `#5b9bd5`, 5–10 `#4caf7d`, 10–15 `#1e40af`, 15+ `#d4956a` |

`TYPE_COLORS.precious` (`#d4af37`) is named for the metal, not the brand; it is a data category and stays. The `:6004` comment still calls the region palette "GREEN/PURPLE/PINK"; the values are greens only.

**Rules:**
- A chart that compares categories uses one family. Don't mix families within one chart.
- Fallback / "other" is always slate `#94a3b8`.
- A category keeps its colour everywhere it appears (pie, legend, table dot, tag).

**Series conventions for projection charts.** The wealth projection (`:18208`) is the only live chart with fixed series colours:

| Series | Colour | Token (proposed) |
|---|---|---|
| 80% likelihood (conservative) | `#1b6841` | `--color-success-text` |
| 50% likelihood (expected) | `#0057b8` | `--color-primary` |
| 30% likelihood (optimistic) | `#7c3aed` | **not decided** (Phase 3): purple is not part of the theme (Q12, Q19), so this series gets a new colour when P3-01 removes it |
| Band between 80% and 30% | primary at ~6% opacity | `--color-primary-tint-1` |
| Retirement marker | dashed line `rgba(15,23,42,.35)`, 4/3 dash, label 10px | `--color-text-muted` |

The PDF report (`:21523`) reuses the same three colours. An older `redrawChart()` scenario bar chart uses the opposite mapping (green = optimistic) but no longer renders, because its canvas `#mcChart` was removed (G-22). **Rule:** green = the cautious / likely outcome, primary = expected, the third colour = the upside.

### 4.4 Typography

- **Family:** Plus Jakarta Sans, weights 200–800 loaded from Google Fonts (`wealth-analyzer.html:17`). Fallback stack: `-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif`.
- `--fd` (display) and `--fb` (body) are **identical**. There is no separate display face in the demo. Proposed: one `--font-sans` (see G-05).
- **Monospace:** `--fm` = `Consolas, 'Courier New', monospace`. Proposed: `--font-mono`.
  - Consolas is **not loaded as a web font**. It ships only with Windows and Office, so on macOS and Linux the demo falls back to Courier New or the system monospace. Monospace text therefore looks different depending on the presenting machine.
  - It is used in few places, all for identifiers and technical strings: the share-session URL box (`.share-url`), the feed JSON paste box (`#fdPaste`), the API-key inputs, and the ISIN / Valor / CUSIP / ticker / ticket-id cells in the order-review and proposal tables. All of these except `.share-url` are inline styles.
  - Two places bypass the token: `.pf-row .ptkr` uses `'DM Sans', monospace` (DM Sans is not loaded, so it renders as the system monospace), and one JS-generated table uses a bare `font-family: monospace` (G-21).
  - The admin console uses **JetBrains Mono**, loaded from Google Fonts (same result on every OS), for `.code`, `.log` and `.test-detail`.
  - **Decision (Q16):** keep both as they are. `--font-mono` is the token name on both surfaces, but its value differs: the Consolas stack in the demo, JetBrains Mono in the admin console. It is the one token allowed to differ between the two `:root` blocks.
- **Base:** `body` 14px / 1.6, weight 400, letter-spacing `-.005em`, antialiased.
- **Numbers:** always `font-variant-numeric: tabular-nums` for figures.

The demo uses 24 distinct font sizes. They cluster into this scale, which is the proposed target:

| Proposed token | Proposed size | Weight | Tracking (observed) | Observed today | Current examples |
|---|---|---|---|---|---|
| `--text-display` | 40px (30px ≤ 900px) | 800 | -.05em | 40px | `.wh-amount` (hero net worth) |
| `--text-h1` | 27px | 800 | -.045em | 27px (`.insight-card`'s 32px is never rendered) | `.wh-title` |
| `--text-kpi` | **not decided** | 700–800 | -.03em | 20 / 21 / 22 / 23px, one component each | `.tb-val` 20, `.mc-val` 21, `.rn-val` 22, `.ss-val` 23. Until decided, the admin console uses 23px (P2-06 follows the results strip) |
| `--text-h2` | 18px | 800 | -.02em | 17–18px | `.logo`, `.set-title` (18); `.share-title` (17) |
| `--text-body-lg` | 15px | 600–700 | -.02em | 14–15px | `.wh-stat-val` (15); `.c-name` (14) |
| `--text-body` | 13px | 400–600 | default | 13px | Nav items, inputs, buttons, goal rows |
| `--text-sm` | 12px | 400–600 | default | 12px, some 12.5px | Form labels, secondary buttons, tables |
| `--text-xs` | 11px | 400–600 | default | 11px, some 11.5px | Captions, chips, meta lines |
| `--text-label` | 10px | 600–700 | **uppercase, +.07 to +.10em** | 10px (37 rules), 10.5px (6) | `.ptitle`, `.mc-lbl`, `.ss-lbl`, table headers |
| `--text-micro` | 9px | 600–700 | uppercase, +.06 to +.10em | 9px (4), 9.5px (1) | `.nav-grp-label`, `.tax-pv-lbl` |

Snapping the observed sizes to the proposed ones is P3-06; each visible snap is listed in its PR. The tracking values stay as observed until P3-06 sets one per token.

**The uppercase label pattern** (10px, weight 700, `.10em` tracking, `--text3`) is the most recognisable piece of the demo's typography. Every section title, KPI label and table header uses it.

### 4.5 Spacing

There is no spacing token in the demo. Observed values sit on a rough 2px grid, mostly 4/6/8/10/12/14/16/18/22/24/28px. Proposed scale for Phase 3 (G-06):

| Token | Value | Typical use |
|---|---|---|
| `--space-1` | 4px | Icon gaps, tight meta |
| `--space-2` | 8px | Inline gaps, small padding |
| `--space-3` | 12px | Tile padding, grid gaps |
| `--space-4` | 16px | Card-to-card gap, section margin |
| `--space-5` | 24px | Panel horizontal padding, hero margin |
| `--space-6` | 32px | Main content padding |

Layout constants: topbar height **64px**, sidebar width **200px**, main padding **28px 32px** (16px on ≤ 900px), panel padding **22px 26px**, panel bottom margin **16px**.

### 4.6 Radius

| Current | Value | Use | Proposed |
|---|---|---|---|
| `--r` | 12px | Cards, panels, metric tiles, hero | `--radius-lg` |
| `--rs` | 8px | Inputs, nested items, table wraps | `--radius-md` |
| literal `10px` | 10px | Onboarding steps, confidence tiles, hero stats | **Not decided:** a `--radius-md-plus` token or fold into `--radius-lg` (P3-06) |
| literal `50px` / `20px` | pill | Buttons, chips, badges, toggles | `--radius-pill` (`999px`) |
| literal `50%` | circle | Avatars, icon buttons, dots | `--radius-full` |
| literal `14px` | 14px | Share modal | `--radius-xl` |

### 4.7 Elevation (shadows)

| Level | Value | Use | Proposed |
|---|---|---|---|
| Rest | `0 1px 4px rgba(0,0,0,.04)` | Panels, tiles at rest | `--shadow-sm` |
| Hover lift | `0 6px 18px rgba(0,87,184,.10)` + `translateY(-2px)` | Metric tiles, cards on hover | `--shadow-md` |
| Panel hover | `0 8px 26px rgba(10,40,100,.09)` | `.panel:hover` | `--shadow-md-soft` |
| Primary button | `0 4px 14px rgba(0,87,184,.30)` → hover `0 9px 24px …/.42` | `.btn-primary` | `--shadow-primary` → `--shadow-primary-hover` |
| Topbar | `0 2px 12px rgba(0,0,0,.05)` | `.topbar` | `--shadow-bar` |
| Feature surface | `0 22px 54px rgba(4,20,50,.38), 0 2px 8px rgba(4,20,50,.22)` | `.wealth-hero` | `--shadow-inverse` |
| Overlay | `0 24px 70px rgba(0,40,120,.25)` | Modal | `--shadow-xl` |
| Drawer | `-14px 0 44px rgba(0,40,120,.18)` | Settings drawer | `--shadow-drawer` |

Shadows are **blue-tinted**, not neutral grey. That tint is part of the brand.

### 4.8 Motion

| Token (proposed) | Proposed value | Use |
|---|---|---|
| `--duration-fast` | .15s (39 uses; also .12s, .16s) | Colour/border hover |
| `--duration-base` | **not decided**: .2s and .25s are equally common (8 each; also .18s, .22s) | Lifts, focus halos, dropdown open |
| `--duration-slow` | **not decided**: .3s–.5s today (drawer .32s, entrance .30s, progress .5s) | Panel entrance, drawer, progress fill |
| `--ease-out-soft` | `cubic-bezier(.2,.7,.3,1)` | Entrances, nav glide |
| `--ease-drawer` | `cubic-bezier(.3,.7,.2,1)` | Drawer and modal |

Named keyframes: `wowFadeUp` (entrance), `dropDown` (disclosure), `wowPop` (value changed), `wowFlash` (simulation finished), `wowSheen` (primary button hover), `wowAurora` (hero ambient).

These effects are **part of the theme**, not demo decoration. Each has a defined job:

| Effect | Job | Where it may be used |
|---|---|---|
| Panel entrance (`wowFadeUp`, staggered) | Signals a fresh view | Any tab/page switch |
| Button sheen (`wowSheen`) | Emphasises the primary action | `.btn-primary` only |
| Value pop (`wowPop`) | "This number changed" | KPI values after recalculation |
| Completion flash (`wowFlash`) | "Long task finished" | Headline KPIs after a simulation / heavy calculation |
| Aurora (`wowAurora`) | Ambient premium feel | Feature surface only (§5.13) |
| Cursor-tracking glow (`interactive-glow.js`) | Invites interaction on the headline area | Feature surface and its cards only |
| Hover lift | Shows a card or tile is interactive | Metric tiles, cards, secondary buttons |

**Rules:**
- Animate only `transform` and `opacity` (plus colour/shadow for hover).
- Staggered entrance applies to at most the first 8 panels in a tab.
- Everything is switched off under `@media (prefers-reduced-motion: reduce)`. The main block is at `wealth-analyzer.html:980`; eight smaller ones sit next to individual components, and the intro splash is not covered (G-29). New motion must be added to the main block.
- No `backdrop-filter`; imitate glass with semi-opaque fills.

### 4.9 Layering (z-index)

The main stylesheet uses 13 ad-hoc values; the whole file uses 18 (the extra `<style>` blocks and inline styles add 0, 60, 9200 and 9998). Proposed named layers (G-10):

| Layer | Current values | Proposed token |
|---|---|---|
| Content raise | 0, 1, 2 | `--z-raised` |
| Local popover inside a panel | 60 (`.rpt-ord-prev`) | **Not decided** (P3-10): its own layer, or folded into `--z-popover` |
| Sticky banner / topbar | 150, 200 | `--z-sticky` |
| Floating button | 800 | `--z-float` |
| Dropdown / popover | 1000, 1001 | `--z-popover` |
| Drawer + overlay | 9000, 9001, 9200 | `--z-drawer` |
| Modal + overlay | 9500, 9501 | `--z-modal` |
| Tooltip | 9998, 9999, 10000 | `--z-tooltip` |
| Intro screen | 100000 | `--z-splash` |

### 4.10 Accessibility standard

**Standard: WCAG 2.1 level AA** on every surface (demo, admin console, SaaS). The rules below make it concrete. ⚠ marks where the demo falls short today.

**Contrast**

| What | Floor | Today |
|---|---|---|
| Text, including the 9–11px uppercase labels and captions | **4.5:1** against its background. Small uppercase labels are not "large text"; the 3:1 exception needs ≥ 18px, or ≥ 14px bold | ⚠ `--text3` is 2.54:1 on white and is used for most labels, captions and placeholders (G-07) |
| Large text (≥ 18px, or ≥ 14px bold) | 3:1 | ✔ |
| Boundaries of controls (input, select, switch track, checkbox) | **3:1** against the adjacent colour, or another visible cue | ⚠ input border `rgba(0,87,184,.14)` is 1.25:1 (G-31) |
| Icons that carry meaning, focus rings, chart lines | 3:1 | ⚠ `.info-ic` "i" in `--text3` 2.54:1 (G-31) |
| Decorative hairlines (panel borders, dividers) | none | They mustn't be the only way to tell two things apart |

**Target size.** Pointer targets are at least **24×24px** (the WCAG 2.2 AA rule, adopted ahead of 2.2), or have 24px of clear space around them. ✔ `.icon-btn` 38px, `.set-close` 32px, `.ob-x` 26px. ⚠ `.info-ic` is 14px and `.btn-x` about 17px (G-32).

**Keyboard**
- Everything a mouse can do, the keyboard can do, in reading order, with a visible focus ring: `:focus-visible { outline: 2px solid rgba(0,105,217,.55); outline-offset: 2px }` (`:899`). Inputs add the `--shadow-focus` halo.
- Collapsible sections ✔: `enhanceCollapsibles()` gives each `.section-dropdown` `role="button"`, `tabindex="0"`, `aria-expanded`, `aria-controls` and Enter/Space.
- ⚠ **Sidebar navigation is not keyboard reachable**: `.nav-item` is a `<div onclick>` with no `tabindex` or role (G-33). Standard: nav items are buttons or links, Enter/Space activates, the active one has `aria-current="page"`.
- Icon-only buttons have an `aria-label` (✔ `.icon-btn`, `.set-close`).

**Dialogs, drawers and modals.** Standard for every overlay (§5.10):
- `role="dialog"`, `aria-modal="true"` and an `aria-label` or `aria-labelledby` (✔ role and label today; ⚠ no `aria-modal`).
- On open, focus moves into the dialog (to the first field, or the close button). On close, focus returns to the control that opened it (⚠ not done, G-33).
- **Escape closes** (⚠ only the Settings drawer does, G-33). Clicking the overlay closes too (✔).
- The page behind is inert (`inert` on `.app-shell`) and doesn't scroll (⚠ not done, G-33).
- `aria-hidden` is toggled with visibility (✔ drawer and modals).

**Motion.** Everything in §4.8 is switched off under `prefers-reduced-motion: reduce`. ⚠ The intro splash is not (G-29).

**Colour is never the only signal.** Status always comes with a word, an icon or a sign (+ / −). Red and green are both mid-luminance and look alike to colour-blind readers, so a gain/loss figure always shows its sign.

**Charts** are `<canvas role="img">` with an `aria-label` that states what the chart shows (✔ `simWealthChart`). A chart's key figures also appear as text or in a table nearby.

### 4.11 Number formatting

All figures go through the shared helpers (`fmtMoney` at `wealth-analyzer.html:6945`); don't format money inline.

| Helper | Output | Use |
|---|---|---|
| `fmtMoney(n)` | Compact: `CHF 328k` (≥ 1,000, no decimals), `CHF 2.05M` (≥ 1M, 2 decimals), `CHF 1.20B` (≥ 1B, 2 decimals); below 1,000 the whole number | Tiles, tables, charts, running text |
| `fmtMoneyFull(n)` | Whole units with thousands separators: `CHF 328,450` | Inputs, confirmations, and anything a person books or signs off (order tickets) |
| `fmtPct(n, d)` | One decimal by default: `31.8%` | Rates, weights, probabilities |

- **Currency** is a prefix from `CURRENCIES[code].sym`. Codes keep a space (`CHF 328k`); symbols attach (`$328k`, `€328k`, `£328k`). The currency is the household's, set in the topbar picker; amounts are never shown without it.
- **Negative:** the sign goes before the currency, `-CHF 5k`. Today it is a hyphen-minus; switching to the typographic minus (U+2212) is **not decided** (G-34).
- **Changes** (deltas, gaps, "ahead of target") carry an explicit `+` or `−`. Balances and totals don't.
- **Missing** values show an em dash `—`, never `0` or `NaN`.
- **Thousands separator:** ⚠ `toLocaleString()` uses the viewer's browser locale, so the same figure prints `328,450` on one machine and `328’450` on another (G-34). Standard: one separator per household, not per viewer; which one is **not decided**.
- **Display:** tabular numerals (`font-variant-numeric: tabular-nums`), right-aligned in tables and lists, never wrapping (§5.8, G-25).
- **Colour:** gains/losses may use the success/error **text** colours (§4.1b), but only with the sign (§4.10).

### 4.12 Breakpoints and supported widths

The demo is a **desktop** application, presented at **1440×900**. The design is checked at 1440px and 1280px. Narrower layouts are out of scope (Q7).

| Width | What changes | Scope |
|---|---|---|
| ≤ 1500px | Portfolio add-row and position rows reflow to 5 columns | `.pf-add`, `.pf-row` |
| ≤ 1200px | Same, 3 columns | `.pf-add`, `.pf-row` |
| ≤ 1100px | Allocation pies go from 3 to 2 per row | `.alloc-pies` |
| **≤ 900px** | **Sidebar hidden, main padding 16px**, hero display size 30px, several grids stack | **App-level**: the only breakpoint that changes the shell |
| ≤ 760px | Allocation pies 1 per row | `.alloc-pies` |
| ≤ 700px | Portfolio rows 1 column | `.pf-add`, `.pf-row` |
| ≤ 680px | Intro splash steps stack | `#introScreen` |

⚠ **Below 900px the sidebar disappears and nothing replaces it**, so there is no way to change tab (G-12). This is not a responsive design and must not be treated as one. The other breakpoints are local to one component. New components should reuse **900px** and not add new widths.

### 4.13 Interaction states

Every interactive element defines these states. "Today" is the demo; "Standard" is the rule for new work.

| State | Standard | Today |
|---|---|---|
| Rest | As specified per component | ✔ |
| Hover | Border or fill moves toward primary; cards and tiles lift 2px (§4.8) | ✔ on buttons, inputs, cards, tiles, nav |
| Focus (keyboard) | The global focus ring; inputs also get the `--shadow-focus` halo | ✔ ring and halo; ⚠ nav items can't take focus (G-33) |
| Pressed | Buttons scale to .97 while pressed | ✔ `.btn-primary` only; other buttons **not decided** |
| Selected / active | Primary tint fill (`--color-primary-tint-2`) plus primary border or text; for tabs, solid primary (§5.19) | ✔ nav, band buttons, pill tabs |
| Disabled | The native `disabled` attribute; opacity .5, `cursor: not-allowed`, no hover lift, still readable; explain nearby why it's disabled | ⚠ inline styles only, opacity .45–.6, no shared class (G-35) |
| Pending | The control is disabled and its label says what is happening, ending in an ellipsis: "Sending…", "Running…". It returns to rest or moves to a result state | ✔ order send ("Sending…") |
| Error | Error text colour and border on the field, a message next to it (§5.5); for an operation, an error result (§5.11) | ⚠ validation uses `alert()` (G-35) |

### 4.14 Content and voice

- **Button labels start with a verb** and name the object when it isn't obvious: "Run Simulation", "Save profile", "Retry this ticket", "Add alternative". ✔ Most labels do this.
- **Case:** sentence case for buttons, labels, titles and messages ("Save profile", "Run drawdown analysis"). Product and feature names keep their capitals ("Wealth Analyzer", "Investment Proposal"). ⚠ Some buttons are title case ("Run Simulation", "Upload Document"); they move to sentence case in Phase 3 (G-36).
- **Uppercase** comes only from the label style (§4.4) via CSS. Never type text in capitals.
- **Errors say what happened and what to do**, in plain words, without blame: "Could not confirm — check the PM system" (order result). Validation messages name the field and the fix: "Enter an amount greater than 0".
- **Confirmations name the object and the consequence:** "Delete "Growth portfolio" and its holdings? This cannot be undone." The confirm button repeats the verb ("Delete"), never "OK".
- **Empty states invite** ("Add your first account"), not dead ends (§5.11).
- **Numbers in text** use §4.11.


---

## 5. Components

Each entry lists purpose, anatomy (current classes), key tokens, states, usage rules and the target in the admin console and the SaaS. "SaaS target" names the `components/ui` primitive to build or extend in Phase 4.

### 5.1 App shell

📷 [tab-household](style-guide-assets/tab-household.png) · [5.1-topbar](style-guide-assets/5.1-topbar.png) · [5.1-sidebar](style-guide-assets/5.1-sidebar.png)

- **Anatomy:** `.app-shell` → `.topbar` (64px, sticky, white 96% opacity, hairline bottom border) + `.body` → `.sidebar` (200px white rail) + `.main` (scrolling canvas with a faint top-right radial blue glow).
- **Topbar:** gradient wordmark `.logo` (navy → primary), currency picker `.ccy-picker` (pill), round `.icon-btn` (gear rotates 35° on hover).
- **Sidebar:** `.nav-grp-label` (micro uppercase), `.nav-item` (13px, 3px left border). Active state = primary text + primary left border + left-to-right tint gradient. Hover = 2px slide right. `.nav-dot` turns green when the section holds data.
- **Wordmark and favicon:** `favicon.svg` (added in `522b06f`) is a 64×64 rounded square (radius 14) with a `#0057b8 → #4da6ff` gradient (`--color-primary` → `--color-primary-light`) and a white "W". It uses Arial because an SVG favicon can't load web fonts; that is accepted.
- **"NEW" badge on a nav item** (`.nav-new`): 8px pill, white text, purple→primary gradient (`#7c3aed` → `--color-primary` / demo `--gold`). Shared by the demo and the admin console. ⚠ Purple is still not a theme token (Q19); Phase 3 (P3-01) may retint this without changing the class.
- **Responsive:** at ≤ 900px the sidebar is hidden and main padding drops to 16px. *(Gap: there is no mobile nav replacement, G-12; see §4.12.)*
- **Rail overflow:** the sidebar sets `overflow-x: hidden`, because the 2px hover slide would otherwise open a horizontal scrollbar and make the rail flicker (G-37).
- **States (nav item):** rest (`--text2`), hover (tint + 2px slide right), active (primary text, primary left border, tint gradient; standard: `aria-current="page"`), has-data (green `.nav-dot`), focus (⚠ not focusable today, G-33). **Topbar:** the currency picker and icon buttons follow §4.13; the status text slot (`#topbarStatus`, set by `toastTopbar()`) shows a message for 3.5s.
- **Admin (Phase 2, done):** `.topbar`, gradient `.logo` with the red "ADMIN" badge kept as the admin identifier, `.sidebar` with `.grp` (= `.nav-grp-label`) and `.nav` (= `.nav-item`: hover glide, active gradient), ambient glow on `.main`. One deliberate difference: the admin rail is **220px** (`--sidebar-w`), because its longer labels with a NEW badge wrap at 200px. 📷 [admin-dashboard](style-guide-assets/admin-dashboard.png)
- **SaaS:** `components/nav/sidebar.tsx`, align active/hover states.

### 5.2 Panel (card) and section title

📷 [5.2-panel](style-guide-assets/5.2-panel.png)

- **Anatomy:** `.panel` = white, 1px `rgba(0,87,184,.08)` border, `--r`, padding 22×26, `--shadow-sm`.
- **Hover:** deeper shadow, 2px gradient hairline across the top (`::after`), 3px left border tint.
- **Section title `.ptitle`:** uppercase label (§4.4) + 14×3px gradient marker before it + hairline rule filling the rest of the row.
- **Rules:** a panel holds one topic. Always start with a `.ptitle`. Don't nest panels; use `.client-card`/`.asset-item` (tinted `#f8faff` surface) for inner cards.
- **Admin (Phase 2, done):** `.panel` and the other card-like elements (`.ablock`, `.rp-card`, `.test-card`) share this recipe: radius, border, shadow and hover. `.panel` and `.ablock` also get the hover hairline. `.test-card` keeps its status left border (success / error).
- **SaaS target:** `components/ui/card.tsx` (`Card`, `CardHeader` → section-title variant).

### 5.3 Collapsible sections

📷 [5.3-section-dropdown-open](style-guide-assets/5.3-section-dropdown-open.png) · [5.3-sim-group](style-guide-assets/5.3-sim-group.png) · [5.3-sim-toolbar](style-guide-assets/5.3-sim-toolbar.png)

Two patterns, don't mix within one panel:

| Pattern | Classes | When |
|---|---|---|
| **Section dropdown** | `.ptitle.section-dropdown` + `.dropdown-body` | Whole panel collapses; used heavily in Simulation. ▶ chevron rotates 90°, opens with `dropDown` animation, title turns primary when open. |
| **Inline toggle** | `.coll-toggle` + `.coll-body` | Small optional sub-section inside a panel (e.g. "▶ Address"). |

- **Group divider:** `.sim-group` is a primary-coloured uppercase label with a short bar before it and a rule after it. It separates groups of panels.
- **Toolbar:** `.sim-toolbar` holds Expand all / Collapse all pill buttons.
- **SaaS target:** new `Collapsible` / `Accordion` primitive.

### 5.4 Buttons

📷 [5.4-btn-primary-full](style-guide-assets/5.4-btn-primary-full.png)

| Variant | Class | Look | Use |
|---|---|---|---|
| Primary | `.btn-primary` | Pill, gradient `#0069d9 → #003d8f`, white text, blue shadow, light sheen sweeps across on hover, lifts 1px, presses to 0.97 | One main action per view |
| Primary full-width | `.btn-primary.full` | Same, 100% width, 14px | Form submit, Run Simulation |
| Secondary | `.btn-secondary` | Pill, transparent, 1.5px `rgba(0,87,184,.25)` border, primary text; hover tint + lift | Secondary actions |
| Add | `.btn-add` | Pill, **dashed** border, muted text; hover goes primary | "Add item" in lists |
| Remove | `.btn-x` | Bare ×, muted; hover red | Delete a row |
| Icon | `.icon-btn` | 38px circle, subtle fill, primary icon | Topbar utilities |
| Segmented / choice | `.band-btn` (+`.active`) | Small pill, subtle fill; active = primary tint + primary border | Mutually exclusive presets |
| Toolbar | `.sim-toolbar button` | Small pill, subtle fill | Low-emphasis utilities |
| Close | `.set-close`, `.ob-x` | 26–32px circle, subtle fill, hairline border; hover turns **error red** with white × | Dismiss a drawer, modal or card |
| Copy / inline action | `.share-copy` | Rectangular (`--radius-md`, not pill), primary fill, white text; `.ok` turns success green after copying | An action attached to an input |
| Danger | `.btn-danger` (admin console today; to be added to the demo in Phase 3) | Pill, **resting** `--color-error` fill, `--color-on-error` text; hover darkens, same lift as primary; no sheen | Destructive actions: delete, revoke, reset |

- **Sizes:** primary 10×24 / 13px, secondary 8×18 / 12px, small 5×14 / 11px.
- **Rules:** one primary button per panel. Destructive actions use the Danger variant (red at rest, Q15). A danger button is never the only button in a view and should sit apart from the primary action. Row-level removal in dense lists still uses the quiet `.btn-x`.
- ⚠ `.btn-primary` is defined twice (`:204` flat, `:864` gradient override). The effective look is the gradient (G-08).
- **Disabled:** opacity .5, `cursor: not-allowed`, no lift, sheen or shadow (§4.13). In the admin console this is a shared rule for every variant.
- **Admin (Phase 2, done):** `.btn` = primary (gradient, sheen, press), `.btn-ghost` = secondary, `.btn-link` / `.rp-mini` = small secondary, `.btn-danger` = Danger. The purple `.btn-purple` is gone; AI actions use `.btn`. No inline background overrides on buttons. **SaaS:** `button.tsx` currently uses `rounded-lg` and flat fill, so it needs pill radius, gradient primary, and `secondary`/`add`/`icon`/`segmented` variants.

### 5.5 Form controls

📷 [5.5-form-row](style-guide-assets/5.5-form-row.png) · [5.5-set-switch](style-guide-assets/5.5-set-switch.png)

- **Inputs/selects/textareas:** white, 1.5px `rgba(0,87,184,.14)` border, `--rs`, 13px weight 500, padding 7×10. Hover darkens the border. Focus = primary border + 4px soft halo + `#fbfdff` fill.
- **Row layout:** `.frow` (label left, control right, wraps) with `.flbl` (12px, `--text2`, min 130px).
- **Width helpers:** `.fw`, `.w120`–`.w200`, `.dual`.
- **Toggle switch:** `.set-switch`, 44×24 pill track, 18px white knob, primary when on.
- **Grids:** `.ag2` / `.ag3` for address-style multi-field rows.
- **Stacked field** (`.fld` in the portfolio and proposal add-rows): label above the control, 10px uppercase muted label (the §4.4 label pattern at weight 600).
- **Currency picker** (`.ccy-picker`): a pill on `--bg3` with a micro uppercase label, the currency symbol in primary 15px bold, and a borderless select; hover turns the border primary.
- **Settings row** (`.set-row`): label + small muted help text on the left, control on the right; used in the drawer (§5.10).
- **Helper text** (`.rnote`, `.albl`): 11px muted text under the control. ⚠ `--text3` fails contrast (G-07).

**States**

| State | Standard | Today |
|---|---|---|
| Rest | White, `--color-border-input` border | ✔ ⚠ border below 3:1 (G-31) |
| Hover | Border darkens | ✔ |
| Focus | Primary border, `--shadow-focus` halo, `#fbfdff` fill | ✔ |
| Filled | Value in `--text`, weight 500 | ✔ |
| Placeholder | Example format only, in a colour that passes 4.5:1 | ⚠ `--text3` (2.54:1), and many placeholders repeat the label or say "0": `First`, `Last`, `City`, `0` ×24 (G-35) |
| Invalid | `--color-error` border, `aria-invalid="true"`, message below in `--color-error-text` linked with `aria-describedby`, starting with what to fix | ⚠ none: validation shows a browser `alert()` after submit (23 places, e.g. "Enter goal name and amount", G-35) |
| Disabled | §4.13 | ⚠ inline opacity (G-35) |
| Read-only (shared session) | Visible value, no border change, not focusable as an input | Handled by the shared-session banner (§5.10) |

**Rules**
- Every control has a **visible label** (`.flbl` or a stacked label). A placeholder is never the label.
- Placeholders show an example of the expected format ("e.g. 8000", "IE00B4L5Y983"), not the field name and not a default value.
- Validate when the user leaves the field or submits; show the message **next to the field**, keep what they typed, and move focus to the first invalid field. Don't use `alert()` for validation.
- Required fields: **not decided** (G-35). The demo marks neither required nor optional fields today.
- Units and currency sit in the label or as a suffix, not inside the value.
- **SaaS target:** `input.tsx`, `select.tsx`, `label.tsx`, plus a new `Switch` and a `FieldError`.

### 5.6 Metric tiles (KPI)

📷 [5.6-ss-card](style-guide-assets/5.6-ss-card.png) · [5.6-mc](style-guide-assets/5.6-mc.png) · [5.6-pf-mc](style-guide-assets/5.6-pf-mc.png) · [5.13-wealth-hero](style-guide-assets/5.13-wealth-hero.png)

The demo has **eight** near-identical tile components (G-09). Common spec: uppercase label → large tabular value → optional muted sub-line; subtle surface, `--r`, lift + `--shadow-md` on hover.

| Class | Where | Distinguishing feature |
|---|---|---|
| `.mc` | RMD/Roth/Estate/Goal-funding results | Value colour modifiers `.pos` / `.neg` / `.gold` (⚠ renders blue; becomes `.primary` in P3-01) |
| `.ss-card` | Simulation results strip | 3px left border in status colour: `.good` / `.warn` / `.bad` |
| `.rn-card` | Retirement needs | Subtle fill, `.rn-gap-pos/neg` |
| `.tax-box` | Tax panel | Centred |
| `.conf-tile` | Achievable-lifestyle tiles | Top border colour set inline |
| `.wh-stat` | Hero KPI grid | Icon chip on the left, glass look inside the hero |
| `.pf-mc` | Portfolio summary | `--bg3` fill, `--radius-md`, value 18px; hover turns the fill white |
| `.wi-stat` | What-if scenario results | White tile inside a `--bg3` card, value 15px, `.pos`/`.neg`/`.gold` modifiers like `.mc` |

**Admin (Phase 2, done):** `.kpi` follows the `.ss-card` recipe: primary left accent by default, `tone-green` / `tone-amber` / `tone-red` map to success / warning / error (`tone-blue` = primary), value 23px weight 800, lift and `--shadow-md` on hover.

**Proposed consolidation (Phase 2 for the admin console, Phase 3 for the demo, Phase 4 for the SaaS):** one `MetricTile` with `tone` (neutral/success/warning/error/primary), `accent` (none/left/top), `align` (start/center) and optional `icon`.

- **Insight card** (`.insight-card`): ⚠ styled in the stylesheet but **not rendered on any screen** (G-22), so it can't be checked visually. A full primary gradient (`#0057b8 → #003d82`) card with white text, for a single headline figure. Use sparingly, at most one row per view.

### 5.7 Badges, tags and chips

📷 [5.7-risk-badge](style-guide-assets/5.7-risk-badge.png) · [5.7-goal-tags](style-guide-assets/5.7-goal-tags.png) · [5.7-fund-tag](style-guide-assets/5.7-fund-tag.png) · [5.7-alloc-status](style-guide-assets/5.7-alloc-status.png) · [5.7-asset-item](style-guide-assets/5.7-asset-item.png)

All pills (`border-radius` 20px/50px), 10–11px, weight 500–600, with the same recipe: **~15% tint background + full-colour text + ~25–30% tint border**.

| Class | Use |
|---|---|
| `.rbadge` | Risk / horizon profile (colours from `RISK_PROFILES`/`HORIZON_PROFILES`) |
| `.abadge`, `.lbadge` | Asset / loan type |
| `.gtag` + `.tg` / `.ta` / `.tr` / `.tcat` | Goal status: good / at-risk / red / category. ⚠ `.tg`/`.ta`/`.tr` are never rendered (G-22); `.tcat` is rendered but its colours are set inline per category |
| `.ttier-essential/-important/-aspirational/-legacy` | Goal priority tier (uses darker text-safe colours) |
| `.fund-tag.fund-ok/-warn/-bad` | Funding status (uppercase) |
| `.wh-risk-chip`, `.ob-count` | Informational chips |
| `.tt-etf/-mutual_fund/-stock/-bond/-structured/-alternative`, `.pf-tag`, `.pv-tag` | Instrument type on portfolio and proposal rows. ⚠ Old-palette tints with their own text colours (`#1d4e8f`, `#8a5a2b`, `#5b4791`…), **not** `TYPE_COLORS` (G-03, G-28) |
| `.cf-tag-now/-ret/-pen/-goal/-end` | Event tags in the cash-flow table notes column (today, retirement, pension, goal, end of plan) |
| `.alloc-status.alloc-ok/-warn/-err` | Allocation total check on the proposal (rectangular, `--radius-md`, not pill) |
| `.gprob` | Goal probability pill, min-width 60px, colour set inline by probability |
| `.ov-chip` | Neutral chip on `--bg3` for overlap lists |

⚠ Several tag recipes use RGB values from the old palette instead of the current tokens (G-03).
**SaaS target:** new `Badge` primitive with `tone` variants.

### 5.8 Data table

📷 [5.8-cash-flow-table](style-guide-assets/5.8-cash-flow-table.png) · [5.8-compare-table](style-guide-assets/5.8-compare-table.png)

The reference table is the **cash-flow table** `.cf-tbl` (`:633`, Simulation tab). The current-vs-proposed comparison `.cfc-tbl` (`:664`) uses the same recipe. `.fund-tbl` has the same recipe too but is never rendered (G-22).

- **Wrapper** `.cf-tbl-wrap`: 1px `--border`, `--radius-md`, scrolls both ways, max height 540px (480px for `.cfc-tbl`).
- **Table:** 12px, `tabular-nums`, `border-collapse: collapse`. Numbers right-aligned; the label column (`.cf-l`) left-aligned in `--text2`.
- **Header:** sticky, `--bg3` fill, 10px weight 700 uppercase, `.05em` tracking, `--text`, **2px `--border2` bottom border**, padding 9×10.
- **Rows:** padding 6×10, 1px `--border` bottom. `.cf-decade` uses `--border2` to mark every tenth year.
- **Row states:** `.cf-now` (today: primary tint + 2px primary bottom border), `.cf-ret` (retirement: warm tint, label in warning text colour), `.cf-pen` (pension start: success tint), `.cf-goal` (goal year: primary tint), `.cf-depleted` (money ran out: error tint, error text). ⚠ The tints use old-palette RGB values (G-03).
- **Cells:** `.cf-pos` / `.cf-neg` in success / error **text** colours; event tags in the notes column (§5.7).
- ⚠ **Figures wrap** at 1440px: amounts like "CHF 328k" break over two lines because number cells don't set `white-space: nowrap` (G-25). The target spec is: numeric cells never wrap.
- **Column headers in a comparison** (`.cfc-tbl`): current in `#5b9bd5`, proposed in primary, delta in muted.

**Grid tables.** Some lists are CSS grids, not `<table>`s. They follow the same look (`--bg3` uppercase header row, hairline row borders, right-aligned numbers):
- `.ov-tbl` / `.ov-row`: position overlap on the Portfolio tab (1fr + two 110px number columns).
- `.cmp-grid`: current vs proposed vs delta on the Compare tab, with `.cmp-row-lbl` group rows on `--bg3`.
- Portfolio and proposal position lists are **list rows** (§5.15), not tables.

**SaaS target:** new `Table` primitive.

### 5.9 Tooltip and info popover

📷 [5.9-info-popover](style-guide-assets/5.9-info-popover.png) · [5.9-info-popover-clipped-in-hero](style-guide-assets/5.9-info-popover-clipped-in-hero.png)

- `.info-ic`: 14px circular "i" that turns primary on hover. It reveals `.info-pop` (260px, surface, strong border, 8px radius, arrow).
- **Never clipped (done, G-30):** `initInfoPops()` shows the hovered icon's `.info-pop` content in one body-level `position:fixed` box (`#info-pop-box`), so no `overflow:hidden/auto` ancestor (`.wealth-hero`, `.cmp-grid`, scroll areas) can cut it off. It opens above the icon, flips below when there's no room, stays inside the viewport with the arrow tracking the icon, and hides on mouse-out, blur, scroll, resize or Escape. The in-place `.info-pop` is only the content source (`html.info-pop-float` hides it). The 📷 `5.9-info-popover-clipped-in-hero` shot shows the old behaviour.
- `#prob-tip-box`: ⚠ **never shown**. The cards that trigger it (`.prob-card-wrap`) are built only by `redrawChart()`, which returns early (G-22). The spec is kept for reference: a rich tooltip (`--radius-lg`, white, primary-tinted border, `0 12px 40px rgba(0,0,0,.16)` shadow) with a coloured header strip (`.pt-header`, white 13px headline, colour set per result), body (`.pt-body`, 12px `--text2`), stat mini-tiles (`.pt-stat`, `--bg3`, value 16px weight 800) and a `--bg3` footer (`.pt-footer`). Triggered by `.prob-info-btn` (18px circle, top-right of a `.prob-card-wrap`).
- `#inv-tip-box`: breakdown tooltip. ⚠ Its shadow (`rgba(0,0,0,.55)`) is a dark-theme leftover (G-03).
- **States:** hidden → shown on hover **and on keyboard focus** of the trigger; hidden on mouse-out, blur or Escape. ⚠ `.info-ic` is a `<span>` that appears only on hover, so keyboard users can't open it (G-33).
- **Rules:** tooltips explain; never put the only copy of important information in one. The trigger is at least 24px (⚠ `.info-ic` is 14px, G-32).
- **SaaS target:** new `Tooltip` / `Popover`.

### 5.10 Overlays

📷 [5.10-settings-drawer](style-guide-assets/5.10-settings-drawer.png) · [5.10-share-modal](style-guide-assets/5.10-share-modal.png)

| Component | Spec |
|---|---|
| Drawer (`#settingsPanel`) | Right side, 370px (max 90vw), white, `--shadow-drawer`, slides in over .32s; overlay `rgba(8,20,45,.34)`; sections separated by hairlines with micro uppercase headings |
| Modal (`#shareModal`) | Centred, `min(460px, 92vw)`, 14px radius, scales in from .96; overlay `rgba(8,20,45,.42)` |
| Banner (`#sharedBanner`) | Sticky, warm amber gradient, 2px amber bottom border, amber pill label |
| Large modal (`.da-modal`) | Used for document-import review and the order review (`#ordModalBg`). Inset 4% / 3% of the viewport, `--bg` canvas, `--radius-lg`, header / toolbar / scrolling body / right-aligned footer, each separated by hairlines. ⚠ Overlay `rgba(0,0,0,.6)` and shadow `rgba(0,0,0,.5)` are dark-theme leftovers; the target is `--color-overlay` and `--shadow-xl` like the share modal (G-03) |

📷 [5.10-large-modal](style-guide-assets/5.10-large-modal.png) (large modal)

**Behaviour:** every overlay follows the dialog standard in §4.10: `aria-modal`, focus in and back, Escape closes, background inert.

**Anatomy shared by drawer and modals:** a header row (title 17px weight 800 left, round close button right, hairline below), a padded body, and hairline-separated sections with micro uppercase headings (`.set-sec-h`). The share modal adds a monospace URL box on `--bg3` (`.share-url`), a copy button (§5.4) and a QR panel on `--bg3`.

**SaaS target:** `Sheet`, `Dialog`, `Alert/Banner` primitives.

### 5.11 Feedback states

📷 *The onboarding card dismisses itself 2.6s after its steps are complete, so the capture script usually misses it; see the Phase 0 capture in `tab-household` if present.*

- **Empty state** (`.empty`): dashed primary-tint border, faint primary fill, centred muted text, preceded by "✦". Write it as an invitation ("Add your first…"), not a dead end.
- **Onboarding checklist** (`.onboard-card`): progress bar (5px, `--bg4` track, fill `#0069d9 → #39d98a`), step tiles (`.ob-step`, 10px radius, lift on hover) with numbered circles that turn into green ticks and a struck-through label. When all steps are done the card gets a warm ring (`.ob-complete`, the Q10 warm highlight). Celebrates once, then is dismissed permanently.
- **Value feedback:** `.wow-pop` when a metric changes, `.wow-flash` when a simulation finishes.
- **Back-to-top** (`#wowTop`): 42px primary gradient circle, bottom-right, appears on scroll.

**Operation results (success, unknown, failure).** The reference is the order-send result on the Investment Proposal (`:11037`). It is a callout (§5.20) with a bold one-line status, then details (reference, lines accepted, what to do):

| State | Tone | Headline | Meaning |
|---|---|---|---|
| Staged | success | "Staged in the PM system" | Positive confirmation received (a reference or accepted lines) |
| Unknown | warning | "Could not confirm — check the PM system" | The call may have worked. **Not a failure**: say so, and offer a safe retry that reuses the same reference |
| Rejected | error | "The PM system reported a problem" | The other side refused it; show why |

**Rules:** a 2xx without a positive answer is **unknown**, not success. Any operation that writes to another system (save, send, sync) reports one of these three states, never a silent success. The SaaS uses the same three states for orders (`staged` / `unknown` / `rejected`). ⚠ In the demo the colours are inline literals (`rgba(5,150,105,…)`, `rgba(217,119,6,…)`, `rgba(220,38,38,…)`), not the §4.1b tokens (G-03).

**Pending and loading.** A control that starts work switches to the pending state (§4.13: disabled, "Sending…"). Long calculations finish with `wowFlash` on the headline figures. There is no spinner or skeleton in the theme; if a wait can exceed about 1 second, show pending text where the result will appear. **Not decided:** whether a spinner is added.

**Failures the user caused** (invalid input) are shown next to the field (§5.5). **Failures of the app** (a load or save that failed) are an error callout in the panel concerned, saying what didn't happen and what to do; the user's input is kept. ⚠ Today these are `alert()` dialogs (G-35).

**Destructive actions** ask first. Standard: a confirmation dialog (§5.10) that names the object and the consequence (§4.14), with a Danger button repeating the verb and a secondary Cancel, focus on Cancel. ⚠ Today the demo uses the browser's `confirm()` (2 places: deleting a named portfolio at `:11390`, and applying the AI portfolio over the proposal at `:14768`) (G-35).

### 5.12 Charts

📷 [5.12-chart](style-guide-assets/5.12-chart.png) · [5.17-allocation-pies](style-guide-assets/5.17-allocation-pies.png)

- Chart.js in the app. The PDF report draws its charts with jsPDF primitives.
- Fixed height wrapper `.chart-wrap` (340px). The `.chart-legend` class (8px square dots) is not rendered anywhere (G-22); charts use Chart.js's built-in legend.
- ⚠ No chart sets a font, so chart ticks and legends render in Chart.js's default (Helvetica/Arial), not Plus Jakarta Sans (G-24).
- ⚠ The main projection chart draws the optimistic band in purple `#7c3aed` (G-23). Purple is not part of the theme (Q19 resolved: keep Q12); the demo keeps it until Phase 3.
- Colours come from the §4.3 palettes and the series conventions there.
- **States:** before a simulation has run, the projection chart area stays empty under its title; standard: an empty state (§5.11) that says what to do ("Run the simulation to see your projection"). Hover shows Chart.js's tooltip with the year and all series values (not restyled, **not decided**). Loading: pending text on the run button (§4.13).
- **SaaS target:** `react-chartjs-2` already in use, so share the palette constants (Phase 4).

### 5.13 Feature surface (navy hero) — part of the theme

📷 [5.13-wealth-hero](style-guide-assets/5.13-wealth-hero.png)

The Wealth Overview Hero is the reference implementation of the theme's **feature surface**: one dark navy area per page that carries the headline figure. It is a sanctioned, reusable pattern (Q1 resolved).

**Usage rules:**
- **At most one feature surface per page**, at the top, for the page's headline figure(s). Everything else stays on the light canvas.
- Content on it uses the inverse tokens (§4.1a) only, never the light-surface text tokens.
- Buttons on it: `.btn-primary` unchanged; `.btn-secondary` switches to the glass variant (white-tinted fill and border).
- Aurora and cursor glow run only here, pause when the browser tab is hidden, and switch off under reduced motion.
- No `backdrop-filter`; glass is imitated with semi-opaque fills (performance rule, §3.7).
- Good candidates outside the Household tab: the SaaS dashboard header, the simulation results headline, the admin console overview.

**Current implementation:**

- A navy gradient card (`#061735 → #0a2a5e → #0d3f8a`) with an animated aurora (a blue radial glow plus a soft warm one, kept per Q10; 17s loop, paused when the tab is hidden).
- Gradient white-to-blue title, white net-worth figure with a blue glow, glass KPI tiles (`.wh-stat`) without `backdrop-filter`, and an asset-allocation donut on the right.
- The cursor-tracking spring glow (`interactive-glow.js`, inlined at `:26359`) targets this area.
- It is the only dark surface **inside the app shell**. (The intro splash, §5.21, is a second, full-screen one shown before the app.) It also holds the only warm tones in the theme (`rgba(212,175,95,…)` in the aurora, `rgba(255,205,100,…)` in the completion flash). They stay as a small warm highlight (Q10), named by role (`--color-highlight-warm`); the code comments that call them "gold-lit" are reworded in P3-01.
- **Reuse (Q11):** wherever a navy surface is needed, use the **`.wealth-hero` class itself**, not a new class. Its children (`.wh-left`, `.wh-title`, `.wh-sub`, `.wh-amount`, `.wh-stat-grid`, `.wh-actions`, `.wh-right`) are the building blocks; use only the ones a page needs.
- **Admin (Phase 2, done):** every one of the 15 tab headers is a `.wealth-hero` with only `.wh-left` → `h1.wh-title` + `p.wh-sub`. Without a `.wh-right` panel the hero sizes to its content (`.wealth-hero:not(:has(.wh-right))` drops the 290px showcase height and tightens the padding). A leading Lucide icon (`<i data-lucide>` → SVG via `refreshIcons()`) sits beside `span.wh-title-text` so the glyph keeps `currentColor` instead of being clipped to the title gradient (sized by `.wh-title .icon`). The aurora pauses while the browser tab is hidden (`body.wa-page-hidden`, same listener as the demo) and stops under reduced motion. 📷 [admin-agent](style-guide-assets/admin-agent.png)
- **Anatomy:** `.wealth-hero` (navy gradient + aurora layer) → headline label + value (display size, §4.4) → optional KPI grid of glass `MetricTile`s → optional actions row → optional side panel (chart).

### 5.14 Code block and inline code

📷 [5.14-code-block](style-guide-assets/5.14-code-block.png) (the data-feed spec, inside the large modal)

Code is always shown on a **light** surface. The theme has no dark code surface; the navy feature surface (§5.13) stays the only dark area on a page. Decided in Q18.

| Variant | Proposed class | Look | Use |
|---|---|---|---|
| Code block | `.code-block` | `--color-bg-surface`, 1px `--color-border`, `--radius-md`, padding 10px, `--font-mono` 11–12px, `--color-text`, `white-space: pre-wrap`, scrolls on overflow (max height set per use) | JSON, test output, logs, example payloads |
| Code block, error | `.code-block.is-error` | `--color-error-tint` fill, `--color-error-border`, `--color-error-text` | A failed call or calculation shown as text |
| Code block, warning | `.code-block.is-warning` | `--color-warning-tint` fill, `--color-warning-border`, `--color-warning-text` | Missing data or a partial result (e.g. "no tax dataset synced") |
| Inline code | `code` / `.code-inline` | `--color-bg-subtle` fill, `--color-text`, padding 1px 5px, radius 3px, `--font-mono` | Identifiers in running text: ticket IDs, references, schema names |
| Code input | `textarea.code-input` | Standard input (§5.5) with `--font-mono` | Pasting JSON or other structured text |

**Rules:**
- Status is never shown by colour alone: an error/warning block starts with a word such as "Error:" or "Warning:" (the admin console already does this).
- Escape all content (the existing `escapeHtml` / `_daEsc` helpers); code blocks often show upstream text.
- Long output scrolls inside the block; the page must not scroll horizontally.

**Current implementations:** demo `<pre>` in the data-feeds help (`:10606`), inline `<code>` at `:2884`, `:11027`, `:11045`, the `#fdPaste` textarea (`:3154`), all inline styles; admin `.code` (dark slate `#0f172a`), 10 of its uses with inline backgrounds: `#7f1d1d` (8×, errors) and `#7c2d12` (2×, missing data).
**SaaS target:** `CodeBlock` primitive (Phase 4, P4-05).


### 5.15 List rows

📷 [5.15-goal-item](style-guide-assets/5.15-goal-item.png) · [5.15-portfolio-row](style-guide-assets/5.15-portfolio-row.png) · [5.15-proposal-row](style-guide-assets/5.15-proposal-row.png) · [5.7-asset-item](style-guide-assets/5.7-asset-item.png)

Editable lists of items (goals, positions, accounts, loans) are rows, not tables. They share one recipe:

| Class | Where | Layout |
|---|---|---|
| `.goal-item` | Goals list | Flex row: 32px icon tile (`.goal-icon`, 8px radius, category colour) → name → tags → amount; `--radius-md` with a primary 3% hover fill |
| `.asset-item`, `.loan-item` | Assets / Liabilities | Nested card on `#f8faff` (§5.2 rule: inner cards, not panels) with badges and a `.btn-x` |
| `.pf-row` | Current Portfolio | CSS grid: type tag / name / ticker / class / value / region / expense ratio / yield / notes / remove; the header is a `.pf-row` on `--bg3`. Reflows to 5 columns at ≤ 1500px (so one position takes two lines on a laptop screen), 3 at ≤ 1200px, 2 at ≤ 900px, 1 at ≤ 700px |
| `.pr-row` | Investment Proposal | CSS grid: vehicle / fund name / ticker / asset class / weight / expected return / expense ratio / yield / rationale / remove; header row on `--bg3` with a 2px `--border2` bottom; stacks at ≤ 900px |

- 12–13px text, `--text` name at weight 500, muted 11px italic notes that truncate with an ellipsis, 1px `--border` between rows, hover fill `--bg2` or primary 3%.
- The add-row above each list (`.pf-add`, `.pr-add`) uses the stacked field (§5.5).
- **SaaS target:** `ListRow` (or `Table` with a row-card variant).

### 5.16 Progress and bar indicators

📷 [5.16-funding-bar](style-guide-assets/5.16-funding-bar.png) · [5.16-tax-score-bar](style-guide-assets/5.16-tax-score-bar.png)

| Class | Size | Fill | Use |
|---|---|---|---|
| `.ob-bar` | 5px, radius 4 | `#0069d9 → #39d98a` gradient | Onboarding progress |
| `.fund-bar` | 6px | ok / warn / bad status fills | Goal funding probability |
| `.pf-bar-row` + `.pf-bar-track` | 14px, radius 7, `--bg3` track with hairline border | primary | Allocation breakdown rows: label / bar / amount / % |
| `.risk-bar` | 8px, radius 4 | old-palette green → amber → red gradient (G-03) | Risk scale |
| `.tax-score-bar` | 8px, radius 4, `--bg4` track | error → warning → success gradient (`#e31837 → #f59e0b → #00875a`) | Tax efficiency score |

**States:** empty (track only, figure "0%" or "—"), partial, full; the onboarding bar also has a complete state (warm ring on the card, §5.11). Fills animate width over .4–.5s, off under reduced motion.

**Rules:** the track is always `--bg3`/`--bg4`, never white; the fill carries the meaning (primary for quantity, status colours for good/bad); the figure is always printed next to the bar.

### 5.17 Allocation pie card

📷 [5.17-allocation-pies](style-guide-assets/5.17-allocation-pies.png)

`.alloc-pies` lays out two or three `.alloc-pie-wrap` cards: `--radius-lg`, white → `#f5f8ff` gradient, primary-tinted border, a centred primary uppercase title (`.alloc-pie-title`, the §4.4 label pattern in primary), a 220px doughnut, and a legend (`.alloc-pie-legend-item`: 12px square dot with radius 3, name, amount, muted %; primary 4% hover). One card per palette in §4.3. The hero's donut (§5.13) is the inverse-surface version.

### 5.18 Avatars

📷 [5.18-avatars-client-card](style-guide-assets/5.18-avatars-client-card.png)

`.c-av`: 36px circle, 13px weight 600 initials, in a tinted fill with matching text and border. `.av1` (client 1) uses info blue, `.av2` (client 2) success green, `.avc` (child, 28px) warning amber. ⚠ The tints are old-palette RGB values (G-03); the target is the status-set tint/border roles in §4.1b.

### 5.19 Pill tabs (switcher)

📷 [5.19-pill-tabs](style-guide-assets/5.19-pill-tabs.png)

`.pf-switcher` / `.pf-tab` (Portfolio tab, `:2905`): pills on white with a hairline border, 12.5px weight 600; hover turns the border primary; the active pill is solid primary with white text. An optional count badge (`.pf-tab-n`) sits inside. Use this to switch between items of the same kind (named portfolios); use `.band-btn` (§5.4) for choosing a setting.

### 5.20 Callouts (inline notices)

📷 *Not captured: the Keller profile triggers none of them (no ZIP for the tax preview, no overlapping positions). The order result in §5.11 is the reference callout.*

Short messages inside a panel. All of them use a status tint, a status-coloured border or left accent, and the status **text** colour:

| Class | Tone | Recipe |
|---|---|---|
| `.ov-warn` / `.ov-ok` | warning / success | 3px left accent, tint fill, radius 4, 12.5px |
| `.wi-depwarn` | warning | Full hairline border, tint fill, `--radius-md`. ⚠ Text is `#d4956a` (old palette, fails contrast) |
| `.share-qr-fallback` | warning | Full border, 8% amber tint |
| `.cmp-recommend` | info (primary) | Primary tint and border, strong text in primary |
| `.tax-preview` | info (primary) | Primary→green gradient tint, primary uppercase heading, 4-column stat grid |
| `.rnote-box` | neutral | `--bg3`, hairline, 11px muted |

**Target:** one `Callout` with `tone` (neutral / info / success / warning / error) and `accent` (left / full), built on §4.1b. Status is never shown by colour alone: the message starts with a word or icon.

### 5.21 Intro splash

📷 [5.21-intro-splash](style-guide-assets/5.21-intro-splash.png)

`#introScreen` (`:1021`) is a full-screen launch screen shown before the app (it can be turned off in Settings). It is a **second dark surface**, separate from the in-app feature surface (§5.13), with its own palette:

- Background: radial `#0a63cf → #0057b8 → #042a5e`, plus soft blue glows. Brighter and bluer than the hero's navy.
- Wordmark 42–72px weight 800, second word in `#5aa9ff`; tagline in `#c7d6ee`; uppercase badge pill; feature chips as glass pills; a white launch button with navy text (`#062b66`).
- Below the fold: glass feature cards (`.intro-card`, 16px radius, lift 5px on hover) and numbered steps.
- Motion: `introUp` entrance (.85s) and card lift on hover. ⚠ Neither is switched off under reduced motion (G-29).

**Rules:** at most one splash per app, shown before any data; it is not a pattern for pages. Its colours are not yet tokens (G-26).

### 5.22 Icons

📷 [5.1-sidebar](style-guide-assets/5.1-sidebar.png) · [5.13-wealth-hero](style-guide-assets/5.13-wealth-hero.png)

- **Style:** inline SVG line icons, 1.7–2px stroke, round caps and joins, `currentColor`: primary on light surfaces, `#7fb6ff` / `#9cc4ff` on dark ones. **Admin console** uses Lucide 0.460.0 (`vendor/lucide.min.js`, same pin as `wealth-app-next`'s `lucide-react`); the demo still uses hand-authored SVG paths. Both share the same stroke recipe and size scale.
- **Sizes:** 16px is the default next to 13px text (the most common fixed size); 12–13px inside small buttons and chips; 17–18px in the topbar; 25px in the splash feature cards. Hero KPI icons sit in a 34px, 9px-radius tinted chip (`.wh-stat-icon`).
- **States:** icons take the colour of their control, so they follow its hover, active and disabled states. Meaningful icons need 3:1 contrast (§4.10).
- **When an icon needs a text label:** always, except for the universal ones: close (×), settings (gear), info (i), expand/collapse chevrons. An icon-only button has an `aria-label` and a `title`. An icon next to text is decorative: `aria-hidden="true"`.
- **Emoji** are used as goal category icons and as country flags (🇨🇭, the AI Builder's country banner). Flags stay emoji and are never swapped for an icon. Both are content, not part of the icon set, and never the only label.
- **AI Portfolio Builder (done):** the tab uses Lucide throughout: `bot` in the hero and on the Build button, `user-round` / `file-search` / `chart-pie` in 48px tinted step chips (`.aib-step-chip`, with a "Step N" label in place of keycap emoji), `target` on result titles The UCITS / US-listed banner keeps its country-flag emoji. Status lines use `circle-check` / `circle-x`. Asset-mix rows use a colour swatch that matches the bar. `<option>` text is plain, because a `<select>` can't render an SVG.
- **Simulation tab (done):** section titles take a 15px Lucide icon in primary blue (`.ptitle-icon`): `target` on Goals-Based Analysis, both Swiss pension panels keep their 🇨🇭 flag. Run buttons use `play`; *Use country defaults* uses `rotate-ccw`. Status lines go through `statusMsg(el, "ok"|"err", text)`, which adds a leading `circle-check` / `circle-x` and escapes the text. The Funded / Short tags use `check` / `x`. The ✕ on `.btn-x` row-delete buttons is shared by 15 lists and is unchanged.

---

## Screenshot index

In [`style-guide-assets/`](style-guide-assets/) (49 PNGs, ~4 MB). Regenerate demo shots with `node docs/style-guide-assets/capture.mjs` (Node 22+, Chrome on PATH, network for the CDN scripts). Admin shots and the P2-14 before/after comparison use `node docs/style-guide-assets/capture-admin.mjs` (optionally `<dir> all`). Captured at 1440×900 with the Béatrice Keller sample profile and a simulation run. Each §5 entry links its own images; this is the full index.

| § | File |
|---|---|
| Tabs | `tab-household`, `tab-income`, `tab-expenses`, `tab-assets`, `tab-liabilities`, `tab-goals`, `tab-simulation`, `tab-simulation-after-run`, `tab-portfolio`, `tab-proposal`, `tab-report` |
| 5.1 | `5.1-topbar`, `5.1-sidebar` |
| 5.2 | `5.2-panel` |
| 5.3 | `5.3-section-dropdown-open`, `5.3-sim-group`, `5.3-sim-toolbar` |
| 5.4 | `5.4-btn-primary-full` |
| 5.5 | `5.5-form-row`, `5.5-set-switch` |
| 5.6 | `5.6-mc`, `5.6-ss-card`, `5.6-pf-mc` |
| 5.7 | `5.7-risk-badge`, `5.7-asset-item`, `5.7-goal-tags`, `5.7-fund-tag`, `5.7-alloc-status` |
| 5.8 | `5.8-cash-flow-table`, `5.8-compare-table` |
| 5.9 | `5.9-info-popover`, `5.9-info-popover-clipped-in-hero` |
| 5.10 | `5.10-settings-drawer`, `5.10-share-modal`, `5.10-large-modal` |
| 5.12 | `5.12-chart` |
| 5.13 | `5.13-wealth-hero` |
| 5.14 | `5.14-code-block` |
| 5.15 | `5.15-goal-item`, `5.15-portfolio-row`, `5.15-proposal-row` |
| 5.16 | `5.16-funding-bar`, `5.16-tax-score-bar` |
| 5.17 | `5.17-allocation-pies` |
| 5.18 | `5.18-avatars-client-card` |
| 5.19 | `5.19-pill-tabs` |
| 5.21 | `5.21-intro-splash` |
| Admin console | `admin-dashboard`, `admin-agent` (`node docs/style-guide-assets/capture-admin.mjs`) |

Not captured: `.fund-tbl`, `.insight-card`, the scenario bar chart and `#prob-tip-box` (never rendered, G-22); `.btn-add`, the empty state, `.loan-item`, the `.pf-bar` rows, `.ov-tbl` and the callouts in §5.20 (the Keller profile doesn't trigger them; the script tries and skips); the onboarding card (dismisses itself before the capture); the band buttons (inside a collapsed settings section); the shared-session banner (needs a shared link).

---

## Changelog

| Date | Version | Change |
|---|---|---|
| 2026-09-25 | v1.2 RC | §5.1: the demo sidebar clips horizontal overflow too (G-37 fixed in both surfaces) |
| 2026-09-24 | v1.2 RC | §5.1: sidebar clips horizontal overflow so the hover slide can't flicker (G-37); fixed in the admin console |
| 2026-09-24 | v1.2.1 | `.nav-new` consolidated: admin + demo (+ Avaloq) share the purple→primary gradient badge (admin had been navy) |
| 2026-09-24 | v1.2 RC | Phase 2 Tier 1 landed in the admin console: target token block live in `admin.html` (§4.1 note); new tokens `--color-on-primary`, `--color-bg-bar`, `--color-glow-canvas`, `--color-hairline-primary`, `--color-sheen`, `--color-selection`, `--color-focus-ring`, `--color-primary-on-inverse-end`, `--shadow-primary-hover`, `--shadow-bar`, `--shadow-inverse` (§4.1a, §4.2, §4.7); admin notes in §5.1, §5.2, §5.4 (plus a shared disabled rule), §5.6, §5.13; NEW badge initially navy (later aligned to demo in v1.2.1); Q19 resolved (purple stays out of the theme tokens). Two admin screenshots |
| 2026-09-24 | v1.1 RC | Design review incorporated: single proposed values or "not decided" for every token (§4.2, §4.4, §4.6, §4.8, §4.9); duplicate colour rows removed from §4.2; contents and a new-screen checklist; "one light theme" principle (§3.8); new §4.10 accessibility standard (WCAG 2.1 AA, contrast floors, 24px targets, keyboard, dialogs), §4.11 number formatting, §4.12 breakpoints, §4.13 interaction states, §4.14 content and voice; form states and rules (§5.5); operation results, pending, failure and destructive-confirm patterns (§5.11); states for shell, tooltips, charts, bars, icons; six new screenshots. New gaps G-30 to G-36 in the plan |
| 2026-09-24 | v1.0 RC | Moved out of the plan into this file. Content as of plan r11: §3–§5 checked against the running demo (plan Appendix D), §4.3 palettes in full, §5.8 based on the tables that render, §5.15–§5.22 added, screenshots for every captured component |

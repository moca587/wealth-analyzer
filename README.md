# Wealth Analyzer — Monte Carlo Financial Planner

A single-file browser application for comprehensive personal wealth analysis with Monte Carlo simulation.

## Quick Start

```bash
open src/wealth-analyzer.html
```

No installation, no server, no build step required. Works directly from the filesystem.

## Features

| Feature | Details |
|---------|---------|
| **Household profiles** | 1–2 clients with name, DOB, address, risk profile, time horizon |
| **Children** | Add any number of children with name and DOB |
| **Relationship tracking** | Spouse, domestic partner, significant other, co-applicant, and more |
| **Income** | Primary + secondary income per client, annual raise |
| **Expenses** | Living, insurance, other — with country-specific inflation presets |
| **Inflation regions** | 17 regions, 50-year historical averages |
| **Assets** | 19 countries × ~500 account types (401k, RRSP, ISA, Super, Pillar 3a, CPF...) |
| **Liabilities** | 9 loan types with amortization math |
| **Goals** | Calendar-year targets with success probability |
| **Monte Carlo** | 200–1000 simulations, configurable percentile bands |
| **Risk profiles** | 7 levels from Very conservative to Very aggressive |

## Files

```
wealth-analyzer-project/
├── README.md
├── CLAUDE.md                    ← AI session context & architecture docs
├── src/
│   └── wealth-analyzer.html    ← The entire application (single file)
├── docs/
│   └── CONVERSATION_EXPORT.md  ← Full development conversation log
└── exports/
    └── (future report exports)
```

## Supported Countries & Account Types

🇺🇸 United States · 🇨🇦 Canada · 🇬🇧 United Kingdom · 🇦🇺 Australia · 🇨🇭 Switzerland · 🇪🇺 Euro zone · 🇯🇵 Japan · 🇸🇬 Singapore · 🇭🇰 Hong Kong · 🇨🇳 China · 🇹🇼 Taiwan · 🇰🇷 South Korea · 🇮🇳 India · 🇮🇩 Indonesia · 🇲🇽 Mexico · 🇧🇷 Brazil · 🇸🇦 Saudi Arabia · 🇿🇦 South Africa · 🌍 Other

## Technical Notes

- **No dependencies** beyond Chart.js (CDN) and Google Fonts (CDN)
- **Works offline** if CDN scripts are vendored locally
- **No data leaves the browser** — all computation is client-side
- Chart.js version: 4.4.1

## Development

See `CLAUDE.md` for full architecture decisions, data model documentation, known issues, and future work items.

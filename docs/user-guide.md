# Wealth Analyzer user guide

This guide covers the production application, `wealth-analyzer.html`. The interface may expose additional specialist controls depending on edition and configuration.

## 1. Open the application

Use one of these files:

- `wealth-analyzer.html` — source application; may load pinned libraries or fonts from the web.
- `wealth-analyzer-standalone.html` — generated, fully offline version.
- `wealth-analyzer-avaloq.html` — institution-specific Avaloq edition.

No account is required. The application runs in the browser.

## 2. Build a plan

A practical workflow is:

1. **Household** — enter one or two clients, dates of birth, location, risk profiles, time horizons, and dependants.
2. **Goals** — add the purpose, priority, amount, and calendar-year timing of each financial goal.
3. **Expenses** — enter recurring household costs. Choose an inflation region or override the rate when appropriate.
4. **Income** — enter employment and other income streams.
5. **Assets** — select the country and account type, then enter balances and liquidity information.
6. **Liabilities** — add loans with balance, rate, and remaining term. Do not also include payments on these tracked loans in general expenses unless the screen explicitly instructs otherwise; that would double-count debt service.
7. **Portfolio** — record current holdings or import a supported statement.
8. **Investment proposal** — construct a proposed allocation manually or from supported portfolio tools.
9. **Comparison** — compare the current portfolio with the proposal.
10. **Simulation** — run projections and inspect goal funding, retirement outcomes, and sensitivity results.
11. **Recommendations** — review generated observations and planning flags.
12. **PDF report** — choose sections and branding, preview the report, then download it.

Values are interpreted in the plan's selected currency. Do not mix currencies unless you first convert them to a common basis.

## 3. Understand the simulation

The simulation produces many possible future paths rather than one forecast.

- **Median / P50** — half of simulated outcomes are above this value and half below.
- **P10** — a downside scenario; 10% of paths are below it.
- **P90** — an upside scenario; 10% of paths are above it.
- **Goal success** — the share of simulated paths able to fund a goal at its calendar-year target.
- **Retirement success** — the share of paths that do not deplete the modelled portfolio before the selected planning age.

These figures are model outputs, not guarantees. Results depend on inputs, capital-market assumptions, inflation, tax approximations, and random sampling. Compare scenarios and ranges instead of treating a single result as a promise.

## 4. Save, load, and share

Open **Settings** to access profile data controls.

- **Save profile** downloads plan data to the device.
- **Load profile** restores a previously saved profile.
- **Share** creates a read-only snapshot link or QR code when that feature is available.

Keep exported profiles secure: they contain personal and financial information. A read-only shared view is still visible to anyone who receives its link.

## 5. Import portfolio data

The deterministic statement importer accepts supported CSV, OFX, and QFX exports. Review column mappings and every proposed holding before applying the import.

The optional AI Data Agent can interpret a wider set of documents, including images, scans, PDFs, office documents, and spreadsheets. This feature requires an AI API key and transmits submitted content to the configured external provider. Do not use it with sensitive documents unless your organization's privacy and compliance policies permit that transfer.

## 6. Create a report

In **PDF Report**:

1. Set report identity, branding, and appearance.
2. Add optional custom content.
3. Select and order report sections.
4. Review the glossary and educational charts.
5. Use **Preview in browser** to inspect the output.
6. Use **Download PDF** to produce the final report.

Always review the report for incomplete inputs, inappropriate assumptions, and confidential information before sharing it.

## 7. Troubleshooting

| Problem | Suggested action |
|---|---|
| Charts or PDF tools do not load | Use the standalone build or check network access to external libraries. |
| A saved profile will not import | Confirm it is an unmodified Wealth Analyzer JSON export. Keep the current profile until the import succeeds. |
| Results look unexpectedly high or low | Check currency consistency, monthly versus annual fields, inflation, goal years, loan terms, and duplicate expense/debt entries. |
| Imported holdings are wrong | Cancel or remove them, verify the statement mapping and units, then import again. |
| Browser data disappeared | Restore the last exported profile. The production app does not provide cloud backup. |
| A shared view cannot be edited | Shared sessions are read-only; save a copy from Settings first. |

## Important limitation

Wealth Analyzer is an educational planning tool. It does not replace a licensed financial adviser, tax professional, attorney, or regulated suitability process. Historical averages and simulated outcomes do not predict future performance.

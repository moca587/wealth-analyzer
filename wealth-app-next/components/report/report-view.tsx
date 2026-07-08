"use client";

// ─────────────────────────────────────────────────────────────────
// Branded, print-optimized wealth report. Renders on screen as a
// stack of "pages" and prints cleanly to PDF (A4, page breaks, chrome
// hidden). Runs a fresh, seeded Monte Carlo so the same plan produces
// the same report. This is the SaaS equivalent of the legacy
// generatePDFReport — a reduced but complete first cut.
// ─────────────────────────────────────────────────────────────────

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { SimChart } from "@/components/sim/sim-chart";
import { runMonteCarlo } from "@/lib/engine/monte-carlo";
import { formatMoney, estimateIncomeTax, ageFromDOB } from "@/lib/engine/financial-math";
import { RISK_PROFILES } from "@/lib/engine/constants";
import type { WealthPlan } from "@/lib/engine/types";

const CLASS_LABEL: Record<string, string> = {
  equity: "Equity", fixed_income: "Fixed income", real_estate: "Real estate",
  commodity: "Commodity", cash: "Cash", mixed: "Balanced / mixed",
  alternative: "Alternatives", crypto: "Crypto",
};

export function ReportView({ plan }: { plan: WealthPlan }) {
  const ccy = plan.currency || "USD";
  const m = (n: number) => formatMoney(n, ccy);
  const sum = <T,>(a: T[], g: (x: T) => number) => a.reduce((s, x) => s + (g(x) || 0), 0);

  const sim = useMemo(
    () => runMonteCarlo({ plan, sims: 1000, years: 30, seed: 20260101 }),
    [plan]
  );

  const totalAssets = sum(plan.assets, (a) => a.value);
  const totalLiab = sum(plan.loans, (l) => l.bal);
  const netWorth = totalAssets - totalLiab;
  const grossIncome = sum(plan.incomes, (i) => i.amount);
  const taxableIncome = sum(plan.incomes.filter((i) => i.taxable !== false), (i) => i.amount);
  const tax = estimateIncomeTax(taxableIncome, plan.clients[0]?.country || "US");
  const annualExpense = sum(plan.expenses, (e) => e.amount) * 12;
  const annualSurplus = grossIncome - tax - annualExpense;

  // Assets grouped by class.
  const byClass = new Map<string, number>();
  for (const a of plan.assets) {
    const k = a.cls || "mixed";
    byClass.set(k, (byClass.get(k) || 0) + (a.value || 0));
  }
  const classRows = Array.from(byClass.entries()).sort((a, b) => b[1] - a[1]);

  const today = new Date().toISOString().slice(0, 10);
  const clientNames = plan.clients.map((c) => [c.first, c.last].filter(Boolean).join(" ")).filter(Boolean).join(" & ") || "Client";

  const pct = (n: number) => `${Math.round(n * 100)}%`;

  return (
    <div className="report-root">
      <style>{`
        @media print {
          @page { size: A4; margin: 14mm; }
          .report-noprint { display: none !important; }
          .report-page { box-shadow: none !important; margin: 0 !important; border: 0 !important; page-break-after: always; }
          .report-page:last-child { page-break-after: auto; }
          .report-avoid { break-inside: avoid; }
          body { background: #fff !important; }
        }
        .report-page { break-inside: avoid; }
      `}</style>

      <div className="report-noprint flex items-center justify-between mb-6">
        <div className="text-sm text-muted-foreground">Review below, then export a clean PDF.</div>
        <Button onClick={() => window.print()}>Print / Save as PDF</Button>
      </div>

      <div className="mx-auto max-w-3xl space-y-6 print:space-y-0">
        {/* ── COVER ── */}
        <section className="report-page bg-white text-slate-900 rounded-xl border border-slate-200 shadow-sm p-12 min-h-[60vh] flex flex-col justify-between">
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-white">W</span>
            Wealth Analyzer
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-3">Financial Planning Report</div>
            <h1 className="font-display text-5xl leading-tight mb-4">{clientNames}</h1>
            <p className="text-slate-500 max-w-md">A Monte Carlo projection of your household&apos;s position, portfolio, goals, and — if enabled — retirement sustainability.</p>
          </div>
          <div className="flex justify-between text-xs text-slate-400 border-t border-slate-200 pt-4">
            <span>Prepared {today}</span>
            <span>Confidential</span>
          </div>
        </section>

        {/* ── EXECUTIVE SUMMARY ── */}
        <section className="report-page bg-white text-slate-900 rounded-xl border border-slate-200 shadow-sm p-10">
          <SectionTitle n="01" title="Executive summary" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
            <Stat label="Net worth" value={m(netWorth)} big />
            <Stat label="Total assets" value={m(totalAssets)} />
            <Stat label="Total liabilities" value={m(totalLiab)} />
            <Stat label="Annual surplus (after tax)" value={m(annualSurplus)} />
            <Stat label="Projected wealth (median, 30y)" value={m(sim.final.p50)} />
            {sim.retirement && <Stat label="Money-lasts probability" value={pct(sim.retirement.successProbability)} />}
          </div>
          <p className="text-sm text-slate-500 mt-6 leading-relaxed report-avoid">
            Over a 30-year, 1,000-path Monte Carlo simulation, your net worth is projected to reach a median of{" "}
            <strong className="text-slate-800">{m(sim.final.p50)}</strong> (10th–90th percentile{" "}
            {m(sim.final.p10)} – {m(sim.final.p90)}).{" "}
            {sim.retirement
              ? `Under your retirement plan, ${pct(sim.retirement.successProbability)} of scenarios fund spending through age ${sim.retirement.planToAge}.`
              : "Enable retirement in your plan to add a decumulation / 'will my money last?' analysis."}
          </p>
        </section>

        {/* ── HOUSEHOLD ── */}
        <section className="report-page bg-white text-slate-900 rounded-xl border border-slate-200 shadow-sm p-10">
          <SectionTitle n="02" title="Household" />
          <table className="w-full text-sm mt-4">
            <thead><Tr head cells={["Client", "Age", "Country", "Risk profile", "Horizon"]} /></thead>
            <tbody>
              {plan.clients.map((c) => (
                <Tr key={c.id} cells={[
                  [c.first, c.last].filter(Boolean).join(" ") || "—",
                  c.dob ? String(ageFromDOB(c.dob)) : "—",
                  c.country || "—",
                  c.risk ? RISK_PROFILES[c.risk]?.label ?? c.risk : "—",
                  c.horizon || "—",
                ]} />
              ))}
            </tbody>
          </table>
          {plan.children.length > 0 && (
            <p className="text-sm text-slate-500 mt-4">
              Dependents: {plan.children.map((c) => `${[c.first, c.last].filter(Boolean).join(" ")}${c.dob ? ` (age ${ageFromDOB(c.dob)})` : ""}`).join(", ")}.
            </p>
          )}
        </section>

        {/* ── NET WORTH STATEMENT ── */}
        <section className="report-page bg-white text-slate-900 rounded-xl border border-slate-200 shadow-sm p-10">
          <SectionTitle n="03" title="Net worth statement" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-5 mb-2">Assets by class</h3>
          <table className="w-full text-sm">
            <tbody>
              {classRows.map(([cls, v]) => (
                <Tr key={cls} cells={[CLASS_LABEL[cls] || cls, m(v), totalAssets > 0 ? pct(v / totalAssets) : "—"]} align={["left", "right", "right"]} />
              ))}
              <Tr strong cells={["Total assets", m(totalAssets), "100%"]} align={["left", "right", "right"]} />
            </tbody>
          </table>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mt-6 mb-2">Liabilities</h3>
          <table className="w-full text-sm">
            <tbody>
              {plan.loans.length === 0 && <Tr cells={["No liabilities", "", ""]} />}
              {plan.loans.map((l) => (
                <Tr key={l.id} cells={[l.label || l.type, `${l.rate}% · ${l.yrs}y`, m(l.bal)]} align={["left", "left", "right"]} />
              ))}
              <Tr strong cells={["Total liabilities", "", m(totalLiab)]} align={["left", "left", "right"]} />
            </tbody>
          </table>
          <div className="flex justify-between items-baseline mt-6 pt-4 border-t-2 border-slate-800">
            <span className="font-semibold">Net worth</span>
            <span className="font-display text-2xl">{m(netWorth)}</span>
          </div>
        </section>

        {/* ── CASH FLOW ── */}
        <section className="report-page bg-white text-slate-900 rounded-xl border border-slate-200 shadow-sm p-10">
          <SectionTitle n="04" title="Cash flow" />
          <table className="w-full text-sm mt-4">
            <tbody>
              <Tr cells={["Gross annual income", m(grossIncome)]} align={["left", "right"]} />
              <Tr cells={["Estimated income tax", `(${m(tax)})`]} align={["left", "right"]} />
              <Tr cells={["Annual expenses", `(${m(annualExpense)})`]} align={["left", "right"]} />
              <Tr strong cells={["Annual surplus", m(annualSurplus)]} align={["left", "right"]} />
            </tbody>
          </table>
          <p className="text-xs text-slate-400 mt-3">Income tax is a simplified, federal-level estimate for {plan.clients[0]?.country || "US"}; it excludes state/local layers and credits.</p>
        </section>

        {/* ── GOALS ── */}
        {plan.goals.length > 0 && (
          <section className="report-page bg-white text-slate-900 rounded-xl border border-slate-200 shadow-sm p-10">
            <SectionTitle n="05" title="Goals & funding" />
            <table className="w-full text-sm mt-4">
              <thead><Tr head cells={["Goal", "Amount / yr", "Years", "Success"]} align={["left", "right", "left", "right"]} /></thead>
              <tbody>
                {plan.goals.map((g) => {
                  const gs = sim.goalSuccess.find((x) => x.goalId === g.id);
                  return <Tr key={g.id} cells={[g.name || "(unnamed)", m(g.amt), `${g.startYear}–${g.endYear}`, gs ? pct(gs.probability) : "—"]} align={["left", "right", "left", "right"]} />;
                })}
              </tbody>
            </table>
          </section>
        )}

        {/* ── MONTE CARLO PROJECTION ── */}
        <section className="report-page bg-white text-slate-900 rounded-xl border border-slate-200 shadow-sm p-10">
          <SectionTitle n="06" title="Monte Carlo projection" />
          <p className="text-sm text-slate-500 mb-4">Net worth across {sim.sims.toLocaleString()} simulated market paths over {sim.years} years (today&apos;s dollars).</p>
          <div className="report-avoid"><SimChart result={sim} currency={ccy} /></div>
          <div className="grid grid-cols-5 gap-2 mt-5 report-avoid">
            {([["P10", sim.final.p10], ["P25", sim.final.p25], ["P50", sim.final.p50], ["P75", sim.final.p75], ["P90", sim.final.p90]] as const).map(([k, v]) => (
              <div key={k} className="text-center">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{k}</div>
                <div className="font-display text-sm">{m(v)}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── RETIREMENT ── */}
        {sim.retirement && (
          <section className="report-page bg-white text-slate-900 rounded-xl border border-slate-200 shadow-sm p-10">
            <SectionTitle n="07" title="Will your money last?" />
            <div className="flex items-center gap-8 mt-4 report-avoid">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Success probability</div>
                <div className="font-display text-5xl text-primary">{pct(sim.retirement.successProbability)}</div>
              </div>
              <p className="text-sm text-slate-500 flex-1">
                Retiring at age {sim.retirement.retirementAge}, modelled through age {sim.retirement.planToAge}.{" "}
                {pct(sim.retirement.depletionProbability)} of scenarios exhaust the portfolio before then. Pensions are credited (with COLA) and RMDs are taken from tax-deferred accounts past age 73.
              </p>
            </div>
          </section>
        )}

        {/* ── METHODOLOGY + DISCLOSURES ── */}
        <section className="report-page bg-white text-slate-900 rounded-xl border border-slate-200 shadow-sm p-10">
          <SectionTitle n={sim.retirement ? "08" : "07"} title="Methodology & disclosures" />
          <ul className="text-sm text-slate-600 mt-4 space-y-2 list-disc pl-5 report-avoid">
            <li>Returns are simulated as log-normal draws. Portfolio expected return and volatility are derived from your actual allocation using per-asset-class capital-market assumptions and a correlation matrix (so diversification reduces risk).</li>
            <li>Expenses and goals are inflated at {pct(plan.inflationRate)} per year; income is taxed using simplified federal brackets.</li>
            <li>Loans amortize with real interest math; property appreciates stochastically and is not liquidated for spending.</li>
            {sim.retirement && <li>In retirement, salary stops, spending is drawn from taxable then tax-deferred accounts, pensions are credited, and RMDs are forced past age 73.</li>}
          </ul>
          <p className="text-xs text-slate-400 mt-6 leading-relaxed report-avoid">
            <strong>Important:</strong> This report is an illustrative projection based on the inputs provided and assumed
            capital-market parameters. It is not a prediction, guarantee, or personalized financial, tax, or investment
            advice. Actual results will differ. Consult a licensed advisor before making decisions.
          </p>
        </section>
      </div>
    </div>
  );
}

function SectionTitle({ n, title }: { n: string; title: string }) {
  return (
    <div className="flex items-baseline gap-3 border-b border-slate-200 pb-2">
      <span className="font-display text-lg text-primary">{n}</span>
      <h2 className="font-display text-2xl">{title}</h2>
    </div>
  );
}

function Stat({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div className="report-avoid">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">{label}</div>
      <div className={`font-display ${big ? "text-3xl" : "text-xl"}`}>{value}</div>
    </div>
  );
}

function Tr({ cells, head, strong, align }: { cells: string[]; head?: boolean; strong?: boolean; align?: Array<"left" | "right"> }) {
  return (
    <tr className={`${head ? "text-[10px] font-bold uppercase tracking-wider text-slate-400" : ""} ${strong ? "font-semibold border-t border-slate-200" : ""} border-b border-slate-100 last:border-0`}>
      {cells.map((c, i) => (
        <td key={i} className={`py-2 ${(align?.[i] ?? (i === 0 ? "left" : "left")) === "right" ? "text-right" : "text-left"} ${head ? "" : "text-slate-700"} tabular-nums`}>{c}</td>
      ))}
    </tr>
  );
}

"use client";

import type { WealthPlan } from "@/lib/engine/types";

import { useSimulation } from "@/lib/simulation/simulation-context";
import { useReport } from "@/lib/report/report-context";

import {
  formatMoney,
  estimateIncomeTax,
  ageFromDOB,
  calcMortgagePayment,
} from "@/lib/engine/financial-math";

import { RISK_PROFILES } from "@/lib/engine/constants";

import {
  CLASS_LABEL,
  CLASS_COLOR,
  normalizeClass,
  type AssetClass,
} from "@/lib/portfolio/asset-class";

import { Donut, type DonutSlice } from "@/components/portfolio/donut";

import { SimChart } from "@/components/sim/sim-chart";

import { CoverPage } from "./pages/cover-page";
import { ContentsPage } from "./pages/contents-page";

import { HowToReadPage } from "./pages/chapter-1/how-to-read-page";

import { WhereYouStandDivider } from "./pages/chapter-2/where-you-stand-divider";
import { HouseholdPage } from "./pages/chapter-2/household-page";
import { ExecutiveSummaryPage } from "./pages/chapter-2/executive-summary-page";
import { NetWorthPage } from "./pages/chapter-2/net-worth-page";

type Props = {
  plan: WealthPlan;
};

export function ReportView({ plan }: Props) {
  const { result: sim } = useSimulation();

  const { settings } = useReport();

  if (!sim) {
    return (
      <main className="min-h-screen bg-[#eef2f7] p-8">
        <div className="mx-auto max-w-3xl rounded-xl bg-white p-8 shadow">
          <p className="text-sm text-[#64748b]">
            No simulation result is available. Run the simulation first.
          </p>
        </div>
      </main>
    );
  }

  const currency = plan.currency || "USD";

  const money = (value: number) => formatMoney(value, currency);

  const sum = <T,>(items: T[], getValue: (item: T) => number) =>
    items.reduce((total, item) => total + (getValue(item) || 0), 0);

  const totalAssets = sum(plan.assets, (asset) => asset.value);

  const totalLiabilities = sum(plan.loans, (loan) => loan.bal);

  const netWorth = totalAssets - totalLiabilities;

  const grossIncome = sum(plan.incomes, (income) => income.amount);

  const taxableIncome = sum(
    plan.incomes.filter((income) => income.taxable !== false),
    (income) => income.amount,
  );

  const incomeTax = estimateIncomeTax(
    taxableIncome,
    plan.clients[0]?.country ?? "US",
  );

  const annualExpenses = sum(plan.expenses, (expense) => expense.amount) * 12;

  const annualDebtService = sum(plan.loans, (loan) =>
    loan.bal > 0 && loan.yrs > 0
      ? calcMortgagePayment(loan.bal, loan.rate, loan.yrs) * 12
      : 0,
  );

  const annualSurplus =
    grossIncome - incomeTax - annualExpenses - annualDebtService;

  const byClass = new Map<AssetClass, number>();

  for (const asset of plan.assets) {
    const assetClass = normalizeClass(asset.cls || asset.type);

    byClass.set(
      assetClass,
      (byClass.get(assetClass) ?? 0) + (asset.value || 0),
    );
  }

  const classRows = Array.from(byClass.entries()).sort((a, b) => b[1] - a[1]);

  const allocationSlices: DonutSlice[] = Array.from(byClass.entries()).map(
    ([cls, value]) => ({
      key: cls,

      pct: totalAssets > 0 ? (value / totalAssets) * 100 : 0,

      color: CLASS_COLOR[cls] ?? "#94a3b8",
    }),
  );

  const today = new Date().toISOString().slice(0, 10);

  const clientNames =
    plan.clients
      .map((client) => [client.first, client.last].filter(Boolean).join(" "))
      .filter(Boolean)
      .join(" & ") || "Client";

  const preparedFor = settings.preparedFor || clientNames;

  const percent = (value: number) => `${Math.round(value * 100)}%`;

  return (
    <div className="report-root min-h-screen bg-[#eef2f7] py-8 print:bg-white print:py-0">
      <style>{`
  @page {
    size: ${settings.pageSize === "a4" ? "A4" : "Letter"} ${
      settings.orientation
    };
    margin: 0;
  }

  @media print {
    html,
    body {
      margin: 0 !important;
      padding: 0 !important;
      background: white !important;
    }

    .report-noprint {
      display: none !important;
    }

    .report-root {
      background: white !important;
      padding: 0 !important;
    }

    .report-page {
      margin: 0 !important;
      box-shadow: none !important;
      border: 0 !important;
      border-radius: 0 !important;
      break-after: page;
      page-break-after: always;
    }

    .report-page:last-child {
      break-after: auto;
      page-break-after: auto;
    }

    .report-avoid {
      break-inside: avoid;
      page-break-inside: avoid;
    }
  }
`}</style>

      {/* Preview controls */}
      <div className="report-noprint mx-auto mb-6 flex max-w-3xl items-center justify-between">
        <div className="text-sm text-[#64748b]">Report preview</div>

        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-[#0057b8] px-5 py-2.5 text-[12px] font-bold text-white shadow hover:bg-[#0069d9]"
        >
          Print / Save PDF
        </button>
      </div>

      <div className="space-y-8 print:space-y-0">
        {" "}
        {/* Cover */}
        <CoverPage clientName={preparedFor} date={today} settings={settings} />
        {/* Contents */}
        <ContentsPage
          clientName={preparedFor}
          date={today}
          page={2}
          totalPages={48}
        />
        {/* How to read */}
        <HowToReadPage
          clientName={preparedFor}
          date={today}
          page={3}
          totalPages={48}
        />
        {/* Where you stand */}
        <WhereYouStandDivider
          clientName={preparedFor}
          date={today}
          page={4}
          totalPages={48}
        />
        {/* Household */}
        {settings.includeHousehold && (
          <HouseholdPage
            plan={plan}
            clientName={preparedFor}
            date={today}
            page={5}
            totalPages={48}
          />
        )}
        {/* Executive Summary */}
        {settings.includeExecutiveSummary && (
          <ExecutiveSummaryPage
            plan={plan}
            result={sim}
            clientName={preparedFor}
            date={today}
            page={6}
            totalPages={48}
            annualSurplus={annualSurplus}
          />
        )}
        {/* Net worth */}
        {settings.includeAssetsLiabilities && (
          <NetWorthPage
            plan={plan}
            clientName={preparedFor}
            date={today}
            page={8}
            totalPages={48}
          />
        )}
        {/* Cash flow */}
        {settings.includeIncomeExpenses && (
          <section className={pageClass}>
            <SectionTitle title="Income & Expenses" clientName={preparedFor} />
            <table className="mt-5 w-full text-[12px]">
              <tbody>
                <Tr
                  cells={["Gross annual income", money(grossIncome)]}
                  align={["left", "right"]}
                />

                <Tr
                  cells={["Estimated income tax", `(${money(incomeTax)})`]}
                  align={["left", "right"]}
                />

                <Tr
                  cells={["Annual expenses", `(${money(annualExpenses)})`]}
                  align={["left", "right"]}
                />

                <Tr
                  cells={["Debt service", `(${money(annualDebtService)})`]}
                  align={["left", "right"]}
                />

                <Tr
                  strong
                  cells={["Annual surplus", money(annualSurplus)]}
                  align={["left", "right"]}
                />
              </tbody>
            </table>
          </section>
        )}
        {/* Goals */}
        {settings.includeGoalsRetirement && plan.goals.length > 0 && (
          <section className={pageClass}>
            <SectionTitle
              title="Goals & Retirement Plan"
              clientName={preparedFor}
            />
            <table className="mt-5 w-full text-[12px]">
              <thead>
                <Tr
                  head
                  cells={["Goal", "Amount / yr", "Years", "Success"]}
                  align={["left", "right", "left", "right"]}
                />
              </thead>

              <tbody>
                {plan.goals.map((goal) => {
                  const success = sim.goalSuccess.find(
                    (item) => item.goalId === goal.id,
                  );

                  return (
                    <Tr
                      key={goal.id}
                      cells={[
                        goal.name || "(unnamed)",

                        money(goal.amt),

                        `${goal.startYear}–${goal.endYear}`,

                        success ? percent(success.probability) : "—",
                      ]}
                      align={["left", "right", "left", "right"]}
                    />
                  );
                })}
              </tbody>
            </table>
          </section>
        )}
        {/* Monte Carlo */}
        {settings.includeWealthProjection && (
          <section className={pageClass}>
            <SectionTitle
              title="What Could Your Wealth Look Like"
              clientName={preparedFor}
            />
            <p className="mb-5 mt-3 text-[12px] text-[#64748b]">
              Net worth across {sim.sims.toLocaleString()} simulated market
              paths over {sim.years} years.
            </p>

            <div className="report-avoid">
              <SimChart result={sim} currency={currency} />
            </div>

            <div className="report-avoid mt-6 grid grid-cols-5 gap-2">
              {[
                ["P10", sim.realFinal.p10],
                ["P25", sim.realFinal.p25],
                ["P50", sim.realFinal.p50],
                ["P75", sim.realFinal.p75],
                ["P90", sim.realFinal.p90],
              ].map(([label, value]) => (
                <div key={label as string} className="text-center">
                  <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">
                    {label}
                  </div>

                  <div className="mt-1 text-[12px] font-bold text-[#16213e]">
                    {money(value as number)}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        {/* Goal Success */}
        {settings.includeGoalSuccess && sim.goalSuccess.length > 0 && (
          <section className={pageClass}>
            <SectionTitle
              title="Goal Success Probability"
              clientName={preparedFor}
            />
            <div className="mt-5 space-y-4">
              {sim.goalSuccess.map((goal) => (
                <div
                  key={goal.goalId}
                  className="rounded-xl border border-[#e5eaf2] p-5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-[#16213e]">
                      {goal.goalName || "(unnamed goal)"}
                    </span>

                    <span className="text-[22px] font-extrabold text-[#0057b8]">
                      {percent(goal.probability)}
                    </span>
                  </div>

                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#eef2f7]">
                    <div
                      className="h-full rounded-full bg-[#0057b8]"
                      style={{
                        width: `${Math.min(
                          100,
                          Math.max(0, goal.probability * 100),
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        {/* Retirement */}
        {settings.includeGoalsRetirement && sim.retirement && (
          <section className={pageClass}>
            <SectionTitle
              title="Retirement Sustainability"
              clientName={preparedFor}
            />
            <div className="report-avoid mt-6 flex items-center gap-8">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">
                  Success probability
                </div>

                <div className="mt-2 text-[46px] font-extrabold text-[#0057b8]">
                  {percent(sim.retirement.successProbability)}
                </div>
              </div>

              <p className="flex-1 text-[12px] leading-6 text-[#64748b]">
                Retirement begins at age {sim.retirement.retirementAge},
                modelled through age {sim.retirement.planToAge}.{" "}
                {percent(sim.retirement.depletionProbability)} of simulated
                paths deplete the portfolio before the end of the plan.
              </p>
            </div>
          </section>
        )}
        {/* Methodology */}
        {settings.includeMethodology && (
          <section className={pageClass}>
            <SectionTitle
              title="Methodology & Assumptions"
              clientName={preparedFor}
            />
            <p className="mt-5 text-[12px] leading-6 text-[#64748b]">
              WealthAnalyzer uses market-simulation analysis to model a range of
              possible future outcomes using the household&apos;s financial
              inputs, investment assumptions and configured goals.
            </p>

            <p className="mt-4 text-[12px] leading-6 text-[#64748b]">
              Results are illustrative projections and are not predictions or
              guarantees. Tax calculations are simplified estimates.
            </p>

            {settings.customDisclosure && (
              <>
                <h3 className="mt-7 text-[13px] font-bold text-[#16213e]">
                  Additional Disclosure
                </h3>

                <p className="mt-3 whitespace-pre-wrap text-[12px] leading-6 text-[#64748b]">
                  {settings.customDisclosure}
                </p>
              </>
            )}
          </section>
        )}
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  clientName,
}: {
  title: string;
  clientName: string;
}) {
  return (
    <>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[#6b7280]">{clientName}</span>

        <span className="font-bold text-[#0867b9]">
          Private Wealth Intelligence
        </span>
      </div>

      <h2 className="mt-3 text-[21px] font-bold leading-none text-[#2e333a]">
        {title}
      </h2>

      <div className="mt-2 border-b-2 border-[#454c54]" />
    </>
  );
}

function SectionBar({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-4 flex min-h-[32px] items-center border-l-[5px] border-[#0874c9] bg-[#dceaf7] px-3">
      <h3 className="text-[14px] font-bold text-[#173d60]">{children}</h3>
    </div>
  );
}

function Stat({
  label,
  value,
  big = false,
}: {
  label: string;
  value: string;
  big?: boolean;
}) {
  return (
    <div className="rounded-xl bg-[#f8faff] p-4">
      <div className="text-[9px] font-bold uppercase tracking-[0.08em] text-[#9ca3af]">
        {label}
      </div>

      <div
        className={`mt-2 font-extrabold text-[#16213e] ${
          big ? "text-[25px]" : "text-[19px]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Tr({
  cells,
  head = false,
  strong = false,
  align,
}: {
  cells: string[];
  head?: boolean;
  strong?: boolean;
  align?: ("left" | "right" | "center")[];
}) {
  const Tag = head ? "th" : "td";

  return (
    <tr className="border-b border-[#edf1f6]">
      {cells.map((cell, index) => (
        <Tag
          key={index}
          className={`px-2 py-2 ${
            head
              ? "text-[9px] font-bold uppercase tracking-[0.06em] text-[#9ca3af]"
              : strong
                ? "font-bold text-[#16213e]"
                : "text-[#64748b]"
          } ${
            align?.[index] === "right"
              ? "text-right"
              : align?.[index] === "center"
                ? "text-center"
                : "text-left"
          }`}
        >
          {cell}
        </Tag>
      ))}
    </tr>
  );
}

const pageClass =
  "report-page relative mx-auto h-[210mm] w-[297mm] overflow-hidden bg-white px-[11mm] pb-[13mm] pt-[8mm] text-[#30343b] shadow-xl print:shadow-none";

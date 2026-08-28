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

import { buildLinearCashFlow } from "@/lib/engine/linear-cash-flow";

import { HowToReadPage } from "./pages/chapter-1/how-to-read-page";

import { WhereYouStandDivider } from "./pages/chapter-2/where-you-stand-divider";
import { HouseholdPage } from "./pages/chapter-2/household-page";
import { ExecutiveSummaryPage } from "./pages/chapter-2/executive-summary-page";
import { NetWorthPage } from "./pages/chapter-2/net-worth-page";
import { IncomeExpensesPage } from "./pages/chapter-2/income-expenses-page";
import { NetWorthSummaryPage } from "./pages/chapter-2/net-worth-summary-page";

import { GoalsRetirementDivider } from "./pages/chapter-3/goals-retirement-divider";
import { GoalsRetirementPage } from "./pages/chapter-3/goals-retirement-page";
import { RetirementIncomePage } from "./pages/chapter-3/retirement-income-page";
import { PlanStrategiesPage } from "./pages/chapter-3/plan-strategies-page";

import { FutureDivider } from "./pages/chapter-4/future-divider";
import { GoalSuccessPage } from "./pages/chapter-4/goal-success-page";
import { GoalFundingStatusPage } from "./pages/chapter-4/goal-funding-status-page";
import { GoalFundingStreamsPage } from "./pages/chapter-4/goal-funding-streams-page";
import { AchievableLifestylePage } from "./pages/chapter-4/achievable-lifestyle-page";
import { InvestmentsDivider } from "./pages/chapter-5/investments-divider";
import { InvestmentPolicyStatementPage } from "./pages/chapter-5/investment-policy-statement-page";
import { InvestmentPolicyStatementAllocationPage } from "./pages/chapter-5/investment-policy-statement-allocation-page";
import { InvestmentPolicyStatementChartsPage } from "./pages/chapter-5/investment-policy-statement-charts-page";
import { InvestmentPolicyStatementRebalancingPage } from "./pages/chapter-5/investment-policy-statement-rebalancing-page";
import { InvestmentPolicyStatementMonitoringPage } from "./pages/chapter-5/investment-policy-statement-monitoring-page";
import { PortfolioAnalysisPage } from "./pages/chapter-5/portfolio-analysis-page";
import { PortfolioAllocationPage } from "./pages/chapter-5/portfolio-allocation-page";
import { ProposedPortfolioPage } from "./pages/chapter-5/proposed-portfolio-page";
import { TotalPortfolioPage } from "./pages/chapter-5/total-portfolio-page";
import { PortfolioEfficiencyPage } from "./pages/chapter-5/portfolio-efficiency-page";
import { AllocationPerformancePage } from "./pages/chapter-5/allocation-performance-page";
import { WealthAllocationFrameworkPage } from "./pages/chapter-5/wealth-allocation-framework-page";
import { RiskCategoriesPage } from "./pages/chapter-5/risk-categories-page";
import { RiskCategoriesAspirationalPage } from "./pages/chapter-5/risk-categories-aspirational-page";
import { WealthRiskCurrentStatusPage } from "./pages/chapter-5/wealth-risk-current-status-page";
import { CurrentVsProposedPage } from "./pages/chapter-5/current-vs-proposed-page";

import { RetirementDividerPage } from "./pages/chapter-6/retirement-divider-page";
import { WealthProjectionPage } from "./pages/chapter-6/wealth-projection-page";
import { WealthOutcomesPage } from "./pages/chapter-6/wealth-outcomes-page";
import { AnnualPotentialWealthPage } from "./pages/chapter-6/annual-potential-wealth-page";
import { AnnualPotentialWealthContinuationPage } from "./pages/chapter-6/annual-potential-wealth-continuation-page";
import { CashFlowProjectionPage } from "./pages/chapter-6/cash-flow-projection-page";
import { CashFlowProjectionContinuationPage } from "./pages/chapter-6/cash-flow-projection-continuation-page";
import { RetirementPensionsPage } from "./pages/chapter-6/retirement-pensions-page";

import { InvestmentFactSheetsDivider } from "./pages/chapter-7/investment-fact-sheets-divider";
import { InvestmentVehicleFactSheetsPage } from "./pages/chapter-7/investment-vehicle-fact-sheets-page";

import { AppendixDivider } from "./pages/chapter-8/appendix-divider";
import { CapitalMarketAssumptionsPage } from "./pages/chapter-8/capital-market-assumptions-page";
import { MethodologyAssumptionsPage } from "./pages/chapter-8/methodology-assumptions-page";
import { GlossaryPage } from "./pages/chapter-8/glossary-page";
import { GlossaryContinuationPage } from "./pages/chapter-8/glossary-continuation-page";
import { DisclosuresPage } from "./pages/chapter-8/disclosures-page";

import type { Proposal } from "@/lib/orders/proposal";

type Props = {
  plan: WealthPlan;
  proposal?: Proposal | null;
};

export function ReportView({ plan, proposal }: Props) {
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

  // cash flow
  const cashFlowResult = buildLinearCashFlow(plan);

  const cashFlowRows = cashFlowResult.rows.map((row) => ({
    year: row.year,
    age: row.age,
    phase: row.phase,

    earnedIncome: row.earnedIncome,
    pensionIncome: row.pensionRmdIncome,

    expenses: row.expenses,
    debtService: row.debtService,

    savingsTarget: row.savingsTarget,
    surplus: row.surplusDeficit,

    goalOutflow: row.goalOutflow,

    cash: row.cash,
    investments: row.investments,
    retirementPool: row.retirementPool,

    propertyOther: row.propertyValue + row.otherAssets,

    netWorth: row.netWorth,

    notes: row.notes.join(", "),
  }));

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
  .app-sidebar {
  display: none !important;
}
  html,
  body {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;

    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .report-noprint {
    display: none !important;
  }

  .report-root {
    margin: 0 !important;
    padding: 0 !important;
    background: white !important;

    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .report-page {
    margin: 0 !important;
    box-shadow: none !important;
    border: 0 !important;
    border-radius: 0 !important;

    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;

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
          totalPages={52}
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
          totalPages={52}
        />
        {/* Household */}
        {settings.includeHousehold && (
          <HouseholdPage
            plan={plan}
            clientName={preparedFor}
            date={today}
            page={5}
            totalPages={52}
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
            totalPages={52}
            annualSurplus={annualSurplus}
          />
        )}
        {/* Income & Expenses */}
        {settings.includeIncomeExpenses && (
          <IncomeExpensesPage
            plan={plan}
            clientName={preparedFor}
            date={today}
            page={7}
            totalPages={52}
          />
        )}
        {/* Net worth statement */}
        {settings.includeAssetsLiabilities && (
          <NetWorthPage
            plan={plan}
            clientName={preparedFor}
            date={today}
            page={8}
            totalPages={52}
          />
        )}
        {/* Net Worth Summary */}
        {settings.includeAssetsLiabilities && (
          <NetWorthSummaryPage
            plan={plan}
            clientName={preparedFor}
            date={today}
            page={8}
            totalPages={52}
          />
        )}
        {/* Goals retirement divider */}
        <GoalsRetirementDivider
          clientName={preparedFor}
          date={today}
          page={4}
          totalPages={52}
        />
        {/* Goals & Retirement Plan */}
        {settings.includeGoalsRetirement && (
          <GoalsRetirementPage
            plan={plan}
            clientName={preparedFor}
            date={today}
            page={11}
            totalPages={52}
          />
        )}
        <RetirementIncomePage
          plan={plan}
          clientName={preparedFor}
          date={today}
          page={12}
          totalPages={52}
        />
        <PlanStrategiesPage
          plan={plan}
          clientName={preparedFor}
          date={today}
          page={13}
          totalPages={52}
        />
        {/* Chapter 4 divider */}
        <FutureDivider
          clientName={preparedFor}
          date={today}
          page={14}
          totalPages={52}
        />
        <GoalSuccessPage
          plan={plan}
          result={sim}
          clientName={preparedFor}
          date={today}
          page={15}
          totalPages={52}
        />
        <GoalFundingStatusPage
          plan={plan}
          result={sim}
          clientName={preparedFor}
          date={today}
          page={16}
          totalPages={52}
        />
        <GoalFundingStreamsPage
          clientName={preparedFor}
          date={today}
          page={17}
          totalPages={52}
        />
        <AchievableLifestylePage
          plan={plan}
          result={sim}
          clientName={preparedFor}
          date={today}
          page={18}
          totalPages={52}
        />
        {/* Chapter 5 */}
        <InvestmentsDivider
          clientName={preparedFor}
          date={today}
          page={19}
          totalPages={52}
        />
        <InvestmentPolicyStatementPage
          plan={plan}
          clientName={preparedFor}
          date={today}
          page={20}
          totalPages={52}
        />
        <InvestmentPolicyStatementAllocationPage
          plan={plan}
          clientName={preparedFor}
          date={today}
          page={21}
          totalPages={52}
        />
        <InvestmentPolicyStatementChartsPage
          plan={plan}
          clientName={preparedFor}
          date={today}
          page={22}
          totalPages={52}
        />
        <InvestmentPolicyStatementRebalancingPage
          plan={plan}
          clientName={preparedFor}
          date={today}
          page={23}
          totalPages={52}
        />
        <InvestmentPolicyStatementMonitoringPage
          plan={plan}
          clientName={preparedFor}
          date={today}
          page={24}
          totalPages={52}
        />
        <PortfolioAnalysisPage
          plan={plan}
          proposal={proposal ?? null}
          clientName={preparedFor}
          date={today}
          page={25}
          totalPages={52}
        />
        <PortfolioAllocationPage
          plan={plan}
          clientName={preparedFor}
          date={today}
          page={26}
          totalPages={52}
        />
        {proposal && (
          <ProposedPortfolioPage
            proposal={proposal}
            clientName={preparedFor}
            date={today}
            page={27}
            totalPages={52}
          />
        )}
        {proposal && (
          <CurrentVsProposedPage
            plan={plan}
            proposal={proposal}
            clientName={preparedFor}
            date={today}
            page={28}
            totalPages={52}
          />
        )}
        <TotalPortfolioPage
          plan={plan}
          clientName={preparedFor}
          date={today}
          page={29}
          totalPages={52}
        />
        <PortfolioEfficiencyPage
          plan={plan}
          clientName={preparedFor}
          date={today}
          page={30}
          totalPages={52}
        />
        <AllocationPerformancePage
          plan={plan}
          clientName={preparedFor}
          date={today}
          page={31}
          totalPages={52}
        />
        <WealthAllocationFrameworkPage
          plan={plan}
          clientName={preparedFor}
          date={today}
          page={32}
          totalPages={52}
        />
        <RiskCategoriesPage
          plan={plan}
          clientName={preparedFor}
          date={today}
          page={33}
          totalPages={52}
        />
        <RiskCategoriesAspirationalPage
          plan={plan}
          clientName={preparedFor}
          date={today}
          page={34}
          totalPages={52}
        />
        <WealthRiskCurrentStatusPage
          plan={plan}
          clientName={preparedFor}
          date={today}
          page={35}
          totalPages={52}
        />
        {/* Chapter 6 */}
        <RetirementDividerPage
          clientName={preparedFor}
          date={today}
          page={36}
          totalPages={52}
        />
        {sim && (
          <WealthProjectionPage
            plan={plan}
            result={sim}
            clientName={preparedFor}
            date={today}
            page={37}
            totalPages={52}
          />
        )}
        <WealthOutcomesPage
          plan={plan}
          result={sim}
          clientName={preparedFor}
          date={today}
          page={38}
          totalPages={52}
        />
        <AnnualPotentialWealthPage
          plan={plan}
          result={sim}
          clientName={preparedFor}
          date={today}
          page={39}
          totalPages={52}
        />
        <AnnualPotentialWealthContinuationPage
          plan={plan}
          result={sim}
          clientName={preparedFor}
          date={today}
          page={40}
          totalPages={52}
        />
        <CashFlowProjectionPage
          plan={plan}
          rows={cashFlowRows}
          clientName={preparedFor}
          date={today}
          page={41}
          totalPages={52}
        />
        <CashFlowProjectionContinuationPage
          plan={plan}
          rows={cashFlowRows}
          startIndex={10}
          endIndex={35}
          clientName={preparedFor}
          date={today}
          page={42}
          totalPages={52}
        />
        <CashFlowProjectionContinuationPage
          plan={plan}
          rows={cashFlowRows}
          startIndex={35}
          clientName={preparedFor}
          date={today}
          page={43}
          totalPages={52}
        />
        <RetirementPensionsPage
          plan={plan}
          clientName={preparedFor}
          date={today}
          page={44}
          totalPages={52}
        />
        {/* Chapter 7 */}
        <InvestmentFactSheetsDivider
          clientName={preparedFor}
          date={today}
          page={45}
          totalPages={52}
        />
        {proposal && (
          <InvestmentVehicleFactSheetsPage
            proposal={proposal}
            clientName={preparedFor}
            date={today}
            page={46}
            totalPages={52}
          />
        )}
        {/* Chapter 8 */}
        <AppendixDivider
          clientName={preparedFor}
          date={today}
          page={47}
          totalPages={52}
        />
        <CapitalMarketAssumptionsPage
          plan={plan}
          clientName={preparedFor}
          date={today}
          page={48}
          totalPages={52}
        />
        <MethodologyAssumptionsPage
          plan={plan}
          clientName={preparedFor}
          date={today}
          page={49}
          totalPages={52}
        />
        <MethodologyAssumptionsPage
          plan={plan}
          clientName={preparedFor}
          date={today}
          page={49}
          totalPages={52}
        />
        <GlossaryPage
          clientName={preparedFor}
          date={today}
          page={50}
          totalPages={52}
        />
        <GlossaryContinuationPage
          clientName={preparedFor}
          date={today}
          page={51}
          totalPages={52}
        />
        <GlossaryContinuationPage
          clientName={preparedFor}
          date={today}
          page={51}
          totalPages={52}
        />
        <DisclosuresPage
          clientName={preparedFor}
          date={today}
          page={52}
          totalPages={52}
        />
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

// const pageClass =
//   "report-page relative mx-auto h-[210mm] w-[297mm] overflow-hidden bg-white px-[11mm] pb-[13mm] pt-[8mm] text-[#30343b] shadow-xl print:shadow-none";
const pageClass =
  "report-page relative mx-auto overflow-hidden bg-white px-[11mm] pb-[13mm] pt-[8mm] text-[#30343b] shadow-xl print:shadow-none";

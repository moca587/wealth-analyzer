"use client";

import type { WealthPlan } from "@/lib/engine/types";
import type { Proposal } from "@/lib/orders/proposal";
import type { ReportSectionId } from "@/lib/report/report-settings";

import { useSimulation } from "@/lib/simulation/simulation-context";
import { useReport } from "@/lib/report/report-context";

import {
  estimateIncomeTax,
  calcMortgagePayment,
} from "@/lib/engine/financial-math";

import { buildLinearCashFlow } from "@/lib/engine/linear-cash-flow";

import { CoverPage } from "./pages/cover-page";
import { ContentsPage, type ContentsItem } from "./pages/contents-page";

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
import { CurrentVsProposedPage } from "./pages/chapter-5/current-vs-proposed-page";

import { TotalPortfolioPage } from "./pages/chapter-5/total-portfolio-page";
import { PortfolioEfficiencyPage } from "./pages/chapter-5/portfolio-efficiency-page";
import { AllocationPerformancePage } from "./pages/chapter-5/allocation-performance-page";

import { WealthAllocationFrameworkPage } from "./pages/chapter-5/wealth-allocation-framework-page";
import { RiskCategoriesPage } from "./pages/chapter-5/risk-categories-page";
import { RiskCategoriesAspirationalPage } from "./pages/chapter-5/risk-categories-aspirational-page";
import { WealthRiskCurrentStatusPage } from "./pages/chapter-5/wealth-risk-current-status-page";

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

import { PowerOfCompoundingPage } from "./pages/chapter-8/power-of-compounding-page";
import { CostOfTryingToTimeMarketPage } from "./pages/chapter-8/cost-of-trying-to-time-market-page";
import { BehaviourGapPage } from "./pages/chapter-8/behaviour-gap-page";
import { StayingInvestedThroughDownturnsPage } from "./pages/chapter-8/staying-invested-through-downturns-page";
import { RiskAndReturnPage } from "./pages/chapter-8/risk-and-return-page";
import { CostOfWaitingToStartPage } from "./pages/chapter-8/cost-of-waiting-to-start-page";
import { RetirementMixShiftsPage } from "./pages/chapter-8/retirement-mix-shifts-page";
import { DiversificationSmoothsPage } from "./pages/chapter-8/diversification-smooths-page";
import { InflationPurchasingPowerPage } from "./pages/chapter-8/inflation-purchasing-power-page";
import { BuildingRetirementPaycheckPage } from "./pages/chapter-8/building-retirement-paycheck-page";
import { OrderOfReturnsPage } from "./pages/chapter-8/order-of-returns-page";
import { EmotionsDriveInvestmentDecisionsPage } from "./pages/chapter-8/emotions-drive-investment-decisions-page";

type ReportPageRenderer = (page: number, totalPages: number) => React.ReactNode;

type ReportSectionDefinition = {
  title: string;
  pages: ReportPageRenderer[];
};

type Props = {
  plan: WealthPlan;
  proposal?: Proposal | null;
};

const FIXED_FRONT_PAGES = 3;

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

  // -------------------------------------------------------
  // Cash-flow data
  // -------------------------------------------------------

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

  // -------------------------------------------------------
  // Executive-summary calculations
  // -------------------------------------------------------

  const sum = <T,>(items: T[], getValue: (item: T) => number) =>
    items.reduce((total, item) => total + (getValue(item) || 0), 0);

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

  // -------------------------------------------------------
  // Shared report info
  // -------------------------------------------------------

  const today = new Date().toISOString().slice(0, 10);

  const clientNames =
    plan.clients
      .map((client) => [client.first, client.last].filter(Boolean).join(" "))
      .filter(Boolean)
      .join(" & ") || "Client";

  const preparedFor = settings.preparedFor || clientNames;

  // -------------------------------------------------------
  // Logical report sections
  // -------------------------------------------------------

  const sections: Partial<Record<ReportSectionId, ReportSectionDefinition>> = {
    // =====================================================
    // CHAPTER 2
    // =====================================================

    "household-profile": {
      title: "Household Profile",

      pages: settings.includeHousehold
        ? [
            (page, totalPages) => (
              <WhereYouStandDivider
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <HouseholdPage
                plan={plan}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),
          ]
        : [],
    },

    "about-client": {
      title: "About the Client",
      pages: [],
    },

    "executive-summary": {
      title: "Executive Summary: Key Findings",

      pages: settings.includeExecutiveSummary
        ? [
            (page, totalPages) => (
              <ExecutiveSummaryPage
                plan={plan}
                result={sim}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
                annualSurplus={annualSurplus}
              />
            ),
          ]
        : [],
    },

    "income-expenses": {
      title: "Income & Expenses",

      pages: settings.includeIncomeExpenses
        ? [
            (page, totalPages) => (
              <IncomeExpensesPage
                plan={plan}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),
          ]
        : [],
    },

    "net-worth": {
      title: "Net Worth Statement",

      pages: settings.includeAssetsLiabilities
        ? [
            (page, totalPages) => (
              <NetWorthPage
                plan={plan}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <NetWorthSummaryPage
                plan={plan}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),
          ]
        : [],
    },

    "protection-insurance": {
      title: "Protection & Insurance",
      pages: [],
    },

    // =====================================================
    // CHAPTER 3
    // =====================================================

    "goals-retirement": {
      title: "Goals & Retirement Plan",

      pages: settings.includeGoalsRetirement
        ? [
            (page, totalPages) => (
              <GoalsRetirementDivider
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <GoalsRetirementPage
                plan={plan}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <RetirementIncomePage
                plan={plan}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),
          ]
        : [],
    },

    "plan-strategies": {
      title: "Plan Strategies",

      pages: [
        (page, totalPages) => (
          <PlanStrategiesPage
            plan={plan}
            clientName={preparedFor}
            date={today}
            page={page}
            totalPages={totalPages}
          />
        ),
      ],
    },

    // =====================================================
    // CHAPTER 4
    // =====================================================

    "goal-success": {
      title: "Goal Success Probability",

      pages: settings.includeGoalSuccess
        ? [
            (page, totalPages) => (
              <FutureDivider
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <GoalSuccessPage
                plan={plan}
                result={sim}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),
          ]
        : [],
    },

    "goal-funding": {
      title: "Key Factors: Goal Funding Status",

      pages: settings.includeGoalSuccess
        ? [
            (page, totalPages) => (
              <GoalFundingStatusPage
                plan={plan}
                result={sim}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <GoalFundingStreamsPage
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),
          ]
        : [],
    },

    "achievable-lifestyle": {
      title: "Potentially Achievable Lifestyle",

      pages: settings.includeGoalSuccess
        ? [
            (page, totalPages) => (
              <AchievableLifestylePage
                plan={plan}
                result={sim}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),
          ]
        : [],
    },

    // =====================================================
    // CHAPTER 5
    // =====================================================

    "investment-policy": {
      title: "Investment Policy Statement",

      pages: settings.includePortfolio
        ? [
            (page, totalPages) => (
              <InvestmentsDivider
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <InvestmentPolicyStatementPage
                plan={plan}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <InvestmentPolicyStatementAllocationPage
                plan={plan}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <InvestmentPolicyStatementChartsPage
                plan={plan}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <InvestmentPolicyStatementRebalancingPage
                plan={plan}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <InvestmentPolicyStatementMonitoringPage
                plan={plan}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),
          ]
        : [],
    },

    "portfolio-analysis": {
      title: "Portfolio Analysis",

      pages: settings.includePortfolio
        ? [
            (page, totalPages) => (
              <PortfolioAnalysisPage
                plan={plan}
                proposal={proposal ?? null}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <PortfolioAllocationPage
                plan={plan}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),
          ]
        : [],
    },

    "proposed-portfolio": {
      title: "Proposed Portfolio",

      pages:
        settings.includePortfolio && proposal
          ? [
              (page, totalPages) => (
                <ProposedPortfolioPage
                  proposal={proposal}
                  clientName={preparedFor}
                  date={today}
                  page={page}
                  totalPages={totalPages}
                />
              ),

              (page, totalPages) => (
                <CurrentVsProposedPage
                  plan={plan}
                  proposal={proposal}
                  clientName={preparedFor}
                  date={today}
                  page={page}
                  totalPages={totalPages}
                />
              ),
            ]
          : [],
    },

    "total-portfolio": {
      title: "A View of Your Total Portfolio",

      pages: settings.includePortfolio
        ? [
            (page, totalPages) => (
              <TotalPortfolioPage
                plan={plan}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),
          ]
        : [],
    },

    "portfolio-efficiency": {
      title: "Evaluating Portfolio Efficiency",

      pages: settings.includePortfolio
        ? [
            (page, totalPages) => (
              <PortfolioEfficiencyPage
                plan={plan}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),
          ]
        : [],
    },

    "allocation-performance": {
      title: "Asset Class & Allocation Performance",

      pages: settings.includePortfolio
        ? [
            (page, totalPages) => (
              <AllocationPerformancePage
                plan={plan}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),
          ]
        : [],
    },

    "wealth-allocation-framework": {
      title: "Overview: Wealth Allocation Framework",

      pages: settings.includeWealthAllocation
        ? [
            (page, totalPages) => (
              <WealthAllocationFrameworkPage
                plan={plan}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),
          ]
        : [],
    },

    "risk-categories": {
      title: "Overview: Risk Categories",

      pages: settings.includeWealthAllocation
        ? [
            (page, totalPages) => (
              <RiskCategoriesPage
                plan={plan}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <RiskCategoriesAspirationalPage
                plan={plan}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),
          ]
        : [],
    },

    "wealth-risk-status": {
      title: "Wealth & Risk Allocation: Current Status",

      pages: settings.includeWealthAllocation
        ? [
            (page, totalPages) => (
              <WealthRiskCurrentStatusPage
                plan={plan}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),
          ]
        : [],
    },

    // =====================================================
    // CHAPTER 6
    // =====================================================

    "wealth-projection": {
      title: "What Could Your Wealth Look Like",

      pages: settings.includeWealthProjection
        ? [
            (page, totalPages) => (
              <RetirementDividerPage
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <WealthProjectionPage
                plan={plan}
                result={sim}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <WealthOutcomesPage
                plan={plan}
                result={sim}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),
          ]
        : [],
    },

    "annual-potential-wealth": {
      title: "Annual Potential Wealth",

      pages: settings.includeWealthProjection
        ? [
            (page, totalPages) => (
              <AnnualPotentialWealthPage
                plan={plan}
                result={sim}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <AnnualPotentialWealthContinuationPage
                plan={plan}
                result={sim}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),
          ]
        : [],
    },

    "cash-flow": {
      title: "Cash-Flow Projection",

      pages:
        settings.includeWealthProjection && settings.cashFlowDetail !== "none"
          ? [
              (page, totalPages) => (
                <CashFlowProjectionPage
                  plan={plan}
                  rows={cashFlowRows}
                  clientName={preparedFor}
                  date={today}
                  page={page}
                  totalPages={totalPages}
                />
              ),

              (page, totalPages) => (
                <CashFlowProjectionContinuationPage
                  plan={plan}
                  rows={cashFlowRows}
                  startIndex={10}
                  endIndex={35}
                  clientName={preparedFor}
                  date={today}
                  page={page}
                  totalPages={totalPages}
                />
              ),

              (page, totalPages) => (
                <CashFlowProjectionContinuationPage
                  plan={plan}
                  rows={cashFlowRows}
                  startIndex={35}
                  clientName={preparedFor}
                  date={today}
                  page={page}
                  totalPages={totalPages}
                />
              ),
            ]
          : [],
    },

    "retirement-pensions": {
      title: "Retirement Pensions",

      pages: settings.includeWealthProjection
        ? [
            (page, totalPages) => (
              <RetirementPensionsPage
                plan={plan}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),
          ]
        : [],
    },

    "what-if": {
      title: "What-If Scenarios",
      pages: [],
    },

    // =====================================================
    // CHAPTER 7
    // =====================================================

    "investment-fact-sheets": {
      title: "Investment Vehicle Fact Sheets",

      pages:
        settings.includePortfolio && proposal
          ? [
              (page, totalPages) => (
                <InvestmentFactSheetsDivider
                  clientName={preparedFor}
                  date={today}
                  page={page}
                  totalPages={totalPages}
                />
              ),

              (page, totalPages) => (
                <InvestmentVehicleFactSheetsPage
                  proposal={proposal}
                  clientName={preparedFor}
                  date={today}
                  page={page}
                  totalPages={totalPages}
                />
              ),
            ]
          : [],
    },

    // =====================================================
    // CHAPTER 8
    // =====================================================

    "appendix-divider": {
      title: "Appendix",

      pages: [
        (page, totalPages) => (
          <AppendixDivider
            clientName={preparedFor}
            date={today}
            page={page}
            totalPages={totalPages}
          />
        ),
      ],
    },

    "investor-education": {
      title: "Investor Education",

      pages: settings.includeInvestorEducation
        ? [
            (page, totalPages) => (
              <PowerOfCompoundingPage
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <CostOfTryingToTimeMarketPage
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <BehaviourGapPage
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <StayingInvestedThroughDownturnsPage
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <RiskAndReturnPage
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <CostOfWaitingToStartPage
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <RetirementMixShiftsPage
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <DiversificationSmoothsPage
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <InflationPurchasingPowerPage
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <BuildingRetirementPaycheckPage
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <OrderOfReturnsPage
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <EmotionsDriveInvestmentDecisionsPage
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),
          ]
        : [],
    },

    "capital-market-assumptions": {
      title: "Capital Market Assumptions",

      pages: [
        (page, totalPages) => (
          <CapitalMarketAssumptionsPage
            plan={plan}
            clientName={preparedFor}
            date={today}
            page={page}
            totalPages={totalPages}
          />
        ),
      ],
    },

    methodology: {
      title: "Methodology & Assumptions",

      pages: settings.includeMethodology
        ? [
            (page, totalPages) => (
              <MethodologyAssumptionsPage
                plan={plan}
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),
          ]
        : [],
    },

    glossary: {
      title: "Glossary of Terms",

      pages: settings.includeGlossary
        ? [
            (page, totalPages) => (
              <GlossaryPage
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),

            (page, totalPages) => (
              <GlossaryContinuationPage
                clientName={preparedFor}
                date={today}
                page={page}
                totalPages={totalPages}
              />
            ),
          ]
        : [],
    },

    disclosures: {
      title: "Disclosures",

      pages:
        settings.disclosureProfile !== "none"
          ? [
              (page, totalPages) => (
                <DisclosuresPage
                  clientName={preparedFor}
                  date={today}
                  page={page}
                  totalPages={totalPages}
                />
              ),
            ]
          : [],
    },
  };

  // -------------------------------------------------------
  // Turn section order into physical page order
  // -------------------------------------------------------

  const orderedPages = settings.sectionOrder.flatMap(
    (sectionId) => sections[sectionId]?.pages ?? [],
  );

  const totalPages = FIXED_FRONT_PAGES + orderedPages.length;

  // -------------------------------------------------------
  // Determine which logical sections actually exist
  // -------------------------------------------------------

  const activeSections = settings.sectionOrder
    .map((sectionId) => ({
      id: sectionId,
      definition: sections[sectionId],
    }))
    .filter(
      (
        item,
      ): item is {
        id: ReportSectionId;
        definition: ReportSectionDefinition;
      } => item.definition != null && item.definition.pages.length > 0,
    );

  // -------------------------------------------------------
  // Find starting physical page for every section
  // -------------------------------------------------------

  let nextPage = FIXED_FRONT_PAGES + 1;

  const sectionStartPages = new Map<ReportSectionId, number>();

  for (const section of activeSections) {
    sectionStartPages.set(section.id, nextPage);

    nextPage += section.definition.pages.length;
  }

  // -------------------------------------------------------
  // Build Contents page
  // -------------------------------------------------------

  const contentsItems: ContentsItem[] = [
    {
      number: "CHAPTER 1",
      title: "How to Read This Report",
      page: 3,
      chapter: true,
    },
    {
      number: "01",
      title: "How to Read This Report",
      page: 3,
    },
  ];

  function addContentsItem(
    number: string,
    sectionId: ReportSectionId,
    title: string,
  ) {
    const page = sectionStartPages.get(sectionId);

    if (page == null) {
      return;
    }

    contentsItems.push({
      number,
      title,
      page,
    });
  }

  // -------------------------------------------------------
  // Chapter 2
  // -------------------------------------------------------

  const chapter2Page =
    sectionStartPages.get("household-profile") ??
    sectionStartPages.get("executive-summary") ??
    sectionStartPages.get("income-expenses") ??
    sectionStartPages.get("net-worth");

  if (chapter2Page != null) {
    contentsItems.push({
      number: "CHAPTER 2",
      title: "Where You Stand Today",
      page: chapter2Page,
      chapter: true,
    });

    addContentsItem("02", "household-profile", "Household Profile");

    addContentsItem(
      "03",
      "executive-summary",
      "Executive Summary: Key Findings",
    );

    addContentsItem("04", "income-expenses", "Income & Expenses");

    addContentsItem("05", "net-worth", "Net Worth Statement");
  }

  // -------------------------------------------------------
  // Chapter 3
  // -------------------------------------------------------

  const chapter3Page =
    sectionStartPages.get("goals-retirement") ??
    sectionStartPages.get("plan-strategies");

  if (chapter3Page != null) {
    contentsItems.push({
      number: "CHAPTER 3",
      title: "Your Goals & Retirement Plan",
      page: chapter3Page,
      chapter: true,
    });

    addContentsItem("06", "goals-retirement", "Goals & Retirement Plan");

    addContentsItem("07", "plan-strategies", "Plan Strategies");
  }

  // -------------------------------------------------------
  // Chapter 4
  // -------------------------------------------------------

  const chapter4Page =
    sectionStartPages.get("goal-success") ??
    sectionStartPages.get("goal-funding") ??
    sectionStartPages.get("achievable-lifestyle");

  if (chapter4Page != null) {
    contentsItems.push({
      number: "CHAPTER 4",
      title: "What the Future May Hold",
      page: chapter4Page,
      chapter: true,
    });

    addContentsItem("08", "goal-success", "Goal Success Probability");

    addContentsItem("09", "goal-funding", "Key Factors: Goal Funding Status");

    addContentsItem(
      "10",
      "achievable-lifestyle",
      "Potentially Achievable Lifestyle",
    );
  }

  // -------------------------------------------------------
  // Chapter 5
  // -------------------------------------------------------

  const chapter5Page =
    sectionStartPages.get("investment-policy") ??
    sectionStartPages.get("portfolio-analysis") ??
    sectionStartPages.get("proposed-portfolio") ??
    sectionStartPages.get("total-portfolio");

  if (chapter5Page != null) {
    contentsItems.push({
      number: "CHAPTER 5",
      title: "Your Investments",
      page: chapter5Page,
      chapter: true,
    });

    addContentsItem("11", "investment-policy", "Investment Policy Statement");

    addContentsItem("12", "portfolio-analysis", "Portfolio Analysis");

    addContentsItem("13", "proposed-portfolio", "Proposed Portfolio");

    addContentsItem("14", "total-portfolio", "A View of Your Total Portfolio");

    addContentsItem(
      "15",
      "portfolio-efficiency",
      "Evaluating Portfolio Efficiency",
    );

    addContentsItem(
      "16",
      "allocation-performance",
      "Asset Class & Allocation Performance",
    );

    addContentsItem(
      "17",
      "wealth-allocation-framework",
      "Overview: Wealth Allocation Framework",
    );

    addContentsItem("18", "risk-categories", "Overview: Risk Categories");

    addContentsItem(
      "19",
      "wealth-risk-status",
      "Wealth & Risk Allocation: Current Status",
    );
  }

  // -------------------------------------------------------
  // Chapter 6
  // -------------------------------------------------------

  const chapter6Page =
    sectionStartPages.get("wealth-projection") ??
    sectionStartPages.get("annual-potential-wealth") ??
    sectionStartPages.get("cash-flow") ??
    sectionStartPages.get("retirement-pensions");

  if (chapter6Page != null) {
    contentsItems.push({
      number: "CHAPTER 6",
      title: "Retirement",
      page: chapter6Page,
      chapter: true,
    });

    addContentsItem(
      "20",
      "wealth-projection",
      "What Could Your Wealth Look Like",
    );

    addContentsItem("21", "annual-potential-wealth", "Annual Potential Wealth");

    addContentsItem("22", "cash-flow", "Cash-Flow Projection");

    addContentsItem("23", "retirement-pensions", "Retirement Pensions");
  }

  // -------------------------------------------------------
  // Chapter 7
  // -------------------------------------------------------

  const chapter7Page = sectionStartPages.get("investment-fact-sheets");

  if (chapter7Page != null) {
    contentsItems.push({
      number: "CHAPTER 7",
      title: "Investment Fact Sheets",
      page: chapter7Page,
      chapter: true,
    });

    addContentsItem(
      "24",
      "investment-fact-sheets",
      "Investment Vehicle Fact Sheets",
    );
  }

  // -------------------------------------------------------
  // Chapter 8
  // -------------------------------------------------------

  const chapter8Page =
    sectionStartPages.get("appendix-divider") ??
    sectionStartPages.get("investor-education") ??
    sectionStartPages.get("capital-market-assumptions") ??
    sectionStartPages.get("methodology") ??
    sectionStartPages.get("glossary") ??
    sectionStartPages.get("disclosures");

  if (chapter8Page != null) {
    contentsItems.push({
      number: "CHAPTER 8",
      title: "Appendix",
      page: chapter8Page,
      chapter: true,
    });

    addContentsItem("25", "investor-education", "Investor Education");

    addContentsItem(
      "26",
      "capital-market-assumptions",
      "Capital Market Assumptions",
    );

    addContentsItem("27", "methodology", "Methodology & Assumptions");

    addContentsItem("28", "glossary", "Glossary of Terms");

    addContentsItem("29", "disclosures", "Disclosures");
  }

  // -------------------------------------------------------
  // Render
  // -------------------------------------------------------

  return (
    <div className="report-root min-h-screen bg-[#eef2f7] py-8 print:bg-white print:py-0">
      <style>{`
        @page {
          size: ${
            settings.pageSize === "a4" ? "A4" : "Letter"
          } ${settings.orientation};
          margin: 0;
        }

        .report-page {
          width: ${
            settings.pageSize === "a4"
              ? settings.orientation === "landscape"
                ? "297mm"
                : "210mm"
              : settings.orientation === "landscape"
                ? "11in"
                : "8.5in"
          };

          height: ${
            settings.pageSize === "a4"
              ? settings.orientation === "landscape"
                ? "210mm"
                : "297mm"
              : settings.orientation === "landscape"
                ? "8.5in"
                : "11in"
          };
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

      <div className="report-noprint mx-auto mb-6 flex max-w-3xl items-center justify-between">
        <div className="text-sm text-[#64748b]">
          Report preview · {totalPages} pages
        </div>

        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-[#0057b8] px-5 py-2.5 text-[12px] font-bold text-white shadow hover:bg-[#0069d9]"
        >
          Print / Save PDF
        </button>
      </div>

      <div className="space-y-8 print:space-y-0">
        <CoverPage clientName={preparedFor} date={today} settings={settings} />

        <ContentsPage
          clientName={preparedFor}
          date={today}
          page={2}
          totalPages={totalPages}
          items={contentsItems}
        />

        <HowToReadPage
          clientName={preparedFor}
          date={today}
          page={3}
          totalPages={totalPages}
        />

        {orderedPages.map((renderPage, index) => (
          <div key={index}>
            {renderPage(index + FIXED_FRONT_PAGES + 1, totalPages)}
          </div>
        ))}
      </div>
    </div>
  );
}

"use client";

import {
  DEFAULT_REPORT_SECTION_ORDER,
  type ReportSectionId,
} from "@/lib/report/report-settings";

const LABELS: Record<ReportSectionId, string> = {
  "household-profile": "Household Profile",
  "about-client": "About the Client (custom)",
  "executive-summary": "Executive Summary: Key Findings",
  "income-expenses": "Income & Expenses",
  "net-worth": "Net Worth Statement",
  "protection-insurance": "Protection & Insurance",
  "goals-retirement": "Goals & Retirement Plan",
  "plan-strategies": "Plan Strategies",
  "investment-policy": "Investment Policy Statement",
  "portfolio-analysis": "Portfolio Analysis",
  "proposed-portfolio": "Proposed Portfolio",
  "total-portfolio": "A View of Your Total Portfolio",
  "portfolio-efficiency": "Evaluating Portfolio Efficiency",
  "allocation-performance": "Asset Class & Allocation Performance",
  "wealth-allocation-framework": "Overview: Wealth Allocation Framework",
  "risk-categories": "Overview: Risk Categories",
  "wealth-risk-status": "Wealth & Risk Allocation: Current Status",
  "wealth-projection": "Wealth Projection",
  "goal-success": "Goal Success Probability",
  "goal-funding": "Key Factors: Goal Funding Status",
  "achievable-lifestyle": "Potentially Achievable Lifestyle",
  "annual-potential-wealth": "Annual Potential Wealth",
  "cash-flow": "Cash-Flow Projection",
  "retirement-pensions": "Retirement Pensions",
  "what-if": "What-If Scenarios",
  "investment-fact-sheets": "Investment Fact Sheets",
  "investor-education": "Investor Education",
  "capital-market-assumptions": "Capital Market Assumptions",
  "appendix-divider": "Appendix",
  methodology: "Methodology & Assumptions",
  glossary: "Glossary of Terms",
  disclosures: "Disclosures",
};

type Props = {
  order: ReportSectionId[];
  onChange: (order: ReportSectionId[]) => void;
};

export function ReportPageOrderSection({ order, onChange }: Props) {
  function move(index: number, direction: -1 | 1) {
    const nextIndex = index + direction;

    if (nextIndex < 0 || nextIndex >= order.length) {
      return;
    }

    const next = [...order];

    [next[index], next[nextIndex]] = [next[nextIndex], next[index]];

    onChange(next);
  }

  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]">
        Report Page Order
      </h2>

      <p className="mt-2 text-[11px] text-[#64748b]">
        Use the ↑↓ buttons to reorder report sections.
      </p>

      <div className="mt-4 space-y-2">
        {order.map((id, index) => (
          <div
            key={id}
            className="flex items-center gap-3 rounded-lg border px-3 py-2"
          >
            <span className="w-6 text-[11px] text-[#64748b]">{index + 1}.</span>

            <span className="flex-1 text-[12px] font-medium">{LABELS[id]}</span>

            <button
              type="button"
              disabled={index === 0}
              onClick={() => move(index, -1)}
            >
              ↑
            </button>

            <button
              type="button"
              disabled={index === order.length - 1}
              onClick={() => move(index, 1)}
            >
              ↓
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="mt-4 text-[11px] font-bold text-[#0057b8]"
        onClick={() => onChange([...DEFAULT_REPORT_SECTION_ORDER])}
      >
        ↺ Reset to default order
      </button>
    </section>
  );
}

// Dev/preview-only — renders the report with sample data outside the auth gate.
import { notFound } from "next/navigation";
import { ReportView } from "@/components/report/report-view";
import { emptyPlan } from "@/lib/plan/default-plan";
import type { WealthPlan } from "@/lib/engine/types";

function samplePlan(): WealthPlan {
  const p = emptyPlan();
  p.inflationRegion = "US";
  p.inflationRate = 0.038;
  p.clients[0] = { ...p.clients[0], first: "Alexandra", last: "Whitmore", dob: "1972-05-14", country: "US", risk: "moderately_aggressive", horizon: "15_plus", city: "Boston" };
  p.children = [{ id: "ch1", first: "Ethan", last: "Whitmore", dob: "2010-09-01" }];
  p.incomes = [{ id: "i1", clientId: p.clients[0].id, source: "Salary", amount: 185000, taxable: true }];
  p.expenses = [{ id: "e1", name: "Living expenses", amount: 7500 }];
  p.assets = [
    { id: "a1", country: "US", type: "brokerage", label: "Taxable Brokerage", value: 640000, liquid: true, cls: "equity" },
    { id: "a2", country: "US", type: "401k", label: "401(k)", value: 880000, liquid: false, cls: "mixed" },
    { id: "a3", country: "US", type: "savings", label: "High-Yield Savings", value: 120000, liquid: true, cls: "cash" },
    { id: "a4", country: "US", type: "home", label: "Primary Residence", value: 850000, liquid: false, cls: "real_estate" },
  ];
  p.loans = [{ id: "l1", type: "Mortgage", bal: 410000, rate: 5.4, yrs: 24 }];
  p.goals = [
    { id: "g1", name: "Retirement Income", cat: "Retirement", tier: "essential", amt: 90000, startYear: 2037, endYear: 2062 },
    { id: "g2", name: "College", cat: "Education", tier: "important", amt: 60000, startYear: 2028, endYear: 2031 },
  ];
  p.retirement = { enabled: true, retirementAge: 65, annualSpending: 90000, planToAge: 92 };
  p.pensions = [{ id: "pn1", label: "Social Security", annualAmount: 34000, startAge: 67, colaRate: 0.025 }];
  return p;
}

export default function PreviewReportPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="container max-w-5xl py-10">
      <div className="report-noprint inline-block mb-4 text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1">
        Preview · not auth-gated
      </div>
      <ReportView plan={samplePlan()} />
    </div>
  );
}

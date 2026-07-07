// ─────────────────────────────────────────────────────────────────
// DEV/PREVIEW ONLY — renders the plan-capture form outside the
// auth-gated /app/* area with a seeded sample plan, so the UI can be
// reviewed without a Supabase session. Saving posts to /api/plan and
// will 401 without auth — that's expected here.
// ─────────────────────────────────────────────────────────────────

import { notFound } from "next/navigation";
import { PlanForm } from "@/components/plan/plan-form";
import { emptyPlan } from "@/lib/plan/default-plan";
import type { WealthPlan } from "@/lib/engine/types";

function samplePlan(): WealthPlan {
  const p = emptyPlan();
  p.inflationRegion = "GB";
  p.inflationRate = 0.048;
  p.clients[0] = { ...p.clients[0], first: "Ada", last: "Lovelace", dob: "1985-12-10", country: "GB", risk: "moderately_aggressive", horizon: "15_plus", city: "London" };
  p.children = [{ id: "ch1", first: "Byron", last: "Lovelace", dob: "2016-04-02" }];
  p.incomes = [{ id: "i1", clientId: p.clients[0].id, source: "Salary", amount: 140000, taxable: true }];
  p.expenses = [{ id: "e1", name: "Living expenses", amount: 5200 }];
  p.assets = [
    { id: "a1", country: "GB", type: "stocks_isa", group: "Investment accounts", label: "Stocks & Shares ISA", value: 85000, liquid: true, cls: "equity" },
    { id: "a2", country: "GB", type: "sipp", group: "Pension & retirement", label: "SIPP", value: 210000, liquid: false, cls: "mixed" },
  ];
  p.loans = [{ id: "l1", type: "Mortgage", bal: 320000, rate: 5.1, yrs: 22 }];
  p.goals = [{ id: "g1", name: "Retirement", cat: "Retirement", tier: "essential", amt: 70000, startYear: 2050, endYear: 2075 }];
  return p;
}

export default function PreviewPlanPage() {
  // Design-review aid only — never exposed in a production deployment.
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="container max-w-5xl py-10">
      <div className="mb-8">
        <div className="inline-block mb-3 text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-500/10 border border-amber-500/30 rounded-full px-3 py-1">
          Preview · not auth-gated
        </div>
        <h1 className="font-display text-4xl mb-2">Plan capture — preview</h1>
        <p className="text-muted-foreground">
          Country-aware accounts, DOB/children/address, and import/export. Sample data loaded.
        </p>
      </div>
      <PlanForm initialPlan={samplePlan()} />
    </div>
  );
}

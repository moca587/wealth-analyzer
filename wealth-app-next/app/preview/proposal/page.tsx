import { notFound } from "next/navigation";
import { ProposalBuilder } from "@/components/orders/proposal-builder";
import { AllocationCompare } from "@/components/portfolio/allocation-compare";
import { PickerDemo } from "./picker-demo";
import { emptyPlan, newId } from "@/lib/plan/default-plan";
import type { WealthPlan } from "@/lib/engine/types";
import type { Proposal } from "@/lib/orders/proposal";

// Design review outside the auth gate, like /preview/plan. 404s in
// production; the /api/orders it calls still requires a session, so with no
// connection it simply renders the empty state — enough to check the
// component mounts and the editor behaves.
export const dynamic = "force-dynamic";

// A sample current book so the allocation compare renders without a live
// client + custodian feed.
const samplePlan: WealthPlan = {
  ...emptyPlan(),
  currency: "CHF",
  assets: [
    { id: newId(), type: "VWRL", label: "FTSE All-World", cls: "equity", value: 620000, liquid: true },
    { id: newId(), type: "AGGG", label: "Global Aggregate Bond", cls: "fixed_income", value: 240000, liquid: true },
    { id: newId(), type: "", label: "Cash (CHF)", cls: "cash", value: 90000, liquid: true },
    { id: newId(), type: "", label: "Primary residence", cls: "real_estate", value: 1400000, liquid: false },
  ],
  // Position-level holdings (what a custodian feed provides): the compare
  // prefers these, with the real per-position expense ratios.
  holdings: [
    { id: "h1", name: "FTSE All-World", ticker: "VWRL", cls: "equity", value: 620000, er: 0.22, yld: 1.9 },
    { id: "h2", name: "Global Aggregate Bond", ticker: "AGGG", cls: "fixed_income", value: 240000, er: 0.10, yld: 2.4 },
    { id: "h3", name: "Cash (CHF)", cls: "cash", value: 90000 },
  ],
};

const sampleProposal: Proposal = {
  currency: "CHF",
  targetAmount: 950000,
  positions: [
    { id: "1", name: "FTSE All-World", ticker: "VWRL", cls: "equity", weightPct: 55 },
    { id: "2", name: "Global Aggregate Bond", ticker: "AGGG", cls: "fixed_income", weightPct: 30 },
    { id: "3", name: "Gold", ticker: "SGLN", cls: "commodity", weightPct: 10 },
    { id: "4", name: "Cash", cls: "cash", weightPct: 5 },
  ],
};

export default function PreviewProposalPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="container max-w-5xl py-10 space-y-10">
      <div>
        <h1 className="font-display text-4xl mb-6">Allocation compare (preview)</h1>
        <div className="rounded-xl border border-border p-6">
          <AllocationCompare plan={samplePlan} proposal={sampleProposal} />
        </div>
      </div>

      <div>
        <h1 className="font-display text-4xl mb-6">Investment proposal (preview)</h1>
        <ProposalBuilder clientName="Sample Client" plan={samplePlan} />
        <PickerDemo />
      </div>
    </div>
  );
}

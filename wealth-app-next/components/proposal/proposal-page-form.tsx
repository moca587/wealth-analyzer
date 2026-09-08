"use client";

import type { WealthPlan } from "@/lib/engine/types";
import type { Proposal } from "@/lib/orders/proposal";
import { useProposal } from "@/lib/proposal/use-proposal";
import { NoPlanLoaded } from "@/components/plan/no-plan-loaded";

import { ProposalSetupSection } from "./proposal-setup-section";
import { AdvisoryFeeSection } from "./advisory-fee-section";
import { ProposalSummarySection } from "./proposal-summary-section";
import { ProposedPositionsSection } from "./proposed-positions-section";
import { AddPositionSection } from "./add-position-section";
import { AddAlternativePositionSection } from "./add-alternative-position-section";
import { OrderRoutingSection } from "./order-routing-section";

export function ProposalPageForm({
  initialPlan,
  initialProposal,
}: {
  initialPlan: WealthPlan | null;
  initialProposal: Proposal | null;
}) {
  const plan = initialPlan;

  //   console.log("ProposalPageForm initialPlan:", initialPlan);
  //   console.log("ProposalPageForm initialProposal:", initialProposal);

  const defaultProposal: Proposal = {
    clientId: plan?.clients[0]?.id ?? "",

    clientName: plan?.clients[0]
      ? `${plan.clients[0].first} ${plan.clients[0].last}`.trim()
      : "",

    advisor: "",
    targetAmount: 0,
    objective: "Balanced",
    positions: [],
    currency: plan?.currency ?? "USD",
  };

  const { proposal, updateProposal } = useProposal(
    initialProposal ?? defaultProposal,
  );

  if (!plan) {
    return <NoPlanLoaded />;
  }

  //   console.log("ProposalPageForm rendering normal page");

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-8 py-7">
      <div className="mx-auto max-w-6xl space-y-6">
        <ProposalSetupSection
          plan={plan}
          proposal={proposal}
          update={updateProposal}
        />

        <AdvisoryFeeSection
          proposal={proposal}
          updateProposal={updateProposal}
          grossReturn={0}
        />

        <ProposalSummarySection proposal={proposal} />

        <ProposedPositionsSection
          proposal={proposal}
          updateProposal={updateProposal}
        />

        <AddPositionSection
          proposal={proposal}
          updateProposal={updateProposal}
        />

        <AddAlternativePositionSection
          proposal={proposal}
          updateProposal={updateProposal}
        />

        <OrderRoutingSection proposal={proposal} />
      </div>
    </main>
  );
}

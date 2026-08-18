"use client";

import { useState } from "react";

import type { WealthPlan } from "@/lib/engine/types";
import type { Proposal } from "@/lib/orders/proposal";

import { ProposalSetupSection } from "./proposal-setup-section";
import { AdvisoryFeeSection } from "./advisory-fee-section";
import { ProposalSummarySection } from "./proposal-summary-section";
import { ProposedPositionsSection } from "./proposed-positions-section";
import { AddPositionSection } from "./add-position-section";
import { AddAlternativePositionSection } from "./add-alternative-position-section";
import { OrderRoutingSection } from "./order-routing-section";

export function ProposalPageForm({
    initialPlan,
    initialVersion,
}: {
    initialPlan: WealthPlan | null;
    initialVersion: number;
}) {
    const plan = initialPlan;

    const [proposal, setProposal] =
        useState<Proposal>(() => ({
            clientName:
                plan?.clients
                    .map((client) =>
                        `${client.first} ${client.last}`.trim()
                    )
                    .join(" & ") ?? "",

            advisor: "",

            targetAmount: 0,

            objective: "balanced",

            positions: [],

            currency:
                plan?.currency ?? "USD",
        }));

    function updateProposal(
        patch: Partial<Proposal>
    ) {
        setProposal((prev) => ({
            ...prev,
            ...patch,
        }));
    }

    if (!plan) {
        return (
            <main className="min-h-screen bg-[#f4f6fb] px-8 py-7">
                <div className="mx-auto max-w-6xl">
                    <p className="text-sm text-[#64748b]">
                        No client plan loaded.
                    </p>
                </div>
            </main>
        );
    }

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
                    updateProposal={
                        updateProposal
                    }
                    grossReturn={0}
                />

                <ProposalSummarySection
                    proposal={proposal}
                />

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

                <OrderRoutingSection
                    proposal={proposal}
                />
            </div>
        </main>
    );
}
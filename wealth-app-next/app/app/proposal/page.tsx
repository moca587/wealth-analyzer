import { ProposalBuilder } from "@/components/orders/proposal-builder";
import { loadPageContext } from "@/lib/tenancy/page";
import { ChooseClient } from "@/components/nav/choose-client";

export const dynamic = "force-dynamic";

export default async function ProposalPage() {
  const ctx = await loadPageContext();
  if (ctx.needsChoice) return <ChooseClient message={ctx.needsChoice.message} />;

  // The client's name prefills the ticket's client field. Whether identity
  // actually travels to the OMS is a per-connection choice (send_client_identity,
  // default off) enforced on the server — this only labels the proposal.
  const first = ctx.plan?.clients?.[0];
  const clientName = first ? `${first.first} ${first.last}`.trim() : ctx.household!.name;

  return (
    <div className="container max-w-5xl py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">Investment proposal</h1>
        <p className="text-muted-foreground">
          Build the positions for <strong>{ctx.household!.name}</strong>, then stage them in the
          PM/OMS. Nothing here executes a trade.
        </p>
      </div>
      {/* Keyed on the household so switching client resets the builder rather
          than carrying one client's positions under another's heading. */}
      <ProposalBuilder key={ctx.household!.id} clientName={clientName} plan={ctx.plan} />
    </div>
  );
}

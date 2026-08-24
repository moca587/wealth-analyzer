import { loadPageContext } from "@/lib/tenancy/page";
import { createClient } from "@/lib/supabase/server";

import { proposalSchema } from "@/lib/proposal/schema";

import { ChooseClient } from "@/components/nav/choose-client";
import { ProposalPageForm } from "@/components/proposal/proposal-page-form";

export const dynamic = "force-dynamic";

export default async function ProposalPage() {
  const ctx = await loadPageContext();

  if (ctx.needsChoice) {
    return <ChooseClient message={ctx.needsChoice.message} />;
  }

  const supabase = await createClient();

  // Fetch proposal from Supabase
  const { data, error } = await supabase
    .from("proposals")
    .select("proposal")
    .eq("household_id", ctx.household!.id)
    .maybeSingle();

  if (error) {
    console.error("Could not load proposal:", error);
  }

  let initialProposal = null;

  if (data?.proposal) {
    const parsed = proposalSchema.safeParse(data.proposal);

    if (parsed.success) {
      initialProposal = parsed.data;
    } else {
      console.error("Stored proposal is invalid:", parsed.error);
    }
  }

  return (
    <ProposalPageForm
      key={ctx.household!.id}
      initialPlan={ctx.plan}
      initialProposal={initialProposal}
    />
  );
}

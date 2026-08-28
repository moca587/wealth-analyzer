// import { loadPageContext } from "@/lib/tenancy/page";
// import { ChooseClient } from "@/components/nav/choose-client";
// import { ReportView } from "@/components/reports/report-view";

// export const dynamic = "force-dynamic";

// export default async function ReportPreviewPage() {
//   const ctx = await loadPageContext();

//   if (ctx.needsChoice) {
//     return <ChooseClient message={ctx.needsChoice.message} />;
//   }

//   const plan = ctx.plan;

//   if (!plan) {
//     return <main className="p-8">No client plan loaded.</main>;
//   }

//   return <ReportView plan={plan} />;
// }

import { loadPageContext } from "@/lib/tenancy/page";
import { createClient } from "@/lib/supabase/server";

import { proposalSchema } from "@/lib/proposal/schema";

import { ChooseClient } from "@/components/nav/choose-client";
import { ReportView } from "@/components/reports/report-view";

export const dynamic = "force-dynamic";

export default async function ReportPreviewPage() {
  const ctx = await loadPageContext();

  if (ctx.needsChoice) {
    return <ChooseClient message={ctx.needsChoice.message} />;
  }

  const plan = ctx.plan;

  if (!plan) {
    return <main className="p-8">No client plan loaded.</main>;
  }

  const supabase = await createClient();

  // Load the saved proposal for this household
  const { data, error } = await supabase
    .from("proposals")
    .select("proposal")
    .eq("household_id", ctx.household!.id)
    .maybeSingle();

  if (error) {
    console.error("Could not load proposal:", error);
  }

  let proposal = null;

  if (data?.proposal) {
    const parsed = proposalSchema.safeParse(data.proposal);

    if (parsed.success) {
      proposal = parsed.data;
    } else {
      console.error("Stored proposal is invalid:", parsed.error);
    }
  }

  return <ReportView plan={plan} proposal={proposal} />;
}

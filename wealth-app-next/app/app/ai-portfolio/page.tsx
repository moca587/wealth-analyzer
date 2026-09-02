import { loadPageContext } from "@/lib/tenancy/page";
import { createClient } from "@/lib/supabase/server";

import { proposalSchema } from "@/lib/proposal/schema";

import { ChooseClient } from "@/components/nav/choose-client";
import { AiPortfolioPageForm } from "@/components/ai-portfolio/ai-portfolio-page-form";

import type { AiPortfolioResult } from "@/lib/ai-portfolio/types";

export const dynamic = "force-dynamic";

export default async function AiPortfolioPage() {
  const ctx = await loadPageContext();

  if (ctx.needsChoice) {
    return <ChooseClient message={ctx.needsChoice.message} />;
  }

  const supabase = await createClient();

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

  // recommendation
  const { data: aiPortfolioData, error: aiPortfolioError } = await supabase
    .from("ai_portfolios")
    .select("recommendation")
    .eq("household_id", ctx.household!.id)
    .maybeSingle();

  if (aiPortfolioError) {
    console.error("Could not load AI portfolio:", aiPortfolioError);
  }

  let initialRecommendation: AiPortfolioResult | null = null;

  if (aiPortfolioData?.recommendation) {
    initialRecommendation = aiPortfolioData.recommendation as AiPortfolioResult;
  }

  return (
    <AiPortfolioPageForm
      key={ctx.household!.id}
      initialPlan={ctx.plan}
      initialVersion={ctx.version}
      initialProposal={initialProposal}
      initialRecommendation={initialRecommendation}
    />
  );
}

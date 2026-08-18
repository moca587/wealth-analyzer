import { loadPageContext } from "@/lib/tenancy/page";
import { ChooseClient } from "@/components/nav/choose-client";
import { AiPortfolioPageForm } from "@/components/ai-portfolio/ai-portfolio-page-form";

export const dynamic = "force-dynamic";

export default async function AiPortfolioPage() {
  const ctx = await loadPageContext();

  if (ctx.needsChoice) {
    return (
      <ChooseClient
        message={ctx.needsChoice.message}
      />
    );
  }

  return (
    <AiPortfolioPageForm
      key={ctx.household!.id}
      initialPlan={ctx.plan}
      initialVersion={ctx.version}
    />
  );
}
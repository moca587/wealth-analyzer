import { loadPageContext } from "@/lib/tenancy/page";
import { ChooseClient } from "@/components/nav/choose-client";
import { PortfolioComparisonPageForm } from "@/components/portfolio-comparison/portfolio-comparison-page-form";

export const dynamic = "force-dynamic";

export default async function PortfolioComparisonPage() {
  const ctx = await loadPageContext();

  if (ctx.needsChoice) {
    return (
      <ChooseClient
        message={ctx.needsChoice.message}
      />
    );
  }

  return (
    <PortfolioComparisonPageForm
      key={ctx.household!.id}
      initialPlan={ctx.plan}
      initialVersion={ctx.version}
    />
  );
}
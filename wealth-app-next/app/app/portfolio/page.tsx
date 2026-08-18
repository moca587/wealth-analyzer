import { loadPageContext } from "@/lib/tenancy/page";
import { ChooseClient } from "@/components/nav/choose-client";
import { PortfolioPageForm } from "@/components/portfolio/portfolio-page-form";

export const dynamic = "force-dynamic";

export default async function PortfolioPage() {
  const ctx = await loadPageContext();

  if (ctx.needsChoice) {
    return (
      <ChooseClient
        message={ctx.needsChoice.message}
      />
    );
  }

  return (
    <PortfolioPageForm
      key={ctx.household!.id}
      initialPlan={ctx.plan}
      initialVersion={ctx.version}
    />
  );
}
import { loadPageContext } from "@/lib/tenancy/page";
import { ChooseClient } from "@/components/nav/choose-client";
import { SimulationPageForm } from "@/components/simulation/simulation-page-form";

export const dynamic = "force-dynamic";

export default async function SimulatePage() {
  const ctx = await loadPageContext();

  if (ctx.needsChoice) {
    return (
      <ChooseClient
        message={ctx.needsChoice.message}
      />
    );
  }

  return (
    <SimulationPageForm
      key={ctx.household!.id}
      initialPlan={ctx.plan}
      initialVersion={ctx.version}
    />
  );
}
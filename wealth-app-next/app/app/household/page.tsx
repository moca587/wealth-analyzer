import { loadPageContext } from "@/lib/tenancy/page";
import { ChooseClient } from "@/components/nav/choose-client";
import { HouseholdPageForm } from "@/components/household/household-page-form";

export const dynamic = "force-dynamic";

export default async function HouseholdPage() {
  const ctx = await loadPageContext();

  if (ctx.needsChoice) {
    return <ChooseClient message={ctx.needsChoice.message} />;
  }

  return (
    <HouseholdPageForm
      key={ctx.household!.id}
      initialPlan={ctx.plan}
      initialVersion={ctx.version}
      householdName={ctx.household!.name}
    />
  );
}
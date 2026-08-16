import { loadPageContext } from "@/lib/tenancy/page";
import { ChooseClient } from "@/components/nav/choose-client";
import { IncomePageForm } from "@/components/income/income-page-form";

export const dynamic = "force-dynamic";

export default async function IncomePage() {
  const ctx = await loadPageContext();

  if (ctx.needsChoice) {
    return (
      <ChooseClient message={ctx.needsChoice.message} />
    );
  }

  return (
    <IncomePageForm
      key={ctx.household!.id}
      initialPlan={ctx.plan}
      initialVersion={ctx.version}
    />
  );
}
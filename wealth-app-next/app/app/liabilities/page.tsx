import { loadPageContext } from "@/lib/tenancy/page";
import { ChooseClient } from "@/components/nav/choose-client";
import { LiabilitiesPageForm } from "@/components/liabilities/liabilities-page-form";

export const dynamic = "force-dynamic";

export default async function LiabilitiesPage() {
  const ctx = await loadPageContext();

  if (ctx.needsChoice) {
    return (
      <ChooseClient
        message={ctx.needsChoice.message}
      />
    );
  }

  return (
    <LiabilitiesPageForm
      key={ctx.household!.id}
      initialPlan={ctx.plan}
      initialVersion={ctx.version}
    />
  );
}
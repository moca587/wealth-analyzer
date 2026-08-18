import { loadPageContext } from "@/lib/tenancy/page";
import { ChooseClient } from "@/components/nav/choose-client";
import { AssetsPageForm } from "@/components/assets/assets-page-form";

export const dynamic = "force-dynamic";

export default async function AssetsPage() {
  const ctx = await loadPageContext();

  if (ctx.needsChoice) {
    return (
      <ChooseClient message={ctx.needsChoice.message} />
    );
  }

  return (
    <AssetsPageForm
      key={ctx.household!.id}
      initialPlan={ctx.plan}
      initialVersion={ctx.version}
    />
  );
}
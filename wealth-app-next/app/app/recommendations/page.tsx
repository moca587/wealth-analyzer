import {
  RecommendationsPageForm,
} from "@/components/recommendations/recommendations-page-form";

import {
  loadPageContext,
} from "@/lib/tenancy/page";

import {
  ChooseClient,
} from "@/components/nav/choose-client";

export const dynamic =
  "force-dynamic";

export default async function RecommendationsPage() {
  const ctx =
    await loadPageContext();

  if (ctx.needsChoice) {
    return (
      <ChooseClient
        message={
          ctx.needsChoice.message
        }
      />
    );
  }

  return (
    <RecommendationsPageForm
      initialPlan={ctx.plan}
      initialVersion={
        ctx.version ?? 0
      }
      householdName={
        ctx.household?.name
      }
    />
  );
}
import { loadPageContext } from "@/lib/tenancy/page";
import { ChooseClient } from "@/components/nav/choose-client";
import { ReportView } from "@/components/reports/report-view";

export const dynamic = "force-dynamic";

export default async function ReportPreviewPage() {
  const ctx = await loadPageContext();

  if (ctx.needsChoice) {
    return <ChooseClient message={ctx.needsChoice.message} />;
  }

  const plan = ctx.plan;

  if (!plan) {
    return <main className="p-8">No client plan loaded.</main>;
  }

  return <ReportView plan={plan} />;
}

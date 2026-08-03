import Link from "next/link";
import { ReportView } from "@/components/report/report-view";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { loadPageContext } from "@/lib/tenancy/page";
import { ChooseClient } from "@/components/nav/choose-client";

export const dynamic = "force-dynamic";

export default async function ReportPage() {
  const ctx = await loadPageContext();
  if (ctx.needsChoice) return <ChooseClient message={ctx.needsChoice.message} />;

  const plan = ctx.plan;
  if (!plan || plan.clients.length === 0) {
    return (
      <div className="container max-w-3xl py-10">
        <Card>
          <CardContent className="text-center py-16">
            <h1 className="font-display text-3xl mb-3">No plan yet</h1>
            <p className="text-muted-foreground mb-6">
              Build {ctx.household!.name}&apos;s plan before generating a report.
            </p>
            <Link href="/app/plan" className={buttonVariants()}>Build the plan &rarr;</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-10 animate-fade-in">
      <div className="mb-6 report-noprint">
        <h1 className="font-display text-4xl mb-2">Report</h1>
        <p className="text-muted-foreground">
          A branded, printable wealth report for {ctx.household!.name}.
        </p>
      </div>
      <ReportView key={ctx.household!.id} plan={plan} />
    </div>
  );
}

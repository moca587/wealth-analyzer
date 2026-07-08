import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ReportView } from "@/components/report/report-view";
import { Card, CardContent } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { parsePlan } from "@/lib/plan/schema";

export default async function ReportPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase.from("profiles").select("plan").single();

  const hasStoredPlan = profile?.plan && typeof profile.plan === "object" && Object.keys(profile.plan).length > 0;
  const parsed = hasStoredPlan ? parsePlan(profile!.plan) : null;
  const plan = parsed?.ok ? parsed.plan : null;

  if (!plan || plan.clients.length === 0) {
    return (
      <div className="container max-w-3xl py-10">
        <Card>
          <CardContent className="text-center py-16">
            <h1 className="font-display text-3xl mb-3">No plan yet</h1>
            <p className="text-muted-foreground mb-6">Build your plan before generating a report.</p>
            <Link href="/app/plan" className={buttonVariants()}>Build your plan &rarr;</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-5xl py-10 animate-fade-in">
      <div className="mb-6 report-noprint">
        <h1 className="font-display text-4xl mb-2">Report</h1>
        <p className="text-muted-foreground">A branded, printable wealth report generated from your plan.</p>
      </div>
      <ReportView plan={plan} />
    </div>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SimRunner } from "@/components/sim/sim-runner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { parsePlan } from "@/lib/plan/schema";

export default async function SimulatePage() {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .single();

  // Validate before this ever reaches the Monte Carlo engine — a raw cast
  // would let malformed JSONB (missing fields, NaN amounts) through into
  // the simulation instead of failing safely here.
  const hasStoredPlan = profile?.plan && typeof profile.plan === "object" && Object.keys(profile.plan).length > 0;
  const parsed = hasStoredPlan ? parsePlan(profile!.plan) : null;
  const plan = parsed?.ok ? parsed.plan : null;

  if (!plan || plan.clients.length === 0) {
    return (
      <div className="container max-w-3xl py-10">
        <Card>
          <CardContent className="text-center py-16">
            <h1 className="font-display text-3xl mb-3">No plan yet</h1>
            <p className="text-muted-foreground mb-6">Capture your household, income, assets, and goals before running a simulation.</p>
            <Button asChild>
              <Link href="/app/plan">Build your plan &rarr;</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">Simulation</h1>
        <p className="text-muted-foreground">
          Stress-test your plan against 1,000 random market paths over 30 years.
        </p>
      </div>
      <SimRunner plan={plan} />
    </div>
  );
}

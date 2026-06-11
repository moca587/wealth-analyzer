import { createClient } from "@/lib/supabase/server";
import { PlanForm } from "@/components/plan/plan-form";
import type { WealthPlan } from "@/lib/engine/types";

export default async function PlanPage() {
  const supabase = createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .single();

  // If the JSONB is empty `{}`, treat as null so PlanForm shows an empty plan
  const plan = profile?.plan && typeof profile.plan === "object" && "clients" in profile.plan
    ? (profile.plan as WealthPlan)
    : null;

  return (
    <div className="container max-w-5xl py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">Your plan</h1>
        <p className="text-muted-foreground">
          Fill out the sections that apply. Everything is saved to your account when you click Save.
        </p>
      </div>
      <PlanForm initialPlan={plan} />
    </div>
  );
}

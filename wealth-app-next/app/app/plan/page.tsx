import { createClient } from "@/lib/supabase/server";
import { PlanForm } from "@/components/plan/plan-form";
import { parsePlan } from "@/lib/plan/schema";

export default async function PlanPage() {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("plan")
    .single();

  // Empty JSONB (`{}` or null) means "no plan yet" — not an error, show a
  // blank form. Anything non-empty must pass validation before it reaches
  // the form; a hand-edited or stale-schema row should surface as a clear,
  // recoverable error instead of crashing PlanForm or silently corrupting it.
  const hasStoredPlan = profile?.plan && typeof profile.plan === "object" && Object.keys(profile.plan).length > 0;
  const parsed = hasStoredPlan ? parsePlan(profile!.plan) : null;
  const plan = parsed?.ok ? parsed.plan : null;
  const invalid = hasStoredPlan && !parsed?.ok;

  return (
    <div className="container max-w-5xl py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">Your plan</h1>
        <p className="text-muted-foreground">
          Fill out the sections that apply. Everything is saved to your account when you click Save.
        </p>
      </div>
      {invalid && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          Your saved plan couldn&apos;t be read back safely (it may be from an older
          version of this app) and hasn&apos;t been loaded. Nothing has been
          overwritten — starting from a blank plan below; saving will replace
          the stored version once you&apos;re ready.
        </div>
      )}
      <PlanForm initialPlan={plan} />
    </div>
  );
}

import Link from "next/link";
import { SimRunner } from "@/components/sim/sim-runner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loadPageContext } from "@/lib/tenancy/page";
import { ChooseClient } from "@/components/nav/choose-client";

export const dynamic = "force-dynamic";

export default async function SimulatePageOld() {
  // loadPageContext validates the stored plan before it gets here — a raw
  // cast would let malformed JSONB (missing fields, NaN amounts) through
  // into the Monte Carlo engine instead of failing safely.
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
              Capture {ctx.household!.name}&apos;s household, income, assets and goals before
              running a simulation.
            </p>
            <Button asChild>
              <Link href="/app/plan">Build the plan &rarr;</Link>
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
          {ctx.household!.name} — stress-tested against 1,000 random market paths.
        </p>
      </div>
      <SimRunner key={ctx.household!.id} plan={plan} />
    </div>
  );
}

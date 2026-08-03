import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { loadPageContext } from "@/lib/tenancy/page";
import { ChooseClient } from "@/components/nav/choose-client";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const ctx = await loadPageContext();
  if (ctx.needsChoice) return <ChooseClient message={ctx.needsChoice.message} />;

  const plan = ctx.plan;
  const hasPlan = !!plan && plan.clients.length > 0;

  return (
    <div className="container max-w-5xl py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">{ctx.household!.name}</h1>
        <p className="text-muted-foreground">
          {hasPlan
            ? `Plan in place${ctx.version ? ` (version ${ctx.version})` : ""}. Run a simulation to see where this client stands.`
            : "No plan captured for this client yet. It takes about 10 minutes."}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>1. Capture the plan</CardTitle>
            <CardDescription>
              Household, income, expenses, assets, liabilities, goals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm">
                {hasPlan ? (
                  <>
                    <span className="inline-flex h-2 w-2 rounded-full bg-emerald-500 mr-2" />
                    {plan?.clients.length || 0} {plan?.clients.length === 1 ? "client" : "clients"} ·{" "}
                    {plan?.goals?.length || 0} goals ·{" "}
                    {plan?.assets?.length || 0} assets
                  </>
                ) : (
                  <span className="text-muted-foreground">Not started yet</span>
                )}
              </span>
              <Button asChild>
                <Link href="/app/plan">{hasPlan ? "Edit plan" : "Start now"} &rarr;</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2. Run the simulation</CardTitle>
            <CardDescription>
              1,000 Monte Carlo paths against this client&apos;s goals.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {hasPlan ? "Ready to run" : "Capture the plan first"}
              </span>
              <Button asChild disabled={!hasPlan} variant={hasPlan ? "default" : "outline"}>
                <Link href="/app/simulate">Simulate &rarr;</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gradient-to-br from-accent/5 to-purple-500/5 border-accent/20">
        <CardHeader>
          <CardTitle>What you&apos;ll see</CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            Probability of reaching each goal. Percentile bands of net worth over the next 30 years.
            Median outcome vs. P10 (worst-case) and P90 (best-case). Goal-by-goal success rate.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="mt-10 text-xs text-muted-foreground border-t border-border pt-6">
        <strong>Important:</strong> This tool is for educational purposes. It is not financial,
        investment, tax, or legal advice. Past performance does not predict future results.
        Consult a licensed advisor before making financial decisions.
      </div>
    </div>
  );
}

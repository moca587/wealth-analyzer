import { PlanForm } from "@/components/plan/plan-form";
import { loadPageContext } from "@/lib/tenancy/page";
import { ChooseClient } from "@/components/nav/choose-client";

export const dynamic = "force-dynamic";

export default async function PlanPage() {
  const ctx = await loadPageContext();
  if (ctx.needsChoice) return <ChooseClient message={ctx.needsChoice.message} />;

  return (
    <div className="container max-w-5xl py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">{ctx.household!.name}</h1>
        <p className="text-muted-foreground">
          Fill out the sections that apply. Everything is saved to this client&apos;s
          record when you click Save.
        </p>
      </div>
      {ctx.invalid && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          This client&apos;s saved plan couldn&apos;t be read back safely (it may be from an
          older version of this app) and hasn&apos;t been loaded. Nothing has been
          overwritten — every stored version is still there — but saving from here
          will append a new one on top.
        </div>
      )}
      {/*
        Keyed on the household so switching client REMOUNTS the form. Without
        it the previous client's figures would sit in component state while
        the heading above showed the new name — the worst thing this screen
        could do.
      */}
      <PlanForm
        key={ctx.household!.id}
        initialPlan={ctx.plan}
        initialVersion={ctx.version}
      />
    </div>
  );
}
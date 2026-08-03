import { Card, CardContent } from "@/components/ui/card";

/**
 * Shown when a page cannot tell which client it is about.
 *
 * Deliberately a dead end rather than a default: picking one for the user
 * would put a stranger's balance sheet under whatever name the sidebar
 * happens to show. The switcher in the sidebar is the way out.
 */
export function ChooseClient({ message }: { message: string }) {
  return (
    <div className="container max-w-3xl py-10">
      <Card>
        <CardContent className="text-center py-16">
          <h1 className="font-display text-3xl mb-3">Which client?</h1>
          <p className="text-muted-foreground mb-2">{message}</p>
          <p className="text-sm text-muted-foreground">
            Pick one from the <strong>Client</strong> selector at the top of the sidebar,
            or add a new one there.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

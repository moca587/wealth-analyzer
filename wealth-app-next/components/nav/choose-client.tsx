import { Card, CardContent } from "@/components/ui/card";

/**
 * Shown when a page cannot tell which client it is about.
 *
 * Deliberately a dead end rather than a default: picking one for the user
 * would put a stranger's balance sheet under whatever name the sidebar
 * happens to show. The switcher in the sidebar is the way out.
 */
// export function ChooseClient({ message }: { message: string }) {
//   return (
//     <div className="container max-w-3xl py-10">
//       <Card>
//         <CardContent className="text-center py-16">
//           <h1 className="font-display text-3xl mb-3">Which client?</h1>
//           <p className="text-muted-foreground mb-2">{message}</p>
//           <p className="text-sm text-muted-foreground">
//             Pick one from the <strong>Client</strong> selector at the top of the sidebar,
//             or add a new one there.
//           </p>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
export function ChooseClient({ message }: { message: string }) {
  return (
    <div className="container max-w-3xl py-10">
      <section className="rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]">
            Client Selection
          </h2>

          <div className="h-px flex-1 bg-[rgba(0,87,184,.10)]" />
        </div>

        <div className="py-10 text-center">
          <h1 className="mb-3 text-2xl font-semibold tracking-tight text-[#0f172a]">
            No client yet.
          </h1>

          <p className="text-[13px] leading-5 text-[#64748b]">{message}</p>
        </div>
      </section>
    </div>
  );
}

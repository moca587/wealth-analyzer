import { notFound } from "next/navigation";
import { ProposalBuilder } from "@/components/orders/proposal-builder";

// Design review outside the auth gate, like /preview/plan. 404s in
// production; the /api/orders it calls still requires a session, so with no
// connection it simply renders the empty state — enough to check the
// component mounts and the editor behaves.
export const dynamic = "force-dynamic";

export default function PreviewProposalPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="container max-w-5xl py-10">
      <h1 className="font-display text-4xl mb-6">Investment proposal (preview)</h1>
      <ProposalBuilder clientName="Sample Client" />
    </div>
  );
}

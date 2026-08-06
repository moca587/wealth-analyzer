import { BillingManager } from "@/components/billing/billing-manager";

export const dynamic = "force-dynamic";

export default function BillingPage() {
  return (
    <div className="container max-w-3xl py-10 animate-fade-in">
      <div className="mb-8">
        <h1 className="font-display text-4xl mb-2">Billing</h1>
        <p className="text-muted-foreground">
          Your firm&apos;s subscription. Capture and simulate are free; pulling live feeds
          and staging orders need an active plan.
        </p>
      </div>
      <BillingManager />
    </div>
  );
}

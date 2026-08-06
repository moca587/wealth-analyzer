import { notFound } from "next/navigation";
import { BillingManager } from "@/components/billing/billing-manager";

export const dynamic = "force-dynamic";

export default function PreviewBillingPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return (
    <div className="container max-w-3xl py-10">
      <h1 className="font-display text-4xl mb-6">Billing (preview)</h1>
      <BillingManager />
    </div>
  );
}

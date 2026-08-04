import { Suspense } from "react";
import { AcceptForm } from "./accept-form";

// useSearchParams needs a Suspense boundary or the build fails on
// prerender — the same fix /login needed.
export const dynamic = "force-dynamic";

export default function AcceptPage() {
  return (
    <Suspense fallback={<div className="container max-w-lg py-16 text-center text-muted-foreground">Loading…</div>}>
      <AcceptForm />
    </Suspense>
  );
}

"use client";

// Segment-level error boundary — catches render/data errors in the app so a
// server-component throw shows a styled, recoverable page instead of Next's
// default unstyled 500 screen.

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <div className="max-w-md space-y-4">
        <div className="inline-grid h-14 w-14 place-items-center rounded-full bg-destructive/10 text-destructive text-2xl">!</div>
        <h1 className="font-display text-3xl">Something went wrong</h1>
        <p className="text-muted-foreground">
          We hit an unexpected error. This is usually temporary — try again, and if it keeps
          happening, come back in a moment.
        </p>
        <div className="flex gap-3 justify-center pt-2">
          <Button onClick={reset}>Try again</Button>
          <Link href="/" className={buttonVariants({ variant: "outline" })}>Go home</Link>
        </div>
        {error?.digest && (
          <p className="text-xs text-muted-foreground pt-4">Reference: {error.digest}</p>
        )}
      </div>
    </div>
  );
}

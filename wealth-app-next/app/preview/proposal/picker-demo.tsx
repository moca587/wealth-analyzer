"use client";

// Preview-only harness: exercises the FundPicker in isolation, so a design
// review (and a real browser check) can confirm the 135KB fund data
// lazy-loads and search renders — the proposal editor itself is gated
// behind a live OMS connection, which the preview has none of.

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FundPicker, type FundPick } from "@/components/orders/fund-picker";

export function PickerDemo() {
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<FundPick | null>(null);
  return (
    <div className="mt-8 space-y-3">
      <Button onClick={() => setOpen(true)}>Open fund picker</Button>
      {picked && (
        <p className="text-sm text-muted-foreground">
          Picked: <strong>{picked.ticker}</strong> — {picked.name} ({picked.cls})
        </p>
      )}
      {open && <FundPicker onClose={() => setOpen(false)} onPick={setPicked} />}
    </div>
  );
}

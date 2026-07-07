"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { downloadPlan, deserializePlan } from "@/lib/plan/import-export";
import type { WealthPlan } from "@/lib/engine/types";

/**
 * Import/export section. Export downloads the current plan as versioned JSON.
 * Import validates through migratePlan + Zod before replacing state, so a bad
 * file shows an error and never overwrites the plan you're working on.
 */
export function ImportExportSection({
  plan,
  onImport,
}: {
  plan: WealthPlan;
  onImport: (plan: WealthPlan) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const result = deserializePlan(text);
    if (result.ok) {
      onImport(result.plan);
      setStatus({ kind: "ok", msg: `Imported — ${result.plan.clients.length} client(s), ${result.plan.assets.length} asset(s), ${result.plan.goals.length} goal(s). Review, then Save to keep it.` });
    } else {
      const detail = result.fieldErrors ? " (" + Object.keys(result.fieldErrors).slice(0, 3).join(", ") + "…)" : "";
      setStatus({ kind: "err", msg: result.error + detail });
    }
    // Reset so re-selecting the same file fires change again.
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import / export</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Back up your plan or move it between accounts. Exports are portable JSON; imports are validated and upgraded from older formats before anything is replaced.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="outline" onClick={() => downloadPlan(plan)}>Export plan (.json)</Button>
          <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>Import plan…</Button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={onFile} />
        </div>
        {status && (
          <div
            className={
              status.kind === "ok"
                ? "text-sm text-emerald-600 bg-emerald-500/5 border border-emerald-500/20 rounded-lg px-3 py-2"
                : "text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2"
            }
          >
            {status.msg}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { emptyLegacyPlan } from "@/lib/plan/default-plan-legacy";
import {
  legacyWealthPlanSchema,
  type LegacyWealthPlan,
} from "@/lib/plan/legacy-schema";

type PlanFormProps = {
  initialPlan: LegacyWealthPlan | null;
};

export function PlanForm({ initialPlan }: PlanFormProps) {
  const router = useRouter();

  const [plan, setPlan] = useState<LegacyWealthPlan>(
    () => initialPlan ?? emptyLegacyPlan(),
  );

  const [jsonText, setJsonText] = useState(() =>
    JSON.stringify(initialPlan ?? emptyLegacyPlan(), null, 2),
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  // Keep the JSON editor synchronized when the server loads a plan.
  useEffect(() => {
    if (!initialPlan) return;

    setPlan(initialPlan);
    setJsonText(JSON.stringify(initialPlan, null, 2));
  }, [initialPlan]);

  function importJsonText() {
    try {
      const raw: unknown = JSON.parse(jsonText);
      const result = legacyWealthPlanSchema.safeParse(raw);

      if (!result.success) {
        const errors = result.error.issues
          .map((issue) => {
            const path = issue.path.join(".") || "(root)";
            return `${path}: ${issue.message}`;
          })
          .join("\n");

        setMessage(`Invalid legacy profile:\n${errors}`);
        return;
      }

      setPlan(result.data);
      setJsonText(JSON.stringify(result.data, null, 2));
      setMessage("JSON profile validated successfully.");
    } catch {
      setMessage("The text is not valid JSON.");
    }
  }

  // Take current plan, send it to API, and save it in Supabase
  async function save() {
    setSaving(true);
    setMessage("");

    try {
      const planToSave: LegacyWealthPlan = {
        ...plan,
        savedAt: new Date().toISOString(),
      };

      const response = await fetch("/api/plan", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(planToSave),
      });

      const responseBody = await response.json();

      if (!response.ok) {
        setMessage(JSON.stringify(responseBody, null, 2));
        return;
      }

      setPlan(planToSave);
      setJsonText(JSON.stringify(planToSave, null, 2));
      setMessage("Plan saved successfully.");
      router.refresh();
    } catch (error) {
      console.error(error);
      setMessage("Save failed. Check the browser console.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Import legacy HTML profile</CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Paste the complete JSON exported by the HTML Wealth Analyzer.
          </p>

          <textarea
            value={jsonText}
            onChange={(event) => {
              setJsonText(event.target.value);
              setMessage("");
            }}
            className="min-h-[600px] w-full rounded-md border bg-background p-4 font-mono text-sm"
            spellCheck={false}
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={importJsonText}
            >
              Validate and load JSON
            </Button>

            <Button
              type="button"
              onClick={save}
              disabled={saving}
            >
              {saving ? "Saving…" : "Save to Supabase"}
            </Button>
          </div>

          {message && (
            <pre className="whitespace-pre-wrap rounded-md border bg-muted p-4 text-sm">
              {message}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
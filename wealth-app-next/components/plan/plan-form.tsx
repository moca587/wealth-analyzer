"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/tenancy/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { emptyPlan, newId } from "@/lib/plan/default-plan";
import { HouseholdSection } from "./sections/household-section";
import { ChildrenSection } from "./sections/children-section";
import { AssetsSection } from "./sections/assets-section";
import { RetirementSection } from "./sections/retirement-section";
import { ImportExportSection } from "./sections/import-export-section";
import type {
  WealthPlan, Goal, Loan, IncomeStream, ExpenseCategory
} from "@/lib/engine/types";

const today = () => new Date().toISOString();
const thisYear = new Date().getFullYear();

/**
 * Parses a numeric form field without ever producing NaN/Infinity in plan
 * state — a blank field becomes 0, and anything non-finite is discarded in
 * favor of the previous value (JSON.stringify(NaN) silently becomes `null`,
 * which would otherwise corrupt the saved plan).
 */
function parseMoneyInput(value: string, previous: number): number {
  if (value.trim() === "") return 0;
  const n = Number(value);
  return Number.isFinite(n) ? n : previous;
}

export function PlanForm({
  initialPlan,
  /**
   * The plan version this form was loaded from, sent back on save. The
   * server refuses a save whose base is stale rather than overwriting a
   * change it never saw — which is what the old single-column plan did
   * silently, losing one of two concurrent saves AND writing an audit
   * entry describing a change that never happened.
   *
   * 0 means "no version loaded" (a blank form, or the read-only preview),
   * and is sent as null: last-write-wins is correct when there is nothing
   * to be stale against.
   */
  initialVersion = 0,
}: { initialPlan: WealthPlan | null; initialVersion?: number }) {
  const router = useRouter();
  const [plan, setPlan] = useState<WealthPlan>(() => initialPlan || emptyPlan());
  const [version, setVersion] = useState(initialVersion);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<"idle" | "ok" | "err" | "conflict">("idle");
  const [saveError, setSaveError] = useState("");
  const [dirty, setDirty] = useState(false);

  const set = (patch: Partial<WealthPlan>) => {
    setPlan((p) => ({ ...p, ...patch, updatedAt: today() }));
    setDirty(true);
    setSaved("idle");
  };

  // Warn before leaving with unsaved changes — the app relies on an explicit
  // Save (no autosave), so a stray back/close shouldn't discard a full plan.
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  // ─── Income/expense/loan/goal helpers ─────────────────────────
  const addIncome = () => set({ incomes: [...plan.incomes, { id: newId(), clientId: plan.clients[0].id, source: "", amount: 0 }] });
  const updateIncome = (id: string, patch: Partial<IncomeStream>) =>
    set({ incomes: plan.incomes.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
  const removeIncome = (id: string) => set({ incomes: plan.incomes.filter((x) => x.id !== id) });

  const addExpense = () => set({ expenses: [...plan.expenses, { id: newId(), name: "", amount: 0 }] });
  const updateExpense = (id: string, patch: Partial<ExpenseCategory>) =>
    set({ expenses: plan.expenses.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
  const removeExpense = (id: string) => set({ expenses: plan.expenses.filter((x) => x.id !== id) });

  const addLoan = () => set({ loans: [...plan.loans, { id: newId(), type: "Mortgage", bal: 0, rate: 6.5, yrs: 30 }] });
  const updateLoan = (id: string, patch: Partial<Loan>) =>
    set({ loans: plan.loans.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
  const removeLoan = (id: string) => set({ loans: plan.loans.filter((x) => x.id !== id) });

  const addGoal = () => set({ goals: [...plan.goals, { id: newId(), name: "", amt: 0, startYear: thisYear + 10, endYear: thisYear + 10, tier: "important" }] });
  const updateGoal = (id: string, patch: Partial<Goal>) =>
    set({ goals: plan.goals.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
  const removeGoal = (id: string) => set({ goals: plan.goals.filter((x) => x.id !== id) });

  // Replace the whole plan (used by import) — stamp updatedAt via set().
  const replacePlan = (next: WealthPlan) => set({ ...next });

  // ─── Save to Postgres via /api/plan ───────────────────────────
  async function save() {
    setSaving(true);
    setSaved("idle");
    setSaveError("");
    try {
      const res = await apiFetch("/api/plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, baseVersion: version || null })
      });
      const body = await res.json().catch(() => ({}));

      if (res.status === 409) {
        // Someone else saved this client while this form was open. The edits
        // on screen are NOT discarded — the user keeps them and decides,
        // which is the whole reason the version check exists.
        setSaved("conflict");
        setSaveError(String(body.error ?? "This plan changed while you were editing it."));
        return;
      }
      if (!res.ok) {
        setSaved("err");
        setSaveError(String(body.error ?? `Save failed (HTTP ${res.status})`));
        return;
      }

      if (typeof body.version === "number") setVersion(body.version);
      setSaved("ok");
      setSaveError(body.auditWarning ? String(body.auditWarning) : "");
      setDirty(false);
      router.refresh();
    } catch (e) {
      console.error(e);
      setSaved("err");
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <HouseholdSection plan={plan} update={set} />
      <ChildrenSection plan={plan} update={set} />

      {/* ─── INCOME ─── */}
      <SectionList
        title="Annual income"
        rows={plan.incomes}
        onAdd={addIncome}
        renderRow={(x) => (
          <>
            <div className="space-y-1.5 sm:col-span-2"><Label>Source</Label><Input value={x.source} onChange={(e) => updateIncome(x.id, { source: e.target.value })} placeholder="Salary, Bonus, Dividends…" /></div>
            <div className="space-y-1.5"><Label>Annual amount</Label><Input type="number" value={x.amount} onChange={(e) => updateIncome(x.id, { amount: parseMoneyInput(e.target.value, x.amount) })} /></div>
            <div className="flex items-end"><Button type="button" variant="ghost" size="sm" onClick={() => removeIncome(x.id)} className="text-destructive">Remove</Button></div>
          </>
        )}
      />

      {/* ─── EXPENSES ─── */}
      <SectionList
        title="Monthly expenses"
        hint="Exclude payments on loans entered under Liabilities — the simulation deducts those separately (it would double-count them)."
        rows={plan.expenses}
        onAdd={addExpense}
        renderRow={(x) => (
          <>
            <div className="space-y-1.5 sm:col-span-2"><Label>Category</Label><Input value={x.name} onChange={(e) => updateExpense(x.id, { name: e.target.value })} placeholder="Rent, Food, Transport…" /></div>
            <div className="space-y-1.5"><Label>Monthly amount</Label><Input type="number" value={x.amount} onChange={(e) => updateExpense(x.id, { amount: parseMoneyInput(e.target.value, x.amount) })} /></div>
            <div className="flex items-end"><Button type="button" variant="ghost" size="sm" onClick={() => removeExpense(x.id)} className="text-destructive">Remove</Button></div>
          </>
        )}
      />

      {/* ─── ASSETS (country-aware) ─── */}
      <AssetsSection plan={plan} update={set} />

      {/* ─── LIABILITIES ─── */}
      <SectionList
        title="Liabilities (loans)"
        rows={plan.loans}
        onAdd={addLoan}
        renderRow={(x) => (
          <>
            <div className="space-y-1.5"><Label>Type</Label><Input value={x.type} onChange={(e) => updateLoan(x.id, { type: e.target.value })} placeholder="Mortgage, Auto, Student…" /></div>
            <div className="space-y-1.5"><Label>Balance</Label><Input type="number" value={x.bal} onChange={(e) => updateLoan(x.id, { bal: parseMoneyInput(e.target.value, x.bal) })} /></div>
            <div className="space-y-1.5"><Label>Rate %</Label><Input type="number" step="0.01" value={x.rate} onChange={(e) => updateLoan(x.id, { rate: parseMoneyInput(e.target.value, x.rate) })} /></div>
            <div className="space-y-1.5 flex items-end gap-2">
              <div className="flex-1"><Label>Years left</Label><Input type="number" value={x.yrs} onChange={(e) => updateLoan(x.id, { yrs: parseMoneyInput(e.target.value, x.yrs) })} /></div>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeLoan(x.id)} className="text-destructive">Remove</Button>
            </div>
          </>
        )}
      />

      {/* ─── GOALS ─── */}
      <SectionList
        title="Financial goals"
        rows={plan.goals}
        onAdd={addGoal}
        renderRow={(x) => (
          <>
            <div className="space-y-1.5 sm:col-span-2"><Label>Name</Label><Input value={x.name} onChange={(e) => updateGoal(x.id, { name: e.target.value })} placeholder="Retirement, Kids' college, Home purchase…" /></div>
            <div className="space-y-1.5"><Label>Annual amount needed</Label><Input type="number" value={x.amt} onChange={(e) => updateGoal(x.id, { amt: parseMoneyInput(e.target.value, x.amt) })} /></div>
            <div className="space-y-1.5"><Label>Start year</Label><Input type="number" value={x.startYear} onChange={(e) => updateGoal(x.id, { startYear: parseMoneyInput(e.target.value, x.startYear) })} /></div>
            <div className="space-y-1.5 flex items-end gap-2">
              <div className="flex-1"><Label>End year</Label><Input type="number" value={x.endYear} onChange={(e) => updateGoal(x.id, { endYear: parseMoneyInput(e.target.value, x.endYear) })} /></div>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeGoal(x.id)} className="text-destructive">Remove</Button>
            </div>
          </>
        )}
      />

      {/* ─── RETIREMENT ─── */}
      <RetirementSection plan={plan} update={set} />

      {/* ─── IMPORT / EXPORT ─── */}
      <ImportExportSection plan={plan} onImport={replacePlan} />

      {/* ─── SAVE ─── */}
      <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-background/95 backdrop-blur-sm pt-4 pb-6 -mx-6 px-6 flex items-center justify-between border-t border-border">
        <div className="text-sm max-w-xl">
          {saved === "ok" && (
            <span className="text-emerald-600">
              ✓ Saved{version ? ` — version ${version}` : ""}
              {saveError && <span className="ml-2 text-amber-600">{saveError}</span>}
            </span>
          )}
          {saved === "conflict" && (
            <span className="text-amber-600">
              {saveError} Your edits are still on screen — copy anything you need,
              then reload to merge them into the current version.
            </span>
          )}
          {saved === "err" && <span className="text-destructive">{saveError || "Save failed"}</span>}
          {saved === "idle" && (dirty
            ? <span className="text-amber-600">Unsaved changes</span>
            : <span className="text-muted-foreground">Click save to persist</span>)}
        </div>
        <div className="flex gap-3 shrink-0">
          <Button variant="outline" onClick={() => router.push("/app")}>Cancel</Button>
          {saved === "conflict"
            ? <Button onClick={() => router.refresh()} size="lg" variant="outline">Reload</Button>
            : null}
          <Button onClick={save} disabled={saving} size="lg">{saving ? "Saving…" : "Save plan"}</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Generic add/remove section component ────────────────────────
function SectionList<T extends { id: string }>({
  title, hint, rows, onAdd, renderRow
}: {
  title: string;
  hint?: string;
  rows: T[];
  onAdd: () => void;
  renderRow: (row: T) => React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle>{title}</CardTitle>
          {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>+ Add</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-muted-foreground italic">None yet — click Add to start.</p>}
        {rows.map((r) => (
          <div key={r.id} className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-lg border border-border bg-muted/30">
            {renderRow(r)}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

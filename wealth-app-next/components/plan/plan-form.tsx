"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RISK_PROFILES, HORIZON_PROFILES, COUNTRY_LABELS, INFLATION_REGIONS } from "@/lib/engine/constants";
import type {
  WealthPlan, Client, Goal, Asset, Loan, IncomeStream, ExpenseCategory, AssetClass
} from "@/lib/engine/types";

const newId = () => "id_" + Math.random().toString(36).slice(2, 10);
const today = () => new Date().toISOString();
const thisYear = new Date().getFullYear();

function emptyPlan(): WealthPlan {
  const c1: Client = { id: newId(), first: "", last: "", country: "US", risk: "moderate", horizon: "15_plus" };
  return {
    version: 1,
    currency: "USD",
    inflationRate: INFLATION_REGIONS.US.rate,
    inflationRegion: "US",
    clients: [c1],
    children: [],
    incomes: [{ id: newId(), clientId: c1.id, source: "Salary", amount: 0, taxable: true }],
    expenses: [{ id: newId(), name: "Living expenses", amount: 0 }],
    assets: [],
    loans: [],
    goals: [],
    createdAt: today(),
    updatedAt: today()
  };
}

export function PlanForm({ initialPlan }: { initialPlan: WealthPlan | null }) {
  const router = useRouter();
  const [plan, setPlan] = useState<WealthPlan>(() => initialPlan || emptyPlan());
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<"idle" | "ok" | "err">("idle");

  const set = (patch: Partial<WealthPlan>) => setPlan((p) => ({ ...p, ...patch, updatedAt: today() }));

  // ─── Client helpers ─────────────────────────────────────────────
  const updateClient = (id: string, patch: Partial<Client>) =>
    set({ clients: plan.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  const addSecondClient = () => {
    if (plan.clients.length >= 2) return;
    set({ clients: [...plan.clients, { id: newId(), first: "", last: "", country: plan.clients[0].country, risk: "moderate", horizon: "15_plus" }] });
  };
  const removeClient = (id: string) =>
    plan.clients.length > 1 && set({ clients: plan.clients.filter((c) => c.id !== id) });

  // ─── Income/expense/asset/loan/goal helpers ───────────────────
  const addIncome = () => set({ incomes: [...plan.incomes, { id: newId(), clientId: plan.clients[0].id, source: "", amount: 0 }] });
  const updateIncome = (id: string, patch: Partial<IncomeStream>) =>
    set({ incomes: plan.incomes.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
  const removeIncome = (id: string) => set({ incomes: plan.incomes.filter((x) => x.id !== id) });

  const addExpense = () => set({ expenses: [...plan.expenses, { id: newId(), name: "", amount: 0 }] });
  const updateExpense = (id: string, patch: Partial<ExpenseCategory>) =>
    set({ expenses: plan.expenses.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
  const removeExpense = (id: string) => set({ expenses: plan.expenses.filter((x) => x.id !== id) });

  const addAsset = () => set({ assets: [...plan.assets, { id: newId(), type: "Brokerage", value: 0, liquid: true, cls: "equity" }] });
  const updateAsset = (id: string, patch: Partial<Asset>) =>
    set({ assets: plan.assets.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
  const removeAsset = (id: string) => set({ assets: plan.assets.filter((x) => x.id !== id) });

  const addLoan = () => set({ loans: [...plan.loans, { id: newId(), type: "Mortgage", bal: 0, rate: 6.5, yrs: 30 }] });
  const updateLoan = (id: string, patch: Partial<Loan>) =>
    set({ loans: plan.loans.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
  const removeLoan = (id: string) => set({ loans: plan.loans.filter((x) => x.id !== id) });

  const addGoal = () => set({ goals: [...plan.goals, { id: newId(), name: "", amt: 0, startYear: thisYear + 10, endYear: thisYear + 10, tier: "important" }] });
  const updateGoal = (id: string, patch: Partial<Goal>) =>
    set({ goals: plan.goals.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
  const removeGoal = (id: string) => set({ goals: plan.goals.filter((x) => x.id !== id) });

  // ─── Inflation region change ──────────────────────────────────
  const setRegion = (region: string) => {
    const r = INFLATION_REGIONS[region];
    set({ inflationRegion: region, inflationRate: r?.rate ?? plan.inflationRate });
  };

  // ─── Save to Postgres via /api/plan ───────────────────────────
  async function save() {
    setSaving(true);
    setSaved("idle");
    try {
      const res = await fetch("/api/plan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(plan)
      });
      if (!res.ok) throw new Error(await res.text());
      setSaved("ok");
      router.refresh();
    } catch (e) {
      console.error(e);
      setSaved("err");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ─── HOUSEHOLD ─── */}
      <Card>
        <CardHeader>
          <CardTitle>Household</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {plan.clients.map((c, idx) => (
            <div key={c.id} className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-lg border border-border bg-muted/30">
              <div className="space-y-1.5">
                <Label>First name</Label>
                <Input value={c.first} onChange={(e) => updateClient(c.id, { first: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Last name</Label>
                <Input value={c.last} onChange={(e) => updateClient(c.id, { last: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Country</Label>
                <Select value={c.country || "US"} onChange={(e) => updateClient(c.id, { country: e.target.value as Client["country"] })}>
                  {Object.entries(COUNTRY_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Risk profile</Label>
                <Select value={c.risk || "moderate"} onChange={(e) => updateClient(c.id, { risk: e.target.value as Client["risk"] })}>
                  {Object.entries(RISK_PROFILES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Time horizon</Label>
                <div className="flex gap-2">
                  <Select value={c.horizon || "15_plus"} onChange={(e) => updateClient(c.id, { horizon: e.target.value as Client["horizon"] })}>
                    {Object.entries(HORIZON_PROFILES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </Select>
                  {idx > 0 && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeClient(c.id)} className="text-destructive">&times;</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {plan.clients.length < 2 && (
            <Button type="button" variant="outline" size="sm" onClick={addSecondClient}>+ Add second client</Button>
          )}

          <div className="grid sm:grid-cols-3 gap-3 pt-4 border-t border-border">
            <div className="space-y-1.5">
              <Label>Currency</Label>
              <Select value={plan.currency} onChange={(e) => set({ currency: e.target.value })}>
                {["USD","EUR","GBP","CHF","CAD","AUD","JPY","SGD","HKD"].map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Inflation region</Label>
              <Select value={plan.inflationRegion || "US"} onChange={(e) => setRegion(e.target.value)}>
                {Object.entries(INFLATION_REGIONS).map(([k, v]) => <option key={k} value={k}>{v.label} ({(v.rate*100).toFixed(1)}%)</option>)}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Inflation rate (decimal)</Label>
              <Input type="number" step="0.001" value={plan.inflationRate} onChange={(e) => set({ inflationRate: +e.target.value })} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ─── INCOME ─── */}
      <SectionList
        title="Annual income"
        rows={plan.incomes}
        onAdd={addIncome}
        renderRow={(x) => (
          <>
            <div className="space-y-1.5 sm:col-span-2"><Label>Source</Label><Input value={x.source} onChange={(e) => updateIncome(x.id, { source: e.target.value })} placeholder="Salary, Bonus, Dividends…" /></div>
            <div className="space-y-1.5"><Label>Annual amount</Label><Input type="number" value={x.amount} onChange={(e) => updateIncome(x.id, { amount: +e.target.value })} /></div>
            <div className="flex items-end"><Button type="button" variant="ghost" size="sm" onClick={() => removeIncome(x.id)} className="text-destructive">Remove</Button></div>
          </>
        )}
      />

      {/* ─── EXPENSES ─── */}
      <SectionList
        title="Monthly expenses"
        rows={plan.expenses}
        onAdd={addExpense}
        renderRow={(x) => (
          <>
            <div className="space-y-1.5 sm:col-span-2"><Label>Category</Label><Input value={x.name} onChange={(e) => updateExpense(x.id, { name: e.target.value })} placeholder="Rent, Food, Transport…" /></div>
            <div className="space-y-1.5"><Label>Monthly amount</Label><Input type="number" value={x.amount} onChange={(e) => updateExpense(x.id, { amount: +e.target.value })} /></div>
            <div className="flex items-end"><Button type="button" variant="ghost" size="sm" onClick={() => removeExpense(x.id)} className="text-destructive">Remove</Button></div>
          </>
        )}
      />

      {/* ─── ASSETS ─── */}
      <SectionList
        title="Assets"
        rows={plan.assets}
        onAdd={addAsset}
        renderRow={(x) => (
          <>
            <div className="space-y-1.5"><Label>Type</Label><Input value={x.type} onChange={(e) => updateAsset(x.id, { type: e.target.value })} placeholder="Brokerage, 401k, Property…" /></div>
            <div className="space-y-1.5"><Label>Class</Label><Select value={x.cls || "equity"} onChange={(e) => updateAsset(x.id, { cls: e.target.value as AssetClass })}>
              {["equity","fixed_income","real_estate","commodity","cash","mixed","alternative","crypto"].map((c) => <option key={c} value={c}>{c.replace("_"," ")}</option>)}
            </Select></div>
            <div className="space-y-1.5"><Label>Current value</Label><Input type="number" value={x.value} onChange={(e) => updateAsset(x.id, { value: +e.target.value })} /></div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={x.liquid} onChange={(e) => updateAsset(x.id, { liquid: e.target.checked })} /> Liquid</label>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeAsset(x.id)} className="text-destructive ml-auto">Remove</Button>
            </div>
          </>
        )}
      />

      {/* ─── LIABILITIES ─── */}
      <SectionList
        title="Liabilities (loans)"
        rows={plan.loans}
        onAdd={addLoan}
        renderRow={(x) => (
          <>
            <div className="space-y-1.5"><Label>Type</Label><Input value={x.type} onChange={(e) => updateLoan(x.id, { type: e.target.value })} placeholder="Mortgage, Auto, Student…" /></div>
            <div className="space-y-1.5"><Label>Balance</Label><Input type="number" value={x.bal} onChange={(e) => updateLoan(x.id, { bal: +e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Rate %</Label><Input type="number" step="0.01" value={x.rate} onChange={(e) => updateLoan(x.id, { rate: +e.target.value })} /></div>
            <div className="space-y-1.5 flex items-end gap-2">
              <div className="flex-1"><Label>Years left</Label><Input type="number" value={x.yrs} onChange={(e) => updateLoan(x.id, { yrs: +e.target.value })} /></div>
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
            <div className="space-y-1.5"><Label>Annual amount needed</Label><Input type="number" value={x.amt} onChange={(e) => updateGoal(x.id, { amt: +e.target.value })} /></div>
            <div className="space-y-1.5"><Label>Start year</Label><Input type="number" value={x.startYear} onChange={(e) => updateGoal(x.id, { startYear: +e.target.value })} /></div>
            <div className="space-y-1.5 flex items-end gap-2">
              <div className="flex-1"><Label>End year</Label><Input type="number" value={x.endYear} onChange={(e) => updateGoal(x.id, { endYear: +e.target.value })} /></div>
              <Button type="button" variant="ghost" size="sm" onClick={() => removeGoal(x.id)} className="text-destructive">Remove</Button>
            </div>
          </>
        )}
      />

      {/* ─── SAVE ─── */}
      <div className="sticky bottom-0 bg-gradient-to-t from-background via-background to-background/95 backdrop-blur-sm pt-4 pb-6 -mx-6 px-6 flex items-center justify-between border-t border-border">
        <div className="text-sm">
          {saved === "ok" && <span className="text-emerald-600">✓ Saved</span>}
          {saved === "err" && <span className="text-destructive">Save failed — check console</span>}
          {saved === "idle" && <span className="text-muted-foreground">Click save to persist</span>}
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => router.push("/app")}>Cancel</Button>
          <Button onClick={save} disabled={saving} size="lg">{saving ? "Saving…" : "Save plan"}</Button>
        </div>
      </div>
    </div>
  );
}

// ─── Generic add/remove section component ────────────────────────
function SectionList<T extends { id: string }>({
  title, rows, onAdd, renderRow
}: {
  title: string;
  rows: T[];
  onAdd: () => void;
  renderRow: (row: T) => React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>{title}</CardTitle>
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

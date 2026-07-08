"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ageFromDOB } from "@/lib/engine/financial-math";
import { newId } from "@/lib/plan/default-plan";
import type { Retirement } from "@/lib/engine/types";
import type { SectionProps } from "./section-props";

const numIn = (v: string, prev: number) => {
  const t = v.trim();
  return t === "" ? 0 : Number.isFinite(+t) ? +t : prev;
};

export function RetirementSection({ plan, update }: SectionProps) {
  const ret = plan.retirement;
  const enabled = !!ret?.enabled;
  const age = plan.clients[0]?.dob ? ageFromDOB(plan.clients[0].dob) : null;
  const pensions = plan.pensions ?? [];

  const setRet = (patch: Partial<Retirement>) =>
    update({
      retirement: {
        retirementAge: ret?.retirementAge ?? 65,
        annualSpending: ret?.annualSpending ?? 0,
        planToAge: ret?.planToAge ?? 90,
        ...ret,
        ...patch,
      },
    });

  const addPension = () =>
    update({ pensions: [...pensions, { id: newId(), label: "", annualAmount: 0, startAge: 67, colaRate: 0 }] });
  const updPension = (id: string, patch: Partial<(typeof pensions)[number]>) =>
    update({ pensions: pensions.map((p) => (p.id === id ? { ...p, ...patch } : p)) });
  const rmPension = (id: string) => update({ pensions: pensions.filter((p) => p.id !== id) });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Retirement</CardTitle>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={enabled} onChange={(e) => setRet({ enabled: e.target.checked })} />
          Plan for retirement
        </label>
      </CardHeader>
      <CardContent className="space-y-4">
        {!enabled && (
          <p className="text-sm text-muted-foreground italic">
            Turn this on to model an accumulate → decumulate life-cycle: your salary stops at retirement,
            spending is drawn from the portfolio, pensions are credited, and the simulation reports a
            &ldquo;will my money last?&rdquo; probability.
          </p>
        )}
        {enabled && (
          <>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Retirement age{age !== null ? ` · you're ${age} now` : ""}</Label>
                <Input type="number" value={ret?.retirementAge ?? 65}
                  onChange={(e) => setRet({ retirementAge: numIn(e.target.value, ret?.retirementAge ?? 65) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Annual spending in retirement</Label>
                <Input type="number" value={ret?.annualSpending ?? 0}
                  onChange={(e) => setRet({ annualSpending: numIn(e.target.value, ret?.annualSpending ?? 0) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Plan through age</Label>
                <Input type="number" value={ret?.planToAge ?? 90}
                  onChange={(e) => setRet({ planToAge: numIn(e.target.value, ret?.planToAge ?? 90) })} />
              </div>
            </div>

            <div className="pt-3 border-t border-border">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-semibold">Pensions &amp; guaranteed income</div>
                <Button type="button" variant="outline" size="sm" onClick={addPension}>+ Add</Button>
              </div>
              {pensions.length === 0 && (
                <p className="text-xs text-muted-foreground italic">Add Social Security, a state/company pension, or an annuity that pays in retirement.</p>
              )}
              {pensions.map((p) => (
                <div key={p.id} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 p-3 rounded-lg border border-border bg-muted/30 mb-2">
                  <div className="space-y-1.5">
                    <Label>Label</Label>
                    <Input value={p.label} onChange={(e) => updPension(p.id, { label: e.target.value })} placeholder="Social Security" />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Annual amount</Label>
                    <Input type="number" value={p.annualAmount} onChange={(e) => updPension(p.id, { annualAmount: numIn(e.target.value, p.annualAmount) })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Starts at age</Label>
                    <Input type="number" value={p.startAge} onChange={(e) => updPension(p.id, { startAge: numIn(e.target.value, p.startAge) })} />
                  </div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1.5">
                      <Label>COLA %/yr</Label>
                      <Input type="number" step="0.1" value={Math.round((p.colaRate ?? 0) * 1000) / 10}
                        onChange={(e) => updPension(p.id, { colaRate: numIn(e.target.value, (p.colaRate ?? 0) * 100) / 100 })} />
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => rmPension(p.id)} className="text-destructive">Remove</Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ageFromDOB } from "@/lib/engine/financial-math";
import { newId } from "@/lib/plan/default-plan";
import type { Child } from "@/lib/engine/types";
import type { SectionProps } from "./section-props";

export function ChildrenSection({ plan, update }: SectionProps) {
  const addChild = () =>
    update({ children: [...plan.children, { id: newId(), first: "", last: plan.clients[0]?.last || "", dob: "" }] });
  const updateChild = (id: string, patch: Partial<Child>) =>
    update({ children: plan.children.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  const removeChild = (id: string) => update({ children: plan.children.filter((c) => c.id !== id) });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Children / dependents</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={addChild}>+ Add</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {plan.children.length === 0 && (
          <p className="text-sm text-muted-foreground italic">None added — click Add if you have dependents to plan for.</p>
        )}
        {plan.children.map((c) => {
          const age = c.dob ? ageFromDOB(c.dob) : null;
          return (
            <div key={c.id} className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 p-4 rounded-lg border border-border bg-muted/30">
              <div className="space-y-1.5">
                <Label>First name</Label>
                <Input value={c.first} onChange={(e) => updateChild(c.id, { first: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Last name</Label>
                <Input value={c.last} onChange={(e) => updateChild(c.id, { last: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Date of birth{age !== null ? ` · age ${age}` : ""}</Label>
                <Input type="date" value={c.dob} onChange={(e) => updateChild(c.id, { dob: e.target.value })} />
              </div>
              <div className="flex items-end">
                <Button type="button" variant="ghost" size="sm" onClick={() => removeChild(c.id)} className="text-destructive">
                  Remove
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

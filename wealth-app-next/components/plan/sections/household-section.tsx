"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RISK_PROFILES, HORIZON_PROFILES, INFLATION_REGIONS, inflationRegionForCountry } from "@/lib/engine/constants";
import { COUNTRY_ACCOUNTS, ACCOUNT_COUNTRY_CODES } from "@/lib/data/country-accounts";
import { ageFromDOB } from "@/lib/engine/financial-math";
import { newId } from "@/lib/plan/default-plan";
import type { Client } from "@/lib/engine/types";
import type { SectionProps } from "./section-props";

export function HouseholdSection({ plan, update }: SectionProps) {
  const [addrOpen, setAddrOpen] = useState<Record<string, boolean>>({});

  const updateClient = (id: string, patch: Partial<Client>) =>
    update({ clients: plan.clients.map((c) => (c.id === id ? { ...c, ...patch } : c)) });

  // Changing the first client's country re-defaults the inflation region (and
  // its rate) to the matching region — eurozone members map to EU, Taiwan to
  // CN — but the user can still override the rate afterwards.
  const setClientCountry = (id: string, country: Client["country"]) => {
    const isPrimary = plan.clients[0]?.id === id;
    const clients = plan.clients.map((c) => (c.id === id ? { ...c, country } : c));
    if (isPrimary && country) {
      const region = inflationRegionForCountry(country);
      update({ clients, inflationRegion: region, inflationRate: INFLATION_REGIONS[region]?.rate ?? plan.inflationRate });
    } else {
      update({ clients });
    }
  };

  const addSecondClient = () => {
    if (plan.clients.length >= 2) return;
    update({
      clients: [
        ...plan.clients,
        { id: newId(), first: "", last: "", country: plan.clients[0].country, risk: "moderate", horizon: "15_plus" },
      ],
    });
  };

  const removeClient = (id: string) => {
    if (plan.clients.length <= 1) return;
    const remaining = plan.clients.filter((c) => c.id !== id);
    // Reassign the removed client's income to whoever's left — no orphans.
    const incomes = plan.incomes.map((x) => (x.clientId === id ? { ...x, clientId: remaining[0].id } : x));
    update({ clients: remaining, incomes });
  };

  const setRegion = (region: string) =>
    update({ inflationRegion: region, inflationRate: INFLATION_REGIONS[region]?.rate ?? plan.inflationRate });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Household</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {plan.clients.map((c, idx) => {
          const age = c.dob ? ageFromDOB(c.dob) : null;
          const open = !!addrOpen[c.id];
          return (
            <div key={c.id} className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label>First name</Label>
                  <Input value={c.first} onChange={(e) => updateClient(c.id, { first: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Last name</Label>
                  <Input value={c.last} onChange={(e) => updateClient(c.id, { last: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Date of birth{age !== null ? ` · age ${age}` : ""}</Label>
                  <Input type="date" value={c.dob || ""} onChange={(e) => updateClient(c.id, { dob: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Country of residence</Label>
                  <Select value={c.country || "US"} onChange={(e) => setClientCountry(c.id, e.target.value as Client["country"])}>
                    {ACCOUNT_COUNTRY_CODES.map((k) => (
                      <option key={k} value={k}>{COUNTRY_ACCOUNTS[k].flag} {COUNTRY_ACCOUNTS[k].name}</option>
                    ))}
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
                  <Select value={c.horizon || "15_plus"} onChange={(e) => updateClient(c.id, { horizon: e.target.value as Client["horizon"] })}>
                    {Object.entries(HORIZON_PROFILES).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setAddrOpen((s) => ({ ...s, [c.id]: !open }))}
                  className="text-xs font-semibold text-accent hover:underline"
                  aria-expanded={open}
                >
                  {open ? "▾" : "▸"} Address {c.city || c.state || c.zip ? "" : "(optional)"}
                </button>
                {idx > 0 && (
                  <Button type="button" variant="ghost" size="sm" onClick={() => removeClient(c.id)} className="text-destructive ml-auto">
                    Remove client
                  </Button>
                )}
              </div>

              {open && (
                <div className="grid sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label>State / province</Label>
                    <Input value={c.state || ""} onChange={(e) => updateClient(c.id, { state: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>City</Label>
                    <Input value={c.city || ""} onChange={(e) => updateClient(c.id, { city: e.target.value })} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Postal / ZIP</Label>
                    <Input value={c.zip || ""} onChange={(e) => updateClient(c.id, { zip: e.target.value })} />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {plan.clients.length < 2 && (
          <Button type="button" variant="outline" size="sm" onClick={addSecondClient}>+ Add second client</Button>
        )}

        <div className="grid sm:grid-cols-3 gap-3 pt-4 border-t border-border">
          <div className="space-y-1.5">
            <Label>Currency</Label>
            <Select value={plan.currency} onChange={(e) => update({ currency: e.target.value })}>
              {["USD", "EUR", "GBP", "CHF", "CAD", "AUD", "JPY", "SGD", "HKD"].map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Inflation region</Label>
            <Select value={plan.inflationRegion || "US"} onChange={(e) => setRegion(e.target.value)}>
              {Object.entries(INFLATION_REGIONS).map(([k, v]) => <option key={k} value={k}>{v.label} ({(v.rate * 100).toFixed(1)}%)</option>)}
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Inflation rate (decimal)</Label>
            <Input
              type="number"
              step="0.001"
              value={plan.inflationRate}
              onChange={(e) => {
                const v = e.target.value.trim();
                update({ inflationRate: v === "" ? 0 : (Number.isFinite(+v) ? +v : plan.inflationRate) });
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

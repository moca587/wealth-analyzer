"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { COUNTRY_ACCOUNTS, ACCOUNT_COUNTRY_CODES, findAccountType } from "@/lib/data/country-accounts";
import { newId } from "@/lib/plan/default-plan";
import type { Asset, AssetClass, CountryCode } from "@/lib/engine/types";
import type { SectionProps } from "./section-props";

const CLASSES: AssetClass[] = ["equity", "fixed_income", "real_estate", "commodity", "cash", "mixed", "alternative", "crypto"];

// Infer a sensible asset class from an account-type value, so picking a
// country-specific account also sets a reasonable default risk bucket.
function inferClass(value: string): AssetClass {
  const v = value.toLowerCase();
  if (/(check|saving|cash|mmf|money_market|deposit|current)/.test(v)) return "cash";
  if (/(bond|treasury|gilt|fixed|cd|term)/.test(v)) return "fixed_income";
  if (/(property|home|real_?estate|reit|land)/.test(v)) return "real_estate";
  if (/(crypto|bitcoin)/.test(v)) return "crypto";
  if (/(gold|commodity|silver)/.test(v)) return "commodity";
  if (/(pension|retire|401|ira|isa|super|rrsp|cpf|mpf)/.test(v)) return "mixed";
  return "equity";
}

export function AssetsSection({ plan, update }: SectionProps) {
  const defaultCountry = (plan.clients[0]?.country as CountryCode) || "US";

  const addAsset = () => {
    const country = defaultCountry;
    const first = COUNTRY_ACCOUNTS[country]?.groups[0]?.accounts[0];
    update({
      assets: [
        ...plan.assets,
        {
          id: newId(),
          country,
          type: first?.value || "brokerage",
          label: first?.label,
          group: COUNTRY_ACCOUNTS[country]?.groups[0]?.group,
          value: 0,
          liquid: first?.liquid ?? true,
          cls: inferClass(first?.value || "brokerage"),
          note: first?.note,
        },
      ],
    });
  };

  const updateAsset = (id: string, patch: Partial<Asset>) =>
    update({ assets: plan.assets.map((x) => (x.id === id ? { ...x, ...patch } : x)) });
  const removeAsset = (id: string) => update({ assets: plan.assets.filter((x) => x.id !== id) });

  // Picking an account type pulls its liquidity, label, group and note from the
  // country taxonomy so the row is fully described from one choice.
  const setAssetType = (a: Asset, value: string) => {
    const country = (a.country as string) || defaultCountry;
    const meta = findAccountType(country, value);
    const group = COUNTRY_ACCOUNTS[country]?.groups.find((g) => g.accounts.some((x) => x.value === value))?.group;
    updateAsset(a.id, {
      type: value,
      label: meta?.label,
      group,
      liquid: meta?.liquid ?? a.liquid,
      note: meta?.note,
      cls: inferClass(value),
    });
  };

  // Changing an asset's own country resets its type to that country's first
  // account (its old type won't exist in the new taxonomy).
  const setAssetCountry = (a: Asset, country: CountryCode) => {
    const first = COUNTRY_ACCOUNTS[country]?.groups[0]?.accounts[0];
    updateAsset(a.id, {
      country,
      type: first?.value || a.type,
      label: first?.label,
      group: COUNTRY_ACCOUNTS[country]?.groups[0]?.group,
      liquid: first?.liquid ?? a.liquid,
      note: first?.note,
      cls: inferClass(first?.value || a.type),
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle>Assets</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={addAsset}>+ Add</Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {plan.assets.length === 0 && (
          <p className="text-sm text-muted-foreground italic">None yet — click Add. New assets default to {COUNTRY_ACCOUNTS[defaultCountry]?.name}.</p>
        )}
        {plan.assets.map((a) => {
          const country = (a.country as string) || defaultCountry;
          const groups = COUNTRY_ACCOUNTS[country]?.groups || [];
          return (
            <div key={a.id} className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="space-y-1.5">
                  <Label>Country</Label>
                  <Select value={country} onChange={(e) => setAssetCountry(a, e.target.value as CountryCode)}>
                    {ACCOUNT_COUNTRY_CODES.map((k) => (
                      <option key={k} value={k}>{COUNTRY_ACCOUNTS[k].flag} {COUNTRY_ACCOUNTS[k].name}</option>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Account type</Label>
                  <Select value={a.type} onChange={(e) => setAssetType(a, e.target.value)}>
                    {groups.map((g) => (
                      <optgroup key={g.group} label={g.group}>
                        {g.accounts.map((acc) => <option key={acc.value} value={acc.value}>{acc.label}</option>)}
                      </optgroup>
                    ))}
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Current value</Label>
                  <Input
                    type="number"
                    value={a.value}
                    onChange={(e) => {
                      const v = e.target.value.trim();
                      updateAsset(a.id, { value: v === "" ? 0 : (Number.isFinite(+v) ? +v : a.value) });
                    }}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Asset class</Label>
                  <Select value={a.cls || "equity"} onChange={(e) => updateAsset(a.id, { cls: e.target.value as AssetClass })}>
                    {CLASSES.map((c) => <option key={c} value={c}>{c.replace("_", " ")}</option>)}
                  </Select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs">
                  <input type="checkbox" checked={a.liquid} onChange={(e) => updateAsset(a.id, { liquid: e.target.checked })} /> Liquid
                </label>
                {a.note && <span className="text-xs text-muted-foreground truncate flex-1">{a.note}</span>}
                <Button type="button" variant="ghost" size="sm" onClick={() => removeAsset(a.id)} className="text-destructive ml-auto">
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

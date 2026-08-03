"use client";

// ─────────────────────────────────────────────────────────────────
// Which client am I looking at?
//
// This is the most consequential control in the app: everything below it
// — the plan, the feeds, the proposal, the order — is about whichever
// client is named here. So it says the name plainly rather than hiding
// it behind an avatar, and switching does a full router.refresh() so no
// stale server-rendered figure from the previous client can remain on
// screen next to the new one's name.
// ─────────────────────────────────────────────────────────────────

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  loadHouseholds, setHouseholdId, type HouseholdRef,
} from "@/lib/tenancy/client";
import { Button } from "@/components/ui/button";

export function HouseholdSwitcher() {
  const router = useRouter();
  const [households, setHouseholds] = useState<HouseholdRef[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const { households: hs, selected: sel } = await loadHouseholds();
    setHouseholds(hs);
    setSelected(sel);
    setLoading(false);
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  function choose(id: string) {
    setHouseholdId(id);
    setSelected(id);
    // Server components on this page rendered the PREVIOUS client's data.
    router.refresh();
  }

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/households", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(body.error || `Could not create the client (HTTP ${res.status})`);
      return;
    }
    setName("");
    setAdding(false);
    await refresh();
    if (body.household?.id) choose(body.household.id);
  }

  if (loading) {
    return <div className="px-3 py-2 text-xs text-muted-foreground">Loading clients…</div>;
  }

  const current = households.find((h) => h.id === selected);

  return (
    <div className="px-3 py-3 border-b border-border space-y-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground px-1">Client</div>

      {households.length === 0 ? (
        <p className="px-1 text-xs text-muted-foreground">No clients yet.</p>
      ) : (
        <select
          value={selected ?? ""}
          onChange={(e) => choose(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          aria-label="Select client"
        >
          {/* Only shown until a choice exists — the server refuses to guess,
              so an unset value must look unset rather than like the first row. */}
          {!selected && <option value="">Choose a client…</option>}
          {households.map((h) => (
            <option key={h.id} value={h.id}>{h.name}</option>
          ))}
        </select>
      )}

      {current && (
        <div className="px-1 text-[11px] text-muted-foreground">Reporting in {current.currency}</div>
      )}

      {adding ? (
        <form onSubmit={create} className="space-y-2">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Client name"
            className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm"
          />
          {error && <p className="text-[11px] text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button type="submit" size="sm" className="flex-1" disabled={!name.trim()}>Add</Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { setAdding(false); setError(""); }}>
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button variant="outline" size="sm" className="w-full" onClick={() => setAdding(true)}>
          + New client
        </Button>
      )}
    </div>
  );
}

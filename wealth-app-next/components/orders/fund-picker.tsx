"use client";

// ─────────────────────────────────────────────────────────────────
// The fund-universe picker for the proposal builder.
//
// 973 vehicles is 135KB, so the data is DYNAMICALLY imported the first
// time the picker opens — it never rides in the main proposal bundle. An
// advisor who only ever types ISINs by hand pays nothing for it.
//
// On select, it fills a position's name / ticker / class / vehicle. It
// deliberately does NOT fill an ISIN or Valor: the universe is
// ticker-keyed and carries none, and inventing one would be exactly the
// silently-wrong-identifier failure the order path exists to prevent. The
// advisor adds the identifier their custodian books on; the picker just
// saves them the name-and-ticket typing.
// ─────────────────────────────────────────────────────────────────

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { searchFunds, CLASS_LABEL } from "@/lib/data/fund-search";
import type { Fund, FundClass } from "@/lib/data/fund-universe";

export interface FundPick {
  name: string;
  ticker: string;
  cls: string;
  vehicle: string;
}

const CLASSES: FundClass[] = [
  "equity", "fixed_income", "real_estate", "commodity", "cash", "mixed", "alternative", "crypto",
];

export function FundPicker({
  onPick, onClose,
}: {
  onPick: (f: FundPick) => void;
  onClose: () => void;
}) {
  const [funds, setFunds] = useState<Fund[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [text, setText] = useState("");
  const [cls, setCls] = useState<FundClass | "">("");
  const [ucitsOnly, setUcitsOnly] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Lazy-load the 135KB data module only now that the picker is open.
  useEffect(() => {
    let live = true;
    import("@/lib/data/fund-universe")
      .then((m) => { if (live) setFunds(m.FUND_UNIVERSE); })
      .catch(() => { if (live) setLoadFailed(true); });
    return () => { live = false; };
  }, []);

  useEffect(() => { inputRef.current?.focus(); }, [funds]);

  // Close on Escape — a modal that traps the advisor is worse than no modal.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const results = useMemo(() => {
    if (!funds) return [];
    return searchFunds(funds, {
      text, cls: cls || undefined, ucitsOnly, limit: 50,
    });
  }, [funds, text, cls, ucitsOnly]);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 pt-[8vh]" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Fund picker"
      >
        <div className="p-4 border-b border-border space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">Add from the fund universe</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Search by ticker, name or sponsor — e.g. VWRL, all-world, iShares"
          />
          <div className="flex flex-wrap items-center gap-2">
            <Select value={cls} onChange={(e) => setCls(e.target.value as FundClass | "")} className="w-44">
              <option value="">All classes</option>
              {CLASSES.map((c) => <option key={c} value={c}>{CLASS_LABEL[c]}</option>)}
            </Select>
            <label className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <input type="checkbox" checked={ucitsOnly} onChange={(e) => setUcitsOnly(e.target.checked)} />
              UCITS only
            </label>
          </div>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {loadFailed && (
            <p className="p-4 text-sm text-destructive">
              Could not load the fund list. Enter the position manually instead.
            </p>
          )}
          {!funds && !loadFailed && (
            <p className="p-4 text-sm text-muted-foreground">Loading fund universe…</p>
          )}
          {funds && !results.length && (
            <p className="p-4 text-sm text-muted-foreground">
              No match. Try fewer letters, or enter the position manually.
            </p>
          )}
          {results.map((f) => (
            <button
              key={f.tkr}
              type="button"
              onClick={() => {
                onPick({ name: f.name, ticker: f.tkr, cls: f.cls, vehicle: f.vehicle });
                onClose();
              }}
              className="w-full text-left rounded-lg px-3 py-2 hover:bg-accent/10 flex items-baseline gap-3"
            >
              <span className="font-mono text-sm text-accent w-16 shrink-0">{f.tkr}</span>
              <span className="flex-1 min-w-0">
                <span className="block truncate text-sm">{f.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {f.sponsor} · {CLASS_LABEL[f.cls]}
                  {f.er != null ? ` · ${f.er}% ER` : ""}
                  {f.ucits ? " · UCITS" : ""}
                  {f.ccy ? ` · ${f.ccy}` : ""}
                </span>
              </span>
            </button>
          ))}
        </div>

        <div className="p-3 border-t border-border text-xs text-muted-foreground">
          Fills the name and ticker. Add the ISIN or Valor your custodian books on — the
          universe is ticker-keyed and carries no identifier, so none is guessed.
        </div>
      </div>
    </div>
  );
}

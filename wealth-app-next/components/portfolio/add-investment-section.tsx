"use client";

import { useState } from "react";

import { searchFunds } from "@/lib/data/fund-search";
import { FUND_UNIVERSE } from "@/lib/data/fund-universe";

import type { Holding, WealthPlan } from "@/lib/engine/types";

import {
  ASSET_CLASSES,
  CLASS_LABEL,
  type AssetClass,
} from "@/lib/portfolio/asset-class";

type Props = {
  plan: WealthPlan;
  update: (patch: Partial<WealthPlan>) => void;
};

const INVESTMENT_TYPES = ["ETF", "Mutual fund", "Stock", "Bond", "Alternative"];

const REGIONS = ["US", "Dev Intl", "EM", "Global", "Other"];

export function AddInvestmentSection({ plan, update }: Props) {
  const [type, setType] = useState("ETF");

  const [name, setName] = useState("");

  const [ticker, setTicker] = useState("");

  const [cls, setCls] = useState<AssetClass>("equity");

  const [value, setValue] = useState(0);

  const [region, setRegion] = useState("US");

  const [expenseRatio, setExpenseRatio] = useState<number | undefined>();

  const [yieldPct, setYieldPct] = useState<number | undefined>();

  const [note, setNote] = useState("");

  function addInvestment() {
    if (value <= 0) return;

    const newHolding: Holding = {
      id: crypto.randomUUID(),

      name: name.trim() || ticker.trim().toUpperCase() || "Investment",

      ticker: ticker.trim() ? ticker.trim().toUpperCase() : undefined,

      cls,

      value,

      region,

      er: expenseRatio,

      yld: yieldPct,

      note: note.trim() || undefined,

      instrumentType: type,
    };

    update({
      holdings: [...(plan.holdings ?? []), newHolding],
    });

    setName("");
    setTicker("");
    setValue(0);
    setExpenseRatio(undefined);
    setYieldPct(undefined);
    setNote("");
  }

  function fetchByTicker() {
    const normalizedTicker = ticker.trim().toUpperCase();

    if (!normalizedTicker) return;

    const matches = searchFunds(FUND_UNIVERSE, {
      text: normalizedTicker,
      limit: 20,
    });

    const fund = matches.find((f) => f.tkr.toUpperCase() === normalizedTicker);

    if (!fund) {
      return;
    }

    setTicker(fund.tkr);
    setName(fund.name);
    setType(mapVehicleToInstrumentType(fund.vehicle));
    setCls(fund.cls as AssetClass);
    setExpenseRatio(fund.er);
    setYieldPct(fund.yld);

    // Don't set region yet because the fund universe
    // doesn't appear to contain reliable region data.
  }

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Add Investment</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className={labelClass}>Type</span>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className={inputClass}
          >
            {INVESTMENT_TYPES.map((investmentType) => (
              <option key={investmentType} value={investmentType}>
                {investmentType}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>Name</span>

          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Ticker</span>

          <div className="flex gap-2">
            <input
              type="text"
              value={ticker}
              onChange={(e) => setTicker(e.target.value)}
              className={inputClass}
            />

            <button
              type="button"
              onClick={fetchByTicker}
              className={secondaryButtonClass}
            >
              ↻ Fetch
            </button>
          </div>
        </label>

        <label>
          <span className={labelClass}>Class</span>

          <select
            value={cls}
            onChange={(e) => setCls(e.target.value as AssetClass)}
            className={inputClass}
          >
            {ASSET_CLASSES.map((assetClass) => (
              <option key={assetClass} value={assetClass}>
                {CLASS_LABEL[assetClass]}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>Value ({plan.currency})</span>

          <input
            type="number"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Region</span>

          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className={inputClass}
          >
            {REGIONS.map((regionOption) => (
              <option key={regionOption} value={regionOption}>
                {regionOption}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>Expense Ratio %</span>

          <input
            type="number"
            step="0.01"
            value={expenseRatio ?? ""}
            onChange={(e) => {
              const raw = e.target.value;

              setExpenseRatio(raw === "" ? undefined : Number(raw));
            }}
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Yield %</span>

          <input
            type="number"
            step="0.01"
            value={yieldPct ?? ""}
            onChange={(e) => {
              const raw = e.target.value;

              setYieldPct(raw === "" ? undefined : Number(raw));
            }}
            className={inputClass}
          />
        </label>

        <label className="md:col-span-2">
          <span className={labelClass}>Notes</span>

          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <button type="button" onClick={addInvestment} className={buttonClass}>
        Add
      </button>
    </section>
  );
}

function mapVehicleToInstrumentType(vehicle?: string): string {
  switch (vehicle) {
    case "etf":
      return "ETF";
    case "mutual_fund":
      return "Mutual fund";
    case "stock":
      return "Stock";
    case "bond":
      return "Bond";
    case "alternative":
      return "Alternative";
    default:
      return "ETF";
  }
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "mb-4 text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const labelClass = "mb-1.5 block text-[11px] font-semibold text-[#64748b]";

const inputClass =
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8]";

const buttonClass =
  "mt-5 rounded-full bg-[#0057b8] px-5 py-2 text-[12px] font-semibold text-white hover:bg-[#0069d9]";

const secondaryButtonClass =
  "rounded-lg border border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[11px] font-semibold text-[#0057b8]";

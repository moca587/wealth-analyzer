"use client";

import { useState } from "react";

import type { Proposal, ProposalPosition } from "@/lib/orders/proposal";
import { portfolioReturnParams } from "@/lib/engine/financial-math";

import { searchFunds } from "@/lib/data/fund-search";
import { FUND_UNIVERSE } from "@/lib/data/fund-universe";

type Props = {
  proposal: Proposal;
  updateProposal: (patch: Partial<Proposal>) => void;
};

const VEHICLES = [
  "Mutual fund",
  "ETF",
  "Stock",
  "Bond",
  "Alternative",
  "Precious metals",
  "SMA",
  "Futures",
];

const ASSET_CLASSES = [
  "Equity",
  "Fixed income",
  "Real estate",
  "Commodity",
  "Cash / MM",
  "Mixed",
  "Hedge funds",
  "Private equity",
  "Structured products / notes",
  "Alternatives (other)",
];

const REGIONS = ["US", "Dev Intl", "EM", "Global", "Other"];

export function AddPositionSection({ proposal, updateProposal }: Props) {
  const [vehicle, setVehicle] = useState("Mutual fund");

  const [name, setName] = useState("");

  const [ticker, setTicker] = useState("");

  const [assetClass, setAssetClass] = useState("Equity");

  const [region, setRegion] = useState("US");

  const [isin, setIsin] = useState("");

  const [valor, setValor] = useState("");

  const [weightPct, setWeightPct] = useState(0);

  const [expectedReturn, setExpectedReturn] = useState<number | undefined>();

  const [expenseRatio, setExpenseRatio] = useState<number | undefined>();

  const [yieldPct, setYieldPct] = useState<number | undefined>();

  const [rationale, setRationale] = useState("");

  function fetchByTicker() {
    const normalizedTicker = ticker.trim().toUpperCase();

    if (!normalizedTicker) {
      return;
    }

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
    setVehicle(mapVehicleToProposalVehicle(fund.vehicle));
    setAssetClass(mapClassToProposalClass(fund.cls));
    setExpenseRatio(fund.er);
    setYieldPct(fund.yld);
    setRegion(inferRegion(fund));
  }

  function addPosition() {
    if (weightPct <= 0) {
      return;
    }

    const newPosition: ProposalPosition = {
      id: crypto.randomUUID(),

      vehicle,

      name: name.trim() || ticker.trim().toUpperCase() || "Investment",

      ticker: ticker.trim() ? ticker.trim().toUpperCase() : undefined,

      cls: assetClass,

      region,

      isin: isin.trim() ? isin.trim().toUpperCase() : undefined,

      valor: valor.trim() || undefined,

      weightPct,

      expectedReturn,

      er: expenseRatio,

      yld: yieldPct,

      note: rationale.trim() || undefined,
    };

    updateProposal({
      positions: [...proposal.positions, newPosition],
    });

    setName("");
    setTicker("");
    setRegion("US");
    setIsin("");
    setValor("");
    setWeightPct(0);
    setExpectedReturn(undefined);
    setExpenseRatio(undefined);
    setYieldPct(undefined);
    setRationale("");
  }

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Add Position</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className={labelClass}>Vehicle</span>

          <select
            value={vehicle}
            onChange={(e) => setVehicle(e.target.value)}
            className={inputClass}
          >
            {VEHICLES.map((item) => (
              <option key={item} value={item}>
                {item}
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
            value={assetClass}
            onChange={(e) => setAssetClass(e.target.value)}
            className={inputClass}
          >
            {ASSET_CLASSES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>Region</span>

          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className={inputClass}
          >
            {REGIONS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>ISIN (for order routing)</span>

          <input
            type="text"
            value={isin}
            onChange={(e) => setIsin(e.target.value)}
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Valor (Swiss)</span>

          <input
            type="text"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Weight %</span>

          <input
            type="number"
            min="0"
            step="0.1"
            value={weightPct}
            onChange={(e) => setWeightPct(Number(e.target.value) || 0)}
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>10yr Exp Return %</span>

          <input
            type="number"
            step="0.1"
            value={expectedReturn ?? ""}
            onChange={(e) => {
              const raw = e.target.value;

              setExpectedReturn(raw === "" ? undefined : Number(raw));
            }}
            className={inputClass}
          />
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
          <span className={labelClass}>Rationale</span>

          <input
            type="text"
            value={rationale}
            onChange={(e) => setRationale(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <button type="button" onClick={addPosition} className={buttonClass}>
        Add
      </button>
    </section>
  );
}

function mapVehicleToProposalVehicle(vehicle?: string): string {
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

function mapClassToProposalClass(cls?: string): string {
  switch (cls) {
    case "equity":
      return "Equity";
    case "fixed_income":
      return "Fixed income";
    case "real_estate":
      return "Real estate";
    case "commodity":
      return "Commodity";
    case "cash":
      return "Cash / MM";
    case "mixed":
      return "Mixed";
    case "alternative":
      return "Alternatives (other)";
    default:
      return "Alternatives (other)";
  }
}

function inferRegion(fund: { ccy?: string; ucits?: boolean }): string {
  // This is only a fallback inference.
  // If FUND_UNIVERSE eventually stores an explicit region,
  // use that instead.
  if (fund.ccy === "USD") {
    return "US";
  }

  if (fund.ucits) {
    return "Dev Intl";
  }

  return "Global";
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

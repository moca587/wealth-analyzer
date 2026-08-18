"use client";

import { useState } from "react";

import type {
  Holding,
  WealthPlan,
} from "@/lib/engine/types";

import type { AssetClass } from "@/lib/portfolio/asset-class";

type Props = {
  plan: WealthPlan;
  update: (patch: Partial<WealthPlan>) => void;
};

const ALTERNATIVE_TYPES = [
  "Private equity fund",
  "Hedge fund",
  "Structured product",
];

const SUBCATEGORIES = [
  "Buyout / LBO",
  "Venture capital",
  "Growth equity",
  "Secondaries",
  "Fund-of-funds",
  "Distressed / special situations",
  "Private credit",
  "Co-investment",
];

const REGIONS = [
  "US",
  "Dev Intl",
  "EM",
  "Global",
  "Other",
];

export function AddAlternativeSection({
  plan,
  update,
}: Props) {
  const [type, setType] =
    useState("Private equity fund");

  const [subcategory, setSubcategory] =
    useState("Buyout / LBO");

  const [name, setName] =
    useState("");

  const [value, setValue] =
    useState(0);

  const [region, setRegion] =
    useState("US");

  const [expenseRatio, setExpenseRatio] =
    useState<number | undefined>();

  const [yieldPct, setYieldPct] =
    useState<number | undefined>();

  const [note, setNote] =
    useState("");

  function addAlternative() {
    if (value <= 0) return;

    const cls: AssetClass =
      "alternative";

    const newHolding: Holding = {
      id: crypto.randomUUID(),

      name:
        name.trim() ||
        `${type} — ${subcategory}`,

      instrumentType: type,

      cls,

      value,

      region,

      er: expenseRatio,

      yld: yieldPct,

      note:
        note.trim() ||
        subcategory,
    };

    update({
      holdings: [
        ...(plan.holdings ?? []),
        newHolding,
      ],
    });

    setName("");
    setValue(0);
    setExpenseRatio(undefined);
    setYieldPct(undefined);
    setNote("");
  }

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Add alternative investment — private equity, hedge funds & structured products
      </h2>

      <p className="mb-5 text-[11px] text-[#9ca3af]">
        No ticker required.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className={labelClass}>
            Type
          </span>

          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value)
            }
            className={inputClass}
          >
            {ALTERNATIVE_TYPES.map(
              (alternativeType) => (
                <option
                  key={alternativeType}
                  value={alternativeType}
                >
                  {alternativeType}
                </option>
              )
            )}
          </select>
        </label>

        <label>
          <span className={labelClass}>
            Subcategory
          </span>

          <select
            value={subcategory}
            onChange={(e) =>
              setSubcategory(
                e.target.value
              )
            }
            className={inputClass}
          >
            {SUBCATEGORIES.map(
              (subcategoryOption) => (
                <option
                  key={subcategoryOption}
                  value={subcategoryOption}
                >
                  {subcategoryOption}
                </option>
              )
            )}
          </select>
        </label>

        <label>
          <span className={labelClass}>
            Name
          </span>

          <input
            type="text"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>
            Value ({plan.currency})
          </span>

          <input
            type="number"
            value={value}
            onChange={(e) =>
              setValue(
                Number(
                  e.target.value
                )
              )
            }
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>
            Region
          </span>

          <select
            value={region}
            onChange={(e) =>
              setRegion(
                e.target.value
              )
            }
            className={inputClass}
          >
            {REGIONS.map(
              (regionOption) => (
                <option
                  key={regionOption}
                  value={regionOption}
                >
                  {regionOption}
                </option>
              )
            )}
          </select>
        </label>

        <label>
          <span className={labelClass}>
            Expense Ratio %
          </span>

          <input
            type="number"
            step="0.01"
            value={
              expenseRatio ?? ""
            }
            onChange={(e) => {
              const raw =
                e.target.value;

              setExpenseRatio(
                raw === ""
                  ? undefined
                  : Number(raw)
              );
            }}
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>
            Yield %
          </span>

          <input
            type="number"
            step="0.01"
            value={yieldPct ?? ""}
            onChange={(e) => {
              const raw =
                e.target.value;

              setYieldPct(
                raw === ""
                  ? undefined
                  : Number(raw)
              );
            }}
            className={inputClass}
          />
        </label>

        <label className="md:col-span-2">
          <span className={labelClass}>
            Notes
          </span>

          <input
            type="text"
            value={note}
            onChange={(e) =>
              setNote(e.target.value)
            }
            className={inputClass}
          />
        </label>
      </div>

      <button
        type="button"
        onClick={addAlternative}
        className={buttonClass}
      >
        Add alternative
      </button>
    </section>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "mb-2 text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const labelClass =
  "mb-1.5 block text-[11px] font-semibold text-[#64748b]";

const inputClass =
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8]";

const buttonClass =
  "mt-5 rounded-full bg-[#0057b8] px-5 py-2 text-[12px] font-semibold text-white hover:bg-[#0069d9]";
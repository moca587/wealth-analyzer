"use client";

import { useState } from "react";

import type {
  Proposal,
  ProposalPosition,
} from "@/lib/orders/proposal";

type Props = {
  proposal: Proposal;
  updateProposal: (
    patch: Partial<Proposal>
  ) => void;
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

export function AddAlternativePositionSection({
  proposal,
  updateProposal,
}: Props) {
  const [type, setType] =
    useState("Private equity fund");

  const [subcategory, setSubcategory] =
    useState("Buyout / LBO");

  const [name, setName] =
    useState("");

  const [weightPct, setWeightPct] =
    useState(0);

  const [expectedReturn, setExpectedReturn] =
    useState<number | undefined>();

  const [expenseRatio, setExpenseRatio] =
    useState<number | undefined>();

  const [yieldPct, setYieldPct] =
    useState<number | undefined>();

  const [rationale, setRationale] =
    useState("");

  function addAlternative() {
    if (weightPct <= 0) {
      return;
    }

    const newPosition: ProposalPosition = {
      id: crypto.randomUUID(),

      name:
        name.trim() ||
        `${type} — ${subcategory}`,

      vehicle: type,

      cls:
        type === "Private equity fund"
          ? "private_equity"
          : type === "Hedge fund"
            ? "hedge_fund"
            : "structured",

      weightPct,

      expectedReturn,

      er: expenseRatio,

      yld: yieldPct,

      note:
        rationale.trim() ||
        subcategory,
    };

    updateProposal({
      positions: [
        ...proposal.positions,
        newPosition,
      ],
    });

    setName("");
    setWeightPct(0);
    setExpectedReturn(undefined);
    setExpenseRatio(undefined);
    setYieldPct(undefined);
    setRationale("");
  }

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Add alternative position — private equity, hedge funds & structured products
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
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
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
              (item) => (
                <option
                  key={item}
                  value={item}
                >
                  {item}
                </option>
              )
            )}
          </select>
        </label>

        <label className="md:col-span-2">
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
            Weight %
          </span>

          <input
            type="number"
            min="0"
            step="0.1"
            value={weightPct}
            onChange={(e) =>
              setWeightPct(
                Number(e.target.value) ||
                  0
              )
            }
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>
            10yr Exp Return %
          </span>

          <input
            type="number"
            step="0.1"
            value={
              expectedReturn ?? ""
            }
            onChange={(e) => {
              const raw =
                e.target.value;

              setExpectedReturn(
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
            Rationale
          </span>

          <input
            type="text"
            value={rationale}
            onChange={(e) =>
              setRationale(
                e.target.value
              )
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
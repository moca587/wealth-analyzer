"use client";

import { useState } from "react";

import type { Loan, WealthPlan } from "@/lib/engine/types";
import { calcMortgagePayment, formatMoney } from "@/lib/engine/financial-math";

import { LOAN_TYPES } from "@/lib/data/loan-types";

type Props = {
  plan: WealthPlan;
  update: (patch: Partial<WealthPlan>) => void;
};

export function LoansSection({ plan, update }: Props) {
  const [type, setType] = useState("mortgage_primary");

  const [owner, setOwner] = useState(plan.clients[0]?.id ?? "");

  const [balance, setBalance] = useState(0);

  const [rate, setRate] = useState(6.8);

  const [years, setYears] = useState(30);

  const [label, setLabel] = useState("");

  // refers to an object
  const selectedLoan =
    LOAN_TYPES.find((loan) => loan.value === type) ?? LOAN_TYPES[0];

  function changeLoanType(newType: string) {
    setType(newType);

    const loanType = LOAN_TYPES.find((loan) => loan.value === newType);

    if (!loanType) return;

    setRate(loanType.rate);
    setYears(loanType.years);
  }

  function addLoan() {
    if (!selectedLoan) return;
    if (balance <= 0) return;

    const newLoan: Loan = {
      id: crypto.randomUUID(),

      type,

      label: label.trim() || selectedLoan.displayLabel,

      bal: balance,

      rate,

      yrs: years,

      owner,
    };

    update({
      loans: [...plan.loans, newLoan],
    });

    setBalance(0);
    setLabel("");
  }

  function removeLoan(id: string) {
    update({
      loans: plan.loans.filter((loan) => loan.id !== id),
    });
  }

  function updateLoan(id: string, patch: Partial<Loan>) {
    update({
      loans: plan.loans.map((loan) =>
        loan.id === id
          ? {
              ...loan,
              ...patch,
            }
          : loan,
      ),
    });
  }

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Liabilities — Loans</h2>

      <div className="mb-6 space-y-2">
        {plan.loans.length === 0 ? (
          <div className="text-[12px] text-[#9ca3af]">No loans added.</div>
        ) : (
          plan.loans.map((loan) => (
            <LoanRow
              key={loan.id}
              loan={loan}
              currency={plan.currency}
              onUpdate={(patch) => updateLoan(loan.id, patch)}
              onRemove={() => removeLoan(loan.id)}
            />
          ))
        )}
      </div>

      <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
        Add Loan
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className={labelClass}>Loan type</span>

          <select
            value={type}
            onChange={(e) => changeLoanType(e.target.value)}
            className={inputClass}
          >
            {LOAN_TYPES.map((loan) => (
              <option key={loan.value} value={loan.value}>
                {loan.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>Owned by</span>

          <select
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            className={inputClass}
          >
            {plan.clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.first} {client.last}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>Balance</span>

          <input
            type="number"
            value={balance}
            onChange={(e) => setBalance(Number(e.target.value))}
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Interest rate %</span>

          <input
            type="number"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Years remaining</span>

          <input
            type="number"
            value={years}
            onChange={(e) => setYears(Number(e.target.value))}
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Label (optional)</span>

          <input
            type="text"
            value={label}
            placeholder="e.g. Home 2019"
            onChange={(e) => setLabel(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <button type="button" onClick={addLoan} className={buttonClass}>
        + Add Loan
      </button>
    </section>
  );
}

function LoanRow({
  loan,
  currency,
  onUpdate,
  onRemove,
}: {
  loan: Loan;
  currency: string;
  onUpdate: (patch: Partial<Loan>) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);

  const [label, setLabel] = useState(loan.label ?? "");

  const [balance, setBalance] = useState(loan.bal);

  const [rate, setRate] = useState(loan.rate);

  const [years, setYears] = useState(loan.yrs);

  const monthlyPayment = calcMortgagePayment(loan.bal, loan.rate, loan.yrs);

  function save() {
    if (balance <= 0) {
      return;
    }

    onUpdate({
      label: label.trim(),
      bal: balance,
      rate,
      yrs: years,
    });

    setEditing(false);
  }

  function cancel() {
    // Restore the saved loan values.
    setLabel(loan.label ?? "");
    setBalance(loan.bal);
    setRate(loan.rate);
    setYears(loan.yrs);

    setEditing(false);
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-[rgba(0,87,184,.12)] bg-[#f8faff] px-4 py-4">
        <div className="grid gap-3 md:grid-cols-2">
          <label>
            <span className={labelClass}>Label</span>

            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={inputClass}
            />
          </label>

          <label>
            <span className={labelClass}>Balance</span>

            <input
              type="number"
              value={balance}
              onChange={(e) => setBalance(Number(e.target.value))}
              className={inputClass}
            />
          </label>

          <label>
            <span className={labelClass}>Interest rate %</span>

            <input
              type="number"
              step="0.1"
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className={inputClass}
            />
          </label>

          <label>
            <span className={labelClass}>Years remaining</span>

            <input
              type="number"
              value={years}
              onChange={(e) => setYears(Number(e.target.value))}
              className={inputClass}
            />
          </label>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={save}
            className="rounded-full bg-[#0057b8] px-4 py-2 text-[11px] font-semibold text-white hover:bg-[#0069d9]"
          >
            Save
          </button>

          <button
            type="button"
            onClick={cancel}
            className="rounded-full border border-[rgba(0,87,184,.14)] bg-white px-4 py-2 text-[11px] font-semibold text-[#64748b]"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-semibold text-[#16213e]">
            {loan.label ?? loan.type}
          </div>

          <div className="mt-1 text-[13px] font-semibold text-[#16213e]">
            {formatMoney(loan.bal, currency)}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setEditing(true)}
          className="text-[12px] text-[#0057b8]"
        >
          ✎
        </button>

        <button
          type="button"
          onClick={onRemove}
          className="text-[12px] text-[#9ca3af] hover:text-red-500"
        >
          ✕
        </button>
      </div>

      <div className="mt-2 text-[11px] text-[#64748b]">
        {loan.rate.toFixed(2)}% • {loan.yrs}y remaining
      </div>

      <div className="mt-1 text-[11px] text-[#64748b]">
        Monthly: {formatMoney(monthlyPayment, currency)}
      </div>
    </div>
  );
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

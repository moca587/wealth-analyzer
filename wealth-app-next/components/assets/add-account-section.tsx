"use client";

import { useState } from "react";
import type { WealthPlan } from "@/lib/engine/types";

type Props = {
  plan: WealthPlan;
  update: (patch: Partial<WealthPlan>) => void;
};

const ACCOUNT_TYPES = [
  {
    value: "checking",
    label: "Checking account",
    group: "Cash & banking",
    liquid: true,
    withdrawAge: null,
    note: "Standard transactional account. FDIC insured up to $250k per depositor.",
  },
  {
    value: "401k_traditional",
    label: "401(k) — Traditional",
    group: "Retirement accounts",
    liquid: false,
    withdrawAge: 59.5,
    note: "Employer-sponsored plan. Pre-tax contributions.",
  },
  {
    value: "brokerage",
    label: "Taxable brokerage account",
    group: "Investment accounts",
    liquid: true,
    withdrawAge: null,
    note: "General investment account. Capital gains taxed.",
  },
  {
    value: "real_estate",
    label: "Property / Real Estate",
    group: "Other assets",
    liquid: false,
    withdrawAge: null,
    note: "Primary home, investment properties, land, or other real estate.",
  },
  {
    value: "other_asset",
    label: "Other assets (misc)",
    group: "Other assets",
    liquid: false,
    withdrawAge: null,
    note: "Business interests, collectibles, receivables, or other assets.",
  },
];

export function AddAccountSection({
  plan,
  update,
}: Props) {
  const [type, setType] = useState("checking"); // account type
  const [owner, setOwner] = useState(
    plan.clients[0]?.id ?? ""
  );
  const [label, setLabel] = useState("");
  const [value, setValue] = useState(0);

  // selected account type by the user
  const selectedAccount =
    ACCOUNT_TYPES.find(
      (account) => account.value === type
    ) ?? ACCOUNT_TYPES[0];

  // Add a new account to the plan's assets
  function addAccount() {
    if (!selectedAccount) return;

    const newAsset = {
      id: crypto.randomUUID(),

      type: selectedAccount.value,

      label:
        label.trim() ||
        selectedAccount.label,

      group: selectedAccount.group,

      value,

      liquid: selectedAccount.liquid,

      withdrawAge:
        selectedAccount.withdrawAge,

      note: selectedAccount.note,

      owner,

      country:
        plan.clients[0]?.country,

      ccy: plan.currency,
    };

    update({
      assets: [
        ...plan.assets,
        newAsset,
      ],
    });

    setLabel("");
    setValue(0);
  }

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Add Account
      </h2>

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className={labelClass}>
            Account type
          </span>

          <select
            value={type}
            onChange={(e) =>
              setType(e.target.value)
            }
            className={inputClass}
          >
            {ACCOUNT_TYPES.map((account) => (
              <option
                key={account.value}
                value={account.value}
              >
                {account.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>
            Owned by
          </span>

          <select
            value={owner}
            onChange={(e) =>
              setOwner(e.target.value)
            }
            className={inputClass}
          >
            {plan.clients.map((client) => (
              <option
                key={client.id}
                value={client.id}
              >
                {client.first} {client.last}
              </option>
            ))}

            {plan.clients.length > 1 && (
              <option value="joint">
                Joint
              </option>
            )}
          </select>
        </label>

        <label>
          <span className={labelClass}>
            Label (optional)
          </span>

          <input
            type="text"
            value={label}
            placeholder="e.g. Chase checking"
            onChange={(e) =>
              setLabel(e.target.value)
            }
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>
            Balance / Value
          </span>

          <input
            type="number"
            value={value}
            onChange={(e) =>
              setValue(
                Number(e.target.value)
              )
            }
            className={inputClass}
          />
        </label>
      </div>

      <div className="mt-4 rounded-lg bg-[#f8faff] p-3 text-[11px] leading-5 text-[#64748b]">
        {selectedAccount.note}
      </div>

      <button
        type="button"
        onClick={addAccount}
        className="mt-4 rounded-full bg-[#0057b8] px-5 py-2 text-[12px] font-semibold text-white hover:bg-[#0069d9]"
      >
        + Add Account
      </button>
    </section>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "mb-4 text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const labelClass =
  "mb-1.5 block text-[11px] font-semibold text-[#64748b]";

const inputClass =
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8]";
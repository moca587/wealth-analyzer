"use client";

import { useState } from "react";
import type {
  EquityGrant,
  WealthPlan,
} from "@/lib/engine/types";
import { formatMoney } from "@/lib/engine/financial-math";

type Props = {
  plan: WealthPlan;
  update: (patch: Partial<WealthPlan>) => void;
};

export function EquityCompSection({
  plan,
  update,
}: Props) {
  const grants = plan.equityGrants ?? [];

  const [kind, setKind] =
    useState<EquityGrant["kind"]>("rsu");

  const [owner, setOwner] = useState(
    plan.clients[0]?.id ?? ""
  );

  const [ticker, setTicker] = useState("");
  const [shares, setShares] = useState(0);
  const [strike, setStrike] = useState(0);
  const [price, setPrice] = useState(0);
  const [growth, setGrowth] = useState(8);

  const [vestStart, setVestStart] = useState(
    new Date().getFullYear() + 1
  );

  const [vestYears, setVestYears] = useState(4);
  const [label, setLabel] = useState("");

  function addGrant() {
    if (shares <= 0 || price <= 0) return;

    const newGrant: EquityGrant = {
      id: crypto.randomUUID(),
      kind,
      owner,
      ticker: ticker.toUpperCase(),
      shares,
      strike,
      price,
      growth,
      vestStart,
      vestYears: Math.max(1, vestYears),

      label:
        label.trim() ||
        `${ticker.toUpperCase() || "Grant"} ${kind.toUpperCase()}`,
    };

    update({
      equityGrants: [
        ...grants,
        newGrant,
      ],
    });

    setTicker("");
    setShares(0);
    setStrike(0);
    setPrice(0);
    setLabel("");
  }

  function removeGrant(id: string) {
    update({
      equityGrants: grants.filter(
        (grant) => grant.id !== id
      ),
    });
  }

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>
        Equity Compensation — Options & RSUs
      </h2>

      <p className="mb-5 text-[12px] leading-5 text-[#64748b]">
        Track stock options and restricted stock units.
        Tranches vest in equal annual amounts; vesting
        proceeds flow into income and are taxed in the
        cash-flow projection and simulation.
      </p>

      <div className="mb-6 space-y-2">
        {grants.length === 0 ? (
          <div className="text-[12px] text-[#9ca3af]">
            No grants added.
          </div>
        ) : (
          grants.map((grant) => (
            <GrantRow
              key={grant.id}
              grant={grant}
              plan={plan}
              onRemove={() =>
                removeGrant(grant.id)
              }
            />
          ))
        )}
      </div>

      <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
        Add Grant
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Grant type">
          <select
            value={kind}
            onChange={(e) =>
              setKind(
                e.target.value as EquityGrant["kind"]
              )
            }
            className={inputClass}
          >
            <option value="rsu">
              RSU — restricted stock units
            </option>

            <option value="nqso">
              NQSO — non-qualified options
            </option>

            <option value="iso">
              ISO — incentive options
            </option>
          </select>
        </Field>

        <Field label="Granted to">
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
          </select>
        </Field>

        <Field label="Company / ticker">
          <input
            value={ticker}
            placeholder="e.g. AAPL"
            onChange={(e) =>
              setTicker(e.target.value)
            }
            className={inputClass}
          />
        </Field>

        <Field label="Number of shares">
          <input
            type="number"
            value={shares}
            onChange={(e) =>
              setShares(Number(e.target.value))
            }
            className={inputClass}
          />
        </Field>

        <Field label="Strike price (options)">
          <input
            type="number"
            step="0.01"
            value={strike}
            disabled={kind === "rsu"}
            onChange={(e) =>
              setStrike(Number(e.target.value))
            }
            className={inputClass}
          />
        </Field>

        <Field label="Current share price">
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) =>
              setPrice(Number(e.target.value))
            }
            className={inputClass}
          />
        </Field>

        <Field label="Assumed share growth %/yr">
          <input
            type="number"
            step="0.5"
            value={growth}
            onChange={(e) =>
              setGrowth(Number(e.target.value))
            }
            className={inputClass}
          />
        </Field>

        <Field label="First vesting year">
          <input
            type="number"
            value={vestStart}
            onChange={(e) =>
              setVestStart(Number(e.target.value))
            }
            className={inputClass}
          />
        </Field>

        <Field label="Vesting period (years)">
          <input
            type="number"
            value={vestYears}
            onChange={(e) =>
              setVestYears(Number(e.target.value))
            }
            className={inputClass}
          />
        </Field>

        <Field label="Label (optional)">
          <input
            value={label}
            placeholder="e.g. 2026 refresh grant"
            onChange={(e) =>
              setLabel(e.target.value)
            }
            className={inputClass}
          />
        </Field>
      </div>

      <button
        type="button"
        onClick={addGrant}
        className="mt-5 rounded-full bg-[#0057b8] px-5 py-2 text-[12px] font-semibold text-white"
      >
        + Add Grant
      </button>
    </section>
  );
}

function GrantRow({
  grant,
  plan,
  onRemove,
}: {
  grant: EquityGrant;
  plan: WealthPlan;
  onRemove: () => void;
}) {
  const currentValue =
    grant.kind === "rsu"
      ? grant.shares * grant.price
      : grant.shares *
        Math.max(
          0,
          grant.price - grant.strike
        );

  return (
    <div className="rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-3">
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-bold text-[#0057b8]">
          {grant.kind.toUpperCase()}
        </span>

        <span className="flex-1 text-[12px] font-semibold text-[#16213e]">
          {grant.label}
        </span>

        <span className="text-[12px] font-semibold text-[#16213e]">
          {formatMoney(
            currentValue,
            plan.currency
          )}
        </span>

        <button
          type="button"
          onClick={onRemove}
          className="text-[#9ca3af] hover:text-red-500"
        >
          ✕
        </button>
      </div>

      <div className="mt-2 text-[11px] text-[#9ca3af]">
        {grant.ticker || "—"} · {grant.shares} shares ·
        vests {grant.vestStart}–
        {grant.vestStart + grant.vestYears - 1}
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className={labelClass}>
        {label}
      </span>

      {children}
    </label>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "mb-4 text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const labelClass =
  "mb-1.5 block text-[11px] font-semibold text-[#64748b]";

const inputClass =
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8] disabled:bg-[#f1f5f9]";
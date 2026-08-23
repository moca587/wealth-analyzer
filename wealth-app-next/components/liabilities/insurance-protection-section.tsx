"use client";

import { useState } from "react";

import type { InsurancePolicy, WealthPlan } from "@/lib/engine/types";

import { formatMoney } from "@/lib/engine/financial-math";
import { POLICY_TYPES } from "@/lib/data/policy-types";

type Props = {
  plan: WealthPlan;
  update: (patch: Partial<WealthPlan>) => void;
};

export function InsuranceProtectionSection({ plan, update }: Props) {
  const policies = plan.insurancePolicies ?? [];

  const [type, setType] = useState<InsurancePolicy["type"]>("term_life");

  const [insured, setInsured] = useState(plan.clients[0]?.id ?? "");

  const [benefit, setBenefit] = useState(0);

  const [cashValue, setCashValue] = useState(0);

  const [annualPremium, setAnnualPremium] = useState(0);

  const [beneficiary, setBeneficiary] = useState("");

  const [label, setLabel] = useState("");

  function addPolicy() {
    if (benefit <= 0 && cashValue <= 0 && annualPremium <= 0) {
      return;
    }

    const selectedType = POLICY_TYPES.find((policy) => policy.value === type);

    const newPolicy: InsurancePolicy = {
      id: crypto.randomUUID(),

      type,

      insured,

      benefit,

      cashValue,

      annualPremium,

      beneficiary,

      label: label.trim() || selectedType?.label || "Insurance policy",
    };

    update({
      insurancePolicies: [...policies, newPolicy],
    });

    setBenefit(0);
    setCashValue(0);
    setAnnualPremium(0);
    setBeneficiary("");
    setLabel("");
  }

  function removePolicy(id: string) {
    update({
      insurancePolicies: policies.filter((policy) => policy.id !== id),
    });
  }

  function updatePolicy(id: string, patch: Partial<InsurancePolicy>) {
    update({
      insurancePolicies: policies.map((policy) =>
        policy.id === id
          ? {
              ...policy,
              ...patch,
            }
          : policy,
      ),
    });
  }

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Insurance — Protection Inventory</h2>

      <p className="mb-5 text-[12px] leading-5 text-[#64748b]">
        Track life, disability, and long-term-care policies. Cash value counts
        toward net worth; death benefits feed the estate transfer summary;
        premiums can flow into annual expenses below.
      </p>

      <div className="mb-6 space-y-2">
        {policies.length === 0 ? (
          <div className="text-[12px] text-[#9ca3af]">No policies added.</div>
        ) : (
          policies.map((policy) => (
            <PolicyRow
              key={policy.id}
              policy={policy}
              currency={plan.currency}
              clients={plan.clients}
              onUpdate={(patch) => updatePolicy(policy.id, patch)}
              onRemove={() => removePolicy(policy.id)}
            />
          ))
        )}
      </div>

      <h3 className="mb-4 text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
        Add Policy
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className={labelClass}>Policy type</span>

          <select
            value={type}
            onChange={(e) => setType(e.target.value as InsurancePolicy["type"])}
            className={inputClass}
          >
            {POLICY_TYPES.map((policy) => (
              <option key={policy.value} value={policy.value}>
                {policy.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className={labelClass}>Insured</span>

          <select
            value={insured}
            onChange={(e) => setInsured(e.target.value)}
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
          <span className={labelClass}>Benefit amount</span>

          <input
            type="number"
            value={benefit}
            placeholder="Death benefit / monthly / daily"
            onChange={(e) => setBenefit(Number(e.target.value))}
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Cash value (if any)</span>

          <input
            type="number"
            value={cashValue}
            onChange={(e) => setCashValue(Number(e.target.value))}
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Annual premium</span>

          <input
            type="number"
            value={annualPremium}
            onChange={(e) => setAnnualPremium(Number(e.target.value))}
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Beneficiary (optional)</span>

          <input
            type="text"
            value={beneficiary}
            placeholder="e.g. Spouse 50% / Children 50%"
            onChange={(e) => setBeneficiary(e.target.value)}
            className={inputClass}
          />
        </label>

        <label>
          <span className={labelClass}>Label (optional)</span>

          <input
            type="text"
            value={label}
            placeholder="e.g. Zurich term 2040"
            onChange={(e) => setLabel(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      <button type="button" onClick={addPolicy} className={buttonClass}>
        + Add Policy
      </button>

      <label className="mt-6 flex items-center gap-2">
        <input
          type="checkbox"
          checked={plan.includeInsurancePremiums ?? true}
          onChange={(e) =>
            update({
              includeInsurancePremiums: e.target.checked,
            })
          }
        />

        <span className="text-[12px] text-[#16213e]">
          Include premiums in annual expenses{" "}
          <span className="text-[#9ca3af]">
            (untick if already counted in the Expenses tab&apos;s
            &quot;Insurance &amp; health&quot;)
          </span>
        </span>
      </label>
    </section>
  );
}

function PolicyRow({
  policy,
  currency,
  clients,
  onUpdate,
  onRemove,
}: {
  policy: InsurancePolicy;
  currency: string;
  clients: WealthPlan["clients"];
  onUpdate: (patch: Partial<InsurancePolicy>) => void;
  onRemove: () => void;
}) {
  const [editing, setEditing] = useState(false);

  const [type, setType] = useState<InsurancePolicy["type"]>(policy.type);

  const [insured, setInsured] = useState(policy.insured ?? "");

  const [benefit, setBenefit] = useState(policy.benefit);

  const [cashValue, setCashValue] = useState(policy.cashValue);

  const [annualPremium, setAnnualPremium] = useState(policy.annualPremium);

  const [beneficiary, setBeneficiary] = useState(policy.beneficiary ?? "");

  const [label, setLabel] = useState(policy.label ?? "");

  const typeLabel =
    POLICY_TYPES.find((item) => item.value === policy.type)?.label ??
    policy.type;

  function save() {
    const selectedType = POLICY_TYPES.find((item) => item.value === type);

    onUpdate({
      type,
      insured,
      benefit,
      cashValue,
      annualPremium,
      beneficiary,
      label: label.trim() || selectedType?.label || "Insurance policy",
    });

    setEditing(false);
  }

  function cancel() {
    setType(policy.type);
    setInsured(policy.insured ?? "");
    setBenefit(policy.benefit);
    setCashValue(policy.cashValue);
    setAnnualPremium(policy.annualPremium);
    setBeneficiary(policy.beneficiary ?? "");
    setLabel(policy.label ?? "");

    setEditing(false);
  }

  if (editing) {
    return (
      <div className="rounded-lg border border-[rgba(0,87,184,.12)] bg-[#f8faff] px-4 py-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label>
            <span className={labelClass}>Policy type</span>

            <select
              value={type}
              onChange={(e) =>
                setType(e.target.value as InsurancePolicy["type"])
              }
              className={inputClass}
            >
              {POLICY_TYPES.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className={labelClass}>Insured</span>

            <select
              value={insured}
              onChange={(e) => setInsured(e.target.value)}
              className={inputClass}
            >
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.first} {client.last}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className={labelClass}>Benefit amount</span>

            <input
              type="number"
              value={benefit}
              onChange={(e) => setBenefit(Number(e.target.value))}
              className={inputClass}
            />
          </label>

          <label>
            <span className={labelClass}>Cash value</span>

            <input
              type="number"
              value={cashValue}
              onChange={(e) => setCashValue(Number(e.target.value))}
              className={inputClass}
            />
          </label>

          <label>
            <span className={labelClass}>Annual premium</span>

            <input
              type="number"
              value={annualPremium}
              onChange={(e) => setAnnualPremium(Number(e.target.value))}
              className={inputClass}
            />
          </label>

          <label>
            <span className={labelClass}>Beneficiary</span>

            <input
              type="text"
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
              className={inputClass}
            />
          </label>

          <label>
            <span className={labelClass}>Label</span>

            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
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
            {policy.label ?? typeLabel}
          </div>

          <div className="mt-1 text-[11px] text-[#64748b]">{typeLabel}</div>

          {policy.benefit > 0 && (
            <div className="mt-1 text-[11px] text-[#64748b]">
              Benefit: {formatMoney(policy.benefit, currency)}
            </div>
          )}

          {policy.cashValue > 0 && (
            <div className="text-[11px] text-[#64748b]">
              Cash value: {formatMoney(policy.cashValue, currency)}
            </div>
          )}

          {policy.annualPremium > 0 && (
            <div className="text-[11px] text-[#64748b]">
              Premium: {formatMoney(policy.annualPremium, currency)} / yr
            </div>
          )}

          {policy.beneficiary && (
            <div className="text-[11px] text-[#64748b]">
              Beneficiary: {policy.beneficiary}
            </div>
          )}
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

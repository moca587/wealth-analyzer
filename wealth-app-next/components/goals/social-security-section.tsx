"use client";

import type { WealthPlan, Pension } from "@/lib/engine/types";
import { formatMoney } from "@/lib/engine/financial-math";

type Props = {
  plan: WealthPlan;
  update: (patch: Partial<WealthPlan>) => void;
};

export function SocialSecuritySection({ plan, update }: Props) {
  const primaryClient = plan.clients[0];

  const pension =
    plan.pensions?.find(
      (p) =>
        !p.clientId ||
        p.clientId === primaryClient?.id
    ) ?? null;

  const annualAmount = pension?.annualAmount ?? 22000;
  const startAge = pension?.startAge ?? 67;
  const colaRate = pension?.colaRate ?? plan.inflationRate;

  const adjustmentPerYear = 0.07;
  const evaluateToAge = 90;

  function updatePension(patch: Partial<Pension>) {
    if (!primaryClient) return;

    if (pension) {
      update({
        pensions: (plan.pensions ?? []).map((p) =>
          p.id === pension.id
            ? { ...p, ...patch }
            : p
        ),
      });

      return;
    }

    update({
      pensions: [
        ...(plan.pensions ?? []),
        {
          id: crypto.randomUUID(),
          clientId: primaryClient.id,
          label: "Social Security",
          annualAmount,
          startAge,
          colaRate,
          ...patch,
        },
      ],
    });
  }

  const rows = Array.from({ length: 9 }, (_, i) => {
    const claimAge = 62 + i;

    const yearsFromPlan = claimAge - startAge;

    const adjustedAnnual =
      yearsFromPlan === 0
        ? annualAmount
        : yearsFromPlan < 0
          ? annualAmount *
            Math.pow(
              1 - adjustmentPerYear,
              Math.abs(yearsFromPlan)
            )
          : annualAmount *
            Math.pow(
              1 + adjustmentPerYear,
              yearsFromPlan
            );

    const yearsPaid = Math.max(
      0,
      evaluateToAge - claimAge + 1
    );

    const total = adjustedAnnual * yearsPaid;

    const planYearsPaid = Math.max(
      0,
      evaluateToAge - startAge + 1
    );

    const planTotal =
      annualAmount * planYearsPaid;

    return {
      claimAge,
      adjustedAnnual,
      total,
      difference: total - planTotal,
      isCurrent: claimAge === startAge,
    };
  });

  const bestTotal = Math.max(...rows.map((r) => r.total));

  return (
    <section className="rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]">
          State pension / Social Security
        </h2>

        <div className="h-px flex-1 bg-[rgba(0,87,184,.10)]" />
      </div>

      {primaryClient && (
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(91,155,213,.3)] bg-[rgba(91,155,213,.15)] text-[12px] font-bold text-[#0057b8]">
            {(primaryClient.first?.[0] ?? "")
              + (primaryClient.last?.[0] ?? "")}
          </div>

          <div>
            <div className="font-bold text-[#16213e]">
              {primaryClient.first} {primaryClient.last}
            </div>

            <div className="text-[11px] text-[#9ca3af]">
              Primary client
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <div>
          <label className={labelClass}>Programme</label>

          <select className={inputClass} defaultValue="auto">
            <option value="auto">
              Auto from country
            </option>
            <option value="manual">
              Manual override
            </option>
            <option value="none">
              None — exclude
            </option>
          </select>
        </div>

        <div>
          <label className={labelClass}>Annual benefit</label>

          <input
            type="number"
            value={annualAmount}
            onChange={(e) =>
              updatePension({
                annualAmount: Number(e.target.value),
              })
            }
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Start age</label>

          <input
            type="number"
            value={startAge}
            onChange={(e) =>
              updatePension({
                startAge: Number(e.target.value),
              })
            }
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>COLA</label>

          <select
            className={inputClass}
            value={
              colaRate === 0
                ? "none"
                : Math.abs(
                    colaRate - plan.inflationRate
                  ) < 0.0001
                  ? "full"
                  : "partial"
            }
            onChange={(e) => {
              const mode = e.target.value;

              updatePension({
                colaRate:
                  mode === "full"
                    ? plan.inflationRate
                    : mode === "partial"
                      ? plan.inflationRate * 0.5
                      : 0,
              });
            }}
          >
            <option value="full">
              Full COLA — adjusts each year
            </option>

            <option value="partial">
              Partial — 50% of inflation
            </option>

            <option value="none">
              None — fixed nominal
            </option>
          </select>
        </div>
      </div>

      <details className="mt-4 text-[12px] text-[#64748b]">
        <summary className="cursor-pointer font-semibold text-[#0057b8]">
          What is COLA & why it matters
        </summary>

        <p className="mt-2 leading-5">
          COLA is a cost-of-living adjustment. It determines
          whether the pension grows with inflation after benefits
          begin.
        </p>
      </details>

      <div className="mt-5 rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
        <div className="text-[12px] text-[#64748b]">
          Auto — United States Social Security
        </div>

        <div className="mt-1 text-[13px] font-semibold text-[#16213e]">
          {formatMoney(annualAmount, plan.currency)}/yr from age{" "}
          {startAge}
        </div>
      </div>

      <p className="mt-5 text-[12px] leading-5 text-[#64748b]">
        Claiming earlier shrinks the annual benefit; delaying grows it.
        This compares total benefits received by a given age using the
        configured pension as the reference benefit.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <div>
          <label className={labelClass}>
            Adjustment per year (±%)
          </label>

          <input
            type="number"
            value={(adjustmentPerYear * 100).toFixed(1)}
            readOnly
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>
            Evaluate to age
          </label>

          <input
            type="number"
            value={evaluateToAge}
            readOnly
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-[rgba(0,87,184,.08)]">
        <table className="w-full border-collapse text-left text-[12px]">
          <thead className="bg-[#f4f7fc] text-[10px] uppercase tracking-[0.06em] text-[#64748b]">
            <tr>
              <th className="px-4 py-3">
                Claim at age
              </th>
              <th className="px-4 py-3">
                Annual benefit
              </th>
              <th className="px-4 py-3">
                Total by age {evaluateToAge}
              </th>
              <th className="px-4 py-3">
                vs your plan
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              const isBest =
                Math.abs(row.total - bestTotal) < 0.01;

              return (
                <tr
                  key={row.claimAge}
                  className={
                    row.isCurrent
                      ? "border-t border-[#e5eaf2] bg-[#eef5ff]"
                      : "border-t border-[#e5eaf2]"
                  }
                >
                  <td className="px-4 py-3 font-semibold text-[#16213e]">
                    {row.claimAge}

                    {row.isCurrent && (
                      <span className="ml-1 text-[#0057b8]">
                        (your plan)
                      </span>
                    )}

                    {isBest && (
                      <span className="ml-1 text-[#f59e0b]">
                        ★ best
                      </span>
                    )}
                  </td>

                  <td className="px-4 py-3 text-[#16213e]">
                    {formatMoney(
                      row.adjustedAnnual,
                      plan.currency
                    )}
                  </td>

                  <td className="px-4 py-3 font-bold text-[#16213e]">
                    {formatMoney(
                      row.total,
                      plan.currency
                    )}
                  </td>

                  <td
                    className={`px-4 py-3 font-semibold ${
                      row.difference > 0
                        ? "text-[#00875a]"
                        : row.difference < 0
                          ? "text-red-500"
                          : "text-[#64748b]"
                    }`}
                  >
                    {row.isCurrent
                      ? "—"
                      : `${
                          row.difference > 0 ? "+" : ""
                        }${formatMoney(
                          row.difference,
                          plan.currency
                        )}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-[11px] leading-5 text-[#9ca3af]">
        Nominal totals, before tax and COLA. Each year of early
        claiming reduces the modeled benefit by 7.0%; each year
        of delay increases it by the same amount.
      </p>
    </section>
  );
}

const labelClass =
  "mb-1.5 block text-[11px] font-semibold text-[#64748b]";

const inputClass =
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8] focus:ring-2 focus:ring-[rgba(0,87,184,.08)]";
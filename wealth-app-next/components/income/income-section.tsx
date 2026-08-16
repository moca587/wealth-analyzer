import type { WealthPlan } from "@/lib/engine/types";
import { formatMoney } from "@/lib/engine/financial-math";

type Props = {
  plan: WealthPlan;
  update: (patch: Partial<WealthPlan>) => void;
};

export function IncomeSection({ plan, update }: Props) {
  const totalIncome = plan.incomes.reduce(
    (sum, income) => sum + income.amount,
    0
  );

  function getIncome(clientId: string, source: string) {
    return (
      plan.incomes.find(
        (income) =>
          income.clientId === clientId &&
          income.source === source
      )?.amount ?? 0
    );
  }

  function updateIncome(
    clientId: string,
    source: string,
    amount: number
  ) {
    const exists = plan.incomes.some(
      (income) =>
        income.clientId === clientId &&
        income.source === source
    );

    const incomes = exists
      ? plan.incomes.map((income) =>
          income.clientId === clientId &&
          income.source === source
            ? { ...income, amount }
            : income
        )
      : [
          ...plan.incomes,
          {
            id: crypto.randomUUID(),
            clientId,
            source,
            amount,
            taxable: true,
          },
        ];

    update({ incomes });
  }

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Income</h2>

      <div className="space-y-6">
        {plan.clients.map((client) => {
          const primary = getIncome(
            client.id,
            "Primary income"
          );

          const secondary = getIncome(
            client.id,
            "Secondary income"
          );

          const subtotal = primary + secondary;

          return (
            <div
              key={client.id}
              className="rounded-xl border border-[rgba(0,87,184,.08)] p-5"
            >
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0057b8] text-[12px] font-bold text-white">
                  {client.first?.[0]}
                  {client.last?.[0]}
                </div>

                <div className="font-semibold text-[#16213e]">
                  {client.first} {client.last}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <IncomeField
                  label="Primary income (annual)"
                  value={primary}
                  onChange={(amount) =>
                    updateIncome(
                      client.id,
                      "Primary income",
                      amount
                    )
                  }
                />

                <IncomeField
                  label="Secondary income (annual)"
                  value={secondary}
                  onChange={(amount) =>
                    updateIncome(
                      client.id,
                      "Secondary income",
                      amount
                    )
                  }
                />
              </div>

              <div className="mt-3 text-[12px] text-[#64748b]">
                Client subtotal:{" "}
                <strong>
                  {formatMoney(subtotal, plan.currency)}
                </strong>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-5 rounded-xl bg-[#f8faff] p-5">
        <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
          Household total income (live)
        </div>

        <div className="mt-1 text-[24px] font-extrabold text-[#16213e]">
          {formatMoney(totalIncome, plan.currency)} / yr
        </div>

        <div className="mt-1 text-[11px] text-[#9ca3af]">
          Updates as you type. Sum of all income fields above.
        </div>
      </div>
    </section>
  );
}

function IncomeField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label>
      <span className={labelClass}>{label}</span>

      <input
        type="number"
        value={value}
        onChange={(e) =>
          onChange(Number(e.target.value))
        }
        className={inputClass}
      />
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
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8]";
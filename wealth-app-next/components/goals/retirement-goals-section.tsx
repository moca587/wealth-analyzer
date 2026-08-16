import type { WealthPlan } from "@/lib/engine/types";

type Props = {
  plan: WealthPlan;
  update: (patch: Partial<WealthPlan>) => void;
};

export function RetirementGoalsSection({ plan, update }: Props) {
  const ret = plan.retirement;

  function updateRetirement(
    patch: Partial<NonNullable<WealthPlan["retirement"]>>
  ) {
    update({
      retirement: {
        enabled: ret?.enabled ?? true,
        retirementAge: ret?.retirementAge ?? 65,
        annualSpending: ret?.annualSpending ?? 0,
        planToAge: ret?.planToAge ?? 90,
        ...patch,
      },
    });
  }

  return (
    <section className="rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className={labelClass}>Desired lifestyle</label>

          <select className={inputClass} defaultValue="comfortable">
            <option value="">— Select —</option>
            <option value="frugal">Frugal — basic needs</option>
            <option value="modest">Modest — simple & comfortable</option>
            <option value="comfortable">
              Comfortable — middle-class standard
            </option>
            <option value="upscale">Upscale — premium lifestyle</option>
            <option value="luxury">Luxury — high-end travel & homes</option>
          </select>

          <p className="mt-2 text-[11px] text-[#9ca3af]">
            Middle-class standard, regular travel and dining. ~75–85% of
            working-life expenses.
          </p>
        </div>

        <div>
          <label className={labelClass}>Desired retirement age</label>

          <input
            type="number"
            value={ret?.retirementAge ?? 65}
            onChange={(e) =>
              updateRetirement({
                retirementAge: Number(e.target.value),
              })
            }
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Annual retirement spending</label>

          <input
            type="number"
            value={ret?.annualSpending ?? 0}
            onChange={(e) =>
              updateRetirement({
                annualSpending: Number(e.target.value),
              })
            }
            className={inputClass}
          />
        </div>

        <div className="md:col-span-2">
          <label className={labelClass}>Retirement location</label>

          <select className={inputClass} defaultValue="US">
            <option value="US">🇺🇸 United States (CoL 1.00x)</option>
            <option value="CA">🇨🇦 Canada (CoL 0.95x)</option>
            <option value="GB">🇬🇧 United Kingdom (CoL 1.05x)</option>
            <option value="AU">🇦🇺 Australia (CoL 1.05x)</option>
            <option value="CH">🇨🇭 Switzerland (CoL 1.45x)</option>
            <option value="EU">🇪🇺 Euro zone (generic) (CoL 0.85x)</option>
            <option value="JP">🇯🇵 Japan (CoL 0.85x)</option>
            <option value="SG">🇸🇬 Singapore (CoL 1.10x)</option>
            <option value="OTHER">🌍 Other (CoL 0.85x)</option>
          </select>

          <p className="mt-2 text-[11px] text-[#9ca3af]">
            Location can differ from your current country — cost of living varies.
          </p>
        </div>
      </div>
    </section>
  );
}

const labelClass =
  "mb-1.5 block text-[11px] font-semibold text-[#64748b]";

const inputClass =
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8] focus:ring-2 focus:ring-[rgba(0,87,184,.08)]";
import type { WealthPlan } from "@/lib/engine/types";

type Props = {
  plan: WealthPlan;
  update: (patch: Partial<WealthPlan>) => void;
};

const REGIONS = [
  { value: "us", label: "🇺🇸 United States — 3.8%", rate: 0.038 },
  { value: "ca", label: "🇨🇦 Canada — 3.7%", rate: 0.037 },
  { value: "mx", label: "🇲🇽 Mexico — 15.2%", rate: 0.152 },
  { value: "eu", label: "🇪🇺 Euro zone — 3.1%", rate: 0.031 },
  { value: "gb", label: "🇬🇧 United Kingdom — 4.8%", rate: 0.048 },
  { value: "ch", label: "🇨🇭 Switzerland — 2.1%", rate: 0.021 },
  { value: "jp", label: "🇯🇵 Japan — 2.0%", rate: 0.02 },
];

export function InflationSection({ plan, update }: Props) {
  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Inflation</h2>

      <div className="grid gap-4 md:grid-cols-2">
        <label>
          <span className={labelClass}>Region</span>

          <select
            value={plan.inflationRegion ?? "us"}
            onChange={(e) => {
              const region = REGIONS.find(
                (r) => r.value === e.target.value
              );

              if (!region) return;

              update({
                inflationRegion: region.value,
                inflationRate: region.rate,
              });
            }}
            className={inputClass}
          >
            {REGIONS.map((region) => (
              <option
                key={region.value}
                value={region.value}
              >
                {region.label}
              </option>
            ))}
          </select>

          <p className="mt-2 text-[11px] text-[#9ca3af]">
            50-yr avg CPI-U (1974–2024): 3.8%
          </p>
        </label>

        <label>
          <span className={labelClass}>
            Inflation rate %
          </span>

          <input
            type="number"
            step="0.1"
            value={(plan.inflationRate * 100).toFixed(1)}
            onChange={(e) =>
              update({
                inflationRate:
                  Number(e.target.value) / 100,
              })
            }
            className={inputClass}
          />
        </label>
      </div>
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
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8] focus:ring-2 focus:ring-[rgba(0,87,184,.08)]";
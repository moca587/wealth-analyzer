"use client";

import type { ReportSettings } from "@/lib/report/report-settings";

type Props = {
  settings: ReportSettings;

  update: (patch: Partial<ReportSettings>) => void;
};

export function ReportContentsSection({ settings, update }: Props) {
  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Report Contents</h2>

      <p className="mt-2 text-[12px] text-[#64748b]">
        Choose which sections should appear in the generated report.
      </p>

      <div className="mt-5 divide-y divide-[rgba(0,87,184,.07)]">
        <Toggle
          label="Executive summary"
          checked={settings.includeExecutiveSummary}
          onChange={(value) =>
            update({
              includeExecutiveSummary: value,
            })
          }
        />

        <Toggle
          label="Household profile"
          checked={settings.includeHousehold}
          onChange={(value) =>
            update({
              includeHousehold: value,
            })
          }
        />

        <Toggle
          label="Income, expenses & tax"
          checked={settings.includeIncomeExpenses}
          onChange={(value) =>
            update({
              includeIncomeExpenses: value,
            })
          }
        />

        <Toggle
          label="Assets & liabilities"
          checked={settings.includeAssetsLiabilities}
          onChange={(value) =>
            update({
              includeAssetsLiabilities: value,
            })
          }
        />

        <Toggle
          label="Goals & retirement plan"
          checked={settings.includeGoalsRetirement}
          onChange={(value) =>
            update({
              includeGoalsRetirement: value,
            })
          }
        />

        <Toggle
          label="Portfolio detail"
          checked={settings.includePortfolio}
          onChange={(value) =>
            update({
              includePortfolio: value,
            })
          }
        />

        <Toggle
          label="Wealth projection"
          checked={settings.includeWealthProjection}
          onChange={(value) =>
            update({
              includeWealthProjection: value,
            })
          }
        />

        <Toggle
          label="Goal success probability"
          checked={settings.includeGoalSuccess}
          onChange={(value) =>
            update({
              includeGoalSuccess: value,
            })
          }
        />

        <Toggle
          label="Wealth allocation framework"
          checked={settings.includeWealthAllocation}
          onChange={(value) =>
            update({
              includeWealthAllocation: value,
            })
          }
        />

        <Toggle
          label="Methodology notes"
          checked={settings.includeMethodology}
          onChange={(value) =>
            update({
              includeMethodology: value,
            })
          }
        />

        <Toggle
          label="Glossary of terms"
          checked={settings.includeGlossary}
          onChange={(value) =>
            update({
              includeGlossary: value,
            })
          }
        />
      </div>

      <Toggle
        label="Plan strategies summary"
        checked={settings.includePlanStrategies}
        onChange={(value) =>
          update({
            includePlanStrategies: value,
          })
        }
      />

      <Toggle
        label="Investment Policy Statement"
        checked={settings.includeInvestmentPolicy}
        onChange={(value) =>
          update({
            includeInvestmentPolicy: value,
          })
        }
      />

      <Toggle
        label="Morningstar fact sheets"
        checked={settings.includeFactSheets}
        onChange={(value) =>
          update({
            includeFactSheets: value,
          })
        }
      />

      <Toggle
        label="Goal funding status (PV)"
        checked={settings.includeGoalFunding}
        onChange={(value) =>
          update({
            includeGoalFunding: value,
          })
        }
      />

      <Toggle
        label="Achievable lifestyle"
        checked={settings.includeAchievableLifestyle}
        onChange={(value) =>
          update({
            includeAchievableLifestyle: value,
          })
        }
      />

      <Toggle
        label="Annual potential wealth"
        checked={settings.includeAnnualPotentialWealth}
        onChange={(value) =>
          update({
            includeAnnualPotentialWealth: value,
          })
        }
      />

      <Toggle
        label="Retirement pensions"
        checked={settings.includeRetirementPensions}
        onChange={(value) =>
          update({
            includeRetirementPensions: value,
          })
        }
      />

      <Toggle
        label="Capital market assumptions"
        checked={settings.includeCapitalMarketAssumptions}
        onChange={(value) =>
          update({
            includeCapitalMarketAssumptions: value,
          })
        }
      />

      <Toggle
        label="Investor education"
        checked={settings.includeInvestorEducation}
        onChange={(value) =>
          update({
            includeInvestorEducation: value,
          })
        }
      />

      <div className="mt-5">
        <label className={labelClass}>Cash-flow projection</label>

        <select
          value={settings.cashFlowDetail}
          onChange={(e) =>
            update({
              cashFlowDetail: e.target
                .value as ReportSettings["cashFlowDetail"],
            })
          }
          className={inputClass}
        >
          <option value="summary">Summary — every 5 years</option>

          <option value="full">Full — every year</option>

          <option value="none">Do not include</option>
        </select>
      </div>
    </section>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-5 py-3">
      <span className="text-[12px] font-semibold text-[#16213e]">{label}</span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[#0057b8]"
      />
    </label>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const labelClass = "mb-1.5 block text-[11px] font-semibold text-[#64748b]";

const inputClass =
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8]";

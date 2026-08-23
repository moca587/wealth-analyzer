"use client";

import type { Dispatch, SetStateAction } from "react";

type SimulationCount = 200 | 500 | 1000;

type Props = {
  open: boolean;
  onClose: () => void;

  years: number;
  setYears: Dispatch<SetStateAction<number>>;

  sims: SimulationCount;
  setSims: Dispatch<SetStateAction<SimulationCount>>;
};

export function SimulationSettingsSheet({
  open,
  onClose,
  years,
  setYears,
  sims,
  setSims,
}: Props) {
  if (!open) {
    return null;
  }

  return (
    <>
      {/* Background overlay */}
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />

      {/* Settings drawer */}
      <aside className="fixed right-0 top-0 z-50 h-screen w-full max-w-[460px] overflow-y-auto bg-white shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[rgba(0,87,184,.08)] bg-white px-6 py-5">
          <div>
            <h2 className="text-[18px] font-bold text-[#16213e]">Settings</h2>

            <p className="mt-1 text-[11px] text-[#64748b]">
              Configure simulation assumptions and display options.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-[22px] text-[#64748b] hover:bg-[#f4f6fb]"
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div className="space-y-8 p-6">
          {/* Display */}
          <SettingsGroup title="Display">
            <SettingField
              label="Currency"
              description="Auto-set from Client 1's country."
            >
              <div className={readOnlyClass}>
                Controlled by household profile
              </div>
            </SettingField>
          </SettingsGroup>

          {/* Simulation */}
          <SettingsGroup title="Simulation">
            <SettingField
              label="Projection years"
              description="Number of years included in the projection."
            >
              <input
                type="number"
                min={1}
                max={100}
                value={years}
                onChange={(e) => {
                  const value = Number(e.target.value);

                  if (Number.isFinite(value)) {
                    setYears(value);
                  }
                }}
                className={inputClass}
              />
            </SettingField>

            <SettingField
              label="Simulations"
              description="More paths provide a more stable Monte Carlo estimate but take longer to run."
            >
              <select
                value={sims}
                onChange={(e) =>
                  setSims(Number(e.target.value) as SimulationCount)
                }
                className={inputClass}
              >
                <option value={200}>200 — fast</option>

                <option value={500}>500 — balanced</option>

                <option value={1000}>1,000 — precise</option>
              </select>
            </SettingField>
          </SettingsGroup>

          {/* Portfolio settings */}
          <SettingsGroup title="Portfolio">
            <SettingField
              label="Glidepath de-risking"
              description="Gradually reduce portfolio risk as retirement approaches."
            >
              <select className={inputClass} defaultValue="off" disabled>
                <option value="off">Off — static allocation</option>

                <option value="on">On — de-risk toward retirement</option>
              </select>

              <ComingSoon />
            </SettingField>

            <SettingField
              label="De-risk over final (years)"
              description="Number of years over which the portfolio becomes more conservative."
            >
              <input
                type="number"
                className={inputClass}
                defaultValue={10}
                disabled
              />

              <ComingSoon />
            </SettingField>

            <SettingField
              label="Portfolio rebalancing"
              description="Controls whether portfolio weights are restored during the simulation."
            >
              <select className={inputClass} defaultValue="none" disabled>
                <option value="none">None — static allocation</option>

                <option value="annual">Annual — rebalance every year</option>

                <option value="drift">5% drift — rebalance on breach</option>
              </select>

              <ComingSoon />
            </SettingField>

            <SettingField
              label="Invested allocation %"
              description="Percentage of liquid wealth allocated to investments; the remainder stays in cash."
            >
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={60}
                  disabled
                  className={inputClass}
                />

                <span className="text-[12px] font-semibold text-[#64748b]">
                  %
                </span>
              </div>

              <ComingSoon />
            </SettingField>
          </SettingsGroup>

          {/* Stress testing */}
          <SettingsGroup title="Stress Testing">
            <SettingField
              label="Stress scenario"
              description="Apply an alternative market or economic environment."
            >
              <select className={inputClass} defaultValue="base" disabled>
                <option value="base">Base case</option>

                <option value="inflation">High inflation</option>

                <option value="crash">Market crash</option>

                <option value="lost-decade">Lost decade</option>

                <option value="2008">2008 financial crisis replay</option>

                <option value="dot-com">Dot-com crash replay</option>

                <option value="stagflation">Stagflation</option>
              </select>

              <ComingSoon />
            </SettingField>
          </SettingsGroup>

          {/* Probability bands */}
          <SettingsGroup title="Probability Bands">
            <SettingField
              label="Percentile display"
              description="Controls which Monte Carlo percentile bands are displayed."
            >
              <select className={inputClass} defaultValue="standard" disabled>
                <option value="standard">Standard — 30 / 50 / 80%</option>

                <option value="alternative">Alternative — 40 / 60 / 90%</option>

                <option value="custom">Custom</option>
              </select>

              <ComingSoon />
            </SettingField>
          </SettingsGroup>

          {/* Explanation */}
          <div className="rounded-xl border border-[rgba(0,87,184,.08)] bg-[#f8faff] p-4">
            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#64748b]">
              Simulation settings
            </div>

            <p className="mt-2 text-[11px] leading-5 text-[#64748b]">
              Changes to projection years and simulation count will be applied
              the next time you run the Monte Carlo simulation. Additional
              portfolio and stress settings can be connected to the simulation
              engine as those features are migrated.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}

function SettingsGroup({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-4 border-b border-[rgba(0,87,184,.08)] pb-2 text-[10px] font-bold uppercase tracking-[0.10em] text-[#64748b]">
        {title}
      </h3>

      <div className="space-y-5">{children}</div>
    </section>
  );
}

function SettingField({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-[11px] font-semibold text-[#16213e]">
        {label}
      </label>

      {description && (
        <p className="mb-2 text-[10px] leading-4 text-[#9ca3af]">
          {description}
        </p>
      )}

      {children}
    </div>
  );
}

function ComingSoon() {
  return (
    <div className="mt-1.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-[#9ca3af]">
      Not connected yet
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border-[1.5px] border-[rgba(0,87,184,.14)] bg-white px-3 py-2 text-[13px] font-medium text-[#16213e] outline-none focus:border-[#0057b8] focus:ring-2 focus:ring-[rgba(0,87,184,.08)] disabled:cursor-not-allowed disabled:bg-[#f8faff] disabled:text-[#94a3b8]";

const readOnlyClass =
  "w-full rounded-lg border border-[rgba(0,87,184,.08)] bg-[#f8faff] px-3 py-2 text-[12px] font-medium text-[#64748b]";

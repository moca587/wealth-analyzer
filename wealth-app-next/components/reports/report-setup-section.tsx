"use client";

import type { WealthPlan } from "@/lib/engine/types";

import type { ReportSettings } from "@/lib/report/report-settings";

type Props = {
  plan: WealthPlan;
  settings: ReportSettings;
  update: (patch: Partial<ReportSettings>) => void;
};

export function ReportSetupSection({ plan, settings, update }: Props) {
  const client = plan.clients[0];

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>PDF Report</h2>

      <p className="mt-2 text-[12px] text-[#64748b]">
        Configure the client report, choose which sections to include, then
        preview or download the PDF.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Report title">
          <input
            value={settings.reportTitle}
            onChange={(e) =>
              update({
                reportTitle: e.target.value,
              })
            }
            className={inputClass}
          />
        </Field>

        <Field label="Prepared by">
          <input
            value={settings.preparedBy}
            onChange={(e) =>
              update({
                preparedBy: e.target.value,
              })
            }
            className={inputClass}
          />
        </Field>

        <Field label="Prepared for">
          <input
            value={settings.preparedFor}
            placeholder={client ? `${client.first} ${client.last}` : ""}
            onChange={(e) =>
              update({
                preparedFor: e.target.value,
              })
            }
            className={inputClass}
          />
        </Field>

        <Field label="Firm / advisor name">
          <input
            value={settings.firmName}
            onChange={(e) =>
              update({
                firmName: e.target.value,
              })
            }
            className={inputClass}
          />
        </Field>

        <Field label="Reference / case #">
          <input
            value={settings.reference}
            onChange={(e) =>
              update({
                reference: e.target.value,
              })
            }
            className={inputClass}
          />
        </Field>

        <Field label="Cover subtitle line">
          <input
            value={settings.subtitle}
            onChange={(e) =>
              update({
                subtitle: e.target.value,
              })
            }
            className={inputClass}
          />
        </Field>

        <Field label="Page size">
          <select
            value={settings.pageSize}
            onChange={(e) =>
              update({
                pageSize: e.target.value as ReportSettings["pageSize"],
              })
            }
            className={inputClass}
          >
            <option value="a4">A4</option>

            <option value="letter">US Letter</option>
          </select>
        </Field>

        <Field label="Orientation">
          <select
            value={settings.orientation}
            onChange={(e) =>
              update({
                orientation: e.target.value as ReportSettings["orientation"],
              })
            }
            className={inputClass}
          >
            <option value="portrait">Portrait</option>

            <option value="landscape">Landscape</option>
          </select>
        </Field>

        <Field label="Accent colour">
          <select
            value={settings.accent}
            onChange={(e) =>
              update({
                accent: e.target.value as ReportSettings["accent"],
              })
            }
            className={inputClass}
          >
            <option value="midnight">Midnight blue</option>

            <option value="navy">Navy</option>

            <option value="forest">Forest green</option>

            <option value="graphite">Graphite</option>

            <option value="crimson">Crimson</option>

            <option value="teal">Teal</option>
          </select>
        </Field>

        <Field label="Number format">
          <select
            value={settings.numberFormat}
            onChange={(e) =>
              update({
                numberFormat: e.target.value as ReportSettings["numberFormat"],
              })
            }
            className={inputClass}
          >
            <option value="full">Full</option>

            <option value="thousands">Thousands</option>

            <option value="millions">Millions</option>
          </select>
        </Field>
      </div>

      <div className="mt-5">
        <Field label="About the client">
          <textarea
            value={settings.aboutClient}
            onChange={(e) =>
              update({
                aboutClient: e.target.value,
              })
            }
            className={`${inputClass} min-h-[110px] resize-y`}
          />
        </Field>
      </div>

      <div className="mt-4">
        <Field label="Custom disclosure / disclaimer">
          <textarea
            value={settings.customDisclosure}
            onChange={(e) =>
              update({
                customDisclosure: e.target.value,
              })
            }
            className={`${inputClass} min-h-[110px] resize-y`}
          />
        </Field>
      </div>
    </section>
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
      <span className={labelClass}>{label}</span>

      {children}
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

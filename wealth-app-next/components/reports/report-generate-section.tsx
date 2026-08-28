"use client";

import type { WealthPlan, SimulationResult } from "@/lib/engine/types";

import type { ReportSettings } from "@/lib/report/report-settings";
import { useRouter } from "next/navigation";

type Props = {
  plan: WealthPlan;
  result?: SimulationResult | null;
  settings: ReportSettings;
};

export function ReportGenerateSection({ plan, result, settings }: Props) {
  const router = useRouter();

  const canGenerate = result != null;

  function previewReport() {
    if (!result) {
      return;
    }

    router.push("/app/reports/preview");
  }

  function downloadPdf() {
    if (!result) {
      return;
    }

    router.push("/app/reports/print");
  }

  return (
    <section className={sectionClass}>
      <h2 className={titleClass}>Generate Report</h2>

      {!canGenerate && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-[12px] text-amber-800">
          Run the simulation first — projection results and goal success rates
          are populated when the simulation runs.
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={!canGenerate}
          onClick={downloadPdf}
          className={primaryButton}
        >
          ↓ Download PDF
        </button>

        <button
          type="button"
          disabled={!canGenerate}
          onClick={previewReport}
          className={secondaryButton}
        >
          Preview in browser
        </button>
      </div>
    </section>
  );
}

const sectionClass =
  "rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm";

const titleClass =
  "text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]";

const primaryButton =
  "rounded-full bg-[#0057b8] px-5 py-2.5 text-[12px] font-bold text-white hover:bg-[#0069d9] disabled:cursor-not-allowed disabled:opacity-40";

const secondaryButton =
  "rounded-full border border-[rgba(0,87,184,.18)] bg-white px-5 py-2.5 text-[12px] font-bold text-[#0057b8] hover:bg-[#f8faff] disabled:cursor-not-allowed disabled:opacity-40";

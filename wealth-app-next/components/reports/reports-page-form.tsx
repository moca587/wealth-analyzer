"use client";

import { useState } from "react";

import type { WealthPlan, SimulationResult } from "@/lib/engine/types";

import {
  defaultReportSettings,
  type ReportSettings,
} from "@/lib/report/report-settings";

import { ReportSetupSection } from "./report-setup-section";
import { ReportContentsSection } from "./report-contents-section";
import { ReportGenerateSection } from "./report-generate-section";

import { useSimulation } from "@/lib/simulation/simulation-context";
import { useReport } from "@/lib/report/report-context";

type Props = {
  initialPlan: WealthPlan | null;
  //   simulationResult?: SimulationResult | null;
};

export function ReportsPageForm({ initialPlan }: Props) {
  const plan = initialPlan;
  const { result: simulationResult } = useSimulation();

  //   const [settings, setSettings] = useState<ReportSettings>(
  //     defaultReportSettings,
  //   );
  const { settings, setSettings } = useReport();

  function updateSettings(patch: Partial<ReportSettings>) {
    setSettings((current) => ({
      ...current,
      ...patch,
    }));
  }

  if (!plan) {
    return (
      <main className="min-h-screen bg-[#f4f6fb] px-8 py-7">
        <div className="mx-auto max-w-6xl">
          <p className="text-sm text-[#64748b]">No client plan loaded.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-8 py-7">
      <div className="mx-auto max-w-6xl space-y-6">
        <ReportSetupSection
          plan={plan}
          settings={settings}
          update={updateSettings}
        />

        <ReportContentsSection settings={settings} update={updateSettings} />

        <ReportGenerateSection
          plan={plan}
          result={simulationResult}
          settings={settings}
        />
      </div>
    </main>
  );
}

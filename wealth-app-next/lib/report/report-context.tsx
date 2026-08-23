"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import { defaultReportSettings, type ReportSettings } from "./report-settings";

type ReportContextValue = {
  settings: ReportSettings;
  setSettings: React.Dispatch<React.SetStateAction<ReportSettings>>;
};

const ReportContext = createContext<ReportContextValue | null>(null);

export function ReportProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<ReportSettings>(
    defaultReportSettings,
  );

  return (
    <ReportContext.Provider
      value={{
        settings,
        setSettings,
      }}
    >
      {children}
    </ReportContext.Provider>
  );
}

export function useReport() {
  const context = useContext(ReportContext);

  if (!context) {
    throw new Error("useReport must be used inside ReportProvider");
  }

  return context;
}

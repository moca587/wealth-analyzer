"use client";

import { createContext, useContext, useState } from "react";

import type { SimulationResult } from "@/lib/engine/types";

type SimulationContextValue = {
  result: SimulationResult | null;
  setResult: (result: SimulationResult | null) => void;
};

const SimulationContext = createContext<SimulationContextValue | null>(null);

export function SimulationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [result, setResult] = useState<SimulationResult | null>(null);

  return (
    <SimulationContext.Provider
      value={{
        result,
        setResult,
      }}
    >
      {children}
    </SimulationContext.Provider>
  );
}

export function useSimulation() {
  const context = useContext(SimulationContext);

  if (!context) {
    throw new Error("useSimulation must be used inside SimulationProvider");
  }

  return context;
}

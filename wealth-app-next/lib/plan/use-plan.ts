"use client";

import { useRef, useState } from "react";

import type { WealthPlan } from "@/lib/engine/types";

// keeps the current plan in React state and persists changes after
// a short delay
export function usePlan(
  initialPlan: WealthPlan | null,
  initialVersion: number,
) {
  const [plan, setPlan] = useState<WealthPlan | null>(initialPlan);

  const [version, setVersion] = useState(initialVersion);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function savePlan(updatedPlan: WealthPlan, baseVersion: number) {
    try {
      const response = await fetch("/api/plan", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: updatedPlan,
          baseVersion,
        }),
      });

      const data = await response.json();

      if (response.status === 409) {
        console.error("Plan version conflict:", data);

        return;
      }

      if (!response.ok) {
        console.error("Could not save plan:", data);

        return;
      }

      // Server created a new version.
      setVersion(data.version);
    } catch (error) {
      console.error("Could not save plan:", error);
    }
  }

  // decides when savePlan should run
  function scheduleSave(updatedPlan: WealthPlan) {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    } // if save is scheduled, cancel that scheduled save

    // Capture the version this edit was based on.
    const baseVersion = version;

    // wait 500ms. If timer isn't canceled, save the plan
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;
      void savePlan(updatedPlan, baseVersion);
    }, 500);
  }

  function updatePlan(patch: Partial<WealthPlan>) {
    setPlan((currentPlan) => {
      if (!currentPlan) {
        return currentPlan;
      }

      const updatedPlan: WealthPlan = {
        ...currentPlan,
        ...patch,
        updatedAt: new Date().toISOString(),
      };

      scheduleSave(updatedPlan);

      return updatedPlan;
    });
  }

  async function replacePlan(newPlan: WealthPlan) {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    setPlan(newPlan);

    await savePlan(newPlan, version);
  }

  return {
    plan,
    version,
    updatePlan,
    replacePlan,
  };
}

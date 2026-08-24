"use client";

import { useRef, useState } from "react";

import type { Proposal } from "@/lib/orders/proposal";

import { saveProposal } from "@/lib/proposal/api";

export function useProposal(initialProposal: Proposal) {
  const [proposal, setProposal] = useState<Proposal>(initialProposal);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function scheduleSave(updatedProposal: Proposal) {
    // If a save is already waiting,
    // cancel it.
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);
    }

    // Wait until the user stops
    // editing for 500 ms.
    saveTimer.current = setTimeout(() => {
      saveTimer.current = null;

      void saveProposal(updatedProposal);
    }, 500);
  }

  function updateProposal(patch: Partial<Proposal>) {
    setProposal((currentProposal) => {
      const updatedProposal: Proposal = {
        ...currentProposal,
        ...patch,
      };

      scheduleSave(updatedProposal);

      return updatedProposal;
    });
  }

  async function replaceProposal(newProposal: Proposal) {
    if (saveTimer.current) {
      clearTimeout(saveTimer.current);

      saveTimer.current = null;
    }

    setProposal(newProposal);

    await saveProposal(newProposal);
  }

  return {
    proposal,
    updateProposal,
    replaceProposal,
  };
}

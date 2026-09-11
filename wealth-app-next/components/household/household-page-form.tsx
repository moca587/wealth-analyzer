"use client";

import { useState } from "react";
import { usePlan } from "@/lib/plan/use-plan";

import { wealthPlanSchema } from "@/lib/plan/schema";

import type { WealthPlan, Holding } from "@/lib/engine/types";

import { migratePlan } from "@/lib/plan/migrate";
import { migrateProposal } from "@/lib/proposal/migrate";
import { saveProposal } from "@/lib/proposal/api";

import { WealthOverviewSection } from "@/components/household/wealth-overview-section";
import { HouseholdProfilesSection } from "@/components/household/household-profiles-section";
import { ProfileDataSection } from "@/components/household/profile-data-section";
import { UploadDocumentSection } from "@/components/household/upload-document-section";

import { NoPlanLoaded } from "@/components/plan/no-plan-loaded";

import type { Proposal } from "@/lib/orders/proposal";

import { parseCsv } from "@/lib/document-intake/parsers/csv";
import { normalizeExtraction } from "@/lib/document-intake/normalize";

import type {
  DocumentExtraction,
  ExtractedHolding,
} from "@/lib/document-intake/types";
import { DocumentReview } from "@/components/document-intake/document-review";

type Props = {
  initialPlan: WealthPlan | null;
  initialVersion: number;
  householdName?: string;
};

export function HouseholdPageForm({
  initialPlan,
  initialVersion,
  householdName,
}: Props) {
  const { plan, updatePlan, replacePlan } = usePlan(
    initialPlan,
    initialVersion,
  );

  const [extraction, setExtraction] = useState<DocumentExtraction | null>(null);

  // Load profile from JSON and persist to supabase
  function loadProfileFile(file: File) {
    const reader = new FileReader();

    reader.onload = async () => {
      try {
        const text = String(reader.result);

        const raw: unknown = JSON.parse(text);

        // Convert legacy profile data
        // into the current WealthPlan.
        const migrated = migratePlan(raw);

        // Validate the migrated WealthPlan.
        const result = wealthPlanSchema.safeParse(migrated);

        if (!result.success) {
          console.error(result.error);

          alert("Invalid profile file.");

          return;
        }

        // Save the main WealthPlan.
        await replacePlan(result.data);

        const migratedProposal = migrateProposal(raw);

        const proposalToSave: Proposal = migratedProposal ?? {
          clientId: result.data.clients[0]?.id ?? "",

          clientName: result.data.clients[0]
            ? `${result.data.clients[0].first} ${result.data.clients[0].last}`.trim()
            : "",

          advisor: "",
          targetAmount: 0,
          objective: "Balanced",
          positions: [],
          currency: result.data.currency,
        };

        try {
          await saveProposal(proposalToSave);
        } catch (error) {
          console.error("Could not save imported proposal:", error);

          alert(
            "Profile was loaded, but the investment proposal could not be saved.",
          );
        }
      } catch (error) {
        console.error(error);

        alert("Could not load profile.");
      }
    };

    reader.readAsText(file);
  }

  function handleAddSelectedHoldings(extractedHoldings: ExtractedHolding[]) {
    if (!plan) return;

    const importedHoldings: Holding[] = extractedHoldings.map((holding) => ({
      id: crypto.randomUUID(),

      name: holding.name ?? holding.tkr ?? "Unknown Holding",

      ticker: holding.tkr ?? undefined,

      value: holding.val ?? 0,

      instrumentType: holding.type ?? undefined,

      cls: holding.cls != null ? (holding.cls as Holding["cls"]) : undefined,

      region: holding.region ?? undefined,

      er: holding.er ?? undefined,

      yld: holding.yld ?? undefined,

      note: holding.note ?? undefined,
    }));

    const mergedHoldings = [...(plan.holdings ?? [])];

    for (const imported of importedHoldings) {
      const existingIndex = mergedHoldings.findIndex(
        (existing) =>
          existing.ticker?.toUpperCase() === imported.ticker?.toUpperCase(),
      );

      if (existingIndex >= 0) {
        const existing = mergedHoldings[existingIndex];

        mergedHoldings[existingIndex] = {
          ...existing,

          name: imported.name || existing.name,

          ticker: imported.ticker ?? existing.ticker,

          value: imported.value,

          instrumentType: imported.instrumentType ?? existing.instrumentType,

          cls: imported.cls ?? existing.cls,

          region: imported.region ?? existing.region,

          er: imported.er ?? existing.er,

          yld: imported.yld ?? existing.yld,

          note: imported.note ?? existing.note,

          id: existing.id,
        };
      } else {
        mergedHoldings.push(imported);
      }
    }

    const holdingsTotal = mergedHoldings.reduce(
      (total, holding) => total + holding.value,
      0,
    );

    let linkedPortfolioAssetId = plan.linkedPortfolioAssetId;

    if (!linkedPortfolioAssetId) {
      const brokerageAsset = plan.assets.find(
        (asset) =>
          asset.label?.toLowerCase().includes("brokerage") ||
          asset.type.toLowerCase().includes("brokerage"),
      );

      linkedPortfolioAssetId = brokerageAsset?.id;
    }

    const updatedAssets = linkedPortfolioAssetId
      ? plan.assets.map((asset) =>
          asset.id === linkedPortfolioAssetId
            ? {
                ...asset,
                value: holdingsTotal,
              }
            : asset,
        )
      : plan.assets;

    updatePlan({
      holdings: mergedHoldings,
      assets: updatedAssets,
      linkedPortfolioAssetId,
    });

    setExtraction(null);
  }

  // The page cannot render household information
  // until a plan has been loaded.
  if (!plan) {
    return <NoPlanLoaded />;
  }

  async function handleDocumentUpload(file: File) {
    try {
      const extension = file.name.split(".").pop()?.toLowerCase();

      if (extension !== "csv") {
        alert("Only CSV files are supported right now.");
        return;
      }

      // Read the uploaded CSV file as text.
      const text = await file.text();

      // Convert the CSV text into DocumentExtraction.
      const extracted = parseCsv(text);

      // Clean and standardize the extracted values.
      const normalized = normalizeExtraction(extracted);

      console.log("Raw extraction:", extracted);
      console.log("Normalized extraction:", normalized);

      setExtraction(normalized);
    } catch (error) {
      console.error("Could not import document:", error);

      alert("Could not import document.");
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f6fb] px-8 py-7">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Household wealth summary */}
        <WealthOverviewSection plan={plan} />

        {/* Client / household information */}
        <HouseholdProfilesSection plan={plan} update={updatePlan} />

        <ProfileDataSection onLoad={loadProfileFile} />

        <UploadDocumentSection onUpload={handleDocumentUpload} />

        <DocumentReview
          extraction={extraction}
          onAddSelected={handleAddSelectedHoldings}
        />
      </div>
    </main>
  );
}

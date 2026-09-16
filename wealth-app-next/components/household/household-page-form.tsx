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

  const [isExtracting, setIsExtracting] = useState(false);

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

  function normalizeHoldingClass(
    value: string | null | undefined,
  ): Holding["cls"] | undefined {
    if (!value) return undefined;

    const normalized = value.trim().toLowerCase().replace(/\s+/g, "_");

    const allowed: Holding["cls"][] = [
      "equity",
      "fixed_income",
      "real_estate",
      "commodity",
      "cash",
      "mixed",
      "alternative",
      "crypto",
    ];

    return allowed.includes(normalized as Holding["cls"])
      ? (normalized as Holding["cls"])
      : undefined;
  }

  function handleAddSelectedHoldings(extractedHoldings: ExtractedHolding[]) {
    if (!plan) return;

    const importedHoldings: Holding[] = extractedHoldings.map((holding) => ({
      id: crypto.randomUUID(),

      name: holding.name ?? holding.tkr ?? "Unknown Holding",

      ticker: holding.tkr ?? undefined,

      value: holding.val ?? 0,

      instrumentType: holding.type ?? undefined,

      // cls: holding.cls != null ? (holding.cls as Holding["cls"]) : undefined,
      cls: normalizeHoldingClass(holding.cls),

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
    setIsExtracting(true);

    try {
      const extension = file.name.split(".").pop()?.toLowerCase();

      if (extension === "csv") {
        const text = await file.text();

        const extracted = parseCsv(text);
        const normalized = normalizeExtraction(extracted);

        setExtraction(normalized);
        return;
      }

      if (extension === "pdf") {
        const buffer = await file.arrayBuffer();

        const bytes = new Uint8Array(buffer);

        let binary = "";

        for (const byte of bytes) {
          binary += String.fromCharCode(byte);
        }

        const base64 = btoa(binary);

        const response = await fetch("/api/document-extract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            pdfBase64: base64,
          }),
        });

        if (!response.ok) {
          throw new Error(`PDF extraction failed: ${response.status}`);
        }

        const extracted: DocumentExtraction = await response.json();

        const normalized = normalizeExtraction(extracted);

        setExtraction(normalized);
        return;
      }

      // TXT path
      if (extension === "txt") {
        const text = await file.text();

        const response = await fetch("/api/document-extract", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text,
          }),
        });

        if (!response.ok) {
          throw new Error(`Document extraction failed: ${response.status}`);
        }

        const extracted: DocumentExtraction = await response.json();

        const normalized = normalizeExtraction(extracted);

        setExtraction(normalized);
        return;
      }

      alert("Unsupported file type.");
    } catch (error) {
      console.error("Could not import document:", error);
      alert("Could not import document.");
    } finally {
      setIsExtracting(false);
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

        {isExtracting && (
          <section className="rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#dbe7f5] border-t-[#0057b8]" />

              <p className="text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]">
                Extracting document data...
              </p>

              <div className="h-px flex-1 bg-[rgba(0,87,184,.10)]" />
            </div>
          </section>
        )}

        <DocumentReview
          extraction={extraction}
          onAddSelected={handleAddSelectedHoldings}
        />
      </div>
    </main>
  );
}

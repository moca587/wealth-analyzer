"use client";

import { useEffect, useState } from "react";

import type {
  DocumentExtraction,
  ExtractedHolding,
} from "@/lib/document-intake/types";

type Props = {
  extraction: DocumentExtraction | null;
  onAddSelected: (holdings: ExtractedHolding[]) => void;
};

export function DocumentReview({ extraction, onAddSelected }: Props) {
  const holdings = extraction?.holdings ?? [];

  const [selected, setSelected] = useState<boolean[]>([]);

  useEffect(() => {
    setSelected(holdings.map(() => true));
  }, [extraction]);

  if (!extraction) {
    return null;
  }

  function toggleHolding(index: number) {
    setSelected((current) =>
      current.map((value, i) => (i === index ? !value : value)),
    );
  }

  function handleAddSelected() {
    const selectedHoldings = holdings.filter((_, index) => selected[index]);

    onAddSelected(selectedHoldings);
  }

  const selectedCount = selected.filter(Boolean).length;

  return (
    <section className="rounded-xl border border-[rgba(0,87,184,.08)] bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.10em] text-[#64748b]">
          Extracted Document Data
        </h2>

        <div className="h-px flex-1 bg-[rgba(0,87,184,.10)]" />
      </div>

      <p className="mb-4 text-[12px] leading-5 text-[#64748b]">
        Review the extracted holdings before adding them to the portfolio.
      </p>

      {holdings.length > 0 ? (
        <>
          <div className="space-y-3">
            {holdings.map((holding, index) => (
              <label
                key={`${holding.tkr ?? "holding"}-${index}`}
                className="flex cursor-pointer gap-3 rounded-lg border border-[rgba(0,87,184,.10)] bg-white p-4"
              >
                <input
                  type="checkbox"
                  checked={selected[index] ?? false}
                  onChange={() => toggleHolding(index)}
                  className="mt-1 h-4 w-4"
                />

                <div className="min-w-0 flex-1 text-[12px] leading-5 text-[#334155]">
                  <div>
                    <span className="font-semibold">Name:</span>{" "}
                    {holding.name ?? "Unknown"}
                  </div>

                  <div>
                    <span className="font-semibold">Ticker:</span>{" "}
                    {holding.tkr ?? "Unknown"}
                  </div>

                  <div>
                    <span className="font-semibold">Value:</span>{" "}
                    {holding.val != null
                      ? `$${holding.val.toLocaleString()}`
                      : "Unknown"}
                  </div>

                  <div>
                    <span className="font-semibold">Confidence:</span>{" "}
                    {holding.confidence ?? "Unknown"}
                  </div>

                  {holding.sourceQuote && (
                    <div className="mt-2 text-[11px] leading-5 text-[#64748b]">
                      Source: {holding.sourceQuote}
                    </div>
                  )}
                </div>
              </label>
            ))}
          </div>

          <div className="mt-5 flex items-center justify-between">
            <span className="text-[12px] text-[#64748b]">
              {selectedCount} of {holdings.length} selected
            </span>

            <button
              type="button"
              disabled={selectedCount === 0}
              onClick={handleAddSelected}
              className="inline-flex items-center rounded-lg border border-[rgba(0,87,184,.14)] bg-white px-4 py-2 text-[12px] font-semibold text-[#0057b8] transition hover:bg-[#f8faff] disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add Selected to Portfolio
            </button>
          </div>
        </>
      ) : (
        <p className="text-[12px] text-[#64748b]">No holdings were found.</p>
      )}
    </section>
  );
}

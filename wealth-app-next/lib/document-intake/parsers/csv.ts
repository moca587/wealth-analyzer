import Papa from "papaparse";

import type { DocumentExtraction, ExtractedHolding } from "../types";

type CsvRow = Record<string, string | undefined>;

function normalizeHeader(header: string): string {
  return header.trim().toLowerCase().replace(/_/g, " ").replace(/\s+/g, " ");
}

function getFirst(record: CsvRow, keys: string[]): string | null {
  for (const key of keys) {
    const value = record[key];

    if (value && value.trim() !== "") {
      return value.trim();
    }
  }

  return null;
}

function parseNumber(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const negative = trimmed.startsWith("(") && trimmed.endsWith(")");

  const cleaned = trimmed.replace(/[$€£¥,%()\s]/g, "");

  if (!cleaned) {
    return null;
  }

  const parsed = Number(cleaned);

  if (!Number.isFinite(parsed)) {
    return null;
  }

  return negative ? -parsed : parsed;
}

function buildSourceQuote(record: CsvRow): string {
  return Object.entries(record)
    .filter(([, value]) => value && value.trim() !== "")
    .map(([key, value]) => `${key}: ${value}`)
    .join(" | ");
}

export function parseCsv(text: string): DocumentExtraction {
  const result = Papa.parse<CsvRow>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: normalizeHeader,
  });

  if (result.errors.length > 0) {
    console.warn("CSV parsing warnings:", result.errors);
  }

  const holdings: ExtractedHolding[] = [];

  for (const record of result.data) {
    const tickerRaw = getFirst(record, [
      "symbol",
      "ticker",
      "security symbol",
      "stock symbol",
      "security ticker",
    ]);

    const ticker = tickerRaw?.toUpperCase() ?? null;

    const name = getFirst(record, [
      "name",
      "description",
      "security",
      "security name",
      "security description",
      "investment name",
      "fund name",
    ]);

    const quantity = parseNumber(
      getFirst(record, ["quantity", "shares", "units"]),
    );

    const price = parseNumber(
      getFirst(record, [
        "price",
        "market price",
        "current price",
        "last price",
      ]),
    );

    const explicitValue = parseNumber(
      getFirst(record, [
        "market value",
        "marketvalue",
        "value",
        "current value",
        "current market value",
        "position value",
        "ending value",
        "total value",
      ]),
    );

    const value =
      explicitValue ??
      (quantity != null && price != null ? quantity * price : null);

    const assetClass = getFirst(record, [
      "class",
      "asset class",
      "assetclass",
      "asset_class",
      "investment class",
    ]);

    const region = getFirst(record, [
      "region",
      "geography",
      "geographic region",
      "market region",
    ]);

    const expenseRatio = parseNumber(
      getFirst(record, [
        "expense ratio",
        "expense_ratio",
        "expense ratio %",
        "er",
      ]),
    );

    const yieldPct = parseNumber(
      getFirst(record, [
        "yield",
        "yield %",
        "dividend yield",
        "distribution yield",
        "current yield",
      ]),
    );

    const instrumentType = getFirst(record, [
      "type",
      "security type",
      "investment type",
      "instrument type",
      "asset type",
    ]);

    const note = getFirst(record, ["note", "notes", "comment", "comments"]);

    if (ticker === null && name === null && value === null) {
      continue;
    }

    const holding: ExtractedHolding = {
      name,
      tkr: ticker,
      val: value,
      type: instrumentType,
      cls: assetClass,
      region,
      er: expenseRatio,
      yld: yieldPct,
      note,
      confidence: 1,
      sourceQuote: buildSourceQuote(record),
    };

    holdings.push(holding);
  }

  return {
    holdings,
  };
}

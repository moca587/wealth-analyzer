// ─────────────────────────────────────────────────────────────────
// The identifier arithmetic exists TWICE: once in wealth-analyzer.html
// (a single file with no imports) and once here. Two implementations of
// the same rules will drift, and when they do the two products book
// different securities from identical data.
//
// This extracts the legacy block from the shipped HTML, runs both over a
// shared corpus of real / malformed / hostile inputs, and fails on any
// disagreement. It is the only thing keeping the copies honest.
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import * as saas from "../identifiers";

const html = readFileSync(join(process.cwd(), "..", "wealth-analyzer.html"), "utf8");

function extractLegacy() {
  const a = html.indexOf("function _cusipCharVal(c){");
  const b = html.indexOf("function detectInputType(raw){");
  if (a < 0 || b < 0 || b < a) throw new Error("could not locate the legacy identifier block");
  return html.slice(a, b);
}

interface LegacyApi {
  normalizeCusip(v: unknown): string;
  isValidCusip(v: unknown): boolean;
  cusipCheckDigit(v: string): number | null;
  isinCheckDigit(v: string): number | null;
  isValidIsinStrict(v: unknown): boolean;
  cusipToIsin(v: unknown, cc?: string): string | null;
  isinToCusip(v: unknown): string | null;
  checkIdentifierAgreement(c: unknown, i: unknown): { ok: boolean; derivedIsin?: string };
  normalizeValor(v: unknown): string;
  isValidValorFormat(v: unknown): boolean;
  valorToIsin(v: unknown): string | null;
  isinToValor(v: unknown): string | null;
  checkValorAgreement(v: unknown, i: unknown): { ok: boolean; derivedIsin?: string };
}

const L: LegacyApi = new Function(extractLegacy() + `
  return { normalizeCusip, isValidCusip, cusipCheckDigit, isinCheckDigit,
           isValidIsinStrict, cusipToIsin, isinToCusip, checkIdentifierAgreement,
           normalizeValor, isValidValorFormat, valorToIsin, isinToValor,
           checkValorAgreement };`)() as LegacyApi;

const CUSIPS = [
  "037833100", "594918104", "88160R101", "023135106", "084670702", "922908769",
  "78462F103", "02079K107", "478160104", "67066G104",
  "037833101", "037833010", "12345678", "1234567890", "", "abc", "0378331OO",
  " 037833-100 ", "03 78 33 100", "US0378331005", "000000000", "999999999", "AAAAAAAA1",
];
const ISINS = [
  "US0378331005", "US5949181045", "US88160R1014", "CH0038863350", "CH0012032048",
  "IE00B4L5Y983", "GB0002634946", "CH0009002509", "CA1363751027",
  "US0378331004", "IE00B4L5Y984", "", "notanisin", "CH00A8863350",
  "us0378331005", "  CH0038863350  ", "CH0000000000", "XX0000000000",
];
const VALORS: (string | number)[] = [
  "3886335", "1203204", "24476758", "874251", "0003886335", "3'886'335", "3.886.335",
  "1", "999999999", "1234567890", "0", "", "abc", "12a345", " 3886335 ", 3886335, 1203204,
];

const norm = (v: unknown) => JSON.stringify(v === undefined ? null : v);

describe("legacy ↔ SaaS identifier parity", () => {
  it("agrees on CUSIP handling for every input", () => {
    const diffs: string[] = [];
    for (const c of CUSIPS) {
      const pairs: [string, unknown, unknown][] = [
        ["normalizeCusip", L.normalizeCusip(c), saas.normalizeCusip(c)],
        ["isValidCusip", L.isValidCusip(c), saas.isValidCusip(c)],
        ["cusipToIsin", L.cusipToIsin(c), saas.cusipToIsin(c)],
        ["cusipToIsin/CA", L.cusipToIsin(c, "CA"), saas.cusipToIsin(c, "CA")],
      ];
      if (c.length === 8) pairs.push(["cusipCheckDigit", L.cusipCheckDigit(c), saas.cusipCheckDigit(c)]);
      for (const [fn, l, s] of pairs) if (norm(l) !== norm(s)) diffs.push(`${fn}(${JSON.stringify(c)}): legacy=${norm(l)} saas=${norm(s)}`);
    }
    expect(diffs, diffs.join("\n")).toEqual([]);
  });

  it("agrees on ISIN handling for every input", () => {
    const diffs: string[] = [];
    for (const i of ISINS) {
      const pairs: [string, unknown, unknown][] = [
        ["isValidIsin", L.isValidIsinStrict(i), saas.isValidIsin(i)],
        ["isinToCusip", L.isinToCusip(i), saas.isinToCusip(i)],
        ["isinToValor", L.isinToValor(i), saas.isinToValor(i)],
      ];
      if (i.length === 11) pairs.push(["isinCheckDigit", L.isinCheckDigit(i), saas.isinCheckDigit(i)]);
      for (const [fn, l, s] of pairs) if (norm(l) !== norm(s)) diffs.push(`${fn}(${JSON.stringify(i)}): legacy=${norm(l)} saas=${norm(s)}`);
    }
    expect(diffs, diffs.join("\n")).toEqual([]);
  });

  it("agrees on Valor handling for every input", () => {
    const diffs: string[] = [];
    for (const v of VALORS) {
      const pairs: [string, unknown, unknown][] = [
        ["normalizeValor", L.normalizeValor(v), saas.normalizeValor(v as string)],
        ["isValidValorFormat", L.isValidValorFormat(v), saas.isValidValorFormat(v as string)],
        ["valorToIsin", L.valorToIsin(v), saas.valorToIsin(v as string)],
      ];
      for (const [fn, l, s] of pairs) if (norm(l) !== norm(s)) diffs.push(`${fn}(${JSON.stringify(v)}): legacy=${norm(l)} saas=${norm(s)}`);
    }
    expect(diffs, diffs.join("\n")).toEqual([]);
  });

  it("agrees on the cross-checks across the identifier product space", () => {
    const diffs: string[] = [];
    for (const c of CUSIPS) for (const i of ISINS) {
      const l = L.checkIdentifierAgreement(c, i), s = saas.checkIdentifierAgreement(c, i);
      if (l.ok !== s.ok) diffs.push(`agree(${c},${i}).ok: legacy=${l.ok} saas=${s.ok}`);
      if (norm(l.derivedIsin) !== norm(s.derivedIsin)) diffs.push(`agree(${c},${i}).derived: legacy=${norm(l.derivedIsin)} saas=${norm(s.derivedIsin)}`);
    }
    for (const v of VALORS) for (const i of ISINS) {
      const l = L.checkValorAgreement(v, i), s = saas.checkValorAgreement(v as string, i);
      if (l.ok !== s.ok) diffs.push(`valorAgree(${v},${i}).ok: legacy=${l.ok} saas=${s.ok}`);
      if (norm(l.derivedIsin) !== norm(s.derivedIsin)) diffs.push(`valorAgree(${v},${i}).derived: legacy=${norm(l.derivedIsin)} saas=${norm(s.derivedIsin)}`);
    }
    expect(diffs, diffs.slice(0, 20).join("\n")).toEqual([]);
  });
});

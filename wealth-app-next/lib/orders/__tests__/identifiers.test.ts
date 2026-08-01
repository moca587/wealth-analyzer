// Identifier arithmetic is verifiable against published check digits, so
// these tests use REAL securities. If one fails, the algorithm is wrong —
// not the expectation.

import { describe, it, expect } from "vitest";
import {
  cusipCheckDigit, isValidCusip, normalizeCusip,
  isinCheckDigit, isValidIsin, cusipToIsin, isinToCusip,
  checkIdentifierAgreement,
} from "../identifiers";

/** name, CUSIP, ISIN — all independently published. */
const REAL: [string, string, string][] = [
  ["Apple",             "037833100", "US0378331005"],
  ["Microsoft",         "594918104", "US5949181045"],
  ["Tesla",             "88160R101", "US88160R1014"],
  ["Amazon",            "023135106", "US0231351067"],
  ["Berkshire Hath. B", "084670702", "US0846707026"],
  ["Vanguard VTI",      "922908769", "US9229087690"],
  ["SPDR SPY",          "78462F103", "US78462F1030"],
  ["Alphabet C",        "02079K107", "US02079K1079"],
  ["Johnson & Johnson", "478160104", "US4781601046"],
  ["NVIDIA",            "67066G104", "US67066G1040"],
];

describe("CUSIP check digit", () => {
  it("reproduces the published check digit for real securities", () => {
    for (const [name, cusip] of REAL) {
      expect(cusipCheckDigit(cusip.slice(0, 8)), name).toBe(Number(cusip[8]));
      expect(isValidCusip(cusip), name).toBe(true);
    }
  });

  it("handles the alphabetic positions (A=10..Z=35), not just digits", () => {
    // 88160R101 and 02079K107 both carry a letter in the body.
    expect(isValidCusip("88160R101")).toBe(true);
    expect(isValidCusip("02079K107")).toBe(true);
  });

  it("rejects a transposition — the error a typed CUSIP actually makes", () => {
    expect(isValidCusip("037833100")).toBe(true);
    expect(isValidCusip("037833010")).toBe(false);   // digits swapped
    expect(isValidCusip("037833101")).toBe(false);   // wrong check digit
  });

  it("rejects the wrong shape outright", () => {
    for (const bad of ["", "12345678", "1234567890", "03783310", "0378331OO", "US0378331005"]) {
      expect(isValidCusip(bad), bad).toBe(false);
    }
  });

  it("normalizes spacing and hyphens an advisor might paste", () => {
    expect(normalizeCusip(" 037833-100 ")).toBe("037833100");
    expect(isValidCusip("037833-100")).toBe(true);
    expect(isValidCusip("03 78 33 100")).toBe(true);
  });

  it("returns null rather than a number for malformed input", () => {
    expect(cusipCheckDigit("1234567")).toBeNull();
    expect(cusipCheckDigit("1234567!")).toBeNull();
  });
});

describe("ISIN check digit", () => {
  it("reproduces the published check digit", () => {
    for (const [name, , isin] of REAL) {
      expect(isinCheckDigit(isin.slice(0, 11)), name).toBe(Number(isin[11]));
      expect(isValidIsin(isin), name).toBe(true);
    }
  });

  it("validates non-US ISINs too", () => {
    for (const i of ["IE00B4L5Y983", "CH0038863350", "GB0002634946", "IE00B3RBWM25"]) {
      expect(isValidIsin(i), i).toBe(true);
    }
  });

  it("rejects a bad check digit", () => {
    expect(isValidIsin("US0378331004")).toBe(false);
    expect(isValidIsin("IE00B4L5Y984")).toBe(false);
  });
});

describe("CUSIP ↔ ISIN, offline and deterministic", () => {
  it("derives the published ISIN from the CUSIP — no network involved", () => {
    for (const [name, cusip, isin] of REAL) {
      expect(cusipToIsin(cusip), name).toBe(isin);
    }
  });

  it("round-trips back out of the ISIN", () => {
    for (const [name, cusip, isin] of REAL) {
      expect(isinToCusip(isin), name).toBe(cusip);
    }
  });

  it("honours a Canadian issuer when asked, and never guesses it", () => {
    // Nothing in a CUSIP says US vs CA, so the caller states it. Same CUSIP,
    // two different valid ISINs — which is exactly why this is explicit.
    const us = cusipToIsin("037833100", "US");
    const ca = cusipToIsin("037833100", "CA");
    expect(us).toBe("US0378331005");
    expect(ca).not.toBe(us);
    expect(isValidIsin(ca!)).toBe(true);
    expect(cusipToIsin("037833100")).toBe(us);   // default is US
  });

  it("refuses to derive anything from an invalid CUSIP", () => {
    expect(cusipToIsin("037833101")).toBeNull();
    expect(cusipToIsin("nonsense")).toBeNull();
  });

  it("will not pull a CUSIP out of a non-US/CA ISIN", () => {
    // IE00B4L5Y983 has 9 characters in the right place, but they are not a
    // CUSIP — returning them would invent an identifier.
    expect(isinToCusip("IE00B4L5Y983")).toBeNull();
    expect(isinToCusip("CH0038863350")).toBeNull();
  });
});

describe("cross-checking a CUSIP against an ISIN", () => {
  it("agrees when they describe the same security", () => {
    for (const [name, cusip, isin] of REAL) {
      const r = checkIdentifierAgreement(cusip, isin);
      expect(r.ok, name).toBe(true);
      expect(r.derivedIsin, name).toBe(isin);
    }
  });

  it("catches two identifiers that name DIFFERENT securities", () => {
    // Apple's CUSIP with Microsoft's ISIN — both individually valid, which
    // is precisely why validating them separately is not enough.
    const r = checkIdentifierAgreement("037833100", "US5949181045");
    expect(r.ok).toBe(false);
    expect(r.derivedIsin).toBe("US0378331005");
    expect(r.conflict).toMatch(/different securities/i);
  });

  it("does NOT flag a cross-listed non-US ISIN alongside a CUSIP", () => {
    // A false alarm here trains people to click through the real one.
    expect(checkIdentifierAgreement("037833100", "IE00B4L5Y983").ok).toBe(true);
  });

  it("stays quiet when only one identifier is present", () => {
    expect(checkIdentifierAgreement("037833100", "").ok).toBe(true);
    expect(checkIdentifierAgreement("", "US0378331005").ok).toBe(true);
    expect(checkIdentifierAgreement("", "").ok).toBe(true);
  });

  it("leaves malformed input to the shape validators", () => {
    expect(checkIdentifierAgreement("bogus", "US0378331005").ok).toBe(true);
    expect(checkIdentifierAgreement("037833100", "notanisin").ok).toBe(true);
  });
});

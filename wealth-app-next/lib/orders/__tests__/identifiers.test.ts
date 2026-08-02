// Identifier arithmetic is verifiable against published check digits, so
// these tests use REAL securities. If one fails, the algorithm is wrong —
// not the expectation.

import { describe, it, expect } from "vitest";
import {
  cusipCheckDigit, isValidCusip, normalizeCusip,
  isinCheckDigit, isValidIsin, cusipToIsin, isinToCusip,
  checkIdentifierAgreement,
  isValidValorFormat, normalizeValor, valorToIsin, isinToValor, checkValorAgreement,
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

// ═══ Valorennummer ═══════════════════════════════════════════════
/** name, Valor, published CH ISIN — real Swiss listed securities. */
const SWISS: [string, number, string][] = [
  ["Nestlé",            3886335,  "CH0038863350"],
  ["Roche GS",          1203204,  "CH0012032048"],
  ["Novartis",          1200526,  "CH0012005267"],
  ["UBS Group",         24476758, "CH0244767585"],
  ["Swisscom",          874251,   "CH0008742519"],
  ["Zurich Insurance",  1107539,  "CH0011075394"],
  ["ABB",               1222171,  "CH0012221716"],
  ["Swiss Re",          12688156, "CH0126881561"],
  ["Richemont",         21048333, "CH0210483332"],
  ["Geberit",           3017040,  "CH0030170408"],
];

describe("Valor ↔ CH ISIN", () => {
  it("derives the published ISIN for real Swiss securities", () => {
    for (const [name, valor, isin] of SWISS) {
      expect(valorToIsin(valor), name).toBe(isin);
    }
  });

  it("round-trips back out of the CH ISIN, unpadded", () => {
    for (const [name, valor, isin] of SWISS) {
      expect(isinToValor(isin), name).toBe(String(valor));
    }
  });

  it("zero-pads to the 9-digit national number", () => {
    // Swisscom's Valor is 6 digits; the ISIN's NSIN is always 9.
    expect(valorToIsin(874251)).toBe("CH0008742519");
    expect(valorToIsin("000874251")).toBe("CH0008742519");   // already padded
  });

  it("normalizes the separators Swiss statements use", () => {
    expect(normalizeValor(" 3'886'335 ")).toBe("3886335");
    expect(normalizeValor("3.886.335")).toBe("3886335");
    expect(normalizeValor("0003886335")).toBe("3886335");
    expect(valorToIsin("3'886'335")).toBe("CH0038863350");
  });

  it("will not pull a Valor out of a non-CH ISIN", () => {
    expect(isinToValor("US0378331005")).toBeNull();
    expect(isinToValor("IE00B4L5Y983")).toBeNull();
  });

  it("refuses an alphanumeric NSIN even on a CH ISIN", () => {
    // A CH ISIN's national number is all digits; anything else is not a Valor.
    expect(isinToValor("CH00A8863350")).toBeNull();
  });

  it("validates FORMAT only — a Valor carries no check digit", () => {
    // This is the honest limit. 3886335 is Nestlé; 3886336 is simply a
    // different valid Valor, and no arithmetic distinguishes them. Only
    // resolving it and showing the name can.
    expect(isValidValorFormat(3886335)).toBe(true);
    expect(isValidValorFormat(3886336)).toBe(true);
    expect(valorToIsin(3886336)).not.toBe(valorToIsin(3886335));
    // and both derive to structurally valid ISINs
    expect(isValidIsin(valorToIsin(3886336)!)).toBe(true);

    for (const bad of ["", "0", "abc", "12345678901", "12a345"]) {
      expect(isValidValorFormat(bad), bad).toBe(false);
    }
  });
});

describe("cross-checking a Valor against an ISIN", () => {
  it("agrees for a Swiss security", () => {
    for (const [name, valor, isin] of SWISS) {
      const r = checkValorAgreement(valor, isin);
      expect(r.ok, name).toBe(true);
      expect(r.derivedIsin, name).toBe(isin);
    }
  });

  it("catches a Valor and CH ISIN naming different securities", () => {
    // Nestlé's Valor with Roche's ISIN.
    const r = checkValorAgreement(3886335, "CH0012032048");
    expect(r.ok).toBe(false);
    expect(r.derivedIsin).toBe("CH0038863350");
    expect(r.conflict).toMatch(/different securities/i);
  });

  it("does NOT flag a foreign ISIN beside a Valor", () => {
    // The normal case for a Swiss portfolio: an Irish UCITS listed on SIX
    // has a Valor AND keeps its IE ISIN. Flagging this would fire on most
    // holdings and train advisors to ignore the warning.
    expect(checkValorAgreement(24476758, "IE00B4L5Y983").ok).toBe(true);
    expect(checkValorAgreement(1203204, "US0378331005").ok).toBe(true);
  });

  it("stays quiet when only one identifier is present", () => {
    expect(checkValorAgreement(3886335, "").ok).toBe(true);
    expect(checkValorAgreement("", "CH0038863350").ok).toBe(true);
  });
});

// ═══ through the order path ═════════════════════════════════════
import { ticketFingerprint, type OrderTicket, ORDER_SCHEMA, sumLines } from "../model";
import { checkTicket, orderTicketSchema } from "../schema";
import { ticketToWire } from "../adapters";

const CONN = { account: "CH-1", currency: "CHF", maxTicketAmount: 10_000_000 };
const mk = (inst: Record<string, string>): OrderTicket => {
  const lines = [{
    lineId: "ln1", side: "BUY" as const, instrument: inst as never,
    weightPct: 100, amount: 1000, currency: "CHF", orderType: "market" as const, note: "",
  }];
  return {
    schema: ORDER_SCHEMA, ticketId: "wo_probe_000001", createdAt: "", intent: "stage",
    account: { id: "CH-1", custodian: "", currency: "CHF" }, client: { name: "", advisor: "" },
    source: { system: "", version: "", objective: "" },
    totals: { amount: sumLines(lines), currency: "CHF", positions: 1 }, lines,
  };
};

describe("identifiers end-to-end through the order path", () => {
  it("fingerprint of a valor-free ticket is unchanged by the new field", () => {
    const noValor = mk({ isin: "CH0038863350", cusip: "", valor: "", ticker: "NESN", name: "N" });
    expect(ticketFingerprint(noValor)).toBe(
      ["CH-1", "CHF", "1000.00", "CH0038863350|NESN|BUY|1000.00|CHF"].join("\n"));
  });

  it("fingerprint CHANGES when a valor is added — it is part of the instruction", () => {
    const a = ticketFingerprint(mk({ isin: "CH0038863350", valor: "", ticker: "NESN" }));
    const b = ticketFingerprint(mk({ isin: "CH0038863350", valor: "3886335", ticker: "NESN" }));
    expect(b).not.toBe(a);
  });

  it("a VALOR-ONLY line is identifiable and reaches the wire", () => {
    const t = orderTicketSchema.parse(mk({ isin: "", cusip: "", valor: "3886335", ticker: "", name: "Nestle" })) as OrderTicket;
    const r = checkTicket(t, CONN);
    expect(r.ok, r.errors.join(" | ")).toBe(true);
    const w = ticketToWire(r.ticket, "avaloq") as { orders: { instrument: Record<string, string> }[] };
    expect(w.orders[0].instrument).toEqual({ valor: "3886335" });
  });

  it("valor normalisation survives the Zod round-trip (apostrophes on the wire)", () => {
    const t = orderTicketSchema.parse(mk({ isin: "", valor: "3'886'335", ticker: "", name: "N" })) as OrderTicket;
    const r = checkTicket(t, CONN);
    expect(r.ticket.lines[0].instrument.valor).toBe("3886335");
  });

  it("a non-numeric valor is refused rather than silently dropped", () => {
    const t = orderTicketSchema.parse(mk({ isin: "CH0038863350", valor: "ABC123", ticker: "" })) as OrderTicket;
    const r = checkTicket(t, CONN);
    expect(r.ok).toBe(false);
    expect(r.errors.join(" ")).toMatch(/not a plain number/);
  });

  it("Beatrice's real Swiss holdings back-fill their Valors", () => {
    expect(isinToValor("CH0237935652")).toBe("23793565");
    expect(isinToValor("CH0226976816")).toBe("22697681");
    expect(isinToValor("CH0106027193")).toBe("10602719");
    expect(isinToValor("IE00B3RBWM25")).toBeNull();
    expect(isinToValor("IE00BKM4GZ66")).toBeNull();
    expect(isinToValor("IE00BDBRDM35")).toBeNull();
  });

  it("round-trips those back to the same ISIN", () => {
    for (const i of ["CH0237935652", "CH0226976816", "CH0106027193"]) {
      expect(valorToIsin(isinToValor(i)!), i).toBe(i);
    }
  });
});

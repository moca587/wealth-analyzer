// ─────────────────────────────────────────────────────────────────
// HARDENING regressions. Each test pins a defect an adversarial audit
// of the feed stack actually reproduced. If one goes red, a real
// client-money bug has come back.
//
// The recurring theme: a feed is untrusted external data, and the worst
// outcome is not a crash but a plausible WRONG NUMBER landing silently
// in a client's plan.
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect, afterEach } from "vitest";
import { redact, HTTP_FOR } from "../redact";
import { encryptSecret, decryptSecret, encryptionAvailable, FeedCryptoError } from "../crypto";
import { parseFeedNumber, emptyEnvelope, type FeedEnvelope } from "../model";
import { fromCsv, fromCamt, fromOfx, fromCrmJson, fromWaJson, detectFormat, FeedFormatError } from "../adapters";
import { diffPlan, applyChanges, type PlanChange } from "../apply";
import { blockedIpReason, validateFeedUrl } from "../ssrf";
import { parsePlan } from "@/lib/plan/schema";
import { emptyPlan } from "@/lib/plan/default-plan";
import type { WealthPlan } from "@/lib/engine/types";

const all = (c: PlanChange[]) => new Set(c.map((x) => x.key));
const feed = (p: Partial<FeedEnvelope>): FeedEnvelope => ({ ...emptyEnvelope(), ...p });

// ═══ money parsing ═══════════════════════════════════════════════
describe("parseFeedNumber: a date must never become an amount", () => {
  it("rejects date-like strings instead of stripping their separators", () => {
    // "2026-08-31" previously lost its hyphens and arrived as 20,260,831.
    for (const d of ["2026-08-31", "2026-08-31T00:00:00Z", "31.08.2026", "31/08/2026", "2026/08/31", "31-Aug-2026"]) {
      expect(parseFeedNumber(d), d).toBeNull();
    }
  });
  it("still parses genuine amounts", () => {
    expect(parseFeedNumber("350'000")).toBe(350000);
    expect(parseFeedNumber("1.234,56")).toBe(1234.56);
    expect(parseFeedNumber("1,234.56")).toBe(1234.56);
    expect(parseFeedNumber("95 000")).toBe(95000);
    expect(parseFeedNumber("95 000")).toBe(95000);      // NBSP
  });
});

describe("parseFeedNumber: sign and notation", () => {
  it("keeps the minus when a currency code precedes it", () => {
    expect(parseFeedNumber("CHF -240'000.00")).toBe(-240000);
    expect(parseFeedNumber("-240000")).toBe(-240000);
    expect(parseFeedNumber("240000-")).toBe(-240000);        // trailing (SAP/DATEV)
    expect(parseFeedNumber("(4,200.00)")).toBe(-4200);
    expect(parseFeedNumber("1.234,56 DR")).toBe(-1234.56);
  });
  it("handles scientific notation instead of mangling it", () => {
    expect(parseFeedNumber("1.23e5")).toBe(123000);
    expect(parseFeedNumber("1.23E+5")).toBe(123000);
  });
  it("accepts a percentage figure so a rate is not read as 0", () => {
    expect(parseFeedNumber("1.9%")).toBe(1.9);
    expect(parseFeedNumber("2,4 %")).toBe(2.4);
  });
  it("treats a lone 3-digit group consistently for both separators", () => {
    // Previously "1,234" → 1234 but "1.234" → 1.234, a 1000x inconsistency.
    expect(parseFeedNumber("1,234")).toBe(1234);
    expect(parseFeedNumber("250.000")).toBe(250000);
    expect(parseFeedNumber("250.000", { decimal: "." })).toBe(250);   // explicit hint wins
  });
  it("returns null for junk rather than a number", () => {
    for (const v of ["", "n/a", "abc", "--", "1.2.3.4a"]) expect(parseFeedNumber(v), String(v)).toBeNull();
  });
});

// ═══ CSV ═════════════════════════════════════════════════════════
describe("CSV", () => {
  it("does not mistake a 'Value Date' column for the amount", () => {
    // The universal European bank export shape. This produced a
    // CHF 20,260,831 position from the date and ignored the real 5,000.
    const csv = "Booking Date;Value Date;Description;Amount\n2026-08-01;2026-08-31;Salary;5000,00\n";
    const env = fromCsv(csv, "bank", "CH");
    expect(env.holdings).toHaveLength(1);
    expect(env.holdings[0].val).toBe(5000);
    expect(env.holdings[0].name).toBe("Salary");
  });

  it("keeps a row whose quoted field contains a newline", () => {
    const csv = 'Name,Value\n"Fund,\nGlobal Equity",50000\n';
    const env = fromCsv(csv, "x");
    expect(env.holdings).toHaveLength(1);
    expect(env.holdings[0].name).toBe("Fund,\nGlobal Equity");
    expect(env.holdings[0].val).toBe(50000);
  });

  it("detects CRLF files, which is how Excel and banks export", () => {
    const rows = ["Security Name;ISIN;Market Value", "Nestle;CH0038863350;117'900,00"];
    expect(detectFormat(rows.join("\r\n"))).toBe("csv");
    expect(detectFormat(rows.join("\r\n"), "text/plain")).toBe("csv");
  });

  it("reads German column headers instead of labelling rows by portfolio id", () => {
    const csv = [
      "Portfolio;ISIN;Bezeichnung;Anzahl;Kurs;Marktwert;Währung",
      "CH-8842-01;CH0038863350;Nestlé SA;1'250;94,32;117'900,00;CHF",
      "CH-8842-01;CH0012032048;Roche Holding AG;300;248,75;74'625,00;CHF",
    ].join("\n");
    const env = fromCsv(csv, "Custodian", "CH");
    expect(env.holdings.map((h) => h.name)).toEqual(["Nestlé SA", "Roche Holding AG"]);
    expect(env.holdings.map((h) => h.val)).toEqual([117900, 74625]);
    expect(env.holdings[0].tkr).toBe("CH0038863350");
  });

  it("routes a negative balance to liabilities, not a negative asset", () => {
    const csv = "Security Name;ISIN;Market Value;Currency\nLombard-Kredit;;-240'000,00;CHF\n";
    const env = fromCsv(csv, "Custodian", "CH");
    expect(env.liabilities).toHaveLength(1);
    expect(env.liabilities[0].balance).toBe(240000);
    expect(env.assets.every((a) => a.value >= 0)).toBe(true);
    // ...and the merged plan still validates, where before Zod rejected it all.
    const p0 = emptyPlan();
    const ch = diffPlan(p0, env, "CHF");
    expect(parsePlan(applyChanges(p0, ch, all(ch))).ok).toBe(true);
  });

  it("refuses a file it cannot interpret rather than inventing rows", () => {
    expect(() => fromCsv("Foo;Bar\n1;2\n", "x")).toThrow(FeedFormatError);
  });
});

// ═══ camt ════════════════════════════════════════════════════════
const camtDoc = (inner: string) =>
  `<?xml version="1.0" encoding="UTF-8"?><Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.08"><BkToCstmrStmt>${inner}</BkToCstmrStmt></Document>`;

describe("camt (ISO 20022)", () => {
  it("does not read an overdraft LIMIT (CdtLine) as the balance", () => {
    const doc = camtDoc(`<Stmt><Acct><Id><IBAN>CH11</IBAN></Id><Nm>Kontokorrent</Nm><Ccy>CHF</Ccy></Acct>
      <Bal><Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp>
        <CdtLine><Incl>true</Incl><Amt Ccy="CHF">500000.00</Amt></CdtLine>
        <Amt Ccy="CHF">12500.00</Amt><CdtDbtInd>CRDT</CdtDbtInd></Bal></Stmt>`);
    const env = fromCamt(doc, "bank");
    expect(env.assets[0].value).toBe(12500);      // not the 500,000 credit line
  });

  it("labels each account by ITS OWN name, not the account holder", () => {
    // Owner-based labels made every account in a statement identical, so they
    // collapsed onto one plan record and overwrote each other.
    const st = (iban: string, nm: string, amt: string) =>
      `<Stmt><Acct><Id><IBAN>${iban}</IBAN></Id><Nm>${nm}</Nm><Ccy>CHF</Ccy>
        <Ownr><Nm>Hans Müller</Nm></Ownr></Acct>
       <Bal><Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp><Amt Ccy="CHF">${amt}</Amt><CdtDbtInd>CRDT</CdtDbtInd></Bal></Stmt>`;
    const env = fromCamt(camtDoc(st("CH01", "Privatkonto", "128450.35") + st("CH02", "Sparkonto", "90000.00")), "UBS");
    expect(env.assets.map((a) => a.label)).toEqual(["Privatkonto", "Sparkonto"]);
    expect(env.assets.map((a) => a.value)).toEqual([128450.35, 90000]);
    expect(env.assets.map((a) => a.accountRef)).toEqual(["CH01", "CH02"]);
  });

  it("does not double-negate a negative amount carrying DBIT", () => {
    const doc = camtDoc(`<Stmt><Acct><Id><IBAN>CH33</IBAN></Id><Nm>Kontokorrent</Nm></Acct>
      <Bal><Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp><Amt Ccy="CHF">-8200.00</Amt><CdtDbtInd>DBIT</CdtDbtInd></Bal></Stmt>`);
    const env = fromCamt(doc, "bank");
    expect(env.assets).toHaveLength(0);
    expect(env.liabilities[0].balance).toBe(8200);
  });

  it("classifies a vested-benefits account as illiquid and a current account as cash", () => {
    const st = (nm: string, amt: string, iban: string) =>
      `<Stmt><Acct><Id><IBAN>${iban}</IBAN></Id><Nm>${nm}</Nm><Ccy>CHF</Ccy></Acct>
       <Bal><Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp><Amt Ccy="CHF">${amt}</Amt><CdtDbtInd>CRDT</CdtDbtInd></Bal></Stmt>`;
    const env = fromCamt(camtDoc(st("Freizügigkeitskonto Säule 2", "486300.00", "CH1") + st("Privatkonto", "128450.35", "CH2")), "VZ");
    const p0 = emptyPlan();
    const ch = diffPlan(p0, env, "CHF");
    const p1 = applyChanges(p0, ch, all(ch));
    const vested = p1.assets.find((a) => a.label?.startsWith("Freizüg"))!;
    const current = p1.assets.find((a) => a.label === "Privatkonto")!;
    expect(vested.liquid).toBe(false);            // locked until retirement
    expect(current.cls).toBe("cash");             // not simulated at 6%/10% vol
  });

  it("fails loudly when no usable closing balance is present", () => {
    const doc = camtDoc(`<Stmt><Acct><Id><IBAN>CH99</IBAN></Id><Nm>Konto</Nm></Acct>
      <Bal><Tp><CdOrPrtry><Cd>OPBD</Cd></CdOrPrtry></Tp><Amt Ccy="CHF">100.00</Amt><CdtDbtInd>CRDT</CdtDbtInd></Bal></Stmt>`);
    expect(() => fromCamt(doc, "bank")).toThrow(FeedFormatError);
  });

  it("takes the balance's own currency over the account's", () => {
    const doc = camtDoc(`<Stmt><Acct><Id><IBAN>CH44</IBAN></Id><Nm>Konto</Nm><Ccy>CHF</Ccy></Acct>
      <Bal><Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp><Amt Ccy="EUR">1000.00</Amt><CdtDbtInd>CRDT</CdtDbtInd></Bal></Stmt>`);
    expect(fromCamt(doc, "bank").assets[0].ccy).toBe("EUR");
  });

  it("still refuses external entities (XXE)", () => {
    const xxe = `<?xml version="1.0"?><!DOCTYPE Document [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>
      ${camtDoc(`<Stmt><Acct><Nm>&xxe;</Nm></Acct><Bal><Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp><Amt Ccy="CHF">100.00</Amt><CdtDbtInd>CRDT</CdtDbtInd></Bal></Stmt>`)}`;
    const env = fromCamt(xxe, "x");
    expect(env.assets[0].label).not.toMatch(/root:|passwd/);
  });
});

// ═══ OFX ═════════════════════════════════════════════════════════
describe("OFX", () => {
  it("imports cash from EVERY account, not just the first", () => {
    const blk = (acct: string, cash: string) =>
      `<INVSTMTRS><CURDEF>USD<INVACCTFROM><ACCTID>${acct}</ACCTID></INVACCTFROM>` +
      `<INVBAL><AVAILCASH>${cash}<MARGINBALANCE>0</INVBAL></INVSTMTRS>`;
    const ofx = `<OFX><INVSTMTMSGSRSV1>${blk("TAXABLE-1001", "84300.55")}${blk("IRA-2002", "12000.00")}</INVSTMTMSGSRSV1></OFX>`;
    const env = fromOfx(ofx, "Pershing");
    expect(env.assets).toHaveLength(2);
    expect(env.assets.reduce((s, a) => s + a.value, 0)).toBeCloseTo(96300.55, 2);
  });

  it("does not book a checking balance as credit-card debt in a combined file", () => {
    const ofx = `<OFX>
      <BANKMSGSRSV1><STMTRS><CURDEF>USD<BANKACCTFROM><ACCTID>CHK-1</ACCTID><ACCTTYPE>CHECKING</ACCTTYPE></BANKACCTFROM>
        <LEDGERBAL><BALAMT>25000.00</BALAMT></LEDGERBAL></STMTRS></BANKMSGSRSV1>
      <CREDITCARDMSGSRSV1><CCSTMTRS><CURDEF>USD<CCACCTFROM><ACCTID>CC-9</ACCTID></CCACCTFROM>
        <LEDGERBAL><BALAMT>-1800.00</BALAMT></LEDGERBAL></CCSTMTRS></CREDITCARDMSGSRSV1>
    </OFX>`;
    const env = fromOfx(ofx, "broker");
    expect(env.assets.some((a) => a.value === 25000)).toBe(true);   // the bank asset survives
    expect(env.liabilities).toHaveLength(1);
    expect(env.liabilities[0].balance).toBe(1800);                  // only the card is debt
  });
});

// ═══ CRM ═════════════════════════════════════════════════════════
describe("CRM", () => {
  it("assigns slots by role, so a spouse listed first does not erase the primary", () => {
    const env = fromCrmJson({ records: [
      { FirstName: "Thomas", LastName: "Keller", Relationship: "Spouse" },
      { FirstName: "Béatrice", LastName: "Keller" },
    ] }, "Salesforce");
    expect(env.household).toHaveLength(2);
    expect(env.household.find((h) => h.role === "client1")?.first).toBe("Béatrice");
    expect(env.household.find((h) => h.role === "client2")?.first).toBe("Thomas");
  });

  it("normalizes an epoch-millisecond date of birth instead of truncating it", () => {
    const env = fromCrmJson([{ firstName: "A", lastName: "B", dateOfBirth: 452217600000 }], "crm");
    expect(env.household[0].dob).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(env.household[0].dob).not.toBe("4522176000");
  });

  it("drops an ambiguous date rather than guessing day/month order", () => {
    expect(fromCrmJson([{ firstName: "A", lastName: "B", dob: "05/06/1980" }], "x").household[0].dob).toBe("");
    expect(fromCrmJson([{ firstName: "A", lastName: "B", dob: "25.12.1980" }], "x").household[0].dob).toBe("1980-12-25");
  });

  it("says so when it drops one, instead of the field just vanishing", () => {
    // A client with no DOB has no retirement horizon, so a silently discarded
    // date is not a harmless omission — the advisor has to be told to type it.
    const env = fromCrmJson([{ firstName: "A", lastName: "B", dob: "05/06/1980" }], "x");
    expect(env.household[0].dobRaw).toBe("05/06/1980");
    const ch = diffPlan(emptyPlan(), env, "CHF");
    expect(ch.find((c) => c.section === "clients")?.warning).toMatch(/ambiguous/i);
  });
});

// ═══ wa.feed/v1 ══════════════════════════════════════════════════
describe("wa.feed/v1 stringy numbers", () => {
  it("coerces every numeric field the model declares", () => {
    const env = fromWaJson({
      schema: "wa.feed/v1",
      expenses: [{ name: "Living", amount: "9'500", period: "monthly" }],
      goals: [{ name: "Studium", amt: "35'000", startYear: "2033", endYear: "2038" }],
      retirement: [{ retirementAge: "64", annualSpending: "180'000", planToAge: "95" }],
    }, "legacy");
    expect(env.expenses[0]).toMatchObject({ amount: 9500 });
    expect(env.goals[0]).toMatchObject({ amt: 35000, startYear: 2033, endYear: 2038 });
    expect(env.retirement[0]).toMatchObject({ retirementAge: 64, annualSpending: 180000, planToAge: 95 });

    const p0 = { ...emptyPlan(), currency: "CHF" };
    const ch = diffPlan(p0, env, "CHF");
    const p1 = applyChanges(p0, ch, all(ch));
    expect(p1.goals[0]).toMatchObject({ startYear: 2033, endYear: 2038 });   // not the current year
    expect(p1.retirement).toMatchObject({ retirementAge: 64, annualSpending: 180000 });
    expect(parsePlan(p1).ok).toBe(true);
  });
});

// ═══ merge safety ════════════════════════════════════════════════
describe("merge: a feed must not corrupt existing records", () => {
  const planWithPension = (): WealthPlan => ({
    ...emptyPlan(),
    currency: "CHF",
    assets: [
      { id: "pension", type: "bvg_lpp", label: "Pensionskasse UBS", value: 480000, liquid: false, country: "CH", cls: "mixed" },
      { id: "nolabel", type: "account", value: 12345, liquid: true, country: "CH", cls: "cash" },
    ],
  });

  it("a cash position sharing an account's name cannot overwrite that account", () => {
    // A CHF 5,000 cash line called "Pensionskasse UBS" reduced a CHF 480,000
    // pension to 5,000 — the single worst defect found.
    const plan = planWithPension();
    const ch = diffPlan(plan, feed({ holdings: [{ name: "Pensionskasse UBS", val: 5000, cls: "cash" }] }), "CHF");
    const next = applyChanges(plan, ch, all(ch));
    expect(next.assets.find((a) => a.id === "pension")!.value).toBe(480000);
    expect(next.assets).toHaveLength(3);          // added as its own position
  });

  it("a blank or punctuation-only label matches nothing", () => {
    const plan = planWithPension();
    for (const name of ["", "   ", "---", "..."]) {
      const ch = diffPlan(plan, feed({ holdings: [{ name, val: 999 }] }), "CHF");
      const next = applyChanges(plan, ch, all(ch));
      expect(next.assets.find((a) => a.id === "nolabel")!.value, name).toBe(12345);
    }
  });

  it("a generic ticker does not match an account's type field", () => {
    const plan = planWithPension();
    const ch = diffPlan(plan, feed({ holdings: [{ name: "Some Fund", tkr: "account", val: 777 }] }), "CHF");
    const next = applyChanges(plan, ch, all(ch));
    expect(next.assets.find((a) => a.id === "nolabel")!.value).toBe(12345);
  });

  it("the same account twice in one payload creates one record, and converges on re-run", () => {
    const p0 = { ...emptyPlan(), currency: "CHF" };
    const env = feed({ assets: [{ label: "Depot", value: 100 }, { label: "Depot", value: 200 }] });
    const p1 = applyChanges(p0, diffPlan(p0, env, "CHF"), all(diffPlan(p0, env, "CHF")));
    expect(p1.assets.filter((a) => a.label === "Depot")).toHaveLength(1);
    const second = diffPlan(p1, env, "CHF");
    const p2 = applyChanges(p1, second, all(second));
    expect(p2.assets.filter((a) => a.label === "Depot")).toHaveLength(1);
  });

  it("a CRM salary updates the existing stream instead of doubling household income", () => {
    const p0 = { ...emptyPlan(), currency: "CHF" };
    p0.incomes = [{ id: "inc1", clientId: p0.clients[0].id, source: "Salary", amount: 285000, taxable: true }];
    const env = fromCrmJson({ records: [{ FirstName: "B", LastName: "K", Annual_Income__c: "CHF 285'000.00" }] }, "sf");
    const ch = diffPlan(p0, env, "CHF");
    const p1 = applyChanges(p0, ch, all(ch));
    expect(p1.incomes.reduce((s, i) => s + i.amount, 0)).toBe(285000);
    expect(ch.find((c) => c.section === "incomes")?.kind).toBe("unchanged");
  });

  it("keeps both salaries when the CRM introduces the spouse in the same payload", () => {
    // Client 2 does not exist yet, so their income has nothing to match. The
    // lookup fell back to client 1, both rows resolved to client 1's single
    // salary record, and the second overwrote the first — CHF 435,000 of
    // household income arrived as CHF 285,000, with nothing to indicate loss.
    const p0 = { ...emptyPlan(), currency: "CHF" };
    expect(p0.clients).toHaveLength(1);
    const env = fromCrmJson({ records: [
      { FirstName: "Thomas", LastName: "Keller", Relationship: "Spouse", Annual_Income__c: "CHF 150'000.00" },
      { FirstName: "Béatrice", LastName: "Keller", Annual_Income__c: "CHF 285'000.00" },
    ] }, "Salesforce");
    const ch = diffPlan(p0, env, "CHF");
    const p1 = applyChanges(p0, ch, all(ch));

    expect(p1.clients).toHaveLength(2);
    expect(p1.incomes).toHaveLength(2);
    expect(p1.incomes.reduce((s, i) => s + i.amount, 0)).toBe(435000);
    // Each stream belongs to its own client — not both to client 1.
    expect(new Set(p1.incomes.map((i) => i.clientId)).size).toBe(2);
    const byClient = (idx: number) => p1.incomes.find((i) => i.clientId === p1.clients[idx].id)?.amount;
    expect(byClient(0)).toBe(285000);
    expect(byClient(1)).toBe(150000);
    expect(parsePlan(p1).ok).toBe(true);
  });

  it("flags a foreign-currency amount instead of storing it as plan currency silently", () => {
    const p0 = { ...emptyPlan(), currency: "CHF" };
    const ch = diffPlan(p0, feed({ assets: [{ label: "Konto EUR", value: 100000, ccy: "EUR" }] }), "CHF");
    const row = ch.find((c) => c.label === "Konto EUR")!;
    expect(row.risky).toBe(true);
    expect(row.warning).toMatch(/EUR/);
  });

  it("flags an account total that duplicates the positions in the same feed", () => {
    // The classic custodian payload: the portfolio total AND its constituents.
    // Applying both turned CHF 850,000 into CHF 1.7m.
    const p0 = { ...emptyPlan(), currency: "CHF" };
    const env = feed({
      assets: [{ label: "Depot 8842", value: 850000 }],
      holdings: [
        { name: "Nestlé SA", val: 400000, cls: "equity" },
        { name: "Roche Holding AG", val: 450000, cls: "equity" },
      ],
    });
    const ch = diffPlan(p0, env, "CHF");
    const account = ch.find((c) => c.label === "Depot 8842")!;
    expect(account.risky).toBe(true);
    expect(account.warning).toMatch(/count the money twice/i);
    // The positions stay clean, so the default selection keeps the granular side.
    expect(ch.filter((c) => c.label?.startsWith("Nestl") || c.label?.startsWith("Roche"))
             .every((c) => !c.risky)).toBe(true);

    // Default selection (risky excluded) must not double-count.
    const safe = new Set(ch.filter((c) => c.kind !== "unchanged" && !c.risky).map((c) => c.key));
    const p1 = applyChanges(p0, ch, safe);
    expect(p1.assets.reduce((s, a) => s + a.value, 0)).toBe(850000);
  });

  it("does not flag an unrelated account that happens to coexist with positions", () => {
    const p0 = { ...emptyPlan(), currency: "CHF" };
    const ch = diffPlan(p0, feed({
      assets: [{ label: "Privatkonto", value: 128450 }],
      holdings: [{ name: "Nestlé SA", val: 400000 }],
    }), "CHF");
    expect(ch.find((c) => c.label === "Privatkonto")!.risky).toBeFalsy();
  });

  it("does not invent a retirement age the feed never sent", () => {
    const p0 = emptyPlan();
    expect(p0.retirement).toBeUndefined();
    const ch = diffPlan(p0, feed({ retirement: [{ annualSpending: 110000 }] }), "CHF");
    const row = ch.find((c) => c.section === "retirement")!;
    expect(row.risky).toBe(true);
    expect(applyChanges(p0, ch, all(ch)).retirement).toBeUndefined();
  });

  it("warns about a loan with no rate or term but still applies it", () => {
    // Correct-but-incomplete, not wrong. Excluding it from the default
    // selection would drop the whole balance and overstate net worth — the
    // larger error — so it warns and stays selected.
    const p0 = emptyPlan();
    const ch = diffPlan(p0, feed({ liabilities: [{ label: "Lombard", balance: 120000 }] }), "CHF");
    expect(ch[0].warning).toMatch(/rate|term/i);
    expect(ch[0].risky).toBeFalsy();

    const safe = new Set(ch.filter((c) => c.kind !== "unchanged" && !c.risky).map((c) => c.key));
    expect(applyChanges(p0, ch, safe).loans[0].bal).toBe(120000);
  });

  it("does mark a foreign-currency loan risky — that number would be wrong", () => {
    const p0 = { ...emptyPlan(), currency: "CHF" };
    const ch = diffPlan(p0, feed({ liabilities: [{ label: "US Mortgage", balance: 400000, ccy: "USD" }] }), "CHF");
    expect(ch[0].risky).toBe(true);
    expect(ch[0].warning).toMatch(/USD/);
  });

  it("clears a recorded overdraft once the account is back in credit", () => {
    const p0 = { ...emptyPlan(), currency: "CHF" };
    const june = fromCamt(camtDoc(`<Stmt><Acct><Id><IBAN>CH10</IBAN></Id><Nm>Kontokorrent</Nm><Ccy>CHF</Ccy></Acct>
      <Bal><Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp><Amt Ccy="CHF">240000.00</Amt><CdtDbtInd>DBIT</CdtDbtInd></Bal></Stmt>`), "UBS");
    const p1 = applyChanges(p0, diffPlan(p0, june, "CHF"), all(diffPlan(p0, june, "CHF")));
    expect(p1.loans[0].bal).toBe(240000);

    const july = fromCamt(camtDoc(`<Stmt><Acct><Id><IBAN>CH10</IBAN></Id><Nm>Kontokorrent</Nm><Ccy>CHF</Ccy></Acct>
      <Bal><Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp><Amt Ccy="CHF">5000.00</Amt><CdtDbtInd>CRDT</CdtDbtInd></Bal></Stmt>`), "UBS");
    const ch2 = diffPlan(p1, july, "CHF");
    const p2 = applyChanges(p1, ch2, all(ch2));
    expect(p2.assets.find((a) => a.label === "Kontokorrent")?.value).toBe(5000);
    expect(p2.loans[0].bal).toBe(0);               // repaid, not stranded forever
  });

  it("an update whose target vanished is created, not silently dropped", () => {
    const p0 = { ...emptyPlan(), currency: "CHF",
      assets: [{ id: "a1", type: "depot", label: "Depot", value: 100, liquid: true }] } as WealthPlan;
    const ch = diffPlan(p0, feed({ assets: [{ label: "Depot", value: 200 }] }), "CHF");
    const withoutTarget = { ...p0, assets: [] };
    const next = applyChanges(withoutTarget, ch, all(ch));
    expect(next.assets).toHaveLength(1);
    expect(next.assets[0].value).toBe(200);
  });
});

describe("merge: the result always satisfies the plan schema", () => {
  it("clamps hostile values rather than emitting a plan Zod rejects", () => {
    const p0 = { ...emptyPlan(), currency: "CHF" };
    const env = feed({
      assets: [{ label: "Neg", value: -5000 }, { label: "Huge", value: 1e21 }],
      liabilities: [{ label: "Bad rate", balance: 1000, ratePct: 400, years: -3 }],
      goals: [{ name: "Backwards", amt: 100, startYear: 2040, endYear: 2030 } as never],
      household: [{ role: "client1", first: "A", last: "B", country: "ZZ", riskTolerance: "wild", timeHorizon: "??" } as never],
    });
    const ch = diffPlan(p0, env, "CHF");
    const p1 = applyChanges(p0, ch, all(ch));
    const parsed = parsePlan(p1);
    expect(parsed.ok, parsed.ok ? "" : JSON.stringify((parsed as { fieldErrors: unknown }).fieldErrors)).toBe(true);
    expect(p1.assets.every((a) => a.value >= 0 && Number.isFinite(a.value))).toBe(true);
    expect(p1.loans.every((l) => l.rate <= 100 && l.yrs >= 0)).toBe(true);
    expect(p1.goals.every((g) => g.endYear >= g.startYear)).toBe(true);
  });

  it("survives a fuzz sweep of adversarial envelopes", () => {
    const vals = [0, -1, 1e21, NaN, Infinity, 0.005, -0.005];
    const labels = ["", "   ", "Depot", "…", "Pensionskasse UBS"];
    let checked = 0;
    for (const v of vals) {
      for (const label of labels) {
        const p0 = { ...emptyPlan(), currency: "CHF" };
        const env = feed({
          assets: [{ label, value: v }],
          holdings: [{ name: label, val: v, cls: "nonsense" as never }],
          liabilities: [{ label, balance: v, ratePct: v, years: v }],
        });
        const ch = diffPlan(p0, env, "CHF");
        const p1 = applyChanges(p0, ch, all(ch));
        const parsed = parsePlan(p1);
        expect(parsed.ok, `value=${v} label="${label}"`).toBe(true);
        checked++;
      }
    }
    expect(checked).toBe(vals.length * labels.length);
  });
});

// ═══ SSRF ════════════════════════════════════════════════════════
describe("SSRF guard: forms the audit got through", () => {
  it("blocks IPv4-compatible IPv6 (::/96), including the metadata address", () => {
    for (const ip of ["::7f00:1", "::a9fe:a9fe", "::a00:1", "::c0a8:1", "::ffff:0:7f00:1"]) {
      expect(blockedIpReason(ip), ip).toBeTruthy();
    }
    expect(validateFeedUrl("http://[::169.254.169.254]/latest/meta-data/").ok).toBe(false);
  });

  it("blocks internal names carrying a trailing dot", () => {
    for (const u of ["http://localhost./x", "http://db.internal./x", "http://printer.local./x"]) {
      expect(validateFeedUrl(u).ok, u).toBe(false);
    }
  });

  it("accepts the FQDN form of an allowlisted host", () => {
    const prev = process.env.FEEDS_HOST_ALLOWLIST;
    process.env.FEEDS_HOST_ALLOWLIST = "custodian.example.com";
    try {
      expect(validateFeedUrl("https://custodian.example.com./feed").ok).toBe(true);
      expect(validateFeedUrl("https://evilcustodian.example.com/feed").ok).toBe(false);
    } finally {
      if (prev === undefined) delete process.env.FEEDS_HOST_ALLOWLIST;
      else process.env.FEEDS_HOST_ALLOWLIST = prev;
    }
  });

  it("still allows genuine public endpoints", () => {
    expect(validateFeedUrl("https://api.custodian.example.com/v1/positions").ok).toBe(true);
    expect(blockedIpReason("2606:4700:4700::1111")).toBeNull();
  });
});

// ═══ error egress ════════════════════════════════════════════════
describe("redact: a relay error is an egress path", () => {
  it("removes a credential that an upstream echoed back", () => {
    const secret = "sk_live_9f2c4a77b1e3";
    const out = redact(`upstream rejected token ${secret} with HTTP 401`, secret);
    expect(out).not.toContain(secret);
    expect(out).toContain("«redacted»");
  });

  it("removes the password half and the base64 form of a basic credential", () => {
    const secret = "advisor:Hunter2Hunter2";
    const b64 = Buffer.from(secret, "utf8").toString("base64");
    const out = redact(`sent Basic ${b64}; server said Hunter2Hunter2 is wrong`, secret);
    expect(out).not.toContain(b64);
    expect(out).not.toContain("Hunter2Hunter2");
  });

  it("drops the query string, where custodians put the api key", () => {
    const out = redact('GET https://api.bank.example/v1/positions?api_key=SUPERSECRET&fmt=csv failed');
    expect(out).not.toContain("SUPERSECRET");
    expect(out).toContain("https://api.bank.example/v1/positions?«redacted»");
  });

  it("hides the resolved address so a blocked host cannot map the network", () => {
    expect(redact("address db.internal is not reachable through the relay (10.4.2.7 is private)"))
      .not.toMatch(/10\.4\.2\.7/);
    expect(redact("resolved to fd00:1234:5678::1 (unique-local)")).not.toContain("fd00:1234:5678::1");
    expect(redact("address db.internal is not reachable (10.4.2.7 is private)")).toContain("db.internal");
  });

  it("keeps messages inside the audit column budget", () => {
    expect(redact("x".repeat(5000)).length).toBeLessThanOrEqual(300);
  });

  it("maps upstream failures to distinct statuses instead of a blanket 502", () => {
    expect(HTTP_FOR.blocked).toBe(400);
    expect(HTTP_FOR.too_large).toBe(413);
    expect(HTTP_FOR.timeout).toBe(504);
    expect(HTTP_FOR.http).toBe(502);
  });
});

// ═══ credential encryption ═══════════════════════════════════════
describe("crypto: fail closed means fail closed", () => {
  const prev = process.env.FEEDS_ENCRYPTION_KEY;
  const set = (v?: string) => {
    if (v === undefined) delete process.env.FEEDS_ENCRYPTION_KEY;
    else process.env.FEEDS_ENCRYPTION_KEY = v;
  };
  afterEach(() => set(prev));

  it("refuses a passphrase instead of quietly hashing it into a key", () => {
    // The sha256 fallback meant EVERY string produced a usable key, so the
    // documented fail-closed path was unreachable and a dump could be
    // brute-forced offline.
    for (const weak of ["changeme", "password123", "x", "my secret key"]) {
      set(weak);
      expect(encryptionAvailable(), weak).toBe(false);
      expect(() => encryptSecret("token"), weak).toThrow(FeedCryptoError);
    }
  });

  it("refuses base64 or hex of the wrong length", () => {
    set(Buffer.from("a".repeat(16)).toString("base64"));    // 16 bytes
    expect(encryptionAvailable()).toBe(false);
    set("ab".repeat(16));                                    // 32 hex chars = 16 bytes
    expect(encryptionAvailable()).toBe(false);
  });

  it("accepts real 32-byte key material in both accepted encodings", () => {
    const raw = Buffer.alloc(32, 7);
    for (const k of [raw.toString("base64"), raw.toString("hex")]) {
      set(k);
      expect(encryptionAvailable(), k.slice(0, 12)).toBe(true);
      expect(decryptSecret(encryptSecret("custodian-token"))).toBe("custodian-token");
    }
  });

  it("still detects tampering", () => {
    set(Buffer.alloc(32, 3).toString("base64"));
    const enc = encryptSecret("token");
    const parts = enc.split(".");
    const flipped = Buffer.from(parts[3], "base64");
    flipped[0] ^= 0xff;
    parts[3] = flipped.toString("base64");
    expect(() => decryptSecret(parts.join("."))).toThrow(FeedCryptoError);
  });
});

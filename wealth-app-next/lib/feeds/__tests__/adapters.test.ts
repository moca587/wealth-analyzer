// ─────────────────────────────────────────────────────────────────
// Adapters — the normalization layer. These assert the two properties
// that matter: real-world payloads map to the right numbers, and junk
// never invents a record (a fabricated balance is worse than no feed).
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { adaptFeed, detectFormat, fromCamt, fromCrmJson, fromCsv, fromOfx, fromWaJson, FeedFormatError } from "../adapters";
import { parseFeedNumber, countRecords, FEED_SCHEMA } from "../model";

const CAMT = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.08"><BkToCstmrStmt><Stmt>
  <Acct><Id><IBAN>CH9300762011623852957</IBAN></Id><Ccy>CHF</Ccy><Nm>Privatkonto Keller</Nm></Acct>
  <Bal><Tp><CdOrPrtry><Cd>PRCD</Cd></CdOrPrtry></Tp><Amt Ccy="CHF">30000.00</Amt><CdtDbtInd>CRDT</CdtDbtInd></Bal>
  <Bal><Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp><Amt Ccy="CHF">41250.55</Amt><CdtDbtInd>CRDT</CdtDbtInd></Bal>
</Stmt><Stmt>
  <Acct><Id><IBAN>CH5604835012345678009</IBAN></Id><Ccy>CHF</Ccy><Nm>Kontokorrent</Nm></Acct>
  <Bal><Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp><Amt Ccy="CHF">8200.00</Amt><CdtDbtInd>DBIT</CdtDbtInd></Bal>
</Stmt></BkToCstmrStmt></Document>`;

describe("parseFeedNumber — locale tolerance", () => {
  it("handles the separators real custodian feeds actually send", () => {
    expect(parseFeedNumber("350'000")).toBe(350000);      // Swiss
    expect(parseFeedNumber("1.234,56")).toBe(1234.56);    // German
    expect(parseFeedNumber("1,234.56")).toBe(1234.56);    // Anglo
    expect(parseFeedNumber("95 000")).toBe(95000);        // French
    expect(parseFeedNumber("CHF 12'500.25")).toBe(12500.25);
    expect(parseFeedNumber("(4,200.00)")).toBe(-4200);    // accounting negative
    expect(parseFeedNumber(1234.5)).toBe(1234.5);
  });
  it("returns null rather than 0 for junk, so nothing is silently invented", () => {
    for (const v of ["", "  ", "n/a", "abc", null, undefined, {}]) {
      expect(parseFeedNumber(v as unknown), String(v)).toBeNull();
    }
  });
});

describe("detectFormat", () => {
  it("recognizes every supported wire format", () => {
    expect(detectFormat(JSON.stringify({ schema: FEED_SCHEMA, assets: [] }))).toBe("wa");
    expect(detectFormat(JSON.stringify({ records: [{ FirstName: "A" }] }))).toBe("crm");
    expect(detectFormat(CAMT)).toBe("camt");
    expect(detectFormat("OFXHEADER:100\n<OFX><SIGNONMSGSRSV1>")).toBe("ofx");
    expect(detectFormat("Name,Ticker,Value\nFoo,ABC,100\n")).toBe("csv");
    expect(detectFormat("just some prose")).toBe("unknown");
  });
});

describe("fromWaJson", () => {
  it("passes the native model through and coerces stringy numbers", () => {
    const env = fromWaJson({
      schema: FEED_SCHEMA,
      source: { system: "Test Custodian" },
      assets: [{ label: "Depot", value: "350'000", ccy: "CHF" }],
      holdings: [{ name: "SPI ETF", tkr: "CHSPI", val: 90000 }],
    }, "test");
    expect(env.assets[0].value).toBe(350000);
    expect(env.assets[0]._src).toContain("Test Custodian");
    expect(env.assets[0]._ok).toBe(0.9);
    expect(env.holdings).toHaveLength(1);
  });

  it("ignores unknown buckets and non-object rows instead of throwing", () => {
    const env = fromWaJson({ assets: [null, "x", { label: "Ok", value: 1 }], nonsense: [{}] }, "t");
    expect(env.assets).toHaveLength(1);
  });

  it("rejects a non-object payload", () => {
    expect(() => fromWaJson([1, 2, 3], "t")).toThrow(FeedFormatError);
  });
});

describe("fromCrmJson", () => {
  it("maps Salesforce records including __c custom fields", () => {
    const env = fromCrmJson({ records: [
      { FirstName: "Béatrice", LastName: "Keller", Birthdate: "1978-04-12", MailingCity: "Zürich",
        MailingCountry: "Switzerland", MailingState: "ZH", Risk_Profile__c: "Moderately Aggressive",
        Time_Horizon__c: "15+ years", AnnualIncome: 185000 },
      { FirstName: "Thomas", LastName: "Keller", Relationship: "Spouse", MailingCountry: "CH" },
    ] }, "Salesforce");

    expect(env.household).toHaveLength(2);
    const [b, t] = env.household;
    expect(b.role).toBe("client1");
    expect(b.country).toBe("CH");                 // country NAME resolved
    expect(b.riskTolerance).toBe("moderately_aggressive");
    expect(b.timeHorizon).toBe("15_plus");
    expect(t.role).toBe("client2");
    expect(t.relationship).toBe("spouse");
    expect(env.income[0]).toMatchObject({ who: "client1", primary: 185000 });
  });

  it("reads a HubSpot-style nested properties bag", () => {
    const env = fromCrmJson({ results: [{ id: "1", properties: { firstname: "Ada", lastname: "Lovelace", date_of_birth: "1985-12-10", country: "United Kingdom" } }] }, "HubSpot");
    expect(env.household[0]).toMatchObject({ first: "Ada", last: "Lovelace", dob: "1985-12-10", country: "GB" });
  });

  it("accepts a bare array and snake_case keys", () => {
    const env = fromCrmJson([{ given_name: "Marc", surname: "Dubois", country: "FR", annual_income: "95 000" }], "bare");
    expect(env.household[0].first).toBe("Marc");
    expect(env.income[0].primary).toBe(95000);
  });

  it("invents nobody from empty or nameless records", () => {
    expect(fromCrmJson({}, "x").household).toHaveLength(0);
    expect(fromCrmJson([null, {}, { email: "a@b.c" }], "x").household).toHaveLength(0);
  });

  it("caps at two adults — a CRM page must not overwrite the household repeatedly", () => {
    const many = Array.from({ length: 10 }, (_, i) => ({ firstName: `P${i}`, lastName: "X" }));
    expect(fromCrmJson(many, "x").household).toHaveLength(2);
  });
});

describe("fromCamt (ISO 20022)", () => {
  it("prefers the closing booked balance over the opening one", () => {
    const env = fromCamt(CAMT, "camt test");
    expect(env.assets).toHaveLength(1);
    expect(env.assets[0].value).toBe(41250.55);          // CLBD, not PRCD 30000
    expect(env.assets[0].label).toBe("Privatkonto Keller");
    expect(env.assets[0].ccy).toBe("CHF");
    expect(env.assets[0]._src).toContain("CLBD");
  });

  it("routes a debit balance to liabilities rather than a negative asset", () => {
    const env = fromCamt(CAMT, "camt test");
    expect(env.liabilities).toHaveLength(1);
    expect(env.liabilities[0].balance).toBe(8200);
    // The label stays the plain account name and identity is carried in
    // accountRef. Decorating it ("… (overdrawn)") meant that when the account
    // later returned to credit, the asset could never match the liability and
    // a repaid debt stayed on the plan forever.
    expect(env.liabilities[0].label).toBe("Kontokorrent");
    expect(env.liabilities[0].accountRef).toBe("CH5604835012345678009");
  });

  it("falls back through CLAV when CLBD is absent", () => {
    const xml = CAMT.replace("CLBD", "CLAV");
    expect(fromCamt(xml, "t").assets[0].value).toBe(41250.55);
  });

  it("is immune to XXE — an external entity is never resolved", () => {
    const xxe = `<?xml version="1.0"?>
<!DOCTYPE Document [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>
<Document><BkToCstmrStmt><Stmt>
  <Acct><Nm>&xxe;</Nm></Acct>
  <Bal><Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp><Amt Ccy="CHF">100.00</Amt><CdtDbtInd>CRDT</CdtDbtInd></Bal>
</Stmt></BkToCstmrStmt></Document>`;
    const env = fromCamt(xxe, "xxe");
    expect(env.assets).toHaveLength(1);
    // The entity reference is left as literal text; no file content leaks in.
    expect(env.assets[0].label).not.toMatch(/root:|\/bin\/|passwd/);
  });

  it("throws on malformed XML instead of returning a silent empty result", () => {
    expect(() => fromCamt("<Document><unclosed>", "t")).toThrow(FeedFormatError);
  });
});

describe("fromOfx", () => {
  it("extracts positions with their security master names", () => {
    const ofx = `OFXHEADER:100
<OFX><INVSTMTMSGSRSV1><INVSTMTRS><CURDEF>USD
<INVPOSLIST>
<POSSTOCK><INVPOS><SECID><UNIQUEID>037833100</UNIQUEID></SECID><UNITS>100</UNITS><UNITPRICE>150.00</UNITPRICE><MKTVAL>15000.00</MKTVAL></INVPOS></POSSTOCK>
</INVPOSLIST>
<INVBAL><AVAILCASH>2500.00</AVAILCASH></INVBAL>
</INVSTMTRS></INVSTMTMSGSRSV1>
<SECLISTMSGSRSV1><SECLIST><STOCKINFO><SECINFO><SECID><UNIQUEID>037833100</UNIQUEID></SECID><SECNAME>Apple Inc</SECNAME><TICKER>AAPL</TICKER></SECINFO></STOCKINFO></SECLIST></SECLISTMSGSRSV1>
</OFX>`;
    const env = fromOfx(ofx, "broker");
    expect(env.holdings[0]).toMatchObject({ name: "Apple Inc", tkr: "AAPL", val: 15000 });
    expect(env.assets[0].value).toBe(2500);
  });
});

describe("fromCsv", () => {
  it("maps by header name and computes value from qty × price when needed", () => {
    const env = fromCsv("Security,Symbol,Quantity,Price\niShares MSCI EM,EIMI,300,150.00\n", "csv test");
    expect(env.holdings[0]).toMatchObject({ name: "iShares MSCI EM", tkr: "EIMI", val: 45000 });
  });

  it("handles quoted fields containing the delimiter", () => {
    const env = fromCsv('Name,Value\n"Fund, Global Equity",50000\n', "t");
    expect(env.holdings[0].name).toBe("Fund, Global Equity");
    expect(env.holdings[0].val).toBe(50000);
  });

  it("refuses a file with no recognizable value column instead of guessing", () => {
    expect(() => fromCsv("Foo,Bar\n1,2\n", "t")).toThrow(FeedFormatError);
  });

  it("skips rows whose value cannot be parsed", () => {
    const env = fromCsv("Name,Value\nGood,100\nBad,n/a\nAlsoBad,\n", "t");
    expect(env.holdings).toHaveLength(1);
  });
});

describe("adaptFeed dispatch", () => {
  it("auto-detects and reports the format it used", () => {
    const r = adaptFeed(CAMT, "auto", "swiss bank");
    expect(r.format).toBe("camt");
    expect(countRecords(r.envelope)).toBe(2);
  });

  it("honours an explicitly forced format", () => {
    const r = adaptFeed(JSON.stringify([{ firstName: "A", lastName: "B" }]), "crm", "crm");
    expect(r.format).toBe("crm");
    expect(r.envelope.household).toHaveLength(1);
  });

  it("reports unrecognized payloads rather than returning nothing", () => {
    expect(() => adaptFeed("just prose", "auto", "x")).toThrow(FeedFormatError);
  });

  it("reports invalid JSON with the parser's reason", () => {
    expect(() => adaptFeed("{not json", "wa", "x")).toThrow(/valid JSON/);
  });
});

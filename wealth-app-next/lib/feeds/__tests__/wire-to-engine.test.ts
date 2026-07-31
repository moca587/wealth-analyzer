// ─────────────────────────────────────────────────────────────────
// End-to-end: raw custodian wire bytes → engine result.
//
// Every other feed test checks one layer. This one runs the whole chain
// the product actually executes —
//
//   raw text → detectFormat → adaptFeed → diffPlan → applyChanges
//            → parsePlan (Zod) → runMonteCarlo
//
// — because each layer passing in isolation proved nothing about the
// seams between them: a schema-legal plan that the engine turns into NaN,
// or an envelope the merge layer silently drops, both show up only here.
//
// Seeded and asOfYear-anchored, so a failure is a real change, not noise.
// ─────────────────────────────────────────────────────────────────

import { describe, it, expect } from "vitest";
import { adaptFeed, detectFormat } from "../adapters";
import { diffPlan, applyChanges } from "../apply";
import { parsePlan } from "@/lib/plan/schema";
import { emptyPlan } from "@/lib/plan/default-plan";
import { runMonteCarlo } from "@/lib/engine/monte-carlo";
import type { WealthPlan } from "@/lib/engine/types";

// A Swiss household as three separate custodian/CRM deliveries — the shapes a
// bank actually sends, not hand-written envelopes.
const CAMT = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.08"><BkToCstmrStmt>
  <Stmt><Acct><Id><IBAN>CH9300762011623852957</IBAN></Id><Nm>Privatkonto</Nm><Ccy>CHF</Ccy>
      <Ownr><Nm>Béatrice Keller</Nm></Ownr></Acct>
    <Bal><Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp>
      <CdtLine><Incl>true</Incl><Amt Ccy="CHF">250000.00</Amt></CdtLine>
      <Amt Ccy="CHF">128450.35</Amt><CdtDbtInd>CRDT</CdtDbtInd></Bal></Stmt>
  <Stmt><Acct><Id><IBAN>CH5604835012345678009</IBAN></Id><Nm>Freizügigkeitskonto Säule 2</Nm><Ccy>CHF</Ccy>
      <Ownr><Nm>Béatrice Keller</Nm></Ownr></Acct>
    <Bal><Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp>
      <Amt Ccy="CHF">486300.00</Amt><CdtDbtInd>CRDT</CdtDbtInd></Bal></Stmt>
  <Stmt><Acct><Id><IBAN>CH1108888012345678001</IBAN></Id><Nm>Hypothek Zürich</Nm><Ccy>CHF</Ccy></Acct>
    <Bal><Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp>
      <Amt Ccy="CHF">840000.00</Amt><CdtDbtInd>DBIT</CdtDbtInd></Bal></Stmt>
</BkToCstmrStmt></Document>`;

// CRLF, Swiss apostrophes, German headers, a date column beside the amount.
const POSITIONS_CSV = [
  "Portfolio;Valuta;ISIN;Bezeichnung;Anzahl;Kurs;Marktwert;Währung",
  "CH-8842-01;31.07.2026;CH0038863350;Nestlé SA;1'250;94,32;117'900,00;CHF",
  "CH-8842-01;31.07.2026;CH0012032048;Roche Holding AG;300;248,75;74'625,00;CHF",
  "CH-8842-01;31.07.2026;IE00B4L5Y983;iShares Core MSCI World;2'400;95,50;229'200,00;CHF",
  "CH-8842-01;31.07.2026;;Lombard-Kredit;;;-240'000,00;CHF",
].join("\r\n") + "\r\n";

const CRM = JSON.stringify({
  records: [
    { FirstName: "Thomas", LastName: "Keller", Relationship: "Spouse",
      Date_of_Birth__c: "25.03.1971", Annual_Income__c: "CHF 150'000.00" },
    { FirstName: "Béatrice", LastName: "Keller", Birthdate: "1974-06-18",
      MailingCountry: "Switzerland", Risk_Tolerance__c: "Moderately Aggressive",
      Time_Horizon__c: "15+ years", Annual_Income__c: "CHF 285'000.00" },
  ],
});

/** Run one payload the way the relay does, then merge it into `plan`. */
function ingest(plan: WealthPlan, text: string, label: string) {
  const { envelope, format } = adaptFeed(text, "auto", label, { defaultCountry: "CH" });
  const changes = diffPlan(plan, envelope, plan.currency);
  const safe = new Set(changes.filter((c) => c.kind !== "unchanged" && !c.risky).map((c) => c.key));
  const flagged = changes.filter((c) => c.risky);
  return { next: applyChanges(plan, changes, safe), format, changes, flagged };
}

describe("wire bytes → plan → engine", () => {
  it("detects each payload's format from its bytes alone", () => {
    expect(detectFormat(CAMT)).toBe("camt");
    expect(detectFormat(POSITIONS_CSV)).toBe("csv");
    expect(detectFormat(CRM)).toBe("crm");
  });

  it("builds a schema-valid plan from three raw deliveries", () => {
    let plan: WealthPlan = { ...emptyPlan(), currency: "CHF" };
    for (const [text, label] of [[CAMT, "UBS"], [POSITIONS_CSV, "Custodian"], [CRM, "Salesforce"]] as const) {
      const r = ingest(plan, text, label);
      plan = r.next;
      const parsed = parsePlan(plan);
      expect(parsed.ok, `${label}: ${parsed.ok ? "" : JSON.stringify((parsed as { fieldErrors: unknown }).fieldErrors)}`).toBe(true);
    }

    // ── Balances, not credit lines or dates ──
    const byLabel = (s: string) => plan.assets.find((a) => (a.label ?? "").startsWith(s));
    expect(byLabel("Privatkonto")?.value).toBe(128450.35);       // not the 250k credit line
    expect(byLabel("Freizüg")?.value).toBe(486300);
    expect(byLabel("Nestlé")?.value).toBe(117900);
    expect(byLabel("Roche")?.value).toBe(74625);
    expect(byLabel("iShares")?.value).toBe(229200);
    // No date column leaked in as money.
    expect(plan.assets.every((a) => a.value < 1_000_000)).toBe(true);

    // ── Debits became liabilities, with the sign resolved once ──
    expect(plan.loans.find((l) => (l.label ?? "").startsWith("Hypothek"))?.bal).toBe(840000);
    expect(plan.loans.find((l) => (l.label ?? "").startsWith("Lombard"))?.bal).toBe(240000);
    expect(plan.assets.every((a) => a.value >= 0)).toBe(true);

    // ── Classification the engine depends on ──
    expect(byLabel("Freizüg")?.liquid).toBe(false);              // locked until retirement
    expect(byLabel("Privatkonto")?.cls).toBe("cash");            // not simulated at equity vol

    // ── CRM: two people, correct slots, spouse listed first in the payload ──
    expect(plan.clients).toHaveLength(2);
    expect(plan.clients[0].first).toBe("Béatrice");
    expect(plan.clients[1].first).toBe("Thomas");
    expect(plan.clients[0].dob).toBe("1974-06-18");
    expect(plan.clients[1].dob).toBe("1971-03-25");              // dd.mm.yyyy, not mm/dd
    expect(plan.clients[0].country).toBe("CH");
    expect(plan.clients[0].risk).toBe("moderately_aggressive");
    expect(plan.incomes.reduce((s, i) => s + i.amount, 0)).toBe(435000);
    expect(new Set(plan.incomes.map((i) => i.clientId)).size).toBe(2);
  });

  it("feeds the engine a runnable plan and gets coherent numbers back", () => {
    let plan: WealthPlan = { ...emptyPlan(), currency: "CHF" };
    for (const [text, label] of [[CAMT, "UBS"], [POSITIONS_CSV, "Custodian"], [CRM, "Salesforce"]] as const) {
      plan = ingest(plan, text, label).next;
    }
    plan.expenses = [{ id: "e1", name: "Living", amount: 14000 }];

    const res = runMonteCarlo({ plan, sims: 200, years: 25, seed: 42, asOfYear: 2026 });

    expect(Number.isFinite(res.final.p50)).toBe(true);
    expect(res.percentiles.p10.every(Number.isFinite)).toBe(true);
    for (let y = 0; y < res.percentiles.p50.length; y++) {
      expect(res.percentiles.p10[y]).toBeLessThanOrEqual(res.percentiles.p50[y]);
      expect(res.percentiles.p50[y]).toBeLessThanOrEqual(res.percentiles.p90[y]);
    }
    // Byte-reproducible for the same seed.
    const again = runMonteCarlo({ plan, sims: 200, years: 25, seed: 42, asOfYear: 2026 });
    expect(again.final.p50).toBe(res.final.p50);
    expect(again.inputHash).toBe(res.inputHash);
  });

  it("re-running the same three payloads is a no-op", () => {
    let plan: WealthPlan = { ...emptyPlan(), currency: "CHF" };
    const payloads = [[CAMT, "UBS"], [POSITIONS_CSV, "Custodian"], [CRM, "Salesforce"]] as const;
    for (const [text, label] of payloads) plan = ingest(plan, text, label).next;

    const before = JSON.stringify({ a: plan.assets, l: plan.loans, c: plan.clients, i: plan.incomes });
    for (const [text, label] of payloads) {
      const r = ingest(plan, text, label);
      expect(r.changes.some((c) => c.kind === "create"), `${label} created a record on re-sync`).toBe(false);
      plan = r.next;
    }
    expect(JSON.stringify({ a: plan.assets, l: plan.loans, c: plan.clients, i: plan.incomes })).toBe(before);
  });

  it("carries the mortgage into the plan but tells the advisor what's missing", () => {
    // camt sends a balance with no rate or term. The balance is correct, so it
    // is applied — dropping an CHF 840,000 debt would overstate net worth by
    // more than any rate assumption could — but the row says what to fill in.
    const plan: WealthPlan = { ...emptyPlan(), currency: "CHF" };
    const { next, changes } = ingest(plan, CAMT, "UBS");
    const row = changes.find((c) => (c.label ?? "").startsWith("Hypothek"))!;
    expect(row.warning).toMatch(/rate|term/i);
    expect(row.risky).toBeFalsy();
    expect(next.loans.find((l) => (l.label ?? "").startsWith("Hypothek"))?.bal).toBe(840000);
  });
});

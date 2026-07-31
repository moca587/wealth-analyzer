// ─────────────────────────────────────────────────────────────────
// Wire-format adapters → wa.feed/v1.
//
// Pure functions over strings: no network, no DOM, no Supabase, so the
// whole normalization layer is unit-testable. Mirrors the adapters in
// the single-file app (wealth-analyzer.html) so both products speak the
// same model and a payload behaves identically whichever path it takes.
// ─────────────────────────────────────────────────────────────────

import { XMLParser } from "./xml";
import {
  FEED_BUCKETS, FEED_SCHEMA, emptyEnvelope, parseFeedNumber,
  type FeedEnvelope, type FeedFormat, type FeedHousehold,
} from "./model";

export class FeedFormatError extends Error {
  constructor(message: string) { super(message); this.name = "FeedFormatError"; }
}

// ─── Detection ────────────────────────────────────────────────────
/** Never returns "auto" — detection always resolves to a concrete format. */
export function detectFormat(text: string, contentType = ""): Exclude<FeedFormat, "auto"> | "unknown" {
  const head = text.slice(0, 2500);
  const ct = contentType.toLowerCase();

  if (/^\s*[[{]/.test(head)) {
    try {
      const o = JSON.parse(text) as Record<string, unknown>;
      if (o && typeof o === "object" && !Array.isArray(o) &&
          (o.schema === FEED_SCHEMA || "holdings" in o || "assets" in o || "liabilities" in o)) return "wa";
    } catch { /* fall through — malformed JSON is reported by the adapter */ }
    return "crm";
  }
  // camt markers are searched across the WHOLE payload: banks routinely wrap
  // the document in a SOAP envelope whose header alone exceeds 2500 chars,
  // and a windowed search then misfiled it as CSV.
  if (/<Document[^>]*camt\.|<BkToCstmrStmt|<BkToCstmrAcctRpt|<BkToCstmrDbtCdtNtfctn/i.test(text)) return "camt";
  if (/<OFX>/i.test(head) || /^\s*OFXHEADER:/im.test(head) || /<\?OFX/i.test(text)) return "ofx";
  // Explicit about the line ending rather than relying on `.` (which does match
  // \r) so the CRLF case every Excel-exported custodian CSV uses is obvious.
  if (ct.includes("csv") || /[,;\t|][^\n]*\r?\n/.test(head)) return "csv";
  return "unknown";
}

// ─── wa.feed/v1 (native) ──────────────────────────────────────────
// EVERY numeric field the model declares. Omitting a key here does not
// fail loudly — the downstream `typeof x === "number"` checks simply skip
// the field, so a stringy "35'000" goal amount or "2033" start year was
// silently dropped and the goal landed in the current year at zero.
const NUMERIC_KEYS = [
  "value", "val", "balance", "propertyValue", "otherValue", "amt",
  "primary", "secondary", "raisePct", "er", "yld", "ratePct", "years",
  "amount", "startYear", "endYear",
  "retirementAge", "annualSpending", "planToAge",
];

export function fromWaJson(input: unknown, srcLabel: string): FeedEnvelope {
  const obj = input as Record<string, unknown> | null;
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
    throw new FeedFormatError("wa.feed payload must be a JSON object");
  }
  const out = emptyEnvelope();
  const source = obj.source as { system?: string; name?: string } | undefined;
  const sys = source?.system || source?.name || srcLabel;
  if (source) out.source = obj.source as FeedEnvelope["source"];

  for (const bucket of FEED_BUCKETS) {
    const rows = obj[bucket];
    if (!Array.isArray(rows)) continue;
    for (const raw of rows) {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
      const row: Record<string, unknown> = { ...(raw as Record<string, unknown>) };
      for (const k of NUMERIC_KEYS) {
        if (row[k] != null && row[k] !== "" && typeof row[k] !== "number") {
          const n = parseFeedNumber(row[k]);
          if (n != null) row[k] = n;
        }
      }
      row._ok = typeof row._ok === "number" ? row._ok : 0.9;
      row._src = typeof row._src === "string" && row._src ? row._src : `${FEED_SCHEMA} · ${sys} · ${bucket}`;
      (out[bucket] as unknown[]).push(row);
    }
  }
  return out;
}

// ─── Generic CRM contact JSON ─────────────────────────────────────
const RISK_VALUES = new Set([
  "very_conservative", "conservative", "moderately_conservative", "moderate",
  "moderately_aggressive", "aggressive", "very_aggressive",
]);
const COUNTRY_NAMES: Record<string, string> = {
  switzerland: "CH", schweiz: "CH", suisse: "CH", svizzera: "CH",
  "united states": "US", usa: "US", "united states of america": "US",
  "united kingdom": "GB", uk: "GB", "great britain": "GB",
  germany: "DE", deutschland: "DE", france: "FR", italy: "IT", italia: "IT",
  spain: "ES", austria: "AT", österreich: "AT", canada: "CA", australia: "AU",
  netherlands: "NL", belgium: "BE", singapore: "SG", japan: "JP",
};

/** Case/separator-insensitive, and tolerant of Salesforce __c suffixes. */
function normKey(k: string): string {
  return String(k).toLowerCase().replace(/__(c|pc|r)$/, "").replace(/[\s_\-.]/g, "");
}
function picker(o: Record<string, unknown>) {
  const flat: Record<string, unknown> = {};
  // Merge a nested `properties`/`fields`/`attributes` bag (HubSpot, Dynamics).
  const bags = [o, o.properties, o.fields, o.attributes].filter(
    (b): b is Record<string, unknown> => !!b && typeof b === "object" && !Array.isArray(b)
  );
  for (const bag of bags) {
    for (const k of Object.keys(bag)) {
      const n = normKey(k);
      const v = bag[k];
      if (v != null && v !== "" && (flat[n] == null || flat[n] === "")) flat[n] = v;
    }
  }
  return (names: string[]): string => {
    for (const n of names) {
      const v = flat[normKey(n)];
      if (v != null && v !== "" && typeof v !== "object") return String(v);
    }
    return "";
  };
}
function normRisk(v: string): string {
  const s = v.toLowerCase().trim().replace(/[\s-]+/g, "_");
  return RISK_VALUES.has(s) ? s : "";
}
function normHorizon(v: string): string {
  const s = v.toLowerCase();
  if (/15|long/.test(s)) return "15_plus";
  if (/10/.test(s)) return "10_15";
  if (/5\s*[-–to]+\s*10|medium/.test(s)) return "5_10";
  if (/\b[1-4]\b|short/.test(s)) return "0_5";
  return "";
}
function normCountry(v: string): string {
  const s = v.trim();
  if (/^[A-Za-z]{2}$/.test(s)) return s.toUpperCase();
  return COUNTRY_NAMES[s.toLowerCase()] || "";
}

/**
 * Normalize a CRM date of birth to YYYY-MM-DD, or "" when it isn't a date.
 * A blind .slice(0,10) turned an epoch-millisecond value like 452217600000
 * into "4522176000" and stored that as the client's date of birth.
 */
function normDob(v: string): string {
  const s = String(v || "").trim();
  if (!s) return "";
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  // Epoch seconds or milliseconds (CRMs export both; lengths vary by era).
  if (/^\d{9,14}$/.test(s)) {
    const ms = s.length <= 10 ? Number(s) * 1000 : Number(s);
    const d = new Date(ms);
    return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
  }
  // dd.mm.yyyy / dd/mm/yyyy — day-first, the European convention these
  // CRMs export. Ambiguous with US mm/dd; only accept when unambiguous.
  const dmy = s.match(/^(\d{1,2})[./](\d{1,2})[./](\d{4})$/);
  if (dmy) {
    const day = Number(dmy[1]), month = Number(dmy[2]);
    if (day > 12 && month <= 12) {
      return `${dmy[3]}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    }
    return "";   // genuinely ambiguous — better absent than wrong
  }
  const parsed = new Date(s);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

export function fromCrmJson(input: unknown, srcLabel: string): FeedEnvelope {
  const out = emptyEnvelope();
  let rows: unknown[] = [];
  if (Array.isArray(input)) rows = input;
  else if (input && typeof input === "object") {
    const o = input as Record<string, unknown>;
    const key = ["records", "contacts", "data", "value", "results", "items", "clients"]
      .find((k) => Array.isArray(o[k]));
    rows = key ? (o[key] as unknown[]) : [o];
  }

  // Only two adults map onto the plan model (client1 + client2); the rest
  // of a CRM page would silently overwrite them, so they are ignored here.
  const named = rows
    .filter((r): r is Record<string, unknown> => !!r && typeof r === "object" && !Array.isArray(r))
    .map((r) => {
      const get = picker(r);
      const rel = get(["relationship", "role", "contactType", "householdRole"]).toLowerCase();
      return {
        get,
        first: get(["firstName", "first", "givenName", "forename"]),
        last: get(["lastName", "last", "familyName", "surname"]),
        spouseFlag: /spouse|partner|husband|wife|ehepartner|conjoint/.test(rel),
      };
    })
    .filter((p) => p.first || p.last);

  // Assign slots by ROLE, not by position. Ordering alone meant that a CRM
  // page listing the spouse first made BOTH people client2 — the second
  // record overwrote the first and one of the couple vanished.
  const primaryIdx = named.findIndex((p) => !p.spouseFlag);
  const slotOf = (i: number): 0 | 1 => {
    if (primaryIdx < 0) return i === 0 ? 0 : 1;      // everyone flagged spouse: keep order
    if (i === primaryIdx) return 0;
    return 1;
  };
  const taken = new Set<number>();
  const people = named
    .map((p, i) => ({ p, slot: slotOf(i) }))
    .filter(({ slot }) => { if (taken.has(slot)) return false; taken.add(slot); return true; });

  for (const { p, slot } of people) {
    const get = p.get;
    const first = p.first;
    const last = p.last;
    const isSpouse = slot === 1;
    const who = isSpouse ? "client2" : "client1";
    const src = `CRM · ${srcLabel} · ${isSpouse ? "client 2" : "client 1"}`;
    const rawDob = get(["dateOfBirth", "birthDate", "dob", "birthdate"]);

    const person: FeedHousehold = {
      _ok: 0.9, _src: src,
      role: who,
      first, last,
      dob: normDob(rawDob),
      // Preserve a date we REFUSED to interpret (an ambiguous 12.03.1971 could
      // be March 12 or December 3). The merge layer turns this into a visible
      // "enter it by hand" note; without it the DOB just vanished, and a client
      // with no DOB has no retirement horizon.
      dobRaw: rawDob && !normDob(rawDob) ? rawDob : undefined,
      street: get(["street", "address1", "addressLine1", "mailingStreet", "billingStreet"]),
      city: get(["city", "mailingCity", "billingCity", "town", "locality"]),
      postal: get(["postalCode", "zip", "zipCode", "mailingPostalCode", "postcode"]),
      state: get(["state", "canton", "province", "region", "mailingState"]),
      country: normCountry(get(["country", "mailingCountry", "billingCountry", "countryCode"])),
      relationship: isSpouse ? "spouse" : "",
      riskTolerance: normRisk(get(["riskProfile", "riskTolerance", "risk", "investorProfile"])),
      timeHorizon: normHorizon(get(["timeHorizon", "horizon", "investmentHorizon"])),
    };
    out.household.push(person);

    const income = parseFeedNumber(get(["annualIncome", "income", "salary", "grossIncome"]));
    if (income != null && income > 0) {
      out.income.push({ _ok: 0.8, _src: `CRM · ${srcLabel} · annual income`, who, primary: income, secondary: null, raisePct: null });
    }
  }
  return out;
}

// ─── ISO 20022 camt.052 / camt.053 / camt.054 ─────────────────────
// Takes the closing booked balance per statement account. CLBD is the
// canonical "end of statement" figure; CLAV/PRCD/ITBD are fallbacks for
// issuers that omit it. CdtDbtInd decides asset vs liability.
const BALANCE_PREFERENCE = ["CLBD", "CLAV", "PRCD", "ITBD"];

export function fromCamt(text: string, srcLabel: string, defaultCountry = "CH"): FeedEnvelope {
  const out = emptyEnvelope();
  const doc = new XMLParser(text).parse();
  if (!doc) throw new FeedFormatError("camt payload is not well-formed XML");

  const statements = [
    ...doc.find("Stmt"), ...doc.find("Rpt"), ...doc.find("Ntfctn"),
  ];
  if (!statements.length) {
    throw new FeedFormatError("camt payload contains no Stmt/Rpt/Ntfctn statement");
  }

  let skipped = 0;
  statements.forEach((st, si) => {
    const acct = st.first("Acct");
    const iban = acct?.first("IBAN")?.text() || acct?.first("Othr")?.first("Id")?.text() || "";
    // The account's OWN name only. Acct/Ownr/Nm is the account HOLDER, which
    // is identical for every account in a statement — using it made all of a
    // client's accounts share one label, so they collapsed onto a single plan
    // record and overwrote each other on the next sync.
    const name = acct?.first("Nm")?.text() || "";
    const acctCcy = acct?.first("Ccy")?.text() || "";

    // Balances are DIRECT children of the statement; a <Bal> nested deeper
    // (inside an entry, say) is not this account's balance.
    const balances = st.kids("Bal");
    let amount: number | null = null;
    let usedCode = "";
    let balCcy = "";
    for (const code of BALANCE_PREFERENCE) {
      for (const bal of balances) {
        const tp = bal.kid("Tp")?.first("Cd")?.text().trim().toUpperCase();
        if (tp !== code) continue;
        // Direct child only: <Bal><CdtLine><Amt> is an overdraft LIMIT, and
        // reading it as the balance imported a credit facility as cash.
        const amtEl = bal.kid("Amt");
        if (!amtEl) continue;
        const v = parseFeedNumber(amtEl.text());
        if (v == null) continue;
        const ind = bal.kid("CdtDbtInd")?.text() || "";
        // CdtDbtInd carries the sign; the amount itself is unsigned in ISO
        // 20022. Taking abs() first stops a negative <Amt> with DBIT from
        // double-negating into a positive "asset".
        amount = /DBIT/i.test(ind) ? -Math.abs(v) : Math.abs(v);
        balCcy = amtEl.attr("Ccy") || "";
        usedCode = code;
        break;
      }
      if (amount != null) break;
    }
    if (amount == null) { skipped++; return; }

    // The balance's own currency wins over the account's declared one.
    const ccy = balCcy || acctCcy;
    const label = name || (iban ? `Account ${iban.slice(-6)}` : `Account ${si + 1}`);
    const src = `ISO 20022 camt · ${srcLabel} · ${usedCode}${iban ? ` · ${iban}` : ""}`;
    if (amount < 0) {
      out.liabilities.push({
        _ok: 0.85, _src: src, type: "other",
        label, balance: Math.abs(amount), ratePct: null, years: null,
        // Stable identity so a later credit balance can find and clear this
        // record instead of stranding it (see apply.ts liability matching).
        accountRef: iban || label,
      });
    } else {
      out.assets.push({
        _ok: 0.9, _src: src, label,
        // Pass the account's real name as the type hint so downstream
        // classification can see "Freizügigkeitskonto"/"Privatkonto" and set
        // liquidity and asset class correctly. A hardcoded "Bank account"
        // made every account liquid and "mixed".
        accountTypeHint: name || "Bank account",
        value: amount, country: defaultCountry, ccy: ccy || undefined,
        propertyValue: null, otherValue: null,
        accountRef: iban || label,
      });
    }
  });

  if (!out.assets.length && !out.liabilities.length) {
    throw new FeedFormatError(
      `camt payload had ${statements.length} statement(s) but no usable closing balance ` +
      `(looked for ${BALANCE_PREFERENCE.join("/")}). ${skipped} statement(s) skipped.`
    );
  }
  return out;
}

// ─── OFX / QFX ────────────────────────────────────────────────────
function ofxTag(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}>([^<\r\n]*)`, "i"));
  return m ? m[1].trim() : "";
}

/** Split an OFX document into its per-account response blocks. */
function ofxStatements(text: string): Array<{ kind: "inv" | "bank" | "cc"; body: string }> {
  const out: Array<{ kind: "inv" | "bank" | "cc"; body: string }> = [];
  const grab = (tag: string, kind: "inv" | "bank" | "cc") => {
    // SGML OFX often omits closing tags; fall back to "until the next
    // statement opener or end of document".
    const re = new RegExp(`<${tag}>([\\s\\S]*?)(?:<\\/${tag}>|(?=<(?:INVSTMTRS|STMTRS|CCSTMTRS)>)|$)`, "gi");
    for (const m of text.matchAll(re)) out.push({ kind, body: m[1] });
  };
  grab("INVSTMTRS", "inv");
  grab("STMTRS", "bank");
  grab("CCSTMTRS", "cc");
  return out;
}

export function fromOfx(text: string, srcLabel: string, defaultCountry = "US"): FeedEnvelope {
  const out = emptyEnvelope();

  // Securities master is document-wide and shared by every account.
  const secs: Record<string, { name: string; tkr: string }> = {};
  for (const m of text.matchAll(/<SECINFO>([\s\S]*?)<\/SECINFO>/gi)) {
    const b = m[1];
    const uid = ofxTag(b, "UNIQUEID");
    if (uid) secs[uid] = { name: ofxTag(b, "SECNAME"), tkr: ofxTag(b, "TICKER") };
  }

  const POS: Record<string, string> = { POSSTOCK: "stock", POSMF: "mutual_fund", POSBOND: "bond", POSOPT: "alternative", POSOTHER: "alternative" };
  const docCcy = ofxTag(text, "CURDEF") || undefined;

  // Each account is processed on its OWN block. Reading AVAILCASH/LEDGERBAL/
  // ACCTTYPE from the whole document only ever saw the FIRST occurrence, so
  // every account after the first lost its cash, and a combined bank+card
  // download booked the checking balance as credit-card debt.
  const statements = ofxStatements(text);
  const blocks = statements.length ? statements : [{ kind: "bank" as const, body: text }];

  for (const [i, st] of blocks.entries()) {
    const body = st.body;
    const ccy = ofxTag(body, "CURDEF") || docCcy;
    const acctId = ofxTag(body, "ACCTID");
    const ref = acctId || `${st.kind}-${i + 1}`;
    const suffix = acctId ? ` ${acctId.slice(-4)}` : blocks.length > 1 ? ` ${i + 1}` : "";

    if (st.kind === "inv") {
      for (const tag of Object.keys(POS)) {
        for (const m of body.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "gi"))) {
          const b = m[1];
          const uid = ofxTag(b, "UNIQUEID");
          const mkt = parseFeedNumber(ofxTag(b, "MKTVAL"));
          const units = parseFeedNumber(ofxTag(b, "UNITS"));
          const price = parseFeedNumber(ofxTag(b, "UNITPRICE"));
          const val = mkt ?? (units != null && price != null ? units * price : null);
          if (val == null || !Number.isFinite(val) || val === 0) continue;
          const info = secs[uid] || { name: "", tkr: "" };
          const type = POS[tag];
          const name = info.name || info.tkr || uid || "Position";
          // A short position / negative market value is a liability, not a
          // negative asset (which the plan schema rejects outright).
          if (val < 0) {
            out.liabilities.push({
              _ok: 0.7, _src: `OFX ${tag} short${uid ? ` ${uid}` : ""} · ${srcLabel}`,
              type: "other", label: `${name} (short)`, balance: Math.abs(val),
              ratePct: null, years: null, accountRef: ref,
            });
            continue;
          }
          out.holdings.push({
            _ok: mkt != null ? 0.9 : 0.6,
            _src: `OFX ${tag}${uid ? ` ${uid}` : ""} · ${srcLabel}`,
            name,
            tkr: info.tkr || (uid && uid.length <= 6 ? uid : ""),
            val, type,
            cls: type === "bond" ? "fixed_income" : type === "stock" || type === "mutual_fund" ? "equity" : "alternative",
            region: "other", er: null, yld: null, note: "",
          });
        }
      }
      const cash = parseFeedNumber(ofxTag(body, "AVAILCASH"));
      if (cash != null && cash > 0) {
        out.assets.push({
          _ok: 0.9, _src: `OFX INVBAL AVAILCASH · ${srcLabel}`,
          label: `Brokerage cash${suffix}`, accountTypeHint: "Brokerage cash",
          value: cash, country: defaultCountry, ccy, propertyValue: null, otherValue: null,
          accountRef: ref,
        });
      }
      continue;
    }

    const ledgerIdx = body.search(/<LEDGERBAL>/i);
    const ledger = ledgerIdx >= 0 ? parseFeedNumber(ofxTag(body.slice(ledgerIdx, ledgerIdx + 300), "BALAMT")) : null;
    if (ledger == null) continue;

    if (st.kind === "cc") {
      // Card balances are conventionally reported negative when money is owed.
      if (Math.abs(ledger) > 0) {
        out.liabilities.push({
          _ok: 0.8, _src: `OFX CCSTMTRS balance · ${srcLabel}`,
          type: "cc", label: `Credit card${suffix}`, balance: Math.abs(ledger),
          ratePct: null, years: null, accountRef: ref,
        });
      }
      continue;
    }

    const at = (ofxTag(body, "ACCTTYPE") || "CHECKING").toUpperCase();
    const label = `${at.charAt(0)}${at.slice(1).toLowerCase()} account${suffix}`;
    if (ledger < 0) {
      out.liabilities.push({
        _ok: 0.8, _src: `OFX LEDGERBAL (${at}) overdrawn · ${srcLabel}`,
        type: "other", label, balance: Math.abs(ledger), ratePct: null, years: null, accountRef: ref,
      });
    } else if (ledger > 0) {
      out.assets.push({
        _ok: 0.9, _src: `OFX LEDGERBAL (${at}) · ${srcLabel}`,
        label, accountTypeHint: at, value: ledger,
        country: defaultCountry, ccy, propertyValue: null, otherValue: null, accountRef: ref,
      });
    }
  }
  return out;
}

// ─── CSV ──────────────────────────────────────────────────────────
// Server-side there is no interactive mapping step, so columns are
// matched by header name. Unmatched files fail loudly rather than
// guessing positionally and inventing numbers.
/**
 * Tokenize an ENTIRE CSV document, honouring quoted fields that contain the
 * delimiter, CR/LF, or escaped quotes. Splitting on newlines first (the old
 * approach) silently destroyed any row with a quoted multi-line description —
 * a common shape in custodian exports.
 */
function parseCsvRows(text: string, delim: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cur = "";
  let inQuotes = false;
  const src = text.replace(/^﻿/, "");   // strip BOM

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += ch;
      continue;
    }
    if (ch === '"') { inQuotes = true; continue; }
    if (ch === delim) { row.push(cur); cur = ""; continue; }
    if (ch === "\r") { if (src[i + 1] === "\n") i++; row.push(cur); rows.push(row); row = []; cur = ""; continue; }
    if (ch === "\n") { row.push(cur); rows.push(row); row = []; cur = ""; continue; }
    cur += ch;
  }
  row.push(cur);
  rows.push(row);
  return rows
    .map((r) => r.map((c) => c.trim()))
    .filter((r) => r.some((c) => c !== ""));
}

/** Pick the delimiter by consistency across rows, not just the header. */
function detectDelimiter(text: string): string {
  const sample = text.replace(/^﻿/, "").split(/\r?\n/).filter((l) => l.trim()).slice(0, 10);
  let best = ",", bestScore = -1;
  for (const d of [";", ",", "\t", "|"]) {
    const counts = sample.map((l) => (l.match(new RegExp(`\\${d}`, "g")) || []).length);
    if (!counts.length || counts[0] === 0) continue;
    const consistent = counts.filter((c) => c === counts[0]).length / counts.length;
    const score = counts[0] * consistent;
    if (score > bestScore) { bestScore = score; best = d; }
  }
  return best;
}

// Header tokens that must NEVER be taken for a money column. "Value date"
// (Valuta/Valutadatum) appears in virtually every European bank export, and
// substring-matching "value" against it made the relay import the DATE as the
// amount — 2026-08-31 arrived as 20,260,831.
const NON_MONEY_HEADER = /(date|datum|valuta|zeit|time|jahr|year|isin|cusip|valor|symbol|ticker|waehrung|währung|currency|ccy|anzahl|quantity|units|shares|stück|stueck)/;

export function fromCsv(text: string, srcLabel: string, defaultCountry = "US"): FeedEnvelope {
  const out = emptyEnvelope();
  const delim = detectDelimiter(text);
  const rows = parseCsvRows(text, delim);
  if (rows.length < 2) return out;

  const headers = rows[0].map((h) => h.toLowerCase().replace(/[\s_\-.]/g, ""));
  const dataRows = rows.slice(1);

  /**
   * Resolve a column: exact match first across all candidates, then prefix,
   * then substring — and never a column whose header is a date/identifier.
   */
  const col = (names: string[], opts: { money?: boolean } = {}) => {
    const eligible = (i: number) => !(opts.money && NON_MONEY_HEADER.test(headers[i]));
    for (const pass of ["exact", "prefix", "includes"] as const) {
      for (const n of names) {
        const i = headers.findIndex((h, idx) =>
          eligible(idx) && (pass === "exact" ? h === n : pass === "prefix" ? h.startsWith(n) : h.includes(n))
        );
        if (i >= 0) return i;
      }
    }
    return -1;
  };

  const cName = col(["name", "security", "bezeichnung", "description", "beschreibung", "instrument", "position", "holding", "titel", "wertpapier", "fund"]);
  const cTkr = col(["ticker", "symbol", "isin", "cusip", "valor"]);
  const cVal = col(["marketvalue", "marktwert", "value", "amount", "betrag", "balance", "saldo", "wert", "gegenwert"], { money: true });
  const cQty = col(["quantity", "anzahl", "units", "shares", "qty", "stück", "stueck", "nominal"]);
  const cPrice = col(["price", "kurs", "unitprice", "preis"]);
  const cCcy = col(["currency", "ccy", "waehrung", "währung", "whg"]);
  const cAcct = col(["account", "konto", "portfolio", "depot", "iban"]);

  if (cVal < 0 && (cQty < 0 || cPrice < 0)) {
    throw new FeedFormatError(
      `CSV has no recognizable value column (headers: ${rows[0].join(", ")}) — expected something like ` +
      `'Market Value', 'Marktwert', 'Betrag', 'Saldo', or 'Quantity' + 'Price'`
    );
  }
  // Rows describe securities when there is a name column; otherwise they are
  // account balances. A file with BOTH an account column and no name column
  // used to label every security by its portfolio id, discarding the
  // instrument names entirely — now that only happens when there is genuinely
  // no name-like column at all.
  const accountsOnly = cName < 0 && cAcct >= 0;
  if (cName < 0 && cAcct < 0) {
    throw new FeedFormatError(
      `CSV has a value column but no name or account column (headers: ${rows[0].join(", ")}) — ` +
      `cannot tell what each row refers to`
    );
  }

  // Infer the file's decimal convention once, from the money-ish cells, so
  // "250.000" is read the way this particular custodian meant it.
  const decimal = inferDecimalMark(dataRows, [cVal, cPrice].filter((i) => i >= 0));

  for (const cells of dataRows) {
    const at = (i: number) => (i >= 0 && i < cells.length ? cells[i] : "");
    let value = parseFeedNumber(at(cVal), { decimal });
    if (value == null) {
      const q = parseFeedNumber(at(cQty), { decimal });
      const p = parseFeedNumber(at(cPrice), { decimal });
      if (q != null && p != null) value = q * p;
    }
    if (value == null || !Number.isFinite(value)) continue;

    const label = at(cName) || at(cAcct);
    if (!label) continue;
    const ccy = at(cCcy) || undefined;
    const src = `CSV · ${srcLabel}`;

    // A negative balance is a debt, not a negative asset. Emitting it as an
    // asset made the whole merge fail Zod validation (assets must be >= 0)
    // with an error naming no row, so the advisor could not act on it.
    if (value < 0) {
      out.liabilities.push({
        _ok: 0.8, _src: src, type: "other", label,
        balance: Math.abs(value), ratePct: null, years: null,
        accountRef: at(cAcct) || label,
      });
      continue;
    }
    if (accountsOnly) {
      out.assets.push({
        _ok: 0.85, _src: src, label, accountTypeHint: label,
        value, country: defaultCountry, ccy, propertyValue: null, otherValue: null,
        accountRef: at(cAcct) || label,
      });
    } else {
      out.holdings.push({
        _ok: 0.85, _src: src, name: label, tkr: at(cTkr), val: value,
        type: "etf", cls: "equity", region: "other", er: null, yld: null, note: "",
      });
    }
  }
  return out;
}

/**
 * Decide whether this file writes decimals with "." or ",". Looks for an
 * unambiguous witness (a value carrying BOTH separators, or one whose lone
 * separator is followed by other than 3 digits) and returns undefined when
 * the file gives no evidence either way.
 */
function inferDecimalMark(rows: string[][], cols: number[]): "." | "," | undefined {
  let dot = 0, comma = 0;
  for (const cells of rows) {
    for (const i of cols) {
      const raw = (i >= 0 && i < cells.length ? cells[i] : "").replace(/[\s   '’]/g, "");
      if (!/\d/.test(raw)) continue;
      const lc = raw.lastIndexOf(","), ld = raw.lastIndexOf(".");
      if (lc >= 0 && ld >= 0) { if (lc > ld) comma++; else dot++; continue; }
      if (lc >= 0 && raw.length - lc - 1 !== 3) comma++;
      else if (ld >= 0 && raw.length - ld - 1 !== 3) dot++;
    }
  }
  if (dot > comma) return ".";
  if (comma > dot) return ",";
  return undefined;
}

// ─── Dispatch ─────────────────────────────────────────────────────
export function adaptFeed(
  text: string,
  format: FeedFormat,
  srcLabel: string,
  opts: { contentType?: string; defaultCountry?: string } = {}
): { envelope: FeedEnvelope; format: Exclude<FeedFormat, "auto"> } {
  const country = opts.defaultCountry || "CH";
  const resolved = format && format !== "auto" ? format : detectFormat(text, opts.contentType);
  if (resolved === "unknown") {
    throw new FeedFormatError("could not recognize the payload format — set the format explicitly on the connection");
  }
  switch (resolved) {
    case "wa":
    case "crm": {
      let parsed: unknown;
      try { parsed = JSON.parse(text); }
      catch (e) { throw new FeedFormatError(`payload is not valid JSON — ${e instanceof Error ? e.message : String(e)}`); }
      return { envelope: resolved === "wa" ? fromWaJson(parsed, srcLabel) : fromCrmJson(parsed, srcLabel), format: resolved };
    }
    case "camt": return { envelope: fromCamt(text, srcLabel, country), format: "camt" };
    case "ofx":  return { envelope: fromOfx(text, srcLabel, country), format: "ofx" };
    case "csv":  return { envelope: fromCsv(text, srcLabel, country), format: "csv" };
  }
}

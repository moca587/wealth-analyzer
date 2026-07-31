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
  if (/<Document[^>]*camt\.|<BkToCstmrStmt|<BkToCstmrAcctRpt|<BkToCstmrDbtCdtNtfctn/i.test(head)) return "camt";
  if (/<OFX>/i.test(head) || /^\s*OFXHEADER:/im.test(head) || /<\?OFX/i.test(head)) return "ofx";
  if (ct.includes("csv") || /[,;\t|].*\n/.test(head)) return "csv";
  return "unknown";
}

// ─── wa.feed/v1 (native) ──────────────────────────────────────────
const NUMERIC_KEYS = ["value", "val", "balance", "propertyValue", "otherValue", "amt", "primary", "secondary", "er", "yld", "ratePct", "years"];

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
  for (const [idx, raw] of rows.slice(0, 2).entries()) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) continue;
    const get = picker(raw as Record<string, unknown>);
    const first = get(["firstName", "first", "givenName", "forename"]);
    const last = get(["lastName", "last", "familyName", "surname"]);
    if (!first && !last) continue;

    const rel = get(["relationship", "role", "contactType", "householdRole"]).toLowerCase();
    const isSpouse = idx > 0 || /spouse|partner|husband|wife|ehepartner|conjoint/.test(rel);
    const who = isSpouse ? "client2" : "client1";
    const src = `CRM · ${srcLabel} · ${isSpouse ? "client 2" : "client 1"}`;

    const person: FeedHousehold = {
      _ok: 0.9, _src: src,
      role: who,
      first, last,
      dob: get(["dateOfBirth", "birthDate", "dob", "birthdate"]).slice(0, 10),
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
  statements.forEach((st, si) => {
    const acct = st.first("Acct");
    const iban = acct?.first("IBAN")?.text() || acct?.first("Othr")?.first("Id")?.text() || "";
    const name = acct?.first("Nm")?.text() || "";
    const owner = acct?.first("Ownr")?.first("Nm")?.text() || "";
    let ccy = acct?.first("Ccy")?.text() || "";

    let amount: number | null = null;
    let usedCode = "";
    for (const code of BALANCE_PREFERENCE) {
      for (const bal of st.find("Bal")) {
        if (bal.first("Cd")?.text().trim().toUpperCase() !== code) continue;
        const amtEl = bal.first("Amt");
        if (!amtEl) continue;
        const v = parseFeedNumber(amtEl.text());
        if (v == null) continue;
        const ind = bal.first("CdtDbtInd")?.text() || "";
        amount = /DBIT/i.test(ind) ? -v : v;
        if (!ccy) ccy = amtEl.attr("Ccy") || "";
        usedCode = code;
        break;
      }
      if (amount != null) break;
    }
    if (amount == null) return;

    const label = name || owner || (iban ? `Account ${iban.slice(-6)}` : `Account ${si + 1}`);
    const src = `ISO 20022 camt · ${srcLabel} · ${usedCode}${iban ? ` · ${iban}` : ""}`;
    if (amount < 0) {
      out.liabilities.push({ _ok: 0.85, _src: src, type: "other", label: `${label} (overdrawn)`, balance: Math.abs(amount), ratePct: null, years: null });
    } else {
      out.assets.push({ _ok: 0.9, _src: src, label, accountTypeHint: "Bank account", value: amount, country: defaultCountry, ccy: ccy || undefined, propertyValue: null, otherValue: null });
    }
  });
  return out;
}

// ─── OFX / QFX ────────────────────────────────────────────────────
function ofxTag(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}>([^<\r\n]*)`, "i"));
  return m ? m[1].trim() : "";
}

export function fromOfx(text: string, srcLabel: string, defaultCountry = "US"): FeedEnvelope {
  const out = emptyEnvelope();
  const ccy = ofxTag(text, "CURDEF") || undefined;

  // Securities master: <SECINFO> blocks keyed by unique id.
  const secs: Record<string, { name: string; tkr: string }> = {};
  for (const m of text.matchAll(/<SECINFO>([\s\S]*?)<\/SECINFO>/gi)) {
    const b = m[1];
    const uid = ofxTag(b, "UNIQUEID");
    if (uid) secs[uid] = { name: ofxTag(b, "SECNAME"), tkr: ofxTag(b, "TICKER") };
  }

  const POS: Record<string, string> = { POSSTOCK: "stock", POSMF: "mutual_fund", POSBOND: "bond", POSOPT: "alternative", POSOTHER: "alternative" };
  for (const tag of Object.keys(POS)) {
    for (const m of text.matchAll(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`, "gi"))) {
      const b = m[1];
      const uid = ofxTag(b, "UNIQUEID");
      const mkt = parseFeedNumber(ofxTag(b, "MKTVAL"));
      const units = parseFeedNumber(ofxTag(b, "UNITS"));
      const price = parseFeedNumber(ofxTag(b, "UNITPRICE"));
      const val = mkt ?? (units != null && price != null ? units * price : null);
      if (val == null || !(val > 0)) continue;
      const info = secs[uid] || { name: "", tkr: "" };
      const type = POS[tag];
      out.holdings.push({
        _ok: mkt != null ? 0.9 : 0.6,
        _src: `OFX ${tag}${uid ? ` ${uid}` : ""} · ${srcLabel}`,
        name: info.name || info.tkr || uid || "Position",
        tkr: info.tkr || (uid && uid.length <= 6 ? uid : ""),
        val, type,
        cls: type === "bond" ? "fixed_income" : type === "stock" || type === "mutual_fund" ? "equity" : "alternative",
        region: "other", er: null, yld: null, note: "",
      });
    }
  }

  const cash = parseFeedNumber(ofxTag(text, "AVAILCASH"));
  if (cash != null && cash > 0) {
    out.assets.push({ _ok: 0.9, _src: `OFX INVBAL AVAILCASH · ${srcLabel}`, label: "Brokerage cash", accountTypeHint: "Brokerage cash", value: cash, country: defaultCountry, ccy, propertyValue: null, otherValue: null });
  }

  const isInv = /<INVSTMTRS>|<INVACCTFROM>|<POSSTOCK>|<POSMF>/i.test(text);
  const isCC = /<CCSTMTRS>|<CCACCTFROM>/i.test(text);
  const isBank = /<STMTRS>|<BANKACCTFROM>/i.test(text);
  const ledgerIdx = text.search(/<LEDGERBAL>/i);
  const ledger = ledgerIdx >= 0 ? parseFeedNumber(ofxTag(text.slice(ledgerIdx, ledgerIdx + 300), "BALAMT")) : null;
  if (isCC && ledger != null && Math.abs(ledger) > 0) {
    out.liabilities.push({ _ok: 0.8, _src: `OFX CCSTMTRS balance · ${srcLabel}`, type: "cc", label: "Credit card", balance: Math.abs(ledger), ratePct: null, years: null });
  } else if (isBank && !isInv && ledger != null && ledger > 0) {
    const at = (ofxTag(text, "ACCTTYPE") || "CHECKING").toUpperCase();
    out.assets.push({ _ok: 0.9, _src: `OFX LEDGERBAL (${at}) · ${srcLabel}`, label: `${at.charAt(0)}${at.slice(1).toLowerCase()} account`, accountTypeHint: at, value: ledger, country: defaultCountry, ccy, propertyValue: null, otherValue: null });
  }
  return out;
}

// ─── CSV ──────────────────────────────────────────────────────────
// Server-side there is no interactive mapping step, so columns are
// matched by header name. Unmatched files fail loudly rather than
// guessing positionally and inventing numbers.
function splitCsvLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "", inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else inQuotes = false; }
      else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === delim) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export function fromCsv(text: string, srcLabel: string, defaultCountry = "US"): FeedEnvelope {
  const out = emptyEnvelope();
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (!lines.length) return out;

  const delim = [",", ";", "\t", "|"]
    .map((d) => ({ d, n: (lines[0].match(new RegExp(`\\${d}`, "g")) || []).length }))
    .sort((a, b) => b.n - a.n)[0].d;

  const headers = splitCsvLine(lines[0], delim).map((h) => h.toLowerCase().replace(/[\s_\-.]/g, ""));
  const col = (...names: string[]) => {
    for (const n of names) {
      const i = headers.findIndex((h) => h === n || h.includes(n));
      if (i >= 0) return i;
    }
    return -1;
  };
  const cName = col("name", "security", "description", "instrument", "position", "holding");
  const cTkr = col("ticker", "symbol", "isin", "cusip", "valor");
  const cVal = col("marketvalue", "value", "amount", "balance", "marktwert");
  const cQty = col("quantity", "units", "shares", "qty");
  const cPrice = col("price", "unitprice", "kurs");
  const cCcy = col("currency", "ccy", "waehrung");
  const cAcct = col("account", "konto", "portfolio");

  if (cVal < 0 && (cQty < 0 || cPrice < 0)) {
    throw new FeedFormatError(
      "CSV has no recognizable value column — expected a header like 'Market Value', 'Value', 'Amount' or 'Quantity' + 'Price'"
    );
  }
  const accountsOnly = cName < 0 && cAcct >= 0;

  for (const line of lines.slice(1)) {
    const cells = splitCsvLine(line, delim);
    if (!cells.some((c) => c)) continue;
    const at = (i: number) => (i >= 0 && i < cells.length ? cells[i] : "");
    let value = parseFeedNumber(at(cVal));
    if (value == null) {
      const q = parseFeedNumber(at(cQty)), p = parseFeedNumber(at(cPrice));
      if (q != null && p != null) value = q * p;
    }
    if (value == null || !Number.isFinite(value) || value === 0) continue;

    const label = at(cName) || at(cAcct);
    if (!label) continue;
    const ccy = at(cCcy) || undefined;

    if (accountsOnly) {
      out.assets.push({ _ok: 0.85, _src: `CSV · ${srcLabel}`, label, accountTypeHint: "Account", value, country: defaultCountry, ccy, propertyValue: null, otherValue: null });
    } else {
      out.holdings.push({ _ok: 0.85, _src: `CSV · ${srcLabel}`, name: label, tkr: at(cTkr), val: value, type: "etf", cls: "equity", region: "other", er: null, yld: null, note: "" });
    }
  }
  return out;
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

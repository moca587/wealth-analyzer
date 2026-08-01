// ─────────────────────────────────────────────────────────────────
// Security identifiers: ISIN, CUSIP, and the relationship between them.
//
// All of this is OFFLINE and deterministic. That matters: an order line's
// identity is the one thing a custodian books on, and a network lookup
// that silently returns the wrong instrument is worse than no lookup at
// all. Everything here is arithmetic that can be verified against a
// published check digit.
//
// The useful fact: for US and Canadian securities an ISIN is just the
// country code + the 9-character CUSIP + an ISIN check digit. So a CUSIP
// yields its ISIN with no API call, and a US/CA ISIN yields its CUSIP by
// slicing. Only CUSIP → *ticker* needs a reference service, because
// tickers are exchange-scoped and not derivable.
// ─────────────────────────────────────────────────────────────────

/** Character values for the CUSIP scheme: 0-9, A=10..Z=35, then *, @, #. */
function cusipCharValue(c: string): number | null {
  if (c >= "0" && c <= "9") return c.charCodeAt(0) - 48;
  if (c >= "A" && c <= "Z") return c.charCodeAt(0) - 55;
  if (c === "*") return 36;
  if (c === "@") return 37;
  if (c === "#") return 38;
  return null;
}

/**
 * The 9th character of a CUSIP, computed from the first 8.
 * Modulus-10 "double every second" over the character values, summing the
 * DIGITS of each product (so 14 contributes 1+4, not 5).
 */
export function cusipCheckDigit(first8: string): number | null {
  const s = (first8 || "").toUpperCase();
  if (s.length !== 8) return null;
  let total = 0;
  for (let i = 0; i < 8; i++) {
    const v = cusipCharValue(s[i]);
    if (v === null) return null;
    const d = i % 2 === 1 ? v * 2 : v;      // 2nd, 4th, 6th, 8th are doubled
    total += Math.floor(d / 10) + (d % 10);
  }
  return (10 - (total % 10)) % 10;
}

/** True for a well-formed 9-character CUSIP whose check digit agrees. */
export function isValidCusip(cusip: string): boolean {
  const s = normalizeCusip(cusip);
  if (!/^[0-9A-Z*@#]{8}[0-9]$/.test(s)) return false;
  return cusipCheckDigit(s.slice(0, 8)) === Number(s[8]);
}

/** Trim, uppercase, strip separators an advisor might paste. */
export function normalizeCusip(cusip: string): string {
  return String(cusip || "").trim().toUpperCase().replace(/[\s-]/g, "");
}

/** ISIN check digit (ISO 6166) over a country code + 9-char national number. */
export function isinCheckDigit(body: string): number | null {
  const s = (body || "").toUpperCase();
  if (!/^[A-Z]{2}[A-Z0-9]{9}$/.test(s)) return null;
  const expanded = s
    .split("")
    .map((c) => (/[A-Z]/.test(c) ? String(c.charCodeAt(0) - 55) : c))
    .join("");
  let sum = 0;
  let dbl = true;                          // the RIGHTMOST digit is doubled
  for (let i = expanded.length - 1; i >= 0; i--) {
    let d = expanded.charCodeAt(i) - 48;
    if (dbl) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    dbl = !dbl;
  }
  return (10 - (sum % 10)) % 10;
}

/** Full ISIN validation, including the check digit. */
export function isValidIsin(isin: string): boolean {
  const s = String(isin || "").trim().toUpperCase();
  if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(s)) return false;
  return isinCheckDigit(s.slice(0, 11)) === Number(s[11]);
}

/**
 * Derive the ISIN for a CUSIP. Deterministic — no network.
 *
 * `country` is "US" by default because CUSIPs are administered for US and
 * Canadian issuers; a Canadian issue must be passed "CA" explicitly, since
 * nothing in the CUSIP itself distinguishes the two. Getting that wrong
 * produces a valid-looking ISIN for a different security, so this never
 * guesses: the caller states the country or accepts the US default.
 */
export function cusipToIsin(cusip: string, country: "US" | "CA" = "US"): string | null {
  const s = normalizeCusip(cusip);
  if (!isValidCusip(s)) return null;
  const check = isinCheckDigit(country + s);
  return check === null ? null : `${country}${s}${check}`;
}

/** Pull the CUSIP back out of a US/CA ISIN. Null for any other jurisdiction. */
export function isinToCusip(isin: string): string | null {
  const s = String(isin || "").trim().toUpperCase();
  if (!isValidIsin(s)) return null;
  if (s.slice(0, 2) !== "US" && s.slice(0, 2) !== "CA") return null;
  const cusip = s.slice(2, 11);
  return isValidCusip(cusip) ? cusip : null;
}

export interface IdentifierAgreement {
  ok: boolean;
  /** Set when the two identifiers describe DIFFERENT securities. */
  conflict?: string;
  /** The ISIN implied by the CUSIP, when one could be derived. */
  derivedIsin?: string;
}

/**
 * Cross-check a CUSIP against an ISIN when an advisor supplies both.
 *
 * This is the highest-value check in the file. Two identifiers typed on the
 * same row that denote different securities is a data-entry error the
 * custodian cannot catch — it would simply book whichever one the wire
 * format carries. Both being individually valid is not enough; they must
 * agree with each other.
 *
 * A non-US/CA ISIN alongside a CUSIP is NOT a conflict: a US-domiciled
 * issue can be cross-listed, and the CUSIP-derived ISIN legitimately
 * differs from, say, its Irish-domiciled line. That case is left alone
 * rather than flagged, because a false alarm here trains people to click
 * through the real one.
 */
export function checkIdentifierAgreement(cusip: string, isin: string): IdentifierAgreement {
  const c = normalizeCusip(cusip);
  const i = String(isin || "").trim().toUpperCase();
  if (!c || !i) return { ok: true };
  if (!isValidCusip(c) || !isValidIsin(i)) return { ok: true };   // shape errors reported elsewhere

  const cc = i.slice(0, 2);
  if (cc !== "US" && cc !== "CA") return { ok: true };            // cross-listing, see above

  const derived = cusipToIsin(c, cc as "US" | "CA");
  if (derived && derived !== i) {
    return {
      ok: false,
      derivedIsin: derived,
      conflict: `CUSIP ${c} corresponds to ISIN ${derived}, but the ISIN entered is ${i}. ` +
                `These are different securities — check which one is correct.`,
    };
  }
  return { ok: true, derivedIsin: derived ?? undefined };
}

// ─────────────────────────────────────────────────────────────────
// The Investment Proposal → an order ticket.
//
// An advisor builds a proposal: a set of positions, each a percentage of
// a target amount. Pressing BUY turns it into a `wa.order/v1` ticket and
// POSTs it to /api/orders/<connectionId>, where the hardened relay
// re-validates it (checkTicket), enforces idempotency in Postgres, and
// forwards it to the PM/OMS as a STAGE-only instruction.
//
// This module is the pure part — proposal in, ticket + a list of problems
// out — and it is the SaaS twin of `ordBuildTicket` in wealth-analyzer.html.
// It deliberately does NOT talk to the network or the database; the route
// is the only thing that sends, and the server is the gate. Every rule
// here is advisory-facing ("this weight sums to 96%"), NOT a security
// boundary — checkTicket on the server is that.
//
// The one invariant that is load-bearing: `amount` is authoritative, not
// `weightPct`. The amounts are what a human confirms and what the OMS
// books; the weights are recorded for the audit trail. So the amounts are
// computed once, rounded to the minor unit, and the LAST line absorbs the
// rounding residue — otherwise a 3-way split of CHF 100,000 sends
// CHF 99,999.99 and the total-vs-lines check the server runs rejects it.
// ─────────────────────────────────────────────────────────────────

import {
  ORDER_SCHEMA,
  round2,
  sumLines,
  ticketFingerprint,
  type OrderTicket,
  type OrderLine,
} from "./model";
import {
  isValidIsin,
  isValidCusip,
  isValidValorFormat,
  checkIdentifierAgreement,
  checkValorAgreement,
} from "./identifiers";

/** A single line an advisor is proposing to buy. */
export interface ProposalPosition {
  /** Local id for the editor; never sent. */
  id: string;
  name: string;
  isin?: string;
  cusip?: string;
  valor?: string;
  ticker?: string;
  vehicle?: string;

  region?: string;

  cls?: string;
  /** Percent of the target amount, 0–100. */
  weightPct: number;

  expectedReturn?: number;
  er?: number;
  yld?: number;

  note?: string;
}

export interface Proposal {
  positions: ProposalPosition[];
  /** The total cash to deploy, in the account currency. */
  targetAmount: number;
  currency: string;
  clientName?: string;

  clientId?: string;

  advisor?: string;
  objective?: string;

  investmentThesis?: string;

  feeType?: "none" | "aum" | "flat";
  feeRate?: number;
}

export interface ProposalProblem {
  /** null → a whole-proposal problem (e.g. weights don't sum to 100). */
  positionId: string | null;
  /**
   * error   → the ticket must not be built / sent.
   * warning → sendable, but the advisor should look (e.g. no identifier,
   *           only a ticker, which many custodians won't resolve).
   */
  level: "error" | "warning";
  message: string;
}

const cleanId = (s: string | undefined) => (s || "").trim().toUpperCase();

/**
 * Check a proposal. Returns problems ONLY — never throws, never mutates.
 * The UI shows these; the ticket is built separately so a warning-only
 * proposal can still be sent.
 */
export function checkProposal(p: Proposal): ProposalProblem[] {
  const out: ProposalProblem[] = [];

  if (!p.positions.length) {
    out.push({
      positionId: null,
      level: "error",
      message: "Add at least one position.",
    });
  }

  if (!(p.targetAmount > 0)) {
    out.push({
      positionId: null,
      level: "error",
      message: "Set a target amount greater than zero.",
    });
  }

  if (!/^[A-Z]{3}$/.test((p.currency || "").toUpperCase())) {
    out.push({
      positionId: null,
      level: "error",
      message: "Set a 3-letter currency (e.g. CHF).",
    });
  }

  // Weights must sum to 100. A tenth of a percent of slack is fine — the
  // amounts, not the weights, are what the OMS books — but a proposal that
  // sums to 90% is almost certainly missing a line.
  const weightSum = round2(
    p.positions.reduce((s, x) => s + (Number(x.weightPct) || 0), 0),
  );
  if (p.positions.length && Math.abs(weightSum - 100) > 0.1) {
    out.push({
      positionId: null,
      level: "error",
      message: `Weights sum to ${weightSum}%, not 100%.`,
    });
  }

  for (const pos of p.positions) {
    const w = Number(pos.weightPct);
    if (!(w > 0)) {
      out.push({
        positionId: pos.id,
        level: "error",
        message: "Weight must be greater than zero.",
      });
    }
    if (!pos.name?.trim()) {
      out.push({
        positionId: pos.id,
        level: "warning",
        message: "No instrument name.",
      });
    }

    const isin = cleanId(pos.isin);
    const cusip = cleanId(pos.cusip);
    const valor = (pos.valor || "").trim();
    const ticker = cleanId(pos.ticker);

    if (isin && !isValidIsin(isin)) {
      out.push({
        positionId: pos.id,
        level: "error",
        message: `ISIN ${isin} fails its check digit.`,
      });
    }
    if (cusip && !isValidCusip(cusip)) {
      out.push({
        positionId: pos.id,
        level: "error",
        message: `CUSIP ${cusip} fails its check digit.`,
      });
    }
    if (valor && !isValidValorFormat(valor)) {
      out.push({
        positionId: pos.id,
        level: "error",
        message: `Valor ${valor} is not a valid Valorennummer.`,
      });
    }

    // The highest-value check: two identifiers on one row that name
    // DIFFERENT securities. No custodian catches it — it books whichever the
    // wire carries. Mirrors checkTicket's identity check so the advisor sees
    // it while editing rather than as a rejection after BUY.
    if (cusip && isin) {
      const ag = checkIdentifierAgreement(cusip, isin);
      if (!ag.ok) {
        out.push({
          positionId: pos.id,
          level: "error",
          message: `CUSIP and ISIN name different securities: ${ag.conflict}`,
        });
      }
    }
    if (valor && isin) {
      const ag = checkValorAgreement(valor, isin);
      if (!ag.ok) {
        out.push({
          positionId: pos.id,
          level: "error",
          message: `Valor and ISIN disagree: ${ag.conflict}`,
        });
      }
    }

    // A line the custodian can actually book on. A bare ticker often can't be
    // resolved, so it is a warning, not a block — the same stance the legacy
    // app takes.
    if (!isin && !cusip && !valor) {
      if (ticker) {
        out.push({
          positionId: pos.id,
          level: "warning",
          message:
            "Only a ticker — many custodians won't resolve it. Add an ISIN/Valor if you can.",
        });
      } else {
        out.push({
          positionId: pos.id,
          level: "error",
          message: "No identifier at all (ISIN, CUSIP, Valor or ticker).",
        });
      }
    }
  }

  return out;
}

/** True when the proposal has no `error`-level problems. */
export function proposalIsSendable(p: Proposal): boolean {
  return !checkProposal(p).some((x) => x.level === "error");
}

/**
 * Build the ticket. Assumes the proposal is sendable (call
 * proposalIsSendable first); it still produces a shape, but the caller
 * should not send an un-checked one.
 *
 * `ticketId` is passed in so a retry reuses the SAME id — that is what
 * makes the server's Postgres idempotency work. Mint a fresh one only for
 * a genuinely new proposal.
 */
export function buildTicket(
  p: Proposal,
  opts: {
    ticketId: string;
    account: string;
    custodian?: string;
    createdAt: string;
  },
): OrderTicket {
  const ccy = (p.currency || "USD").toUpperCase();
  const target = round2(p.targetAmount);

  const lines: OrderLine[] = p.positions.map((pos, i) => ({
    lineId: "ln" + (i + 1),
    side: "BUY" as const,
    instrument: {
      isin: cleanId(pos.isin) || undefined,
      cusip: cleanId(pos.cusip) || undefined,
      valor: (pos.valor || "").trim() || undefined,
      ticker: cleanId(pos.ticker) || undefined,
      name: pos.name?.trim() || undefined,
      vehicle: pos.vehicle || undefined,
      cls: pos.cls || undefined,
    },
    weightPct: Number(pos.weightPct) || 0,
    amount: round2(target * ((Number(pos.weightPct) || 0) / 100)),
    currency: ccy,
    orderType: "market" as const,
    note: pos.note ? String(pos.note).slice(0, 300) : undefined,
  }));

  // The rounding residue. Summing per-line rounded amounts can miss the
  // target by a few cents; the LAST line absorbs it so the ticket total
  // equals the target exactly and the server's total-vs-lines check passes.
  if (lines.length) {
    const diff = round2(target - sumLines(lines));
    if (diff !== 0) {
      const last = lines[lines.length - 1];
      last.amount = round2(last.amount + diff);
    }
  }

  return {
    schema: ORDER_SCHEMA,
    ticketId: opts.ticketId,
    createdAt: opts.createdAt,
    // Never "execute". A human with trading authority pulls the trigger in
    // the PM system; this app stages.
    intent: "stage",
    account: {
      id: opts.account.trim(),
      custodian: opts.custodian?.trim() || undefined,
      currency: ccy,
    },
    client: {
      name: p.clientName?.trim() || undefined,
      advisor: p.advisor?.trim() || undefined,
    },
    source: {
      system: "Wealth Analyzer",
      objective: p.objective?.trim() || undefined,
    },
    totals: { amount: sumLines(lines), currency: ccy, positions: lines.length },
    lines,
  };
}

/** Re-export so the builder can show a stable id and compare across retries. */
export { ticketFingerprint };

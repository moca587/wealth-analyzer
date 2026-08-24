import { z } from "zod";

// ─────────────────────────────────────────────────────────────────
// Runtime validation for saved investment proposals.
//
// This schema answers:
// "Is this structurally a valid proposal that we can safely save?"
//
// It does NOT answer:
// "Is this proposal ready to become an order?"
//
// Order-readiness rules such as weights summing to 100%,
// identifiers being valid, etc. belong in checkProposal().
// ─────────────────────────────────────────────────────────────────

export const proposalPositionSchema = z.object({
  id: z.string().trim().min(1),

  name: z.string().trim().max(200),

  isin: z.string().trim().max(12).optional(),

  cusip: z.string().trim().max(12).optional(),

  valor: z.string().trim().max(12).optional(),

  ticker: z.string().trim().max(20).optional(),

  vehicle: z.string().trim().max(40).optional(),

  cls: z.string().trim().max(40).optional(),

  weightPct: z.number().finite().min(0).max(100),

  expectedReturn: z.number().finite().optional(),

  er: z.number().finite().optional(),

  yld: z.number().finite().optional(),

  note: z.string().max(300).optional(),
});

export const proposalSchema = z.object({
  positions: z.array(proposalPositionSchema).max(200),

  targetAmount: z.number().finite().nonnegative().max(1_000_000_000),

  currency: z.string().trim().length(3).toUpperCase(),

  clientName: z.string().trim().max(200).optional(),

  advisor: z.string().trim().max(200).optional(),

  objective: z.string().trim().max(100).optional(),

  investmentThesis: z.string().trim().max(5000).optional(),

  feeType: z.enum(["none", "aum", "flat"]).optional(),

  feeRate: z.number().finite().nonnegative().optional(),
});

export type ProposalInput = z.infer<typeof proposalSchema>;

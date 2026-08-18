import type { InsurancePolicy } from "@/lib/engine/types";

export type PolicyTypeDefinition = {
  value: InsurancePolicy["type"];
  label: string;
};

export const POLICY_TYPES: PolicyTypeDefinition[] = [
  {
    value: "term_life",
    label: "Term life",
  },
  {
    value: "whole_life",
    label: "Whole life",
  },
  {
    value: "universal_life",
    label: "Universal / variable life",
  },
  {
    value: "disability",
    label: "Disability income",
  },
  {
    value: "ltc",
    label: "Long-term care",
  },
  {
    value: "other",
    label: "Other",
  },
];
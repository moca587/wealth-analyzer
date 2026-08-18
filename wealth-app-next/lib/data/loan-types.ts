export type LoanTypeDefinition = {
  value: string;
  label: string;
  displayLabel: string;
  rate: number;
  years: number;
};

export const LOAN_TYPES: LoanTypeDefinition[] = [
  {
    value: "mortgage_primary",
    label: "Primary mortgage (30-yr fixed)",
    displayLabel: "Primary mortgage",
    rate: 6.8,
    years: 30,
  },
  {
    value: "mortgage_secondary",
    label: "Secondary / vacation home mortgage",
    displayLabel: "Secondary mortgage",
    rate: 7.3,
    years: 15,
  },
  {
    value: "heloc",
    label: "HELOC (home equity line)",
    displayLabel: "HELOC",
    rate: 8.5,
    years: 10,
  },
  {
    value: "auto",
    label: "Auto loan",
    displayLabel: "Auto loan",
    rate: 6.8,
    years: 5,
  },
  {
    value: "personal",
    label: "Personal loan",
    displayLabel: "Personal loan",
    rate: 11.5,
    years: 4,
  },
  {
    value: "student_federal",
    label: "Federal student loan",
    displayLabel: "Federal student loan",
    rate: 6.5,
    years: 10,
  },
  {
    value: "business",
    label: "Business / SBA loan",
    displayLabel: "Business loan",
    rate: 8.0,
    years: 7,
  },
  {
    value: "cc",
    label: "Credit card",
    displayLabel: "Credit card",
    rate: 21.5,
    years: 3,
  },
  {
    value: "other",
    label: "Other",
    displayLabel: "Other loan",
    rate: 8.0,
    years: 5,
  },
];
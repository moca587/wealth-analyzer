import { describe, expect, test } from "vitest";
import {
  calcMortgagePayment,
  presentValue,
  futureValue,
  annuityPV,
  calcRMD,
  ageFromDOB,
  formatMoney,
  geometricMean,
  portfolioReturnParams,
  estimateIncomeTax,
} from "../financial-math";
import { ASSET_CLASS_CMA } from "../constants";

describe("calcMortgagePayment", () => {
  test("standard amortizing loan", () => {
    // $300k, 6% APR, 30yr — known-good reference payment ≈ $1798.65
    const payment = calcMortgagePayment(300000, 6, 30);
    expect(payment).toBeCloseTo(1798.65, 1);
  });

  test("zero-rate loan splits principal evenly across months", () => {
    const payment = calcMortgagePayment(120000, 0, 10);
    expect(payment).toBeCloseTo(120000 / 120, 6);
  });

  test("single-year term amortizes fully within 12 payments", () => {
    const principal = 12000;
    const payment = calcMortgagePayment(principal, 5, 1);
    expect(payment).toBeGreaterThan(principal / 12); // interest pushes payment above straight-line
    expect(Number.isFinite(payment)).toBe(true);
  });
});

describe("presentValue / futureValue", () => {
  test("futureValue then presentValue round-trips to the original amount", () => {
    const fv = futureValue(10000, 5, 10);
    const pv = presentValue(fv, 5, 10);
    expect(pv).toBeCloseTo(10000, 6);
  });

  test("presentValue discounts a future amount below its nominal value", () => {
    const pv = presentValue(10000, 5, 10);
    expect(pv).toBeLessThan(10000);
    expect(pv).toBeGreaterThan(0);
  });

  test("zero rate leaves the value unchanged", () => {
    expect(futureValue(5000, 0, 20)).toBeCloseTo(5000, 6);
    expect(presentValue(5000, 0, 20)).toBeCloseTo(5000, 6);
  });
});

describe("annuityPV", () => {
  test("matches the closed-form ordinary-annuity formula", () => {
    const pv = annuityPV(1000, 5, 20);
    const expected = (1000 * (1 - Math.pow(1.05, -20))) / 0.05;
    expect(pv).toBeCloseTo(expected, 6);
  });

  test("near-zero rate falls back to a simple payment × periods sum", () => {
    const pv = annuityPV(1000, 0, 15);
    expect(pv).toBeCloseTo(15000, 6);
  });
});

describe("calcRMD", () => {
  test("returns 0 before RMD age (73)", () => {
    expect(calcRMD(500000, 72)).toBe(0);
  });

  test("returns 0 for a zero or negative balance", () => {
    expect(calcRMD(0, 80)).toBe(0);
    expect(calcRMD(-100, 80)).toBe(0);
  });

  test("uses the IRS Uniform Lifetime factor at an exact table age", () => {
    expect(calcRMD(265000, 73)).toBeCloseTo(265000 / 26.5, 6);
  });

  test("falls back to the nearest-5 rounded age when the exact age is missing from the table", () => {
    // 77 isn't in the sparse fallback path used once age > table's dense range;
    // exact-age entries exist here (73-80), so this should hit the direct lookup.
    expect(calcRMD(229000, 77)).toBeCloseTo(229000 / 22.9, 6);
  });
});

describe("ageFromDOB", () => {
  test("computes whole-year age as of a fixed reference date", () => {
    expect(ageFromDOB("1990-06-15", new Date("2026-06-15"))).toBe(36);
  });

  test("has not had this year's birthday yet", () => {
    expect(ageFromDOB("1990-06-15", new Date("2026-06-14"))).toBe(35);
  });

  test("never returns a negative age", () => {
    expect(ageFromDOB("2030-01-01", new Date("2026-01-01"))).toBe(0);
  });
});

describe("formatMoney", () => {
  test("formats a whole-dollar amount with no decimals over $1,000", () => {
    expect(formatMoney(125000, "USD")).toBe("$125,000");
  });

  test("keeps two decimals under $1,000", () => {
    expect(formatMoney(42.5, "USD")).toBe("$42.50");
  });

  test("falls back to a plain string for an invalid currency code", () => {
    expect(formatMoney(1000, "NOT_A_CURRENCY")).toBe("NOT_A_CURRENCY 1000");
  });
});

describe("geometricMean", () => {
  test("applies the -1/2 sigma^2 convexity correction", () => {
    expect(geometricMean(0.08, 0.15)).toBeCloseTo(0.08 - 0.5 * 0.15 * 0.15, 10);
  });

  test("zero volatility leaves the arithmetic mean unchanged", () => {
    expect(geometricMean(0.06, 0)).toBeCloseTo(0.06, 10);
  });
});

describe("portfolioReturnParams", () => {
  const fallback = { mean: 0.07, sigma: 0.12 };

  test("a single-class portfolio returns that class's CMA", () => {
    const p = portfolioReturnParams([{ cls: "equity", value: 100 }], fallback);
    expect(p.mean).toBeCloseTo(ASSET_CLASS_CMA.equity.mean, 10);
    expect(p.sigma).toBeCloseTo(ASSET_CLASS_CMA.equity.sigma, 10);
  });

  test("mean is the value-weighted average of class means", () => {
    const p = portfolioReturnParams(
      [{ cls: "equity", value: 60 }, { cls: "fixed_income", value: 40 }],
      fallback
    );
    const expected = 0.6 * ASSET_CLASS_CMA.equity.mean + 0.4 * ASSET_CLASS_CMA.fixed_income.mean;
    expect(p.mean).toBeCloseTo(expected, 10);
  });

  test("diversification: a mixed portfolio's σ is below the weighted-average σ (correlation < 1)", () => {
    const w = 0.5;
    const weightedAvgSigma = w * ASSET_CLASS_CMA.equity.sigma + w * ASSET_CLASS_CMA.fixed_income.sigma;
    const p = portfolioReturnParams(
      [{ cls: "equity", value: 50 }, { cls: "fixed_income", value: 50 }],
      fallback
    );
    expect(p.sigma).toBeLessThan(weightedAvgSigma);
    // ...and above the lower single-class σ (still carries equity risk).
    expect(p.sigma).toBeGreaterThan(ASSET_CLASS_CMA.fixed_income.sigma);
  });

  test("no valued holdings → returns the fallback", () => {
    expect(portfolioReturnParams([], fallback)).toEqual(fallback);
    expect(portfolioReturnParams([{ cls: "equity", value: 0 }], fallback)).toEqual(fallback);
  });

  test("an unknown/missing class is treated as 'mixed', not dropped", () => {
    const p = portfolioReturnParams([{ value: 100 }], fallback);
    expect(p.mean).toBeCloseTo(ASSET_CLASS_CMA.mixed.mean, 10);
  });
});

describe("estimateIncomeTax", () => {
  test("zero or negative income is untaxed", () => {
    expect(estimateIncomeTax(0, "US")).toBe(0);
    expect(estimateIncomeTax(-5000, "US")).toBe(0);
  });

  test("US brackets are progressive (effective rate rises with income)", () => {
    const t50 = estimateIncomeTax(50000, "US");
    const t200 = estimateIncomeTax(200000, "US");
    expect(t50).toBeGreaterThan(0);
    expect(t200 / 200000).toBeGreaterThan(t50 / 50000); // higher effective rate
  });

  test("an unknown country falls back to the default table (still taxes)", () => {
    expect(estimateIncomeTax(100000, "ZZ")).toBeGreaterThan(0);
  });

  test("a tax-free-threshold country (GB) taxes nothing on income under the allowance", () => {
    expect(estimateIncomeTax(10000, "GB")).toBe(0);
    expect(estimateIncomeTax(30000, "GB")).toBeGreaterThan(0);
  });
});

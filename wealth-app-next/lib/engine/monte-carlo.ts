import type { LegacyWealthPlan } from "@/lib/plan/legacy-schema";

import {
    boxMuller,
    calcRMD,
    createSeededRandom,
    getEffectiveReturnParamsGross,
    calculatePercentile,
} from "./financial-math";

// ─────────────────────────────────────────────────────────────
// Public result types
// ─────────────────────────────────────────────────────────────

export interface MonteCarloPath {
    /** Simulated net-worth snapshots. Length is years + 1. */
    values: number[];

    /** First projection offset where a goal could not be funded. */
    shortfallYear: number | null;

    /** First projection offset where any need became unfunded. */
    liquidityDepletedYear: number | null;

    /** Total lifetime spending and goals that could not be funded. */
    unfunded: number;
}

export interface DepletionStats {
    probability: number;
    medianYear: number | null;
    medianUnfunded: number;
}

// Stores the percentile value for every projected year 
export type PercentileSeries = Record<string, number[]>;

// Stores only the percentile values at the final projection year
export type FinalPercentiles = Record<string, number>;

export interface MonteCarloResult {
    paths: MonteCarloPath[];
    depletion: DepletionStats;

    percentileSeries: PercentileSeries;
    realPercentileSeries: PercentileSeries;

    finalPercentiles: FinalPercentiles;
    realFinalPercentiles: FinalPercentiles;

    requestedPercentiles: number[]; // records which percentiles the client asked the engine to calculate
}

export interface MonteCarloOptions {
    percentiles?: number[];
}

// ─────────────────────────────────────────────────────────────
// Supporting engine types
// ─────────────────────────────────────────────────────────────

export interface SimulationParameters {
    mu: number;
    sig: number;
}

export interface LoanState {
    balance: number;
    annualRate: number;
    yearsRemaining: number;
}

export type AssetBuckets = Record<string, number>;

/**
 * These functions correspond to helpers called by the legacy HTML runMC.
 *
 * Keeping them explicit prevents important behavior from being silently
 * omitted while the rest of the application is migrated.
 */
export interface MonteCarloDependencies {
    getActiveSimulationParams(
        plan: LegacyWealthPlan,
    ): SimulationParameters;

    totalAccountValue(plan: LegacyWealthPlan): number;

    portfolioCashSeed(plan: LegacyWealthPlan): number;

    portfolioInvestedSeed(plan: LegacyWealthPlan): number;

    retirementAccountSeed(plan: LegacyWealthPlan): number;

    getAssetBucketsFromHoldings(
        plan: LegacyWealthPlan,
    ): AssetBuckets;

    /**
     * Returns an inflation rate as a decimal.
     *
     * Example:
     * 0.038 means 3.8%.
     */
    scenarioInflation(
        yearOffset: number,
        baseInflation: number,
    ): number;

    /**
     * Returns a decimal return override or null.
     *
     * Example:
     * -0.25 means a 25% portfolio shock.
     */
    scenarioReturnShock(
        yearOffset: number,
    ): number | null;

    calculatePension(args: {
        source: string;
        annualAmount: number;
        startAge: number;
        cola: string;
        currentAge: number;
        inflationRate: number;
    }): number;

    equityVestIncomeYear(
        plan: LegacyWealthPlan,
        yearOffset: number,
    ): number;

    shouldApplyTax(plan: LegacyWealthPlan): boolean;

    computeIncomeTax(
        plan: LegacyWealthPlan,
        totalIncome: number,
    ): number;

    growAssetBuckets(args: {
        buckets: AssetBuckets;
        capitalGainsDrag: number;
        yearOffset: number;
        mu: number;
        sig: number;
        normalRandom: () => number;
    }): AssetBuckets;
}

// ─────────────────────────────────────────────────────────────
// Monte Carlo engine
// ─────────────────────────────────────────────────────────────

export function runMonteCarlo(
    plan: LegacyWealthPlan,
    years: number,
    sims: number,
    muOverride?: number,
    sigOverride?: number,
    dependencies: MonteCarloDependencies =
        createDefaultMonteCarloDependencies(),
    options: MonteCarloOptions = {}
): MonteCarloResult {
    validateSimulationArguments(years, sims);

    const requestedPercentiles =
        validatePercentiles(
            options.percentiles ?? [30, 50, 80],
        );

    const fields = plan.fields;
    const currentYear = new Date().getFullYear();

    /*
     * The HTML engine calls simSeedReset() once before all paths.
     *
     * Here, the engine creates one deterministic random stream for the
     * complete run. This maintains common-random-number alignment when
     * runMonteCarlo is called repeatedly with the same inputs.
     */
    const random = createSeededRandom(20_260_710);

    const normalRandom = (): number => {
        /*
         * This assumes financial-math.ts defines:
         *
         * boxMuller(random: () => number): number
         *
         * If your current boxMuller() accepts no parameter, replace this with:
         *
         * return boxMuller();
         */
        return boxMuller(random);
    };

    // Override → proposal-driven → household effective defaults.
    const activeParameters =
        dependencies.getActiveSimulationParams(plan);

    const mu = muOverride ?? activeParameters.mu;
    const sig = sigOverride ?? activeParameters.sig;

    if (!Number.isFinite(mu)) {
        throw new Error("mu must be finite");
    }

    if (!Number.isFinite(sig) || sig < 0) {
        throw new Error(
            "sig must be finite and greater than or equal to zero",
        );
    }

    // ───────────────────────────────────────────────────────────
    // Core household assumptions
    // ───────────────────────────────────────────────────────────

    const inflation = numberField(fields.inf) / 100;
    const salaryRaise = numberField(fields.raise) / 100;

    const baseIncome = getGrossIncome(plan);
    const baseExpenses = getTotalExpenses(plan);

    // ───────────────────────────────────────────────────────────
    // Starting balance-sheet values
    // ───────────────────────────────────────────────────────────

    const propertyValue = numberField(fields.aProp);
    const otherAssets = numberField(fields.aOther);

    const totalAccountValue =
        dependencies.totalAccountValue(plan);

    // Portfolio holdings.
    const portfolioCash =
        dependencies.portfolioCashSeed(plan);

    const portfolioInvested =
        dependencies.portfolioInvestedSeed(plan);

    // Retirement pool managed separately from liquid investments.
    const retirementSeed =
        dependencies.retirementAccountSeed(plan);

    const country = fields.c1co || "US";

    const liquidAccountValue = Math.max(
        0,
        totalAccountValue - retirementSeed,
    );

    const portfolioTotal =
        portfolioInvested + portfolioCash;

    let investmentSeed: number;
    let cashSeed: number;

    if (
        plan.investments.length > 0 &&
        !plan.pfLinkedAccountId
    ) {
        /*
         * Mode C:
         *
         * Portfolio holdings exist but are not linked to an asset account.
         *
         * totalAccountValue may already contain the same money represented
         * by the portfolio. Treat the portfolio holdings as authoritative,
         * and only count asset-account value above the portfolio total.
         */
        const extraAccountValue = Math.max(
            0,
            liquidAccountValue - portfolioTotal,
        );

        investmentSeed = portfolioInvested;
        cashSeed = portfolioCash + extraAccountValue;
    } else {
        /*
         * Mode A:
         * No portfolio exists.
         *
         * Mode B:
         * The portfolio is linked to an asset account.
         */
        const totalSeed =
            liquidAccountValue + portfolioInvested;

        investmentSeed = Math.max(
            portfolioInvested,
            totalSeed * 0.3,
        );

        cashSeed =
            Math.max(0, totalSeed - investmentSeed) +
            portfolioCash;
    }

    // ───────────────────────────────────────────────────────────
    // Savings and tax assumptions
    // ───────────────────────────────────────────────────────────

    const annualSavingsTarget =
        numberField(fields.savAnnual);

    const capitalGainsDrag =
        dependencies.shouldApplyTax(plan)
            ? (numberField(fields.cgtRate) / 100) *
            (numberField(fields.cgtTurnover) / 100)
            : 0;

    // ───────────────────────────────────────────────────────────
    // Retirement assumptions
    // ───────────────────────────────────────────────────────────

    const client1StartingAge =
        ageFromDateOfBirth(fields.c1d) ?? 30;

    const retirementAge =
        numberField(fields.retAge);

    const retirementSpending =
        numberField(fields.retSpend) || baseExpenses;

    // Client 1 pension.
    const pensionSource1 =
        fields.penSrc || "auto";

    const pensionAnnual1 =
        numberField(fields.penAnnual);

    const pensionStartAge1 =
        numberField(fields.penStartAge);

    const pensionCola1 =
        fields.penCola || "full";

    // Client 2 pension.
    const showClient2 = plan.c2visible;

    const pensionSource2 = showClient2
        ? fields.penSrc2 || "auto"
        : "none";

    const pensionAnnual2 =
        pensionSource2 === "none"
            ? 0
            : numberField(fields.penAnnual2);

    const pensionStartAge2 =
        numberField(fields.penStartAge2);

    const pensionCola2 =
        fields.penCola2 || "full";

    const client2StartingAge =
        ageFromDateOfBirth(fields.c2d) ??
        client1StartingAge;

    // ───────────────────────────────────────────────────────────
    // Rebalancing assumptions
    // ───────────────────────────────────────────────────────────

    const rebalancingFrequency =
        fields.rebalFreq || "none";

    const targetEquity =
        numberField(fields.tgtEquity) / 100;

    // ───────────────────────────────────────────────────────────
    // Goal outflow map
    // ───────────────────────────────────────────────────────────

    const goalOutflowMap =
        buildGoalOutflowMap(plan.goals);

    // ───────────────────────────────────────────────────────────
    // Asset-bucket template
    // ───────────────────────────────────────────────────────────

    /*
     * The holdings-to-bucket template is invariant across paths.
     * Build it once, then copy it for each simulation.
     */
    const assetBucketTemplate =
        dependencies.getAssetBucketsFromHoldings(plan);

    const templateIsEmpty =
        Object.keys(assetBucketTemplate).length === 0;

    const paths: MonteCarloPath[] = [];

    // ───────────────────────────────────────────────────────────
    // Simulation paths
    // ───────────────────────────────────────────────────────────

    for (
        let simulationIndex = 0;
        simulationIndex < sims;
        simulationIndex += 1
    ) {
        let cash = cashSeed;
        let property = propertyValue;

        let assetBuckets = templateIsEmpty
            ? {
                mixed: investmentSeed,
            }
            : scaleBucketsToTotal(
                { ...assetBucketTemplate },
                investmentSeed,
            );

        let investments = sumBuckets(assetBuckets);

        let retirementPool = retirementSeed;

        let income = baseIncome;
        let expenses = baseExpenses;

        const loans: LoanState[] = plan.loans.map(
            (loan) => ({
                balance: loan.bal,
                annualRate: loan.rate / 100,
                yearsRemaining: loan.yrs,
            }),
        );

        const values: number[] = [];

        let shortfallYear: number | null = null;
        let liquidityDepletedYear: number | null =
            null;

        /*
         * Cumulative amount the household needed but could not fund.
         *
         * It is non-compounding and is subtracted from net worth so
         * insolvent paths continue falling rather than flooring at zero.
         */
        let unfunded = 0;

        // ─────────────────────────────────────────────────────────
        // Yearly projection loop
        // ─────────────────────────────────────────────────────────

        for (
            let yearOffset = 0;
            yearOffset <= years;
            yearOffset += 1
        ) {
            /*
             * Record the chronological snapshot before processing the
             * following year's activity.
             */
            const totalDebt = loans.reduce(
                (sum, loan) => sum + loan.balance,
                0,
            );

            const netWorth =
                Math.max(0, cash + investments) +
                property +
                otherAssets +
                retirementPool -
                totalDebt -
                unfunded;

            values.push(netWorth);

            if (yearOffset === years) {
                break;
            }

            const currentInflation =
                dependencies.scenarioInflation(
                    yearOffset,
                    inflation,
                );

            const returnShock =
                dependencies.scenarioReturnShock(
                    yearOffset,
                );

            // Ages and retirement status.
            const client1Age =
                client1StartingAge + yearOffset;

            const client1Retired =
                client1Age >= retirementAge;

            const client2Age =
                client2StartingAge + yearOffset;

            const client2Retired =
                showClient2 &&
                client2Age >= retirementAge;

            // ───────────────────────────────────────────────────────
            // Pension income
            // ───────────────────────────────────────────────────────

            const pension1 =
                dependencies.calculatePension({
                    source: pensionSource1,
                    annualAmount: pensionAnnual1,
                    startAge: pensionStartAge1,
                    cola: pensionCola1,
                    currentAge: client1Age,
                    inflationRate: inflation,
                });

            const pension2 = showClient2
                ? dependencies.calculatePension({
                    source: pensionSource2,
                    annualAmount: pensionAnnual2,
                    startAge: pensionStartAge2,
                    cola: pensionCola2,
                    currentAge: client2Age,
                    inflationRate: inflation,
                })
                : 0;

            // ───────────────────────────────────────────────────────
            // Retirement pool and RMDs
            // ───────────────────────────────────────────────────────

            /*
             * The retirement pool remains decoupled from household risk
             * and portfolio-builder assumptions.
             */
            const retirementReturn = 0.035;

            const retirementPoolBeforeGrowth =
                retirementPool;

            retirementPool *= 1 + retirementReturn;

            let requiredDistribution = 0;

            if (retirementPoolBeforeGrowth > 0) {
                if (showClient2) {
                    /*
                     * Legacy behavior assumes each client owns half of the
                     * retirement pool.
                     */
                    const halfBalance =
                        retirementPoolBeforeGrowth * 0.5;

                    let client1Distribution = 0;
                    let client2Distribution = 0;

                    if (client1Retired) {
                        client1Distribution = Math.max(
                            calcRMD(
                                halfBalance,
                                client1Age,
                                country,
                            ),
                            halfBalance * 0.04,
                        );
                    }

                    if (client2Retired) {
                        client2Distribution = Math.max(
                            calcRMD(
                                halfBalance,
                                client2Age,
                                country,
                            ),
                            halfBalance * 0.04,
                        );
                    }

                    requiredDistribution =
                        client1Distribution +
                        client2Distribution;
                } else if (client1Retired) {
                    requiredDistribution = Math.max(
                        calcRMD(
                            retirementPoolBeforeGrowth,
                            client1Age,
                            country,
                        ),
                        retirementPoolBeforeGrowth * 0.04,
                    );
                }
            }

            /*
             * Prevent floating-point behavior from drawing more than the
             * current retirement balance.
             */
            requiredDistribution = Math.min(
                requiredDistribution,
                retirementPool,
            );

            retirementPool = Math.max(
                0,
                retirementPool - requiredDistribution,
            );

            const totalPensionIncome =
                pension1 +
                pension2 +
                requiredDistribution;

            // ───────────────────────────────────────────────────────
            // Earned income and current expenses
            // ───────────────────────────────────────────────────────

            const earnedIncome =
                (client1Retired ? 0 : income) +
                dependencies.equityVestIncomeYear(
                    plan,
                    yearOffset,
                );

            const currentExpenses = client1Retired
                ? retirementSpending *
                Math.pow(
                    1 + currentInflation,
                    yearOffset,
                )
                : expenses;

            // ───────────────────────────────────────────────────────
            // Debt service
            // ───────────────────────────────────────────────────────

            let debtPaid = 0;

            for (const loan of loans) {
                if (loan.balance <= 0) {
                    continue;
                }

                const annualPayment =
                    calculateAnnualLoanPayment(loan);

                const interest =
                    loan.balance * loan.annualRate;

                const principal = Math.max(
                    0,
                    annualPayment - interest,
                );

                loan.balance = Math.max(
                    0,
                    loan.balance - principal,
                );

                loan.yearsRemaining = Math.max(
                    0,
                    loan.yearsRemaining - 1,
                );

                debtPaid += annualPayment;
            }

            // ───────────────────────────────────────────────────────
            // Tax and annual surplus
            // ───────────────────────────────────────────────────────

            const totalIncome =
                earnedIncome + totalPensionIncome;

            const tax = dependencies.shouldApplyTax(plan)
                ? dependencies.computeIncomeTax(
                    plan,
                    totalIncome,
                )
                : 0;

            const surplus =
                totalIncome -
                tax -
                currentExpenses -
                debtPaid;

            // ───────────────────────────────────────────────────────
            // Savings target
            // ───────────────────────────────────────────────────────

            let savingsCompleted = client1Retired
                ? 0
                : Math.min(
                    annualSavingsTarget,
                    Math.max(surplus, 0),
                );

            let remainingCashFlow =
                surplus - savingsCompleted;

            /*
             * Preserve legacy behavior:
             *
             * If current surplus is not enough to meet the savings target,
             * existing cash may be moved into savings.
             */
            if (
                !client1Retired &&
                savingsCompleted < annualSavingsTarget
            ) {
                const savingsNeeded =
                    annualSavingsTarget -
                    savingsCompleted;

                const fromCash = Math.min(
                    savingsNeeded,
                    cash,
                );

                cash -= fromCash;
                savingsCompleted += fromCash;
            }

            cash += savingsCompleted;

            /*
             * Positive residual surplus is treated as discretionary
             * spending and is not saved again.
             *
             * Only negative remaining cash flow drains wealth.
             */
            if (remainingCashFlow < 0) {
                cash += remainingCashFlow;

                if (cash < 0) {
                    investments += cash;
                    cash = 0;

                    if (investments < 0) {
                        unfunded += -investments;

                        if (liquidityDepletedYear === null) {
                            liquidityDepletedYear =
                                yearOffset;
                        }

                        investments = 0;
                    }
                }

                assetBuckets = scaleBucketsToTotal(
                    assetBuckets,
                    investments,
                );
            }

            // ───────────────────────────────────────────────────────
            // Goal outflows
            // ───────────────────────────────────────────────────────

            const calendarYear =
                currentYear + yearOffset;

            const goalOutflow =
                goalOutflowMap.get(calendarYear) ?? 0;

            if (goalOutflow > 0) {
                const fromCash = Math.min(
                    Math.max(0, cash),
                    goalOutflow,
                );

                cash -= fromCash;

                const remainingAfterCash =
                    goalOutflow - fromCash;

                const fromInvestments = Math.min(
                    Math.max(0, investments),
                    remainingAfterCash,
                );

                investments -= fromInvestments;

                const unmetGoal =
                    goalOutflow -
                    fromCash -
                    fromInvestments;

                if (
                    shortfallYear === null &&
                    unmetGoal > 0.5
                ) {
                    shortfallYear = yearOffset;
                }

                if (unmetGoal > 0.5) {
                    unfunded += unmetGoal;

                    if (liquidityDepletedYear === null) {
                        liquidityDepletedYear =
                            yearOffset;
                    }
                }

                cash = Math.max(0, cash);
                investments = Math.max(
                    0,
                    investments,
                );

                assetBuckets = scaleBucketsToTotal(
                    assetBuckets,
                    investments,
                );
            }

            // ───────────────────────────────────────────────────────
            // Portfolio rebalancing
            // ───────────────────────────────────────────────────────

            if (
                rebalancingFrequency !== "none" &&
                yearOffset > 0
            ) {
                const totalPortfolio =
                    Math.max(0, cash) +
                    Math.max(0, investments);

                if (totalPortfolio > 0) {
                    const targetInvestments =
                        totalPortfolio * targetEquity;

                    const drift =
                        Math.abs(
                            investments - targetInvestments,
                        ) / totalPortfolio;

                    const shouldRebalance =
                        rebalancingFrequency === "annual" ||
                        (rebalancingFrequency ===
                            "threshold" &&
                            drift > 0.05);

                    if (shouldRebalance) {
                        investments = Math.max(
                            0,
                            targetInvestments,
                        );

                        cash = Math.max(
                            0,
                            totalPortfolio - investments,
                        );

                        assetBuckets = scaleBucketsToTotal(
                            assetBuckets,
                            investments,
                        );
                    }
                }
            }

            // ───────────────────────────────────────────────────────
            // Investment growth or scenario shock
            // ───────────────────────────────────────────────────────

            if (returnShock !== null) {
                for (const assetClass of Object.keys(
                    assetBuckets,
                )) {
                    assetBuckets[assetClass] = Math.max(
                        0,
                        assetBuckets[assetClass] *
                        (1 + returnShock),
                    );
                }

                investments = sumBuckets(assetBuckets);
            } else {
                assetBuckets =
                    dependencies.growAssetBuckets({
                        buckets: assetBuckets,
                        capitalGainsDrag,
                        yearOffset,
                        mu,
                        sig,
                        normalRandom,
                    });

                investments = sumBuckets(assetBuckets);
            }

            // ───────────────────────────────────────────────────────
            // Property growth
            // ───────────────────────────────────────────────────────

            const propertyMu = 0.03;
            const propertySigma = 0.02;

            const propertyLogReturn =
                propertyMu -
                0.5 *
                propertySigma *
                propertySigma +
                propertySigma * normalRandom();

            property *= Math.exp(propertyLogReturn);

            // ───────────────────────────────────────────────────────
            // Advance recurring assumptions
            // ───────────────────────────────────────────────────────

            if (!client1Retired) {
                income *= 1 + salaryRaise;
            }

            expenses *= 1 + currentInflation;
        }

        paths.push({
            values,
            shortfallYear,
            liquidityDepletedYear,
            unfunded,
        });
    }

    const percentileSeries = calculatePercentileSeries(
        paths,
        requestedPercentiles,
    );

    const realPercentileSeries =
        deflatePercentileSeries(
            percentileSeries,
            inflation,
        );

    const finalPercentiles = calculateFinalPercentiles(
        percentileSeries,
    );

    const realFinalPercentiles =
        calculateFinalPercentiles(
            realPercentileSeries,
        );

    return {
        paths,
        depletion: calculateDepletionStats(paths),

        percentileSeries,
        realPercentileSeries,

        finalPercentiles,
        realFinalPercentiles,

        requestedPercentiles,
    };
}

// ─────────────────────────────────────────────────────────────
// Default helper implementation
// ─────────────────────────────────────────────────────────────

export function createDefaultMonteCarloDependencies():
    MonteCarloDependencies {
    return {
        getActiveSimulationParams:
            getDefaultActiveSimulationParams,

        totalAccountValue:
            getDefaultTotalAccountValue,

        portfolioCashSeed:
            getDefaultPortfolioCashSeed,

        portfolioInvestedSeed:
            getDefaultPortfolioInvestedSeed,

        retirementAccountSeed:
            getDefaultRetirementAccountSeed,

        getAssetBucketsFromHoldings:
            getDefaultAssetBucketsFromHoldings,

        scenarioInflation: (
            _yearOffset,
            baseInflation,
        ) => baseInflation,

        scenarioReturnShock: () => null,

        calculatePension:
            calculateDefaultPension,

        equityVestIncomeYear:
            calculateDefaultEquityVestIncome,

        shouldApplyTax:
            getDefaultShouldApplyTax,

        computeIncomeTax:
            computeDefaultIncomeTax,

        growAssetBuckets:
            growDefaultAssetBuckets,
    };
}

// ─────────────────────────────────────────────────────────────
// Input validation
// ─────────────────────────────────────────────────────────────

function validateSimulationArguments(
    years: number,
    sims: number,
): void {
    if (!Number.isInteger(years) || years <= 0) {
        throw new Error(
            "years must be a positive integer",
        );
    }

    if (!Number.isInteger(sims) || sims <= 0) {
        throw new Error(
            "sims must be a positive integer",
        );
    }
}

// Validate percentiles 
function validatePercentiles(
    percentiles: number[],
): number[] {
    if (percentiles.length === 0) {
        throw new Error(
            "At least one percentile is required",
        );
    }

    const uniquePercentiles = [
        ...new Set(percentiles),
    ].sort((a, b) => a - b);

    for (const value of uniquePercentiles) {
        if (
            !Number.isFinite(value) ||
            value < 0 ||
            value > 100
        ) {
            throw new Error(
                `Invalid percentile: ${value}`,
            );
        }
    }

    return uniquePercentiles;
}

function numberField(value: string): number {
    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        throw new Error(
            `Invalid numeric plan field: "${value}"`,
        );
    }

    return parsed;
}

// ─────────────────────────────────────────────────────────────
// Household calculations
// ─────────────────────────────────────────────────────────────

function getGrossIncome(
    plan: LegacyWealthPlan,
): number {
    const fields = plan.fields;

    // HTML field mapping:
    // inc1 + inc2 = Client 1 income
    // inc1b + inc2b = Client 2 income
    const client1Income =
        numberField(fields.inc1) +
        numberField(fields.inc2);

    const client2Income = plan.c2visible
        ? numberField(fields.inc1b) +
        numberField(fields.inc2b)
        : 0;

    return client1Income + client2Income;
}

function getTotalExpenses(
    plan: LegacyWealthPlan,
): number {
    const fields = plan.fields;

    return (
        numberField(fields.expL) +
        numberField(fields.expI) +
        numberField(fields.expO)
    );
}

function ageFromDateOfBirth(
    dateOfBirth: string,
    asOfDate = new Date(),
): number | null {
    if (!dateOfBirth) {
        return null;
    }

    const birthDate = new Date(dateOfBirth);

    if (Number.isNaN(birthDate.getTime())) {
        return null;
    }

    let age =
        asOfDate.getFullYear() -
        birthDate.getFullYear();

    const birthdayAlreadyOccurred =
        asOfDate.getMonth() >
        birthDate.getMonth() ||
        (asOfDate.getMonth() ===
            birthDate.getMonth() &&
            asOfDate.getDate() >=
            birthDate.getDate());

    if (!birthdayAlreadyOccurred) {
        age -= 1;
    }

    return age;
}

// ─────────────────────────────────────────────────────────────
// Goal calculations
// ─────────────────────────────────────────────────────────────

function buildGoalOutflowMap(
    goals: LegacyWealthPlan["goals"],
): Map<number, number> {
    const result = new Map<number, number>();

    for (const goal of goals) {
        for (
            let year = goal.startYear;
            year <= goal.endYear;
            year += 1
        ) {
            result.set(
                year,
                (result.get(year) ?? 0) + goal.amt,
            );
        }
    }

    return result;
}

// ─────────────────────────────────────────────────────────────
// Loan calculations
// ─────────────────────────────────────────────────────────────

function calculateAnnualLoanPayment(
    loan: LoanState,
): number {
    if (loan.balance <= 0) {
        return 0;
    }

    if (
        loan.annualRate <= 0 ||
        loan.yearsRemaining <= 0
    ) {
        return (
            loan.balance /
            Math.max(loan.yearsRemaining, 1)
        );
    }

    const monthlyRate =
        loan.annualRate / 12;

    const numberOfPayments =
        loan.yearsRemaining * 12;

    const growthFactor = Math.pow(
        1 + monthlyRate,
        numberOfPayments,
    );

    const monthlyPayment =
        loan.balance *
        ((monthlyRate * growthFactor) /
            (growthFactor - 1));

    return monthlyPayment * 12;
}

// ─────────────────────────────────────────────────────────────
// Asset buckets
// ─────────────────────────────────────────────────────────────

function sumBuckets(
    buckets: AssetBuckets,
): number {
    return Object.values(buckets).reduce(
        (sum, value) => sum + value,
        0,
    );
}

function scaleBucketsToTotal(
    buckets: AssetBuckets,
    targetTotal: number,
): AssetBuckets {
    const safeTarget = Math.max(0, targetTotal);
    const currentTotal = sumBuckets(buckets);

    if (safeTarget === 0) {
        return Object.fromEntries(
            Object.keys(buckets).map((key) => [
                key,
                0,
            ]),
        );
    }

    if (currentTotal <= 0) {
        return {
            mixed: safeTarget,
        };
    }

    const scale = safeTarget / currentTotal;

    return Object.fromEntries(
        Object.entries(buckets).map(
            ([assetClass, value]) => [
                assetClass,
                Math.max(0, value * scale),
            ],
        ),
    );
}

// ─────────────────────────────────────────────────────────────
// Depletion aggregation
// ─────────────────────────────────────────────────────────────

function calculateDepletionStats(
    paths: MonteCarloPath[],
): DepletionStats {
    const depletedPaths = paths.filter(
        (path) =>
            path.liquidityDepletedYear !== null,
    );

    if (depletedPaths.length === 0) {
        return {
            probability: 0,
            medianYear: null,
            medianUnfunded: 0,
        };
    }

    const depletionYears = depletedPaths
        .map(
            (path) =>
                path.liquidityDepletedYear,
        )
        .filter(
            (value): value is number =>
                value !== null,
        )
        .sort((a, b) => a - b);

    const unfundedAmounts = depletedPaths
        .map((path) => path.unfunded)
        .sort((a, b) => a - b);

    return {
        probability:
            depletedPaths.length / paths.length,

        /*
         * This matches the HTML engine:
         * sorted[Math.floor(length / 2)]
         *
         * It does not average the two middle values.
         */
        medianYear:
            depletionYears[
            Math.floor(depletionYears.length / 2)
            ] ?? null,

        medianUnfunded:
            unfundedAmounts[
            Math.floor(unfundedAmounts.length / 2)
            ] ?? 0,
    };
}

// ─────────────────────────────────────────────────────────────
// Default return assumptions
// ─────────────────────────────────────────────────────────────

function getRiskProfileFallback(
    plan: LegacyWealthPlan,
): SimulationParameters {
    const riskProfile =
        plan.fields.c1r;

    switch (riskProfile) {
        case "very_conservative":
            return {
                mu: 0.035,
                sig: 0.04,
            };

        case "conservative":
            return {
                mu: 0.045,
                sig: 0.07,
            };

        case "moderately_conservative":
            return {
                mu: 0.055,
                sig: 0.09,
            };

        case "moderate":
            return {
                mu: 0.07,
                sig: 0.12,
            };

        case "moderately_aggressive":
            return {
                mu: 0.085,
                sig: 0.15,
            };

        case "aggressive":
            return {
                mu: 0.10,
                sig: 0.18,
            };

        case "very_aggressive":
            return {
                mu: 0.12,
                sig: 0.22,
            };

        default:
            return {
                mu:
                    Number(plan.fields.retM) /
                    100 || 0.06,
                sig:
                    Number(plan.fields.retV) /
                    100 || 0.12,
            };
    }
}

// function getDefaultActiveSimulationParams(
//   plan: LegacyWealthPlan,
// ): SimulationParameters {
//   const riskProfile = plan.fields.c1r;

//   switch (riskProfile) {
//     case "very_conservative":
//       return {
//         mu: 0.035,
//         sig: 0.05,
//       };

//     case "conservative":
//       return {
//         mu: 0.04,
//         sig: 0.07,
//       };

//     case "moderately_conservative":
//       return {
//         mu: 0.045,
//         sig: 0.085,
//       };

//     case "moderate":
//       return {
//         mu: 0.055,
//         sig: 0.11,
//       };

//     case "moderately_aggressive":
//       return {
//         mu: 0.065,
//         sig: 0.14,
//       };

//     case "aggressive":
//       return {
//         mu: 0.075,
//         sig: 0.17,
//       };

//     case "very_aggressive":
//       return {
//         mu: 0.085,
//         sig: 0.21,
//       };

//     default:
//       return {
//         mu: 0.055,
//         sig: 0.11,
//       };
//   }
// }
function getDefaultActiveSimulationParams(
    plan: LegacyWealthPlan,
): SimulationParameters {
    const holdingsParams =
        getEffectiveReturnParamsGross(
            plan.investments,
        );

    if (holdingsParams) {
        const advisoryFee =
            getPortfolioAdvisoryFeePct(plan);

        return {
            mu: Math.max(
                0,
                holdingsParams.mu -
                advisoryFee,
            ),

            sig: holdingsParams.sig,
        };
    }

    return getRiskProfileFallback(plan);
}

// ─────────────────────────────────────────────────────────────
// Default account seed helpers
// ─────────────────────────────────────────────────────────────

function getDefaultTotalAccountValue(
    plan: LegacyWealthPlan,
): number {
    const excludeLinkedAccount =
        Boolean(plan.pfLinkedAccountId) &&
        plan.investments.length > 0;

    return plan.assets.reduce(
        (sum, asset) => {
            if (
                excludeLinkedAccount &&
                asset.id === plan.pfLinkedAccountId
            ) {
                return sum;
            }

            return sum + asset.value;
        },
        0,
    );
}

function getPortfolioAdvisoryFeePct(
    plan: LegacyWealthPlan,
): number {
    const feeType =
        plan.fields.pfFeeType || "none";

    if (feeType === "none") {
        return 0;
    }

    const fee =
        numberField(
            plan.fields.pfAdvisoryFee,
        );

    if (feeType === "aum") {
        return fee / 100;
    }

    if (feeType === "flat") {
        const totalPortfolioValue =
            plan.investments.reduce(
                (sum, investment) =>
                    sum +
                    Math.max(
                        0,
                        Number(investment.val) || 0,
                    ),
                0,
            );

        return totalPortfolioValue > 0
            ? fee / totalPortfolioValue
            : 0;
    }

    return 0;
}

function getDefaultPortfolioCashSeed(
    plan: LegacyWealthPlan,
): number {
    return plan.investments
        .filter(
            (investment) =>
                investment.cls === "cash",
        )
        .reduce(
            (sum, investment) =>
                sum + investment.val,
            0,
        );
}

function getDefaultPortfolioInvestedSeed(
    plan: LegacyWealthPlan,
): number {
    return plan.investments
        .filter(
            (investment) =>
                investment.cls !== "cash",
        )
        .reduce(
            (sum, investment) =>
                sum + investment.val,
            0,
        );
}

function getDefaultRetirementAccountSeed(
    plan: LegacyWealthPlan,
): number {
    return plan.assets
        .filter(
            (asset) =>
                !asset.liquid &&
                (asset.withdrawAge ?? 0) > 0,
        )
        .reduce(
            (sum, asset) =>
                sum + asset.value,
            0,
        );
}

// ─────────────────────────────────────────────────────────────
// Default holdings-to-buckets conversion
// ─────────────────────────────────────────────────────────────

function getDefaultAssetBucketsFromHoldings(
    plan: LegacyWealthPlan,
): AssetBuckets {
    const buckets: AssetBuckets = {};

    for (const investment of plan.investments) {
        if (investment.cls === "cash") {
            continue;
        }

        const assetClass =
            investment.cls || "mixed";

        buckets[assetClass] =
            (buckets[assetClass] ?? 0) +
            investment.val;
    }

    return buckets;
}

// ─────────────────────────────────────────────────────────────
// Default asset growth
// ─────────────────────────────────────────────────────────────

const ASSET_CLASS_MC: Record<
    string,
    SimulationParameters
> = {
    equity: {
        mu: 0.075,
        sig: 0.18,
    },

    fixed_income: {
        mu: 0.04,
        sig: 0.07,
    },

    real_estate: {
        mu: 0.055,
        sig: 0.14,
    },

    commodity: {
        mu: 0.035,
        sig: 0.2,
    },

    mixed: {
        mu: 0.06,
        sig: 0.12,
    },

    hedge_fund: {
        mu: 0.055,
        sig: 0.1,
    },

    private_equity: {
        mu: 0.09,
        sig: 0.25,
    },

    structured: {
        mu: 0.05,
        sig: 0.09,
    },

    alternative: {
        mu: 0.055,
        sig: 0.16,
    },

    crypto: {
        mu: 0.1,
        sig: 0.45,
    },

    cash: {
        mu: 0.02,
        sig: 0.01,
    },

    other: {
        mu: 0.05,
        sig: 0.12,
    },
};

function growDefaultAssetBuckets(args: {
    buckets: AssetBuckets;
    capitalGainsDrag: number;
    yearOffset: number;
    mu: number;
    sig: number;
    normalRandom: () => number;
}): AssetBuckets {
    const {
        buckets,
        capitalGainsDrag,
        mu: activeMu,
        sig: activeSig,
        normalRandom,
    } = args;

    const result: AssetBuckets = {};

    const mixedAssumption =
        ASSET_CLASS_MC.mixed;

    const muScale =
        activeMu / mixedAssumption.mu;

    const sigScale =
        activeSig / mixedAssumption.sig;

    for (const [assetClass, value] of Object.entries(
        buckets,
    )) {
        const assumption =
            ASSET_CLASS_MC[assetClass] ??
            ASSET_CLASS_MC.other;

        /*
         * Match the HTML:
         *
         * muNet =
         *   max(0.001, classMu * muScale)
         *   * (1 - capitalGainsDrag)
         */
        const netMu =
            Math.max(
                0.001,
                assumption.mu * muScale,
            ) *
            (1 - capitalGainsDrag);

        const adjustedSig = Math.max(
            0.01,
            assumption.sig * sigScale,
        );

        /*
         * The profile has glidepath disabled, so the HTML
         * glidepathAdjust() currently returns these unchanged.
         */
        const logReturn =
            netMu -
            0.5 *
            adjustedSig *
            adjustedSig +
            adjustedSig * normalRandom();

        result[assetClass] = Math.max(
            0,
            value * Math.exp(logReturn),
        );
    }

    return result;
}

// ─────────────────────────────────────────────────────────────
// Default pension calculation
// ─────────────────────────────────────────────────────────────

function calculateDefaultPension(args: {
    source: string;
    annualAmount: number;
    startAge: number;
    cola: string;
    currentAge: number;
    inflationRate: number;
}): number {
    const {
        source,
        annualAmount,
        startAge,
        cola,
        currentAge,
        inflationRate,
    } = args;

    if (
        source === "none" ||
        currentAge < startAge ||
        annualAmount <= 0
    ) {
        return 0;
    }

    const yearsReceivingPension =
        currentAge - startAge;

    switch (cola) {
        case "full":
            return (
                annualAmount *
                Math.pow(
                    1 + inflationRate,
                    yearsReceivingPension,
                )
            );

        case "half":
            return (
                annualAmount *
                Math.pow(
                    1 + inflationRate * 0.5,
                    yearsReceivingPension,
                )
            );

        case "none":
        default:
            return annualAmount;
    }
}

// ─────────────────────────────────────────────────────────────
// Default equity compensation
// ─────────────────────────────────────────────────────────────

function calculateDefaultEquityVestIncome(
    plan: LegacyWealthPlan,
    yearOffset: number,
): number {
    /*
     * Your schema currently validates equityComp only as objects
     * containing IDs, so its monetary and vesting properties are not
     * typed yet.
     *
     * This safely reads common legacy property names while preserving
     * the complete runMC step.
     */
    let total = 0;

    for (const item of plan.equityComp) {
        const record = item as Record<string, unknown>;

        const vestYear = readFiniteNumber(
            record.vestYear ??
            record.year ??
            record.startYear,
        );

        const amount = readFiniteNumber(
            record.amount ??
            record.amt ??
            record.value ??
            record.annual,
        );

        if (
            amount === null ||
            amount <= 0
        ) {
            continue;
        }

        if (vestYear === null) {
            continue;
        }

        const projectionYear =
            new Date().getFullYear() + yearOffset;

        if (vestYear === projectionYear) {
            total += amount;
        }
    }

    return total;
}

// ─────────────────────────────────────────────────────────────
// Default tax behavior
// ─────────────────────────────────────────────────────────────

type TaxBand = readonly [
    upperLimit: number,
    ratePercent: number,
];

const TAX_BRACKETS: Record<
    string,
    readonly TaxBand[]
> = {
    US: [
        [11_600, 10],
        [47_150, 12],
        [100_525, 22],
        [191_950, 24],
        [243_725, 32],
        [609_350, 35],
        [Number.POSITIVE_INFINITY, 37],
    ],

    OTHER: [
        [Number.POSITIVE_INFINITY, 25],
    ],
};

const US_STATE_TAX_RATES: Record<
    string,
    number
> = {
    AL: 4.8,
    AK: 0,
    AZ: 2.5,
    AR: 4.4,
    CA: 7.5,
    CO: 4.4,
    CT: 5.0,
    DE: 5.2,
    FL: 0,
    GA: 5.49,
    HI: 8.25,
    ID: 5.8,
    IL: 4.95,
    IN: 3.15,
    IA: 4.82,
    KS: 5.7,
    KY: 4.0,
    LA: 4.25,
    ME: 6.0,
    MD: 5.0,
    MA: 5.0,
    MI: 4.25,
    MN: 7.0,
    MS: 5.0,
    MO: 4.8,
    MT: 6.5,
    NE: 5.5,
    NV: 0,
    NH: 0,
    NJ: 5.53,
    NM: 4.9,
    NY: 6.85,
    NC: 4.75,
    ND: 1.5,
    OH: 3.0,
    OK: 4.75,
    OR: 8.5,
    PA: 3.07,
    RI: 4.75,
    SC: 6.5,
    SD: 0,
    TN: 0,
    TX: 0,
    UT: 4.65,
    VT: 6.0,
    VA: 5.75,
    WA: 0,
    WV: 5.12,
    WI: 5.3,
    WY: 0,
    DC: 8.5,
};

function getDefaultShouldApplyTax(
    plan: LegacyWealthPlan,
): boolean {
    const value =
        plan.fields.taxApply
            .trim()
            .toLowerCase();

    return (
        value === "true" ||
        value === "yes" ||
        value === "on" ||
        value === "apply" ||
        value === "1"
    );
}

function computeLegacyFederalTax(
    income: number,
    bands: readonly TaxBand[],
): number {
    if (income <= 0) {
        return 0;
    }

    let tax = 0;
    let previousCap = 0;

    for (const [cap, ratePercent] of bands) {
        const taxableUpperLimit = Math.min(
            income,
            cap,
        );

        if (taxableUpperLimit > previousCap) {
            tax +=
                (taxableUpperLimit - previousCap) *
                (ratePercent / 100);
        }

        previousCap = cap;

        if (income <= cap) {
            break;
        }
    }

    return tax;
}

function computeLegacyStateTax(
    plan: LegacyWealthPlan,
    income: number,
): number {
    if (income <= 0) {
        return 0;
    }

    const country =
        plan.fields.c1co || "US";

    if (country !== "US") {
        return 0;
    }

    const stateCode =
        plan.fields.taxState ||
        plan.fields.c1st ||
        "";

    const stateRate =
        US_STATE_TAX_RATES[stateCode] ?? 0;

    return income * (stateRate / 100);
}

function computeLegacyChildTaxSaving(
    plan: LegacyWealthPlan,
    grossIncome: number,
): number {
    if (
        plan.children.length === 0 ||
        grossIncome <= 0
    ) {
        return 0;
    }

    const country =
        plan.fields.c1co || "US";

    if (country !== "US") {
        return 0;
    }

    const eligibleChildren =
        plan.children.filter((child) => {
            const record =
                child as Record<string, unknown>;

            const dateOfBirth =
                typeof record.dob === "string"
                    ? record.dob
                    : "";

            if (!dateOfBirth) {
                return true;
            }

            const age =
                ageFromDateOfBirth(dateOfBirth);

            return age === null || age < 17;
        }).length;

    let credit =
        eligibleChildren * 2_000;

    if (grossIncome > 200_000) {
        credit = Math.max(
            0,
            credit -
            (grossIncome - 200_000) *
            0.05,
        );
    }

    return credit;
}

function computeDefaultIncomeTax(
    plan: LegacyWealthPlan,
    totalIncome: number,
): number {
    if (
        totalIncome <= 0 ||
        !getDefaultShouldApplyTax(plan)
    ) {
        return 0;
    }

    const mode =
        plan.fields.taxMode
            .trim()
            .toLowerCase();

    if (mode === "none") {
        return 0;
    }

    if (
        mode === "flat" ||
        mode === "custom"
    ) {
        const flatRate =
            numberField(plan.fields.taxFlat) / 100;

        return totalIncome * flatRate;
    }

    const country =
        plan.fields.c1co || "US";

    const federalBands =
        TAX_BRACKETS[country] ??
        TAX_BRACKETS.OTHER;

    const federalTax =
        computeLegacyFederalTax(
            totalIncome,
            federalBands,
        );

    const stateTax =
        computeLegacyStateTax(
            plan,
            totalIncome,
        );

    const childTaxSaving =
        computeLegacyChildTaxSaving(
            plan,
            totalIncome,
        );

    return Math.max(
        0,
        federalTax +
        stateTax -
        childTaxSaving,
    );
}

// ─────────────────────────────────────────────────────────────
// Unknown legacy-object reader
// ─────────────────────────────────────────────────────────────

function readFiniteNumber(
    value: unknown,
): number | null {
    if (
        typeof value === "number" &&
        Number.isFinite(value)
    ) {
        return value;
    }

    if (
        typeof value === "string" &&
        value.trim() !== ""
    ) {
        const parsed = Number(value);

        return Number.isFinite(parsed)
            ? parsed
            : null;
    }

    return null;
}

function calculatePercentileSeries(
    paths: MonteCarloPath[],
    requestedPercentiles: number[],
): PercentileSeries {
    const percentileSeries: PercentileSeries = {};

    for (const percentileValue of requestedPercentiles) {
        percentileSeries[`p${percentileValue}`] = [];
    }

    if (paths.length === 0) {
        return percentileSeries;
    }

    const numberOfYears = paths[0].values.length;

    for (let yearIndex = 0; yearIndex < numberOfYears; yearIndex++) {
        const valuesForYear = paths
            .map((path) => path.values[yearIndex])
            .sort((a, b) => a - b);

        // for (const percentileValue of requestedPercentiles) {
        //   percentileSeries[`p${percentileValue}`].push(
        //     calculatePercentile(
        //       valuesForYear,
        //       percentileValue,
        //     ),
        //   );
        // }
        for (const percentileValue of requestedPercentiles) {
            /*
             * Legacy HTML convention:
             *
             * P30 means a 30% chance of ending above this value,
             * so it corresponds to the statistical 70th percentile.
             *
             * P80 means an 80% chance of ending above this value,
             * so it corresponds to the statistical 20th percentile.
             */
            const statisticalPercentile =
                100 - percentileValue;

            percentileSeries[`p${percentileValue}`].push(
                calculatePercentile(
                    valuesForYear,
                    statisticalPercentile,
                ),
            );
        }
    }

    return percentileSeries;
}

function calculateFinalPercentiles(
    percentileSeries: PercentileSeries,
): FinalPercentiles {
    const finalPercentiles: FinalPercentiles = {};

    for (const [key, values] of Object.entries(
        percentileSeries,
    )) {
        finalPercentiles[key] =
            values.length > 0
                ? values[values.length - 1]
                : 0;
    }

    return finalPercentiles;
}

function deflatePercentileSeries(
    percentileSeries: PercentileSeries,
    annualInflation: number,
): PercentileSeries {
    const result: PercentileSeries = {};

    for (const [key, values] of Object.entries(
        percentileSeries,
    )) {
        result[key] = values.map(
            (value, yearIndex) =>
                value /
                Math.pow(
                    1 + annualInflation,
                    yearIndex,
                ),
        );
    }

    return result;
}
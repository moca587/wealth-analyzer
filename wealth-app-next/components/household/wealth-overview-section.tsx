import type { WealthPlan } from "@/lib/engine/types";
import {
    formatMoney,
    estimateIncomeTax,
    computeStateTax,
    calcMortgagePayment,
} from "@/lib/engine/financial-math";
import { AssetAllocationDonut } from "./asset-allocation-donut";

export function WealthOverviewSection({ plan }: { plan: WealthPlan }) {
    const totalAssets = plan.assets.reduce(
        (sum, asset) => sum + (Number(asset.value) || 0),
        0
    );

    const totalDebt = plan.loans.reduce(
        (sum, loan) => sum + (Number(loan.bal) || 0),
        0
    );

    const netWorth = totalAssets - totalDebt;

    const grossIncome = plan.incomes.reduce(
        (sum, income) => sum + (Number(income.amount) || 0),
        0
    );

    // WealthPlan expenses are stored monthly.
    const monthlyExpenses = plan.expenses.reduce(
        (sum, expense) => sum + (Number(expense.amount) || 0),
        0
    );

    const annualExpenses = monthlyExpenses * 12;

    const primaryClient = plan.clients[0];
    const country = primaryClient?.country ?? "US";
    const state = primaryClient?.state;

    const federalTax = estimateIncomeTax(grossIncome, country);
    const stateTax = computeStateTax(grossIncome, country, state);
    const annualTax = federalTax + stateTax;

    const annualDebtService = plan.loans.reduce((sum, loan) => {
        const balance = Number(loan.bal) || 0;
        const rate = Number(loan.rate) || 0;
        const years = Number(loan.yrs) || 0;

        // Match legacy loanMonthly() behavior.
        if (years <= 0) {
            const monthlyRate = rate / 100 / 12;

            const monthlyPayment =
                monthlyRate > 0
                    ? balance * monthlyRate
                    : balance / 120;

            return sum + monthlyPayment * 12;
        }

        const monthlyPayment = calcMortgagePayment(
            balance,
            rate,
            years
        );

        return sum + monthlyPayment * 12;
    }, 0);

    const annualSurplus =
        grossIncome -
        annualTax -
        annualExpenses -
        annualDebtService;

    const monthlyCashflow = annualSurplus / 12;

    const savingsRate =
        grossIncome > 0
            ? (annualSurplus / grossIncome) * 100
            : null;

    const debtToAsset =
        totalAssets > 0
            ? (totalDebt / totalAssets) * 100
            : null;

    return (
        <section className="mb-6 flex min-h-[290px] overflow-hidden rounded-xl bg-gradient-to-br from-white to-[#f0f5ff] shadow-[0_1px_4px_rgba(0,0,0,.05),0_6px_20px_rgba(0,87,184,.07)]">
            <div className="flex flex-1 flex-col px-9 py-8">
                <h1 className="bg-gradient-to-br from-[#0057b8] to-[#4da6ff] bg-clip-text text-[27px] font-extrabold leading-[1.1] tracking-[-0.045em] text-transparent">
                    Your Wealth Overview
                </h1>

                <p className="mb-[22px] mt-1 text-[13px] leading-[1.65] text-[#9ca3af]">
                    Here&apos;s a complete picture of your household&apos;s financial
                    position right now.
                </p>

                <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.10em] text-[#9ca3af]">
                    Net Worth
                </div>

                <div className="text-[40px] font-extrabold leading-none tracking-[-0.05em] text-[#16213e]">
                    {formatMoney(netWorth, plan.currency)}
                </div>

                <div className="mb-[22px] mt-1 text-[11px] text-[#9ca3af]">
                    As of {new Date().toLocaleDateString()}
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                    <Metric
                        label="Total Assets"
                        value={formatMoney(totalAssets, plan.currency)}
                    />

                    <Metric
                        label="Total Debt"
                        value={formatMoney(totalDebt, plan.currency)}
                    />

                    <Metric
                        label="Monthly Cashflow"
                        value={`${formatMoney(monthlyCashflow, plan.currency)}/mo`}
                    />

                    <Metric
                        label="Savings Rate"
                        value={
                            savingsRate !== null
                                ? `${savingsRate.toFixed(1)}%`
                                : "—"
                        }
                    />

                    <Metric
                        label="Debt-to-Asset"
                        value={
                            debtToAsset !== null
                                ? `${debtToAsset.toFixed(1)}%`
                                : "—"
                        }
                    />

                    <Metric
                        label="Projected Wealth (median)"
                        value="—"
                    />
                </div>
            </div>

            <div className="flex w-[300px] flex-col items-center justify-center gap-[18px] border-l border-[rgba(0,87,184,.07)] bg-[#eaf1ff] px-6 py-7">                <div className="text-[10px] font-bold uppercase tracking-[0.10em] text-[#9ca3af]">
                Asset Allocation
            </div>

                <AssetAllocationDonut
                    assets={plan.assets}
                    currency={plan.currency}
                />

                {totalAssets === 0 && (
                    <div className="text-center text-[11px] text-[#9ca3af]">
                        Add assets to see breakdown
                    </div>
                )}
            </div>
        </section>
    );
}

function Metric({
    label,
    value,
}: {
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-center gap-[11px] rounded-[10px] border border-[rgba(0,87,184,.08)] bg-white/65 px-3 py-[11px]">
            <div className="min-w-0">
                <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-[0.07em] text-[#9ca3af]">
                    {label}
                </div>

                <div className="truncate text-[15px] font-bold tracking-[-0.025em] text-[#16213e]">
                    {value}
                </div>
            </div>
        </div>
    );
}
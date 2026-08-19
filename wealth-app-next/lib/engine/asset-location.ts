import type {
    AssetClass,
    AssetLocationAnalysis,
    AssetLocationRecommendation,
    WealthPlan,
} from "./types";

export function buildAssetLocationAnalysis(
    plan: WealthPlan
): AssetLocationAnalysis {
    let taxFree = 0;
    let taxDeferred = 0;
    let taxable = 0;

    // ─────────────────────────────────────────────
    // Classify accounts by tax treatment
    // ─────────────────────────────────────────────

    for (const asset of plan.assets) {
        const value =
            Number(asset.value || 0);

        const type =
            asset.type.toLowerCase();

        const group =
            asset.group?.toLowerCase() ?? "";

        // Ignore assets that are not part of
        // financial account-location analysis.
        if (
            asset.cls === "real_estate" ||
            group.includes("real estate") ||
            group === "other"
        ) {
            continue;
        }

        if (
            type.includes("roth") ||
            type.includes("hsa") ||
            type.includes("tfsa") ||
            type.includes("isa") ||
            type.includes("nisa")
        ) {
            taxFree += value;
            continue;
        }

        if (
            type.includes("401") ||
            type.includes("ira") ||
            type.includes("rrsp") ||
            type.includes("rrif") ||
            type.includes("sipp") ||
            group.includes("retirement")
        ) {
            taxDeferred += value;
            continue;
        }

        taxable += value;
    }

    const total =
        taxFree +
        taxDeferred +
        taxable;

    // ─────────────────────────────────────────────
    // Asset-location score
    //
    // Tax-free      = 100% credit
    // Tax-deferred  = 70% credit
    // Taxable       = 0% credit
    // ─────────────────────────────────────────────

    const score =
        total > 0
            ? (
                taxFree * 1 +
                taxDeferred * 0.7
            ) /
            total *
            100
            : 0;

    // ─────────────────────────────────────────────
    // Tax drag
    // ─────────────────────────────────────────────

    const portfolioReturn =
        plan.returnMean ??
        0.07;

    const marginalTaxRate =
        plan.capitalGainsTaxRate ??
        0.25;

    const annualTaxDrag =
        taxable *
        portfolioReturn *
        marginalTaxRate; // $/yr

    const horizonYears =
        30;

    // Simple cumulative estimate.
    const cumulativeTaxDrag =
        annualTaxDrag *
        horizonYears;

    // Needs deterministic cash-flow shortfall
    // data later.
    const shortfallCostBasisTax =
        0;

    // ─────────────────────────────────────────────
    // Holding location recommendations
    // ─────────────────────────────────────────────

    const holdings =
        plan.holdings ?? [];

    const valueByClass =
        new Map<AssetClass, number>(); // cls -> value 

    for (const holding of holdings) {
        const cls =
            holding.cls ??
            "mixed";

        valueByClass.set(
            cls,
            (
                valueByClass.get(cls) ??
                0
            ) +
            Number(
                holding.value || 0
            )
        );
    }

    const recommendations:
        AssetLocationRecommendation[] =
        [];

    for (const [
        assetClass,
        value,
    ] of valueByClass.entries()) {
        const recommendation =
            recommendationForClass(
                assetClass,
                value
            );

        recommendations.push(
            recommendation
        );
    }

    return {
        taxFree,
        taxDeferred,
        taxable,
        score,
        annualTaxDrag,
        cumulativeTaxDrag,
        shortfallCostBasisTax,
        recommendations,
    };
}

function recommendationForClass(
    assetClass: AssetClass,
    value: number
): AssetLocationRecommendation {
    switch (assetClass) {
        case "fixed_income":
            return {
                assetClass:
                    "fixed_income",
                value,
                recommendedLocation:
                    "Tax-deferred / tax-free",
                reason:
                    "Interest is typically tax-inefficient because it is taxed as ordinary income.",
            };

        case "equity":
            return {
                assetClass:
                    "equity",
                value,
                recommendedLocation:
                    "Taxable — tax-efficient as is",
                reason:
                    "Qualified dividends, long-term capital gains, and tax-loss harvesting can make equities relatively tax-efficient in taxable accounts.",
            };

        case "real_estate":
            return {
                assetClass:
                    "real_estate",
                value,
                recommendedLocation:
                    "Depends on vehicle",
                reason:
                    "Tax treatment varies substantially between direct property, REITs, and retirement-account holdings.",
            };

        case "alternative":
            return {
                assetClass:
                    "alternative",
                value,
                recommendedLocation:
                    "Tax-deferred / tax-free",
                reason:
                    "Alternative strategies may generate tax-inefficient income or frequent realizations.",
            };

        case "crypto":
            return {
                assetClass:
                    "crypto",
                value,
                recommendedLocation:
                    "Taxable / specialized account",
                reason:
                    "Tax treatment depends heavily on jurisdiction and account availability.",
            };

        default:
            return {
                assetClass:
                    assetClass as AssetLocationRecommendation["assetClass"],
                value,
                recommendedLocation:
                    "Review account placement",
                reason:
                    "Tax efficiency depends on the income and gain characteristics of the holding.",
            };
    }
}
"use client";

import { useState } from "react";
import type { Asset } from "@/lib/engine/types";
import { formatMoney } from "@/lib/engine/financial-math";

const GROUP_LABELS: Record<string, string> = {
    "cash & banking": "Banking & Cash",
    "investment accounts": "Investment Accounts",
    "retirement accounts": "Retirement Accounts",
    "real estate": "Real Estate",
    "other": "Other Assets",
};

const GROUP_COLORS: Record<string, string> = {
    "cash & banking": "#0057b8",
    "investment accounts": "#5b9bd5",
    "retirement accounts": "#7c3aed",
    "real estate": "#00875a",
    "other": "#f59e0b",
};

export function AssetAllocationDonut({
    assets,
    currency,
}: {
    assets: Asset[];
    currency: string;
}) {
    // State that remembers which donut category the user is hovering over, so we can highlight it and show its value in the center of the donut.
    const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

    const grouped = assets.reduce<Record<string, number>>((acc, asset) => {
        const value = Number(asset.value) || 0;

        if (value <= 0) return acc;

        const rawGroup = asset.group?.trim().toLowerCase() ?? "";

        let group: string;

        if (
            rawGroup.includes("cash") ||
            rawGroup.includes("bank")
        ) {
            group = "cash & banking";
        } else if (rawGroup.includes("retirement")) {
            group = "retirement accounts";
        } else if (
            rawGroup.includes("investment") ||
            rawGroup.includes("brokerage")
        ) {
            group = "investment accounts";
        } else if (
            rawGroup.includes("real estate") ||
            rawGroup.includes("property")
        ) {
            group = "real estate";
        } else {
            group = "other";
        }

        acc[group] = (acc[group] ?? 0) + value;

        return acc;
    }, {});

    const slices = Object.entries(grouped)
        .map(([group, value]) => ({
            group,
            value,
            label: GROUP_LABELS[group] ?? "Other Assets",
            color: GROUP_COLORS[group] ?? "#94a3b8",
        }))
        .filter((slice) => slice.value > 0);

    const total = slices.reduce((sum, slice) => sum + slice.value, 0);

    const hoveredSlice =
        slices.find((slice) => slice.group === hoveredGroup) ?? null;

    if (total <= 0) {
        return (
            <div className="text-center">
                <div className="mx-auto flex h-[190px] w-[190px] items-center justify-center rounded-full border-[18px] border-[#d9e5fb] bg-white">
                    <div>
                        <div className="text-xs text-[#9ca3af]">Assets</div>
                        <div className="font-bold text-[#16213e]">—</div>
                    </div>
                </div>

                <div className="mt-4 text-[11px] text-[#9ca3af]">
                    Add assets to see breakdown
                </div>
            </div>
        );
    }

    const radius = 72;
    const circumference = 2 * Math.PI * radius;

    let runningPercent = 0;

    return (
        <div className="flex flex-col items-center">
            <div className="relative h-[190px] w-[190px]">
                <svg
                    viewBox="0 0 190 190"
                    className="h-full w-full -rotate-90"
                    aria-label="Asset allocation"
                >
                    <circle
                        cx="95"
                        cy="95"
                        r={radius}
                        fill="none"
                        stroke="#d9e5fb"
                        strokeWidth="24"
                    />

                    {slices.map((slice) => {
                        const percent = slice.value / total;

                        const dash = percent * circumference;
                        const gap = circumference - dash;

                        const offset = -runningPercent * circumference;

                        runningPercent += percent;

                        return (
                            <circle
                                key={slice.group}
                                cx="95"
                                cy="95"
                                r={radius}
                                fill="none"
                                stroke={slice.color}
                                strokeWidth={hoveredGroup === slice.group ? 28 : 24}
                                strokeDasharray={`${dash} ${gap}`}
                                strokeDashoffset={offset}
                                strokeLinecap="butt"
                                className="cursor-pointer transition-all duration-150"
                                onMouseEnter={() => setHoveredGroup(slice.group)}
                                onMouseLeave={() => setHoveredGroup(null)}
                            />
                        );
                    })}
                </svg>

                <div className="pointer-events-none absolute inset-0 flex items-center justify-center text-center">
                    {hoveredSlice ? (
                        <div>
                            <div className="text-[11px] font-medium text-[#64748b]">
                                {hoveredSlice.label}
                            </div>

                            <div className="mt-0.5 text-[15px] font-bold text-[#16213e]">
                                {formatMoney(hoveredSlice.value, currency)}
                            </div>

                            <div className="mt-0.5 text-[11px] font-semibold text-[#0057b8]">
                                {((hoveredSlice.value / total) * 100).toFixed(1)}%
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="text-xs text-[#9ca3af]">
                                Assets
                            </div>

                            <div className="font-bold text-[#16213e]">
                                {formatMoney(total, currency)}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4 w-full space-y-1.5">
                {slices.map((slice) => {
                    const percent = (slice.value / total) * 100;

                    return (
                        <div
                            key={slice.group}
                            className="flex items-center justify-between text-[11px]"
                        >
                            <div className="flex items-center gap-2">
                                <span
                                    className="h-2.5 w-2.5 rounded-full"
                                    style={{ backgroundColor: slice.color }}
                                />

                                <span className="text-[#64748b]">
                                    {slice.label}
                                </span>
                            </div>

                            <span className="font-semibold text-[#16213e]">
                                {percent.toFixed(0)}%
                            </span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
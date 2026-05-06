"use client";

import type { TabularCell } from "../shared/types";

function aggregateMax(scores: Record<string, number[]> | null | undefined): number | null {
    if (!scores) return null;
    let max = -Infinity;
    for (const arr of Object.values(scores)) {
        for (const v of arr) if (v > max) max = v;
    }
    return Number.isFinite(max) ? max : null;
}

function aggregateMeanTopK(
    scores: Record<string, number[]> | null | undefined,
    k = 5,
): number | null {
    if (!scores) return null;
    const all: number[] = [];
    for (const arr of Object.values(scores)) all.push(...arr);
    if (!all.length) return null;
    all.sort((a, b) => b - a);
    const top = all.slice(0, Math.min(k, all.length));
    return top.reduce((s, v) => s + v, 0) / top.length;
}

function badgeClass(score: number): string {
    if (score >= 0.7) return "bg-red-500";
    if (score >= 0.4) return "bg-amber-400";
    return "bg-emerald-500";
}

interface Props {
    cell: TabularCell;
}

export function ProbeBadge({ cell }: Props) {
    if (cell.probe_status === "scoring") {
        return (
            <span
                className="absolute right-3 top-1.5 h-1.5 w-1.5 rounded-full bg-gray-300 animate-pulse"
                title="Scoring…"
            />
        );
    }

    const max = aggregateMax(cell.probe_scores);
    const meanTopK = aggregateMeanTopK(cell.probe_scores);
    if (max === null || meanTopK === null) return null;

    const tooltip =
        `Probe max: ${max.toFixed(2)}\nMean top-5: ${meanTopK.toFixed(2)}` +
        (cell.probe_status === "skipped" ? "\n(probe service unavailable)" : "");

    return (
        <span
            className={`absolute right-3 top-1.5 h-1.5 w-1.5 rounded-full ${badgeClass(max)}`}
            title={tooltip}
        />
    );
}

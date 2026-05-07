"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "mike.probeThreshold";
const DEFAULT_THRESHOLD = 0.3;

function readStored(): number {
    if (typeof window === "undefined") return DEFAULT_THRESHOLD;
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_THRESHOLD;
    const n = parseFloat(raw);
    return Number.isFinite(n) && n >= 0 && n <= 1 ? n : DEFAULT_THRESHOLD;
}

export function useProbeThreshold(): [number, (next: number) => void] {
    const [threshold, setThresholdState] = useState<number>(DEFAULT_THRESHOLD);

    useEffect(() => {
        setThresholdState(readStored());
    }, []);

    const setThreshold = useCallback((next: number) => {
        const clamped = Math.max(0, Math.min(1, next));
        setThresholdState(clamped);
        if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, clamped.toFixed(2));
        }
    }, []);

    return [threshold, setThreshold];
}

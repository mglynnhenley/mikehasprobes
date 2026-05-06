"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "mike.enableThinking";

function readStored(): boolean {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function useThinkingMode(): [boolean, (next: boolean) => void] {
    const [enabled, setEnabledState] = useState<boolean>(false);

    useEffect(() => {
        setEnabledState(readStored());
    }, []);

    const setEnabled = useCallback((next: boolean) => {
        setEnabledState(next);
        if (typeof window !== "undefined") {
            window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
        }
    }, []);

    return [enabled, setEnabled];
}

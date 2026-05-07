"use client";

interface Props {
    text: string;
    scores: Record<string, number[]> | null | undefined;
    probeName?: string;
    /** Tokens with scores at or below this value are not tinted. */
    threshold?: number;
}

/**
 * Map a probe score to an rgba tint. Scores ≤ threshold are treated as
 * clean; above the threshold the alpha scales linearly toward 0.7 as the
 * score approaches 1.
 */
function tokenColor(score: number, threshold: number): string {
    const clamped = Math.max(0, Math.min(1, score));
    if (clamped <= threshold) return "transparent";
    const span = Math.max(0.01, 1 - threshold);
    const t = (clamped - threshold) / span;
    const alpha = Math.min(0.7, 0.15 + t * 0.55);
    return `rgba(239, 68, 68, ${alpha.toFixed(3)})`;
}

/**
 * Renders `text` with per-token hallucination probe scores painted as
 * background colors directly behind the prose. Probe tokens are subword
 * units we don't have access to client-side, so we map evenly by character
 * position: char `c` of `T` total maps to `scores[floor(c * N / T)]`.
 */
export function HighlightedSummary({ text, scores, probeName, threshold = 0.3 }: Props) {
    console.log("[HighlightedSummary] render", {
        textLen: text?.length,
        hasScores: !!scores,
        scoreKeys: scores ? Object.keys(scores) : [],
        threshold,
    });
    if (!text || !scores) return null;
    const series =
        (probeName && scores[probeName]) ??
        Object.values(scores)[0] ??
        null;
    if (!series || !series.length) return null;
    console.log("[HighlightedSummary] series", {
        length: series.length,
        min: Math.min(...series),
        max: Math.max(...series),
        avg: series.reduce((a, b) => a + b, 0) / series.length,
    });

    const N = series.length;
    const T = text.length;

    // Build a flat list of {char, score} by walking text and grouping
    // consecutive characters that share the same score index.
    const chunks: { text: string; score: number }[] = [];
    let cursor = 0;
    while (cursor < T) {
        const idx = Math.min(N - 1, Math.floor((cursor * N) / T));
        let next = cursor + 1;
        while (next < T && Math.min(N - 1, Math.floor((next * N) / T)) === idx) {
            next++;
        }
        chunks.push({ text: text.slice(cursor, next), score: series[idx] });
        cursor = next;
    }

    return (
        <span className="whitespace-pre-wrap">
            {chunks.map((c, i) => (
                <span
                    key={i}
                    style={{ backgroundColor: tokenColor(c.score, threshold) }}
                    title={`Score ${c.score.toFixed(2)}`}
                >
                    {c.text}
                </span>
            ))}
        </span>
    );
}

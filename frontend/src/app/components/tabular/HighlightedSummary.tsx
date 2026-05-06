"use client";

interface Props {
    scores: Record<string, number[]> | null | undefined;
    probeName?: string;
}

function tokenColor(score: number): string {
    const clamped = Math.max(0, Math.min(1, score));
    const alpha = clamped * 0.85;
    return `rgba(239, 68, 68, ${alpha.toFixed(3)})`;
}

export function HighlightedSummary({ scores, probeName }: Props) {
    if (!scores) return null;
    const series =
        (probeName && scores[probeName]) ??
        Object.values(scores)[0] ??
        null;
    if (!series || !series.length) return null;

    return (
        <div className="mt-1.5 flex h-1 w-full overflow-hidden rounded-full bg-gray-100">
            {series.map((score, i) => (
                <div
                    key={i}
                    className="h-full flex-1"
                    style={{ backgroundColor: tokenColor(score) }}
                    title={`Token ${i + 1}: ${score.toFixed(2)}`}
                />
            ))}
        </div>
    );
}

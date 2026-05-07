import OpenAI from "openai";

export type ProbeScoreEvent = {
    scores: Record<string, number>;
};

export type ProbeMessage = {
    role: "system" | "user" | "assistant";
    content: string;
};

export type StreamScoreMessagesParams = {
    messages: ProbeMessage[];
    model?: string;
    probeName?: string;
    onScore: (event: ProbeScoreEvent) => void;
    signal?: AbortSignal;
};

export type StreamScoreParams = {
    prompt: string;
    completion: string;
    model?: string;
    probeName?: string;
    onScore: (event: ProbeScoreEvent) => void;
    signal?: AbortSignal;
};

export type StreamScoreResult = {
    scores: Record<string, number[]>;
};

function client(): OpenAI {
    return new OpenAI({
        baseURL: process.env.PROBE_API_URL,
        apiKey: process.env.PROBE_API_KEY ?? "",
    });
}

/**
 * Score the prefilled assistant turn through the probe service via the
 * standard `/v1/chat/completions` endpoint. Returns one score per token of
 * the trailing assistant message.
 *
 * The response is non-streaming. We still surface a per-token `onScore`
 * callback so the SSE animation in the UI works the same way it does for
 * the mock probe.
 */
export async function streamScoreMessages(
    params: StreamScoreMessagesParams,
): Promise<StreamScoreResult | null> {
    if (!process.env.PROBE_API_URL) return null;
    const last = params.messages[params.messages.length - 1];
    if (!last || last.role !== "assistant") {
        console.error(
            "[probe] streamScoreMessages requires trailing assistant message",
        );
        return null;
    }

    const model = params.model ?? process.env.PROBE_MODEL ?? "default";
    console.log(`[probe] score start model=${model} msgs=${params.messages.length}`);
    const t0 = Date.now();
    try {
        const body = {
            model,
            messages: params.messages,
            include_scores: true,
            probe_name: params.probeName,
        } as unknown as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming;

        const response = (await client().chat.completions.create(body, {
            timeout: 240_000,
            signal: params.signal,
        })) as unknown as { scores?: Record<string, number[]> };

        const scores = response.scores ?? {};
        const counts = Object.fromEntries(
            Object.entries(scores).map(([k, v]) => [k, Array.isArray(v) ? v.length : 0]),
        );
        console.log(`[probe] score done in ${Date.now() - t0}ms scores=`, counts);
        for (const [name, arr] of Object.entries(scores)) {
            if (!Array.isArray(arr)) continue;
            for (const value of arr) {
                params.onScore({ scores: { [name]: value } });
            }
        }
        return { scores };
    } catch (err) {
        console.error(`[probe] score failed after ${Date.now() - t0}ms:`, err);
        return null;
    }
}

export function streamScoreCompletion(
    params: StreamScoreParams,
): Promise<StreamScoreResult | null> {
    return streamScoreMessages({
        messages: [
            { role: "user", content: params.prompt },
            { role: "assistant", content: params.completion },
        ],
        model: params.model,
        probeName: params.probeName,
        onScore: params.onScore,
        signal: params.signal,
    });
}

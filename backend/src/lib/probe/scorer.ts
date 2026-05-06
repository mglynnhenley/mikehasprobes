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

    try {
        const body = {
            model: params.model ?? process.env.PROBE_MODEL ?? "default",
            messages: params.messages,
            max_tokens: 1,
            temperature: 0,
            stream: true,
            extra_body: {
                include_scores: true,
                probe_name: params.probeName,
            },
        } as unknown as OpenAI.Chat.ChatCompletionCreateParamsStreaming;

        const stream = await client().chat.completions.create(body, {
            timeout: 60_000,
            signal: params.signal,
        });

        const accumulated: Record<string, number[]> = {};
        for await (const chunk of stream) {
            const s = (chunk as unknown as { scores?: Record<string, number> })
                .scores;
            if (!s) continue;
            params.onScore({ scores: s });
            for (const [name, value] of Object.entries(s)) {
                (accumulated[name] ??= []).push(value);
            }
        }
        return { scores: accumulated };
    } catch (err) {
        console.error("[probe] streamScoreMessages failed:", err);
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

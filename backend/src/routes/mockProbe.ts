import { Router } from "express";

export const mockProbeRouter = Router();

const RISKY_PATTERNS = [
    /berlin/i,
    /always/i,
    /never/i,
    /definitely/i,
    /guaranteed/i,
    /\b100%\b/,
    /undoubtedly/i,
    /certainly/i,
    /\$\d+/,
    /\b(19|20)\d{2}\b/,
];

function scoreToken(tok: string): number {
    const trimmed = tok.trim();
    if (!trimmed) return 0;
    if (RISKY_PATTERNS.some((re) => re.test(trimmed))) {
        return 0.65 + Math.random() * 0.3;
    }
    return Math.random() * 0.2;
}

mockProbeRouter.post("/v1/chat/completions", async (req, res) => {
    const messages = (req.body?.messages ?? []) as {
        role: string;
        content: string;
    }[];
    const last = messages[messages.length - 1];
    if (!last || last.role !== "assistant") {
        return void res
            .status(400)
            .json({ error: "Last message must be assistant prefill" });
    }
    const text = last.content ?? "";
    const tokens = text.split(/(\s+)/).filter((t: string) => t.trim().length);

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");
    res.flushHeaders();

    for (const tok of tokens) {
        const chunk = {
            id: "mock-probe",
            object: "chat.completion.chunk",
            created: Math.floor(Date.now() / 1000),
            model: "mock",
            choices: [
                { index: 0, delta: { content: "" }, finish_reason: null },
            ],
            scores: { hallucination: scoreToken(tok) },
        };
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        await new Promise((r) => setTimeout(r, 25));
    }

    res.write("data: [DONE]\n\n");
    res.end();
});

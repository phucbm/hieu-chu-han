import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

export async function POST(req: NextRequest) {
    const key = process.env.GROQ_API_KEY;
    const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";

    if (!key) {
        return new Response("AI not configured", { status: 503 });
    }

    const { simp, trad } = await req.json();
    if (!simp || typeof simp !== "string") {
        return new Response("Invalid body", { status: 400 });
    }

    const templatePath = path.join(process.cwd(), "public/prompts/word-analysis.md");
    const template = await readFile(templatePath, "utf-8");
    const tradLine = trad && trad !== simp ? `\n- Traditional: ${trad}` : "";
    const prompt = template
        .replace(/\{\{simp\}\}/g, simp)
        .replace(/\{\{trad\}\}/g, trad ?? simp)
        .replace(/\{\{trad_line\}\}/g, tradLine);

    const upstream = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
            model,
            stream: true,
            temperature: 0,
            max_tokens: 16384,
            messages: [{ role: "user", content: prompt }],
        }),
    });

    if (!upstream.ok) {
        const err = await upstream.text();
        return new Response(`Groq error ${upstream.status}: ${err}`, { status: 502 });
    }

    return new Response(upstream.body, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            Connection: "keep-alive",
        },
    });
}

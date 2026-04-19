const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

function getConfig() {
    const key = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    const model = process.env.NEXT_PUBLIC_GROQ_MODEL || "llama-3.1-8b-instant";
    return { key, model };
}

export function isGroqConfigured(): boolean {
    return !!process.env.NEXT_PUBLIC_GROQ_API_KEY;
}

async function loadPromptTemplate(): Promise<string> {
    const res = await fetch("/prompts/word-analysis.md");
    if (!res.ok) throw new Error("Không tải được prompt template");
    return res.text();
}

export async function* streamWordAnalysis(simp: string, trad?: string): AsyncGenerator<string> {
    const { key, model } = getConfig();
    if (!key) throw new Error("NEXT_PUBLIC_GROQ_API_KEY chưa được cấu hình");

    const template = await loadPromptTemplate();
    const tradLine = trad && trad !== simp ? `\n- Traditional: {{trad}}` : "";
    const prompt = template
        .replace(/\{\{simp\}\}/g, simp)
        .replace(/\{\{trad\}\}/g, trad ?? simp)
        .replace(/\{\{trad_line\}\}/g, tradLine);

    const res = await fetch(GROQ_API_URL, {
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

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Groq API lỗi ${res.status}: ${err}`);
    }

    const reader = res.body?.getReader();
    if (!reader) throw new Error("Không đọc được stream");

    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (!data || data === "[DONE]") continue;
            try {
                const obj = JSON.parse(data);
                const chunk = obj.choices?.[0]?.delta?.content;
                if (chunk) yield chunk;
            } catch {
                // malformed SSE line, skip
            }
        }
    }
}

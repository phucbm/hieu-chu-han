"use client";

import {useState} from "react";
import ReactMarkdown from "react-markdown";
import {useLiveQuery} from "dexie-react-hooks";
import {Button} from "@/components/ui/button";
import {isGroqConfigured, streamWordAnalysis} from "@/lib/groq";
import {db} from "@/lib/db";
import {BotMessageSquare, Check, Copy, Loader2} from "lucide-react";

interface WordAIExplanationProps {
    simp: string;
    trad?: string;
}

type Status = "idle" | "loading" | "streaming" | "done" | "error";

export function WordAIExplanation({simp, trad}: WordAIExplanationProps) {
    const [status, setStatus] = useState<Status>("idle");
    const [streamContent, setStreamContent] = useState("");
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    const cached = useLiveQuery(() => db.aiExplanations.get(simp), [simp]);

    if (!isGroqConfigured()) return null;

    const isRunning = status === "loading" || status === "streaming";
    const content = isRunning ? streamContent : (cached?.content ?? streamContent);
    const hasContent = !!content;

    async function handleGenerate() {
        setStatus("loading");
        setStreamContent("");
        setError("");

        try {
            const stream = streamWordAnalysis(simp, trad);
            setStatus("streaming");

            let full = "";
            for await (const chunk of stream) {
                full += chunk;
                setStreamContent(full);
            }

            const model = process.env.NEXT_PUBLIC_GROQ_MODEL || "llama-3.1-8b-instant";
            await db.aiExplanations.put({simp, content: full, model, generatedAt: Date.now()});

            setStatus("done");
            setStreamContent("");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Đã xảy ra lỗi");
            setStatus("error");
        }
    }

    async function handleCopy() {
        await navigator.clipboard.writeText(content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    const generatedAt = cached?.generatedAt
        ? new Date(cached.generatedAt).toLocaleDateString("vi-VN")
        : null;

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <p className="text-sm">Giải thích bằng AI</p>
                <div className="flex items-center gap-0.5">
                    {hasContent && !isRunning && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleCopy}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Sao chép"
                            aria-label="Sao chép nội dung"
                        >
                            {copied ? <Check className="h-3.5 w-3.5"/> : <Copy className="h-3.5 w-3.5"/>}
                        </Button>
                    )}
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerate}
                        disabled={isRunning}
                        className="gap-1.5 text-xs h-7"
                    >
                        {isRunning ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin"/>
                        ) : (
                            <BotMessageSquare className="h-3.5 w-3.5"/>
                        )}
                        {isRunning ? "Đang xử lý..." : cached ? "Tạo lại" : "Phân tích"}
                    </Button>
                </div>
            </div>

            {status === "error" && (
                <p className="text-sm text-destructive">{error}</p>
            )}

            {hasContent && (
                <div className="rounded-xl bg-stone-100 p-4 flex flex-col gap-3">
                    <div className="prose prose-sm prose-stone max-w-none
                        prose-headings:font-semibold
                        prose-h2:text-base prose-h2:mt-0
                        prose-h3:text-sm prose-h3:mt-3 prose-h3:mb-1
                        prose-p:my-1 prose-p:text-sm
                        prose-li:text-sm prose-li:my-0
                        prose-ul:my-1 prose-ul:pl-4
                        prose-blockquote:text-sm prose-blockquote:not-italic prose-blockquote:border-l-2 prose-blockquote:border-stone-400 prose-blockquote:pl-3 prose-blockquote:text-stone-600
                        prose-strong:font-semibold">
                        <ReactMarkdown>{content}</ReactMarkdown>
                    </div>
                    <div className="flex items-center justify-between border-t border-stone-200 pt-2">
                        <p className="text-xs text-muted-foreground">
                            AI ({cached?.model ?? process.env.NEXT_PUBLIC_GROQ_MODEL ?? "llama-3.1-8b-instant"})
                            {generatedAt && !isRunning ? ` · ${generatedAt}` : ""} — chỉ để tham khảo.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}

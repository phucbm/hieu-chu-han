"use client";

import {useState} from "react";
import ReactMarkdown from "react-markdown";
import {Button} from "@/components/ui/button";
import {isGroqConfigured, streamWordAnalysis} from "@/lib/groq";
import {BotMessageSquare, Check, Copy, Loader2} from "lucide-react";

interface WordAIExplanationProps {
    simp: string;
    trad?: string;
}

type Status = "idle" | "loading" | "streaming" | "done" | "error";

export function WordAIExplanation({simp, trad}: WordAIExplanationProps) {
    const [status, setStatus] = useState<Status>("idle");
    const [content, setContent] = useState("");
    const [error, setError] = useState("");
    const [copied, setCopied] = useState(false);

    if (!isGroqConfigured()) return null;

    async function handleGenerate() {
        setStatus("loading");
        setContent("");
        setError("");

        try {
            const stream = streamWordAnalysis(simp, trad);
            setStatus("streaming");

            for await (const chunk of stream) {
                setContent(prev => prev + chunk);
            }

            setStatus("done");
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

    const isRunning = status === "loading" || status === "streaming";
    const hasContent = (status === "streaming" || status === "done") && !!content;

    return (
        <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
                <p className="text-sm">Giải thích bằng AI</p>
                <div className="flex items-center gap-0.5">
                    {hasContent && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={handleCopy}
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            title="Sao chép"
                            aria-label="Sao chép nội dung"
                        >
                            {copied
                                ? <Check className="h-3.5 w-3.5"/>
                                : <Copy className="h-3.5 w-3.5"/>
                            }
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
                        {status === "idle" ? "Phân tích" : isRunning ? "Đang xử lý..." : "Phân tích lại"}
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
                    <p className="text-xs text-muted-foreground border-t border-stone-200 pt-2">
                        AI ({process.env.NEXT_PUBLIC_GROQ_MODEL || "llama-3.1-8b-instant"}) - nội dung được tạo bởi AI, có thể không chính xác và chỉ để tham khảo.
                    </p>
                </div>
            )}
        </div>
    );
}

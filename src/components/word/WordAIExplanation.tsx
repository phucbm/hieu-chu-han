"use client";

import {useState} from "react";
import ReactMarkdown from "react-markdown";
import {useLiveQuery} from "dexie-react-hooks";
import {Button} from "@/components/ui/button";
import {streamWordAnalysis} from "@/lib/groq";
import {db} from "@/lib/db";
import {getDailyLimit, getRemainingCalls, getResetAt, recordAiCall} from "@/lib/aiRateLimit";
import {trackAiCall} from "@/core/pwa";
import {BotMessageSquare, Check, Copy, Loader2} from "lucide-react";
import {MovingBorder} from "@/components/phucbm/moving-border";

function resetIn(resetAt: number): string {
    const ms = resetAt - Date.now();
    if (ms <= 0) return "ngay bây giờ";
    const totalMin = Math.ceil(ms / 60_000);
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    if (h > 0 && m > 0) return `${h} giờ ${m} phút`;
    if (h > 0) return `${h} giờ`;
    return `${m} phút`;
}

function relativeTime(ts: number): string {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 3600) return `${Math.max(1, Math.floor(diff / 60))} phút trước`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
    return new Date(ts).toLocaleString("vi-VN", {dateStyle: "short", timeStyle: "short"});
}

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
    const remaining = useLiveQuery(() => getRemainingCalls(), [status]);
    const resetAt = useLiveQuery(() => getResetAt(), [status]);

    const limit = getDailyLimit();
    const isLimited = remaining === 0;

    const isRunning = status === "loading" || status === "streaming";
    const content = isRunning ? streamContent : (cached?.content ?? streamContent);
    const hasContent = !!content;

    async function handleGenerate() {
        const rem = await getRemainingCalls();
        if (rem !== null && rem <= 0) {
            setError("Đã dùng hết lượt hôm nay.");
            return;
        }

        setStatus("loading");
        setStreamContent("");
        setError("");

        try {
            const stream = streamWordAnalysis(simp, trad);
            setStatus("streaming");
            await recordAiCall();

            let full = "";
            for await (const chunk of stream) {
                full += chunk;
                setStreamContent(full);
            }

            await db.aiExplanations.put({simp, content: full, model: "groq", generatedAt: Date.now()});
            void trackAiCall();

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
                    <div className="flex items-center gap-1.5">
                        {!isRunning && (
                            <span className={`text-xs tabular-nums ${isLimited ? "text-destructive" : "text-muted-foreground"}`}>
                                {isLimited
                                    ? `reset in ${resetAt ? resetIn(resetAt) : "…"}`
                                    : `${remaining ?? "…"}/${limit} lượt`}
                            </span>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleGenerate}
                            disabled={isRunning || isLimited}
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
            </div>

            {status === "error" && (
                <p className="text-sm text-destructive">{error}</p>
            )}

            {hasContent && (
                <MovingBorder className="overflow-hidden" radius={15} borderWidth={1} gradientWidth={800} duration={3}
                              colors={["#005aff", "#4486ff", "#cad3ff"]}>
                    <div className="bg-stone-100 p-4 flex flex-col gap-3">
                        <div className="prose prose-sm prose-stone max-w-none
                        prose-headings:font-semibold
                        prose-h2:text-base prose-h2:mt-0
                        prose-h3:text-sm prose-h3:mt-3 prose-h3:mb-1
                        prose-p:my-1 prose-p:text-sm
                        prose-li:text-sm prose-li:my-0
                        prose-ul:my-1 prose-ul:pl-4
                        prose-blockquote:text-sm prose-blockquote:not-italic prose-blockquote:border-l-2 prose-blockquote:border-stone-400 prose-blockquote:pl-3 prose-blockquote:text-stone-600
                        prose-strong:font-semibold
                        prose-a:text-primary prose-a:no-underline hover:prose-a:no-underline">
                            <ReactMarkdown>{content}</ReactMarkdown>
                        </div>
                        <div className="flex items-center justify-between border-t border-stone-200 pt-2">
                            <p className="text-xs text-muted-foreground">
                                AI{cached && !isRunning ? ` · ${relativeTime(cached.generatedAt)}` : ""} - nội dung được
                                tạo bởi AI, có thể không chính xác và chỉ để tham khảo.
                            </p>
                        </div>
                    </div>
                </MovingBorder>
            )}
        </div>
    );
}

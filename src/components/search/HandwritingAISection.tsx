"use client";

import { useCallback, useEffect, useState } from "react";
import { BotMessageSquare, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AiCreditBadge } from "@/components/shared/AiCreditBadge";
import { getAiUsageStatus } from "@/app/actions/aiExplanation";
import { GUEST_DAILY_LIMIT, USER_DAILY_LIMIT } from "@/lib/aiConstants";
import { useAuth } from "@clerk/nextjs";

interface HandwritingAISectionProps {
  strokeCount: number;
  getImageBase64: () => string | null;
  onCandidateClick: (hanzi: string) => void;
}

export function HandwritingAISection({
  strokeCount,
  getImageBase64,
  onCandidateClick,
}: HandwritingAISectionProps) {
  const { isLoaded, isSignedIn } = useAuth();

  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState("");
  const [candidates, setCandidates]     = useState<string[]>([]);
  const [usage, setUsage]               = useState<{ remaining: number; limit: number } | null>(null);
  const [guestCalls, setGuestCalls]     = useState(0);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      getAiUsageStatus().then(setUsage);
    }
  }, [isLoaded, isSignedIn]);

  const remaining = isSignedIn
    ? (usage?.remaining ?? null)
    : Math.max(0, GUEST_DAILY_LIMIT - guestCalls);
  const limit = isSignedIn ? USER_DAILY_LIMIT : GUEST_DAILY_LIMIT;
  const isLimited = remaining !== null && remaining <= 0;

  const handleAsk = useCallback(async () => {
    const imageBase64 = getImageBase64();
    if (!imageBase64) return;

    setLoading(true);
    setError("");
    setCandidates([]);

    try {
      const res = await fetch("/api/ai/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64 }),
      });

      if (res.status === 429) {
        setError(await res.text());
        return;
      }
      if (!res.ok) {
        setError("Lỗi kết nối AI.");
        return;
      }

      const data = await res.json();
      setCandidates(data.candidates ?? []);

      if (!isSignedIn) setGuestCalls((n) => n + 1);
      if (isSignedIn) getAiUsageStatus().then(setUsage);
    } catch {
      setError("Lỗi kết nối AI.");
    } finally {
      setLoading(false);
    }
  }, [getImageBase64, isSignedIn]);

  return (
    <div className="flex flex-col gap-2 shrink-0 border-t pt-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Không khớp? Hỏi AI nhận diện</p>
        <AiCreditBadge remaining={remaining} limit={limit} />
      </div>

      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleAsk}
        disabled={strokeCount === 0 || loading || isLimited}
        className="w-full"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
        ) : (
          <BotMessageSquare className="h-4 w-4 mr-1.5" />
        )}
        {loading ? "AI đang nhận diện..." : "Hỏi AI"}
      </Button>

      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}

      {candidates.length > 0 && (
        <div className="flex gap-1.5 flex-wrap">
          {candidates.map((hanzi, i) => (
            <button
              key={`${hanzi}-${i}`}
              onClick={() => onCandidateClick(hanzi)}
              className="font-chinese text-xl px-2.5 py-1 rounded-lg border bg-primary/10 hover:bg-primary/20 transition-colors"
            >
              {hanzi}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

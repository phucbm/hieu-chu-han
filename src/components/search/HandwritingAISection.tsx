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
  getStrokes: () => number[][][];
  onCandidateClick: (hanzi: string) => void;
}

function serializeStrokes(strokes: number[][][], canvasSize = 280): string {
  const n = (v: number) => Math.round((v / canvasSize) * 100) / 100;

  const lines = [`Total strokes: ${strokes.length}`];

  strokes.forEach((stroke, i) => {
    const pts = stroke.filter((_, j) => j % 4 === 0);
    const norm = pts.map(([x, y]) => [n(x), n(y)]);
    if (norm.length < 2) return;

    const [sx, sy] = norm[0];
    const [ex, ey] = norm[norm.length - 1];
    const dx = ex - sx;
    const dy = ey - sy;
    const len = Math.round(Math.sqrt(dx * dx + dy * dy) * 100) / 100;

    const angle = Math.atan2(dy, dx) * (180 / Math.PI);
    let dir: string;
    if (Math.abs(dx) < 0.05 && dy > 0) dir = "vertical downward (竖 shù)";
    else if (Math.abs(dx) < 0.05 && dy < 0) dir = "vertical upward";
    else if (Math.abs(dy) < 0.05 && dx > 0) dir = "horizontal rightward (横 héng)";
    else if (Math.abs(dy) < 0.05 && dx < 0) dir = "horizontal leftward";
    else if (dx < 0 && dy > 0) dir = "diagonal top-right to bottom-left (撇 piě)";
    else if (dx > 0 && dy > 0) dir = `diagonal top-left to bottom-right (捺 nà), angle ${Math.round(angle)}°`;
    else dir = `diagonal, angle ${Math.round(angle)}°`;

    // detect direction change (折 zhé)
    const midIdx = Math.floor(norm.length / 2);
    const [mx, my] = norm[midIdx];
    const d1x = mx - sx, d1y = my - sy;
    const d2x = ex - mx, d2y = ey - my;
    const dot = d1x * d2x + d1y * d2y;
    const hasHook = dot < 0;

    lines.push(
      `Stroke ${i + 1}: start(${sx},${sy}) → end(${ex},${ey}), length≈${len}, direction: ${dir}${hasHook ? " with turn/hook (折/钩)" : ""}`
    );
  });

  return lines.join("\n");
}

export function HandwritingAISection({
  strokeCount,
  getStrokes,
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
    const strokeData = serializeStrokes(getStrokes());

    setLoading(true);
    setError("");
    setCandidates([]);

    try {
      const res = await fetch("/api/ai/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ strokeData }),
      });

      if (!res.ok) {
        setError(await res.text());
        return;
      }

      const data = await res.json();
      setCandidates(data.candidates ?? []);

      if (!isSignedIn) setGuestCalls((n) => n + 1);
      if (isSignedIn) getAiUsageStatus().then(setUsage);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [getStrokes, isSignedIn]);

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

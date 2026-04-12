"use client";

/**
 * StrokeBox — Stroke order animation for a single Chinese character.
 * Silently hides itself if hanzi-writer has no data for the character.
 * Data source: hanzi-writer (fetches stroke data from CDN)
 */

import { useEffect, useRef, useId, useState } from "react";
import { createStrokeWriter } from "@/core/stroke";

interface StrokeBoxProps {
  character: string;
}

export function StrokeBox({ character }: StrokeBoxProps) {
  const writerRef = useRef<ReturnType<typeof createStrokeWriter> | null>(null);
  const uid = useId();
  const elementId = `stroke-${uid.replace(/:/g, "")}`;
  // true = show (default), false = hide after confirmed unavailable
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      try {
        writerRef.current = createStrokeWriter(elementId, character);
        writerRef.current.animateCharacter();
      } catch {
        setAvailable(false);
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [elementId, character]);

  if (!available) return null;

  return (
    <div className="rounded-xl border bg-card p-4 flex flex-col items-center gap-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground self-start w-full">
        Nét chữ
      </p>
      <div
        id={elementId}
        className="rounded-lg border bg-background"
        style={{ width: 200, height: 200 }}
        aria-label={`Hoạt ảnh nét chữ: ${character}`}
      />
      <button
        type="button"
        onClick={() => writerRef.current?.animateCharacter()}
        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
      >
        Xem lại
      </button>
    </div>
  );
}

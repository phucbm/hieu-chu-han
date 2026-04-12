"use client";

/**
 * StrokeBox — Stroke order animation for a single Chinese character.
 * Silently hides itself if hanzi-writer has no data for the character.
 * Data source: hanzi-writer (fetches stroke data from CDN)
 */

import {useEffect, useId, useRef, useState} from "react";
import {createStrokeWriter} from "@/core/stroke";
import {RotateCcw} from "lucide-react";
import {Button} from "@/components/ui/button";

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
      <div className="rounded-xl bg-stone-100 p-4 flex flex-col items-center gap-3 relative">
          <p className="text-sm text-muted-foreground mb-1 text-center">
        Nét chữ
      </p>
      <div
        id={elementId}
        className=""
        style={{ width: 200, height: 200 }}
        aria-label={`Hoạt ảnh nét chữ: ${character}`}
      />
          <div className="absolute top-0 right-0 z-20 p-2">
              <Button
                  variant="ghost"
                  size="icon"
                  type="button"
                  title="Xem lại"
                  onClick={() => writerRef.current?.animateCharacter()}
                  className="opacity-60 hover:opacity-100"
              >
                  <RotateCcw/>
              </Button>
          </div>
    </div>
  );
}

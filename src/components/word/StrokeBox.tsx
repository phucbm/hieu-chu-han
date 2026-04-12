"use client";

/**
 * StrokeBox — Stroke order animation for a single Chinese character.
 * Silently hides itself if hanzi-writer has no data for the character.
 * Shows a simp/trad toggle switch when the two forms differ.
 */

import {useEffect, useRef, useState} from "react";
import {createStrokeWriter} from "@/core/stroke";
import {RotateCcw} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Switch} from "@/components/ui/switch";
import {Label} from "@/components/ui/label";

interface StrokeBoxProps {
  simp: string;
  trad: string;
  /** Start with trad form selected (e.g. when the entry is trad-only) */
  defaultTrad?: boolean;
}

export function StrokeBox({ simp, trad, defaultTrad = false }: StrokeBoxProps) {
  const hasDifferentTrad = trad && trad !== simp;
  const [tradAvailable, setTradAvailable] = useState(defaultTrad);
  const [useTrad, setUseTrad] = useState(defaultTrad);
  const character = useTrad ? trad : simp;

  useEffect(() => {
    if (!hasDifferentTrad) return;
    fetch(`https://cdn.jsdelivr.net/npm/hanzi-writer-data@2.0.1/${trad}.json`, { method: "HEAD" })
      .then(r => setTradAvailable(r.ok))
      .catch(() => setTradAvailable(false));
  }, [trad, hasDifferentTrad]);

  const writerRef = useRef<ReturnType<typeof createStrokeWriter> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const generationRef = useRef(0);
  const [available, setAvailable] = useState(true);

  useEffect(() => {
    const gen = ++generationRef.current;
    const timeout = setTimeout(() => {
      const el = containerRef.current;
      if (!el) return;
      el.innerHTML = "";
      setAvailable(true);
      try {
        writerRef.current = createStrokeWriter(el.id, character, {
          onLoadCharDataError: () => {
            if (generationRef.current === gen) setAvailable(false);
          },
        });
        writerRef.current.animateCharacter();
      } catch {
        if (generationRef.current === gen) setAvailable(false);
      }
    }, 100);
    return () => clearTimeout(timeout);
  }, [character]);

  return (
    <div className={`rounded-xl bg-stone-100 p-4 flex flex-col items-center gap-3 relative ${available ? "" : "hidden"}`}>
      <p className="text-sm text-muted-foreground text-center">Nét chữ</p>
      <div
        ref={containerRef}
        id={`stroke-${simp}`}
        style={{ width: 140, height: 140 }}
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
      {tradAvailable && (
        <div className="flex items-center gap-2">
          <Label htmlFor={`stroke-${simp}-toggle`} className="text-xs text-muted-foreground">
            {useTrad ? "Phồn thể" : "Giản thể"}
          </Label>
          <Switch
            id={`stroke-${simp}-toggle`}
            checked={useTrad}
            onCheckedChange={setUseTrad}
          />
        </div>
      )}
    </div>
  );
}

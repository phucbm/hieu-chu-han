"use client";

/**
 * CharCard — Thẻ thông tin chữ Hán
 * Full detail card for a single character or word.
 *
 * Sections:
 * 1. Header: character display, pinyin, Sino-Vietnamese reading
 * 2. Stroke animation: hanzi-writer canvas
 * 3. Etymology: radical breakdown with Sino-Vietnamese labels
 * 4. Meaning: VI (CVDICT) + EN (chinese-lexicon)
 * 5. HSK level badge + frequency indicator
 * 6. Related words: clickable chips
 */

import { useEffect, useRef, useId } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { createStrokeWriter } from "@/core/stroke";
import type { WordEntry } from "@/core/types";

interface CharCardProps {
  /** The word entry to display */
  entry: WordEntry;
  /** Called when user clicks a related word chip */
  onRelatedWordClick?: (word: string) => void;
}

/**
 * Map HSK level to badge color variant.
 */
function hskBadgeVariant(
  level?: number
): "default" | "secondary" | "destructive" | "outline" {
  if (!level) return "outline";
  if (level <= 2) return "default";
  if (level <= 4) return "secondary";
  return "outline";
}

/**
 * Section heading inside the card.
 */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
      {children}
    </p>
  );
}

/**
 * Stroke animation section.
 * Initialises hanzi-writer on mount.
 */
function StrokeSection({ character }: { character: string }) {
  const writerRef = useRef<ReturnType<typeof createStrokeWriter> | null>(null);
  const uid = useId();
  // Use a sanitized id for the DOM element
  const elementId = `stroke-canvas-${uid.replace(/:/g, "")}`;

  useEffect(() => {
    // Delay slightly to ensure DOM is painted
    const timeout = setTimeout(() => {
      try {
        writerRef.current = createStrokeWriter(elementId, character);
        writerRef.current.animateCharacter();
      } catch {
        // hanzi-writer throws if stroke data not found (numbers, ASCII, etc.)
      }
    }, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, [elementId, character]);

  function handleReplay() {
    writerRef.current?.animateCharacter();
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <SectionLabel>Nét chữ</SectionLabel>
      {/* hanzi-writer renders SVG inside this div */}
      <div
        id={elementId}
        className="rounded-lg border bg-background"
        style={{ width: 200, height: 200 }}
        aria-label={`Hoạt ảnh nét chữ: ${character}`}
      />
      <button
        type="button"
        onClick={handleReplay}
        className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-2 transition-colors"
      >
        Xem lại
      </button>
    </div>
  );
}

/**
 * Etymology breakdown section.
 * Shows radical + phonetic components with Sino-Vietnamese labels.
 * e.g. 疒(nạch) + 冬(đông)
 */
function EtymologySection({
  entry,
}: {
  entry: WordEntry;
}) {
  const { etymology } = entry;
  if (!etymology || etymology.components.length === 0) return null;

  return (
    <div>
      <SectionLabel>Nguyên từ (tự nguyên)</SectionLabel>
      {etymology.notes && (
        <p className="text-sm text-muted-foreground mb-2 italic">
          {etymology.notes}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {etymology.components.map((comp, i) => (
          <span
            key={`${comp.char}-${i}`}
            className="inline-flex items-baseline gap-0.5 rounded-md border px-2 py-1 text-sm"
          >
            {/* Label: meaning or sound */}
            <span className="text-xs text-muted-foreground mr-1">
              {comp.type === "meaning" ? "nghĩa" : "âm"}
            </span>
            <span className="font-medium text-base">{comp.char}</span>
            {comp.sinoVietnamese && (
              <span className="text-muted-foreground text-xs">
                ({comp.sinoVietnamese})
              </span>
            )}
            {comp.definition && (
              <span className="text-muted-foreground text-xs ml-1">
                — {comp.definition}
              </span>
            )}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Full character/word detail card.
 */
export function CharCard({ entry, onRelatedWordClick }: CharCardProps) {
  const isSingleChar = [...entry.simp].length === 1;
  const showTrad =
    entry.trad && entry.trad !== entry.simp;

  return (
    <Card className="w-full max-w-md">
      <CardContent className="pt-6 flex flex-col gap-5">
        {/* ── 1. Header ─────────────────────────────────── */}
        <div className="flex flex-col items-center gap-1 text-center">
          {/* Character display */}
          <div className="flex items-baseline gap-2">
            <span className="text-6xl font-bold leading-none select-all">
              {entry.simp}
            </span>
            {showTrad && (
              <span className="text-2xl text-muted-foreground select-all" title="Phồn thể">
                ({entry.trad})
              </span>
            )}
          </div>
          {/* Pinyin */}
          <p className="text-lg text-muted-foreground">{entry.pinyin}</p>
          {/* Sino-Vietnamese reading */}
          {entry.sinoVietnamese && (
            <p className="text-base font-medium text-primary">
              {entry.sinoVietnamese}
            </p>
          )}
        </div>

        <Separator />

        {/* ── 2. Stroke animation (single characters only) ─ */}
        {isSingleChar && <StrokeSection character={entry.simp} />}

        {/* ── 3. Etymology (single characters only) ──────── */}
        {isSingleChar && <EtymologySection entry={entry} />}

        {/* ── 4. Meaning ───────────────────────────────── */}
        <div>
          <SectionLabel>Nghĩa</SectionLabel>
          <div className="flex flex-col gap-2">
            {/* Vietnamese meaning — Source: CVDICT */}
            {entry.definitionVi && (
              <div>
                <span className="text-xs text-muted-foreground">🇻🇳 </span>
                <span className="text-sm">{entry.definitionVi}</span>
              </div>
            )}
            {/* English definitions — Source: chinese-lexicon */}
            {entry.definitionsEn.length > 0 && (
              <div>
                <span className="text-xs text-muted-foreground">🇬🇧 </span>
                <span className="text-sm text-muted-foreground">
                  {entry.definitionsEn.join("; ")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── 5. HSK + Frequency ──────────────────────── */}
        <div className="flex flex-wrap gap-2 items-center">
          {entry.statistics.hskLevel && (
            <Badge variant={hskBadgeVariant(entry.statistics.hskLevel)}>
              HSK {entry.statistics.hskLevel}
            </Badge>
          )}
          {entry.statistics.movieWordRank && (
            <Badge variant="outline" className="text-xs">
              Phim: #{entry.statistics.movieWordRank}
            </Badge>
          )}
          {entry.statistics.bookWordRank && (
            <Badge variant="outline" className="text-xs">
              Sách: #{entry.statistics.bookWordRank}
            </Badge>
          )}
        </div>

        {/* ── 6. Related words ───────────────────────── */}
        {entry.relatedWords.length > 0 && (
          <div>
            <SectionLabel>Từ liên quan</SectionLabel>
            <div className="flex flex-wrap gap-2">
              {entry.relatedWords.map((rel) => (
                <button
                  key={rel.word}
                  type="button"
                  onClick={() => onRelatedWordClick?.(rel.word)}
                  className="inline-flex flex-col items-center rounded-md border px-2.5 py-1.5 text-sm hover:bg-muted transition-colors cursor-pointer"
                  title={rel.gloss}
                >
                  <span className="font-medium">{rel.word}</span>
                  <span className="text-xs text-muted-foreground">
                    {rel.gloss}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

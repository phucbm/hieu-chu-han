"use client";

/**
 * RelatedSection — Related/compound words as clickable WordBadges.
 * Data source: chinese-lexicon topWords
 */

import { WordBadge } from "@/components/shared/WordBadge";
import type { WordEntry } from "@/core/types";

interface RelatedSectionProps {
  entry: WordEntry;
  onWordClick: (simp: string) => void;
}

export function RelatedSection({ entry, onWordClick }: RelatedSectionProps) {
  if (entry.relatedWords.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Từ liên quan
      </p>
      <div className="flex flex-wrap gap-3">
        {entry.relatedWords.map((rel) => (
          <div key={rel.word} className="flex flex-col items-center gap-1">
            <WordBadge
              simp={rel.word}
              onClick={() => onWordClick(rel.word)}
            />
            {rel.gloss && (
              <span className="text-xs text-muted-foreground max-w-[72px] text-center line-clamp-1">
                {rel.gloss}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

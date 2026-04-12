"use client";

/**
 * WordTabContent — Content for a single word tab.
 * Desktop: 2-column grid — left col (sticky): WordInfoBox + StrokeBox,
 *                           right col (scrolls): Etymology, Definitions, Related.
 * Mobile: single column, stacked in reading order.
 * Data source: WordEntry from getWordEntries()
 */

import { WordInfoBox } from "@/components/word/WordInfoBox";
import { StrokeBox } from "@/components/word/StrokeBox";
import { EtymologySection } from "@/components/word/EtymologySection";
import { DefinitionSection } from "@/components/word/DefinitionSection";
import { RelatedSection } from "@/components/word/RelatedSection";
import type { WordEntry } from "@/core/types";

interface WordTabContentProps {
  entry: WordEntry;
  onWordClick: (simp: string) => void;
}

export function WordTabContent({ entry, onWordClick }: WordTabContentProps) {
  const isSingleChar = [...entry.simp].length === 1;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5 py-4">
      {/* Left column — sticky on desktop */}
      <div className="flex flex-col gap-4 lg:sticky lg:top-4 lg:self-start">
        <WordInfoBox entry={entry} />
        {isSingleChar && <StrokeBox character={entry.simp} />}
      </div>

      {/* Right column — etymology, definitions, related */}
      <div className="flex flex-col gap-6">
        {isSingleChar && (
          <EtymologySection entry={entry} onWordClick={onWordClick} />
        )}
        <DefinitionSection entry={entry} />
        <RelatedSection entry={entry} onWordClick={onWordClick} />
      </div>
    </div>
  );
}

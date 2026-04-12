"use client";

/**
 * RelatedSection — Related/compound words as clickable WordRows.
 * Data source: chinese-lexicon topWords
 */

import type { WordEntry } from "@/core/types";
import { WordRow } from "@/components/search/WordRow";

interface RelatedSectionProps {
  entry: WordEntry;
  onWordClick: (simp: string) => void;
}

export function RelatedSection({ entry, onWordClick }: RelatedSectionProps) {
  const rows = entry.relatedWords.filter((rel) => rel.entry);
  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">Từ liên quan</p>
      <ul className="divide-y divide-border rounded-lg border overflow-hidden">
        {rows.map((rel) => (
          <li key={rel.word}>
            <WordRow
              entry={rel.entry!}
              onSelect={() => onWordClick(rel.word)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

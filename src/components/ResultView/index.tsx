"use client";

/**
 * ResultView — Hiển thị kết quả đã chọn
 * Renders CharCard for a single character, or TabView for compound words.
 * Loading states and results list are managed by the parent (page.tsx).
 */

import { CharCard } from "@/components/CharCard";
import { TabView } from "@/components/TabView";
import type { WordEntry } from "@/core/types";

interface ResultViewProps {
  /** Entries to display: [singleEntry] or [compoundEntry, char1, char2, ...] */
  entries: WordEntry[];
  /** Called when user clicks a related word chip inside CharCard */
  onRelatedWordClick?: (word: string) => void;
}

/**
 * Routes between CharCard (single entry) and TabView (multiple entries).
 */
export function ResultView({ entries, onRelatedWordClick }: ResultViewProps) {
  if (entries.length === 0) return null;

  if (entries.length > 1) {
    return <TabView entries={entries} onRelatedWordClick={onRelatedWordClick} />;
  }

  return <CharCard entry={entries[0]} onRelatedWordClick={onRelatedWordClick} />;
}

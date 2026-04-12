"use client";

/**
 * RecentSearch — "Tìm kiếm gần đây" section always visible below SearchInput.
 * Shows up to 5 most recently viewed words as compact simp badges.
 * Clicking fills input and opens the word.
 * Data source: viewedWords from useViewedWords hook (first 5 entries).
 */

import type { ViewedWord } from "@/hooks/useViewedWords";

interface RecentSearchProps {
  words: ViewedWord[];
  /** Called with simp when a badge is clicked. Should update query + open word. */
  onSelect: (simp: string) => void;
}

export function RecentSearch({ words, onSelect }: RecentSearchProps) {
  if (words.length === 0) return null;

  return (
    <div className="mt-3">
      <p className="text-xs text-muted-foreground mb-2">Tìm kiếm gần đây</p>
      <div className="flex flex-wrap gap-1.5">
        {words.slice(0, 5).map((w) => (
          <button
            key={w.simp}
            type="button"
            onClick={() => onSelect(w.simp)}
            className="font-chinese text-sm rounded-md border px-2.5 py-1 hover:bg-muted transition-colors"
          >
            {w.simp}
          </button>
        ))}
      </div>
    </div>
  );
}

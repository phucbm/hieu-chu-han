"use client";

/**
 * ViewedWordList — shared list of recently viewed words.
 * Used by both RecentViewedPanel (desktop column) and HistorySheet (mobile).
 */

import {ScrollArea} from "@/components/ui/scroll-area";
import {WordRow} from "@/components/search/WordRow";
import type {ViewedWord} from "@/hooks/useViewedWords";

interface ViewedWordListProps {
  viewedWords: ViewedWord[];
  onSelect: (simp: string) => void;
  onRemove: (simp: string) => void;
}

export function ViewedWordList({
  viewedWords,
  onSelect,
  onRemove,
}: ViewedWordListProps) {
  if (viewedWords.length === 0) {
    return (
      <p className="text-xs text-muted-foreground text-center px-4 py-8">
        Chưa có từ nào được xem.
      </p>
    );
  }

  return (
      <ul className="divide-y divide-border rounded-lg border overflow-hidden">
          {viewedWords.filter((w) => w.entry).map((w) => (
              <li key={w.simp}>
                  <WordRow
                      entry={w.entry!}
                      viewCount={w.viewedAt.length}
                      onSelect={() => onSelect(w.simp)}
                      onRemove={() => onRemove(w.simp)}
                  />
              </li>
          ))}
      </ul>
  );
}

"use client";

/**
 * ViewedWordList — shared list of recently viewed words.
 * Used by both RecentViewedPanel (desktop column) and HistorySheet (mobile).
 */

import { ScrollArea } from "@/components/ui/scroll-area";
import { WordRow } from "@/components/search/WordRow";
import type { ViewedWord } from "@/hooks/useViewedWords";

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
      <div className="flex-1 flex items-center justify-center">
        <p className="text-xs text-muted-foreground text-center px-4">
          Chưa có từ nào được xem.
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 min-h-0">
      <ul className="divide-y divide-border">
        {viewedWords.map((w) => (
          <li key={w.simp}>
            <WordRow
              simp={w.simp}
              trad={w.trad}
              pinyin={w.pinyin}
              vi={w.sinoViet}
              viewCount={w.viewedAt.length}
              onSelect={() => onSelect(w.simp)}
              onRemove={() => onRemove(w.simp)}
            />
          </li>
        ))}
      </ul>
    </ScrollArea>
  );
}

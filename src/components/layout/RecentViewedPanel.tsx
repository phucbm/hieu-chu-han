"use client";

/**
 * RecentViewedPanel — Fixed right column for desktop (≥1024px).
 * Shows all viewed words as WordRows.
 * Each row shows the word info + 👁 view count, with a remove button on hover.
 * Data source: useViewedWords hook (hch_viewed_words localStorage)
 */

import { ScrollArea } from "@/components/ui/scroll-area";
import { WordRow } from "@/components/search/WordRow";
import type { ViewedWord } from "@/hooks/useViewedWords";

interface RecentViewedPanelProps {
  viewedWords: ViewedWord[];
  onSelect: (simp: string) => void;
  onRemove: (simp: string) => void;
}

export function RecentViewedPanel({
  viewedWords,
  onSelect,
  onRemove,
}: RecentViewedPanelProps) {
  return (
    <aside className="hidden lg:flex fixed right-0 top-0 w-72 h-screen z-30 flex-col border-l bg-background">
      <div className="px-5 py-5 border-b shrink-0">
        <p className="font-semibold text-sm">Đã xem</p>
      </div>

      {viewedWords.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-xs text-muted-foreground text-center px-4">
            Chưa có từ nào được xem.
          </p>
        </div>
      ) : (
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
      )}
    </aside>
  );
}

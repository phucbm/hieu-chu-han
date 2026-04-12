"use client";

/**
 * RecentViewedSidebar — Viewed word badges at the bottom of the desktop sidebar.
 * Data source: useViewedWords hook (hch_viewed_words localStorage)
 */

import { ScrollArea } from "@/components/ui/scroll-area";
import { WordBadge } from "@/components/shared/WordBadge";
import type { ViewedWord } from "@/hooks/useViewedWords";

interface RecentViewedSidebarProps {
  viewedWords: ViewedWord[];
  onSelect: (simp: string) => void;
}

export function RecentViewedSidebar({
  viewedWords,
  onSelect,
}: RecentViewedSidebarProps) {
  if (viewedWords.length === 0) return null;

  return (
    <div className="flex flex-col min-h-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3 border-t">
        Đã xem
      </p>
      <ScrollArea className="flex-1">
        <div className="flex flex-wrap gap-2 px-5 pb-5">
          {viewedWords.filter((w) => w.entry).map((w) => (
            <WordBadge
              key={w.simp}
              entry={w.entry!}
              onClick={() => onSelect(w.simp)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

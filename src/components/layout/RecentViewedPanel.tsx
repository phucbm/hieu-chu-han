"use client";

/**
 * RecentViewedPanel — Right column for desktop (≥1024px).
 * Sticky header + scrollable word list below.
 */

import { ViewedWordList } from "@/components/layout/ViewedWordList";
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
    <aside className="hidden lg:flex flex-col border-l bg-background max-h-screen">
      {/* Sticky header */}
      <div className="px-5 py-5 border-b shrink-0">
        <p className="font-semibold text-sm">Đã xem</p>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0 p-5">
        <ViewedWordList
          viewedWords={viewedWords}
          onSelect={onSelect}
          onRemove={onRemove}
        />
      </div>
    </aside>
  );
}

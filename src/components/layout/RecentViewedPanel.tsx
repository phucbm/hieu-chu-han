"use client";

/**
 * RecentViewedPanel — Fixed right column for desktop (≥1024px).
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
    <aside className="hidden lg:flex fixed right-0 top-0 w-72 h-screen z-30 flex-col border-l bg-background">
      <div className="px-5 py-5 border-b shrink-0">
        <p className="font-semibold text-sm">Đã xem</p>
      </div>
      <ViewedWordList
        viewedWords={viewedWords}
        onSelect={onSelect}
        onRemove={onRemove}
      />
    </aside>
  );
}

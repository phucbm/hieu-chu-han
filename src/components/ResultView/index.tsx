"use client";

/**
 * ResultView — Kết quả tìm kiếm
 * Renders CharCard directly for single characters,
 * or TabView for compound words.
 */

import { Skeleton } from "@/components/ui/skeleton";
import { CharCard } from "@/components/CharCard";
import { TabView } from "@/components/TabView";
import type { WordEntry } from "@/core/types";

interface ResultViewProps {
  /** Search results to display */
  entries: WordEntry[];
  /** Whether the search is loading */
  loading?: boolean;
  /** Whether a search has been performed */
  hasSearched?: boolean;
  /** Called when user clicks a related word chip */
  onRelatedWordClick?: (word: string) => void;
}

/**
 * Loading skeleton placeholder while search is in progress.
 */
function LoadingSkeleton() {
  return (
    <div className="w-full max-w-md flex flex-col gap-4">
      <Skeleton className="h-24 w-full rounded-xl" />
      <Skeleton className="h-48 w-full rounded-xl" />
      <Skeleton className="h-16 w-full rounded-xl" />
    </div>
  );
}

/**
 * Result view — switches between single card and tabbed compound view.
 */
export function ResultView({
  entries,
  loading,
  hasSearched,
  onRelatedWordClick,
}: ResultViewProps) {
  if (loading) {
    return <LoadingSkeleton />;
  }

  if (hasSearched && entries.length === 0) {
    return (
      <p className="text-muted-foreground text-sm text-center">
        Không tìm thấy kết quả. Thử nhập chữ Hán hoặc pinyin khác.
      </p>
    );
  }

  if (entries.length === 0) return null;

  // Compound word: multiple character entries → use tabs
  if (entries.length > 1) {
    return (
      <TabView entries={entries} onRelatedWordClick={onRelatedWordClick} />
    );
  }

  // Single character/word: render card directly
  return (
    <CharCard entry={entries[0]} onRelatedWordClick={onRelatedWordClick} />
  );
}

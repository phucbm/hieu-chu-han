"use client";

/**
 * AppSidebar — Fixed left sidebar for desktop (≥1024px).
 *
 * Delegates search, recent searches, and inline results to SearchBox.
 * Results are always visible when non-empty (no focus gate on desktop).
 */

import { AppLogo } from "@/components/layout/AppLogo";
import { SearchBox } from "@/components/search/SearchBox";
import type { WordEntry } from "@/core/types";
import type { ViewedWord } from "@/hooks/useViewedWords";

interface AppSidebarProps {
  query: string;
  onQueryChange: (value: string) => void;
  results: WordEntry[];
  onResultSelect: (simp: string) => void;
  onDismissResults: () => void;
  isLoading: boolean;
  recentSearches: ViewedWord[];
  onRecentSearchSelect: (simp: string) => void;
}

export function AppSidebar({
  query,
  onQueryChange,
  results,
  onResultSelect,
  onDismissResults,
  isLoading,
  recentSearches,
  onRecentSearchSelect,
}: AppSidebarProps) {
  return (
    <aside className="hidden lg:flex fixed left-0 top-0 w-80 h-screen z-30 flex-col border-r bg-background">
      {/* Logo — pinned at top */}
      <div className="px-5 py-5 border-b shrink-0">
        <AppLogo />
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 pt-4 pb-4">
        <SearchBox
          query={query}
          onQueryChange={onQueryChange}
          results={results}
          isLoading={isLoading}
          recentSearches={recentSearches}
          onRecentSearchSelect={onRecentSearchSelect}
          onResultSelect={onResultSelect}
          onEscape={onDismissResults}
        />
      </div>
    </aside>
  );
}

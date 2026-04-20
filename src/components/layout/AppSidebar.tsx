"use client";

/**
 * AppSidebar — Fixed left sidebar for desktop (≥1024px).
 *
 * Delegates search, recent searches, and inline results to SearchBox.
 * Results are always visible when non-empty (no focus gate on desktop).
 */

import { AppLogo } from "@/components/layout/AppLogo";
import { SearchBox } from "@/components/search/SearchBox";
import { AuthButton } from "@/components/auth/AuthButton";
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
    <aside className="hidden lg:flex flex-col border-r bg-background max-h-screen">
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

      {/* Auth + Badge — pinned at bottom */}
      <div className="px-4 py-4 border-t shrink-0 flex flex-col items-center gap-3">
        <AuthButton />
        <a href="https://launch.j2team.dev/products/hieu-chu-han?utm_source=badge-launched&utm_medium=badge&utm_campaign=badge-hieu-chu-han" target="_blank" rel="noopener noreferrer">
          <img src="https://launch.j2team.dev/badge/hieu-chu-han/light" alt="Hiểu Chữ Hán - Launched on J2TEAM Launch" width="250" height="54" loading="lazy" />
        </a>
      </div>

    </aside>
  );
}

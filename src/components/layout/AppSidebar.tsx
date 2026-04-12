"use client";

/**
 * AppSidebar — Fixed left sidebar for desktop (≥1024px).
 * Contains AppLogo, SearchInput with floating SuggestionBox,
 * always-visible RecentSearch, and RecentViewedSidebar at the bottom.
 */

import { useRef } from "react";
import { AppLogo } from "@/components/layout/AppLogo";
import { RecentViewedSidebar } from "@/components/layout/RecentViewedSidebar";
import { SearchInput } from "@/components/search/SearchInput";
import { SuggestionBox } from "@/components/search/SuggestionBox";
import { RecentSearch } from "@/components/search/RecentSearch";
import type { WordSummary } from "@/core/types";
import type { ViewedWord } from "@/hooks/useViewedWords";

interface AppSidebarProps {
  query: string;
  onQueryChange: (value: string) => void;
  suggestions: WordSummary[];
  showSuggestions: boolean;
  onSuggestionSelect: (simp: string) => void;
  onInputFocus: () => void;
  onDismissSuggestions: () => void;
  isLoadingSuggestions: boolean;
  recentSearches: ViewedWord[];
  onRecentSearchSelect: (simp: string) => void;
  viewedWords: ViewedWord[];
  onViewedWordSelect: (simp: string) => void;
}

export function AppSidebar({
  query,
  onQueryChange,
  suggestions,
  showSuggestions,
  onSuggestionSelect,
  onInputFocus,
  onDismissSuggestions,
  isLoadingSuggestions,
  recentSearches,
  onRecentSearchSelect,
  viewedWords,
  onViewedWordSelect,
}: AppSidebarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 w-80 h-screen z-30 flex-col border-r bg-background">
      {/* Logo */}
      <div className="px-5 py-5 border-b shrink-0">
        <AppLogo />
      </div>

      {/* Search area — focus/blur container controls suggestion visibility */}
      <div
        className="px-4 pt-4 shrink-0"
        onFocus={onInputFocus}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            onDismissSuggestions();
          }
        }}
      >
        {/* Relative container so SuggestionBox can be absolute */}
        <div className="relative">
          <SearchInput
            ref={inputRef}
            value={query}
            onChange={onQueryChange}
            isLoading={isLoadingSuggestions}
            onEscape={onDismissSuggestions}
          />
          <SuggestionBox
            visible={showSuggestions}
            suggestions={suggestions}
            onSelect={(simp) => {
              onDismissSuggestions();
              onSuggestionSelect(simp);
            }}
          />
        </div>
        <RecentSearch
          words={recentSearches}
          onSelect={onRecentSearchSelect}
        />
      </div>

      {/* Spacer — pushes viewed words to bottom */}
      <div className="flex-1 min-h-0" />

      {/* Viewed words — pinned at bottom, scrollable when many items */}
      <div className="overflow-y-auto shrink-0" style={{ maxHeight: "45%" }}>
        <RecentViewedSidebar
          viewedWords={viewedWords}
          onSelect={onViewedWordSelect}
        />
      </div>
    </aside>
  );
}

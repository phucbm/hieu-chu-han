"use client";

/**
 * AppSidebar — Fixed left sidebar for desktop (≥1024px).
 *
 * Search results (top 20) are always visible when the input has a value —
 * focus state does not affect their visibility on desktop.
 * RecentSearch badges are always shown below, not replaced by results.
 *
 * onFocus is forwarded directly to the <input> element (via SearchInput prop)
 * so that clicking RecentSearch badges never sets inputFocused=true.
 */

import { useRef } from "react";
import { AppLogo } from "@/components/layout/AppLogo";
import { SearchInput } from "@/components/search/SearchInput";
import { WordRow } from "@/components/search/WordRow";
import { RecentSearch } from "@/components/search/RecentSearch";
import type { WordSummary } from "@/core/types";
import type { ViewedWord } from "@/hooks/useViewedWords";

interface AppSidebarProps {
  query: string;
  onQueryChange: (value: string) => void;
  /** Top 20 results from searchWords(), updated on 600ms debounce */
  results: WordSummary[];
  /** True when query has a value and results exist */
  showResults: boolean;
  onResultSelect: (simp: string) => void;
  /** Fires only when the search <input> itself gains focus */
  onInputFocus: () => void;
  /** Clears results (e.g. on Escape) */
  onDismissResults: () => void;
  isLoading: boolean;
  recentSearches: ViewedWord[];
  /** Appends simp to the current input value */
  onRecentSearchSelect: (simp: string) => void;
}

export function AppSidebar({
  query,
  onQueryChange,
  results,
  showResults,
  onResultSelect,
  onInputFocus,
  onDismissResults,
  isLoading,
  recentSearches,
  onRecentSearchSelect,
}: AppSidebarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 w-80 h-screen z-30 flex-col border-r bg-background">
      {/* Logo — pinned at top */}
      <div className="px-5 py-5 border-b shrink-0">
        <AppLogo />
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto min-h-0 flex flex-col px-4 pt-4 pb-4 gap-4">
        <SearchInput
          ref={inputRef}
          value={query}
          onChange={onQueryChange}
          isLoading={isLoading}
          onFocus={onInputFocus}
          onEscape={onDismissResults}
        />

        {/* Results list — always visible when query has value, no focus gate */}
        {showResults && (
          <ul className="divide-y divide-border rounded-lg border overflow-hidden shrink-0">
            {results.map((item, i) => (
              <li key={`${item.simp}-${item.pinyin}-${i}`}>
                <WordRow
                  simp={item.simp}
                  trad={item.trad}
                  pinyin={item.pinyin}
                  vi={item.vi}
                  en={item.en}
                  onSelect={() => onResultSelect(item.simp)}
                />
              </li>
            ))}
          </ul>
        )}

        {/* Recent searches — always shown alongside results */}
        <RecentSearch
          words={recentSearches}
          onSelect={onRecentSearchSelect}
        />
      </div>
    </aside>
  );
}

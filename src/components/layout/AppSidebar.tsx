"use client";

/**
 * AppSidebar — Fixed left sidebar for desktop (≥1024px).
 *
 * Structure:
 *   - AppLogo (pinned top)
 *   - Scrollable body:
 *       SearchInput (onFocus triggers suggestions — NOT the container)
 *       When suggestions exist: inline scrollable WordRow list
 *       Otherwise: RecentSearch badges
 *
 * The onFocus is placed directly on the <input> element (via SearchInput prop)
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
  suggestions: WordSummary[];
  showSuggestions: boolean;
  onSuggestionSelect: (simp: string) => void;
  /** Fires only when the search <input> itself is focused */
  onInputFocus: () => void;
  onDismissSuggestions: () => void;
  isLoadingSuggestions: boolean;
  recentSearches: ViewedWord[];
  /** Appends simp to the current input value */
  onRecentSearchSelect: (simp: string) => void;
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
}: AppSidebarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 w-80 h-screen z-30 flex-col border-r bg-background">
      {/* Logo — pinned at top */}
      <div className="px-5 py-5 border-b shrink-0">
        <AppLogo />
      </div>

      {/* Scrollable body: search input + results or recent searches */}
      <div
        className="flex-1 overflow-y-auto min-h-0 px-4 pt-4 pb-4"
        onBlur={(e) => {
          // Dismiss suggestions when focus leaves this entire area
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            onDismissSuggestions();
          }
        }}
      >
        {/* onFocus on the input itself — NOT the container */}
        <SearchInput
          ref={inputRef}
          value={query}
          onChange={onQueryChange}
          isLoading={isLoadingSuggestions}
          onFocus={onInputFocus}
          onEscape={onDismissSuggestions}
        />

        {/* Inline suggestion list (desktop replaces floating dropdown) */}
        {showSuggestions ? (
          <ul className="mt-2 divide-y divide-border rounded-lg border overflow-hidden">
            {suggestions.map((item, i) => (
              <li key={`${item.simp}-${item.pinyin}-${i}`}>
                <WordRow
                  simp={item.simp}
                  trad={item.trad}
                  pinyin={item.pinyin}
                  vi={item.vi}
                  en={item.en}
                  onSelect={() => {
                    onDismissSuggestions();
                    onSuggestionSelect(item.simp);
                  }}
                />
              </li>
            ))}
          </ul>
        ) : (
          <RecentSearch
            words={recentSearches}
            onSelect={onRecentSearchSelect}
          />
        )}
      </div>
    </aside>
  );
}

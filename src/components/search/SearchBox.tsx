"use client";

/**
 * SearchBox — Unified search component: input + recent searches + results list.
 *
 * popover=false (desktop): results render inline below the input, always
 *   visible when `results` is non-empty (no focus gate).
 *
 * popover=true (mobile): results render inside a Base UI Popover anchored to
 *   the input. Opens on focus, closes on outside click / scroll / Escape —
 *   all handled natively by Base UI.
 */

import { useState, useRef } from "react";
import { Popover as PopoverPrimitive } from "@base-ui/react/popover";
import { SearchInput } from "@/components/search/SearchInput";
import { RecentSearch } from "@/components/search/RecentSearch";
import { WordRow } from "@/components/search/WordRow";
import type { WordSummary } from "@/core/types";
import type { ViewedWord } from "@/hooks/useViewedWords";

interface SearchBoxProps {
  /** Wrap results in a Popover (mobile). Default: false (inline, desktop). */
  popover?: boolean;
  query: string;
  onQueryChange: (value: string) => void;
  results: WordSummary[];
  isLoading?: boolean;
  recentSearches: ViewedWord[];
  onRecentSearchSelect: (simp: string) => void;
  onResultSelect: (simp: string) => void;
  /** Called on Escape in inline mode so the parent can clear results. */
  onEscape?: () => void;
}

export function SearchBox({
  popover = false,
  query,
  onQueryChange,
  results,
  isLoading,
  recentSearches,
  onRecentSearchSelect,
  onResultSelect,
  onEscape,
}: SearchBoxProps) {
  const [focused, setFocused] = useState(false);
  const anchorRef = useRef<HTMLDivElement>(null);

  // ── Popover mode (mobile) ─────────────────────────────────────────────────
  if (popover) {
    return (
      <div>
        <div ref={anchorRef}>
          <SearchInput
            value={query}
            onChange={onQueryChange}
            isLoading={isLoading}
            onFocus={() => setFocused(true)}
            onEscape={() => setFocused(false)}
          />
        </div>
        <RecentSearch words={recentSearches} onSelect={onRecentSearchSelect} />

        <PopoverPrimitive.Root
          open={focused && results.length > 0}
          onOpenChange={(open) => {
            if (!open) setFocused(false);
          }}
          modal={false}
        >
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Positioner
              anchor={anchorRef}
              align="start"
              side="bottom"
              sideOffset={4}
              className="isolate z-50 w-[var(--anchor-width)]"
            >
              <PopoverPrimitive.Popup className="max-h-[60vh] overflow-y-auto rounded-lg border bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 outline-none">
                <ul className="divide-y divide-border">
                  {results.map((item, i) => (
                    <li key={`${item.simp}-${item.pinyin}-${i}`}>
                      <WordRow
                        simp={item.simp}
                        trad={item.trad}
                        pinyin={item.pinyin}
                        vi={item.vi}
                        en={item.en}
                        onSelect={() => {
                          setFocused(false);
                          onResultSelect(item.simp);
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </PopoverPrimitive.Popup>
            </PopoverPrimitive.Positioner>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      </div>
    );
  }

  // ── Inline mode (desktop) ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      <SearchInput
        value={query}
        onChange={onQueryChange}
        isLoading={isLoading}
        onEscape={onEscape}
      />
      <RecentSearch words={recentSearches} onSelect={onRecentSearchSelect} />
      {results.length > 0 && (
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
    </div>
  );
}

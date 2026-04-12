"use client";

/**
 * SearchBar — Thanh tìm kiếm với gợi ý tự động
 *
 * Dropdown behavior:
 * - Input empty + focused → show history (SearchHistory)
 * - Input has text → show auto-suggest dropdown (top 8 results, debounced 300ms)
 * - Enter / Search button → close dropdown, emit onSearch
 * - Outside click or Escape → close dropdown
 */

import { forwardRef, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SearchHistory } from "@/components/SearchHistory";
import { Search, X, Loader2 } from "lucide-react";
import type { WordSummary, HistoryItem } from "@/core/types";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  /** Called on Enter / Search button click */
  onSearch: () => void;
  /** Called when user selects a suggestion from the dropdown */
  onSuggestionSelect: (summary: WordSummary) => void;
  /** Auto-suggest items (debounced, from server action) */
  suggestions: WordSummary[];
  /** Whether to show the suggestions dropdown */
  showSuggestions: boolean;
  /** Close the dropdown */
  onDismiss: () => void;
  history: HistoryItem[];
  /** Whether to show history (input empty + focused) */
  showHistory: boolean;
  onHistorySelect: (item: HistoryItem) => void;
  onClearHistory: () => void;
  loading?: boolean;
}

/**
 * Single suggestion row in the dropdown.
 */
function SuggestionItem({
  item,
  onSelect,
}: {
  item: WordSummary;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      // mousedown fires before blur, so we prevent default to keep input focused
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors"
    >
      <span className="font-chinese text-xl font-medium w-8 shrink-0 text-center leading-none">
        {item.simp}
      </span>
      <span className="flex flex-col min-w-0">
        <span className="text-xs text-muted-foreground leading-tight">
          {item.pinyin}
          {item.trad && item.trad !== item.simp && (
            <span className="ml-1 font-chinese">({item.trad})</span>
          )}
        </span>
        {item.vi ? (
          <span className="text-sm truncate">{item.vi}</span>
        ) : item.en ? (
          <span className="text-sm text-muted-foreground truncate">{item.en}</span>
        ) : null}
      </span>
    </button>
  );
}

/**
 * SearchBar with auto-suggest and history positioned dropdown.
 */
export const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  function SearchBar(
    {
      value,
      onChange,
      onSearch,
      onSuggestionSelect,
      suggestions,
      showSuggestions,
      onDismiss,
      history,
      showHistory,
      onHistorySelect,
      onClearHistory,
      loading,
    },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null);
    const isDropdownOpen =
      (showSuggestions && suggestions.length > 0) || showHistory;

    function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
      if (e.key === "Enter" && value.trim()) {
        onDismiss();
        onSearch();
      }
      if (e.key === "Escape") {
        onDismiss();
        (ref as React.RefObject<HTMLInputElement>)?.current?.blur();
      }
    }

    const handleClear = useCallback(() => {
      onChange("");
      onDismiss();
      (ref as React.RefObject<HTMLInputElement>)?.current?.focus();
    }, [onChange, onDismiss, ref]);

    /** Close dropdown when focus leaves the container */
    function handleBlur(e: React.FocusEvent<HTMLDivElement>) {
      if (!containerRef.current?.contains(e.relatedTarget as Node)) {
        onDismiss();
      }
    }

    return (
      <div ref={containerRef} className="relative w-full" onBlur={handleBlur}>
        {/* ── Input row ─────────────────────────────── */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (value.trim()) {
              onDismiss();
              onSearch();
            }
          }}
          className="flex w-full gap-2"
          role="search"
        >
          <div className="relative flex-1">
            <Input
              ref={ref}
              type="search"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Nhập chữ Hán, pinyin..."
              className="pr-8 text-base h-11"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label="Tìm kiếm chữ Hán"
              disabled={loading}
            />
            {value.length > 0 && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleClear}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Xóa"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            type="submit"
            disabled={!value.trim() || loading}
            className="h-11 px-4"
            aria-label="Tìm kiếm"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </form>

        {/* ── Dropdown ──────────────────────────────── */}
        {isDropdownOpen && (
          <div
            className="absolute top-full left-0 right-0 z-50 mt-1
                        rounded-lg border bg-popover text-popover-foreground
                        shadow-md overflow-hidden"
          >
            {showHistory ? (
              <SearchHistory
                history={history}
                onSelect={(item) => {
                  onDismiss();
                  onHistorySelect(item);
                }}
                onClear={onClearHistory}
              />
            ) : (
              <ul className="divide-y divide-border">
                {suggestions.map((item) => (
                  <li key={item.simp}>
                    <SuggestionItem
                      item={item}
                      onSelect={() => {
                        onDismiss();
                        onSuggestionSelect(item);
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    );
  }
);

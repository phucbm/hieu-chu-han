"use client";

/**
 * SearchResults — Danh sách kết quả tìm kiếm
 * Shown after user presses Enter or clicks Search.
 * Each item is clickable → renders full CharCard / TabView.
 */

import type { WordSummary } from "@/core/types";

interface SearchResultsProps {
  results: WordSummary[];
  /** Called when user clicks a result item */
  onSelect: (summary: WordSummary) => void;
}

/**
 * Results list displayed between SearchBar and CharCard.
 * Shows simp + trad + pinyin + first Vietnamese meaning per row.
 */
export function SearchResults({ results, onSelect }: SearchResultsProps) {
  if (results.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4">
        Không tìm thấy kết quả.
      </p>
    );
  }

  return (
    <ul className="w-full divide-y divide-border rounded-lg border bg-card shadow-sm overflow-hidden">
      {results.map((item) => (
        <li key={item.simp}>
          <button
            type="button"
            onClick={() => onSelect(item)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-muted transition-colors"
          >
            {/* Chinese character(s) */}
            <span className="font-chinese text-2xl font-medium w-10 shrink-0 text-center leading-none">
              {item.simp}
            </span>
            {/* Middle: pinyin + traditional */}
            <span className="flex flex-col min-w-0">
              <span className="text-sm text-muted-foreground leading-tight">
                {item.pinyin}
                {item.trad && item.trad !== item.simp && (
                  <span className="ml-1 font-chinese">({item.trad})</span>
                )}
              </span>
              {item.vi && (
                <span className="text-sm truncate">{item.vi}</span>
              )}
              {!item.vi && item.en && (
                <span className="text-sm text-muted-foreground truncate">
                  {item.en}
                </span>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

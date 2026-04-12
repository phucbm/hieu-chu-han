"use client";

/**
 * SuggestionItem — Single row in the suggestion dropdown.
 * Left: large Chinese character for quick visual identification.
 * Right row 1: trad form (if different from simp).
 * Right row 2: pinyin · Vietnamese definition (truncated to 1 line).
 * Data source: WordSummary from suggestWords() server action.
 */

import type { WordSummary } from "@/core/types";

interface SuggestionItemProps {
  item: WordSummary;
  onSelect: () => void;
}

export function SuggestionItem({ item, onSelect }: SuggestionItemProps) {
  const showTrad = item.trad && item.trad !== item.simp;

  return (
    <button
      type="button"
      // Prevent input blur before click fires
      onMouseDown={(e) => e.preventDefault()}
      onClick={onSelect}
      className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors"
    >
      {/* Large character anchor */}
      <span className="font-chinese text-2xl font-medium w-9 shrink-0 text-center leading-none">
        {item.simp}
      </span>

      {/* Text info */}
      <span className="flex flex-col min-w-0 flex-1">
        {/* Row 1: simp + optional trad */}
        <span className="flex items-baseline gap-1.5 leading-tight">
          <span className="font-chinese font-medium text-sm">{item.simp}</span>
          {showTrad && (
            <span className="font-chinese text-xs text-muted-foreground">
              ({item.trad})
            </span>
          )}
        </span>
        {/* Row 2: pinyin + vi definition */}
        <span className="flex items-baseline gap-1.5 min-w-0 leading-tight">
          <span className="text-xs text-muted-foreground shrink-0">
            {item.pinyin}
          </span>
          {(item.vi || item.en) && (
            <span className="text-xs truncate">
              {item.vi || item.en}
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

"use client";

/**
 * SuggestionBox — Floating suggestion dropdown.
 * Positioned absolutely below SearchInput. Only shown when input is focused
 * and suggestions exist.
 * Data source: WordSummary[] from suggestWords() server action.
 */

import { SuggestionItem } from "@/components/search/SuggestionItem";
import type { WordSummary } from "@/core/types";

interface SuggestionBoxProps {
  visible: boolean;
  suggestions: WordSummary[];
  onSelect: (simp: string) => void;
}

export function SuggestionBox({
  visible,
  suggestions,
  onSelect,
}: SuggestionBoxProps) {
  if (!visible || suggestions.length === 0) return null;

  return (
    <div
      className="absolute top-full left-0 right-0 z-50 mt-1
                  rounded-lg border bg-popover text-popover-foreground
                  shadow-md overflow-hidden"
    >
      <ul className="divide-y divide-border">
        {suggestions.map((item, i) => (
          <li key={`${item.simp}-${item.pinyin}-${i}`}>
            <SuggestionItem
              item={item}
              onSelect={() => onSelect(item.simp)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

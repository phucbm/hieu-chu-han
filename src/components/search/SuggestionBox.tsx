"use client";

/**
 * SuggestionBox — Floating suggestion dropdown.
 * Positioned absolutely below SearchInput. Only shown when input is focused
 * and suggestions exist.
 * Data source: WordSummary[] from suggestWords() server action.
 */

import { WordRow } from "@/components/search/WordRow";
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
            <WordRow
              simp={item.simp}
              trad={item.trad}
              pinyin={item.pinyin}
              vi={item.vi}
              en={item.en}
              onSelect={() => onSelect(item.simp)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

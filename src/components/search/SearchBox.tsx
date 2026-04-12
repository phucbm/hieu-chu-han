"use client";

/**
 * SearchBox — Unified search component: input + recent searches + results list.
 *
 * Results render inline below the input and collapse on: result click, input
 * blur, or Escape. On mobile the list is max 300 px tall and scrolls inside.
 *
 * Handwriting panel is an inline collapsible below the input row. It is
 * mutually exclusive with the results list — they are never visible at the
 * same time. Toggle with the pen button; the recognizer lifecycle is tied to
 * open/close.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { SearchInput } from "@/components/search/SearchInput";
import { RecentSearch } from "@/components/search/RecentSearch";
import { WordRow } from "@/components/search/WordRow";
import { HandwritingPad } from "@/components/HandwritingPad";
import { HandwritingRecognizer, type Candidate } from "@/core/handwriting";
import { wordKey, type WordEntry } from "@/core/types";
import type { ViewedWord } from "@/hooks/useViewedWords";

interface SearchBoxProps {
  query: string;
  onQueryChange: (value: string) => void;
  results: WordEntry[];
  isLoading?: boolean;
  recentSearches: ViewedWord[];
  onRecentSearchSelect: (simp: string) => void;
  onResultSelect: (simp: string) => void;
  /** Called on Escape so the parent can clear results. */
  onEscape?: () => void;
}

export function SearchBox({
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
  const [handwritingOpen, setHandwritingOpen] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [strokeCount, setStrokeCount] = useState(0);
  const [padKey, setPadKey] = useState(0);
  const recognizer = useRef<HandwritingRecognizer | null>(null);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resultsOpen = focused && results.length > 0 && !handwritingOpen;

  // ── Recognizer lifecycle ───────────────────────────────────────────────────
  useEffect(() => {
    if (handwritingOpen) {
      recognizer.current = new HandwritingRecognizer();
      recognizer.current.init((r) => setCandidates(r));
    } else {
      recognizer.current?.destroy();
      recognizer.current = null;
      setCandidates([]);
      setStrokeCount(0);
    }
  }, [handwritingOpen]);

  // ── Focus / blur ───────────────────────────────────────────────────────────
  const handleFocus = useCallback(() => {
    if (blurTimer.current) clearTimeout(blurTimer.current);
    setFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    // Small delay so a result click fires before we collapse.
    blurTimer.current = setTimeout(() => setFocused(false), 150);
  }, []);

  // ── Handwriting ────────────────────────────────────────────────────────────
  const handleStrokeEnd = useCallback((strokes: number[][][]) => {
    setStrokeCount(strokes.length);
    if (strokes.length === 0) {
      setCandidates([]);
    } else {
      recognizer.current?.lookup(strokes);
    }
  }, []);

  const handlePadClear = useCallback(() => setCandidates([]), []);

  const handleCandidateSelect = useCallback(
    (char: string) => {
      onQueryChange(query + char);
      setHandwritingOpen(false);
      setFocused(true);
    },
    [onQueryChange, query]
  );

  // ── Result select ──────────────────────────────────────────────────────────
  const handleResultSelect = useCallback(
    (entry: WordEntry) => {
      setFocused(false);
      setHandwritingOpen(false);
      onResultSelect(wordKey(entry));
    },
    [onResultSelect]
  );

  return (
    <div className="flex flex-col gap-4">
      <SearchInput
        value={query}
        onChange={onQueryChange}
        isLoading={isLoading}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onEscape={() => {
          setFocused(false);
          onEscape?.();
        }}
        onHandwriting={() => setHandwritingOpen((v) => !v)}
      />

      <RecentSearch words={recentSearches} onSelect={onRecentSearchSelect} />

      {/* ── Results list ────────────────────────────────────────────────── */}
      {resultsOpen && (
        <ul className="divide-y divide-border rounded-lg border shrink-0 max-h-[300px] lg:max-h-none overflow-y-auto">
          {results.map((item, i) => (
            <li key={`${item.simp}-${item.pinyin}-${i}`}>
              <WordRow
                entry={item}
                onSelect={() => handleResultSelect(item)}
              />
            </li>
          ))}
        </ul>
      )}

      {/* ── Handwriting panel ───────────────────────────────────────────── */}
      {handwritingOpen && (
        <div className="flex flex-col items-center gap-4">
          <HandwritingPad
            key={padKey}
            onStrokeEnd={handleStrokeEnd}
            onClear={handlePadClear}
            strokeCount={strokeCount}
            onUndo={() => {}}
          />

          {candidates.length > 0 ? (
            <div className="w-full">
              <p className="text-xs text-muted-foreground mb-2">Chọn chữ phù hợp:</p>
              <div className="grid grid-cols-8 gap-1">
                {candidates.map((c) => (
                  <button
                    key={c.hanzi}
                    type="button"
                    onClick={() => handleCandidateSelect(c.hanzi)}
                    className="font-chinese text-2xl rounded-md border py-1 hover:bg-muted transition-colors text-center"
                  >
                    {c.hanzi}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {strokeCount === 0 ? "Vẽ một chữ Hán" : "Đang nhận dạng..."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

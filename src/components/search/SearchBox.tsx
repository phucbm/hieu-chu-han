"use client";

/**
 * SearchBox — Unified search component: input + recent searches + results list.
 *
 * collapsible=false (desktop): results/message always visible when query is
 *   non-empty and handwriting is closed.
 *
 * collapsible=true (mobile): results/message only shown when the input is
 *   focused. Collapses on blur, result click, or Escape.
 *
 * Handwriting panel is an inline collapsible, mutually exclusive with the
 * results area on both breakpoints.
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
  /** On mobile: collapse results until input is focused. Default: false. */
  collapsible?: boolean;
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
  collapsible = false,
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
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Refocus after search completes to recover from DOM-churn blur ─────────
  const prevLoadingRef = useRef(false);
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading && query.length > 0) {
      inputRef.current?.focus();
    }
    prevLoadingRef.current = isLoading ?? false;
  }, [isLoading, query.length]);

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
        ref={inputRef}
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

      {/* ── Results list / no-match message ────────────────────────────── */}
      {(!collapsible || focused) && !handwritingOpen && query.length > 0 && !isLoading && (
        results.length > 0 ? (
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
        ) : (
          <p className="text-xs text-muted-foreground px-1">Không tìm thấy kết quả phù hợp</p>
        )
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

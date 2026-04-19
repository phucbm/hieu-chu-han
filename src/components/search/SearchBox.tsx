"use client";

/**
 * SearchBox — Unified search component: input + recent searches + results list.
 *
 * Two mutually exclusive modes driven by last user interaction:
 *   text        — text input focused → results list visible
 *   handwriting — pad open → canvas + candidates visible
 *
 * Clicking the text input while the pad is open switches back to text mode.
 * Selecting a candidate stays in handwriting mode and clears the canvas.
 *
 * collapsible=true (mobile): results/pad only visible while focused or pad open.
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

  // Refocus text input after search completes, but only when in text mode
  const prevLoadingRef = useRef(false);
  useEffect(() => {
    if (prevLoadingRef.current && !isLoading && query.length > 0 && !handwritingOpen) {
      inputRef.current?.focus();
    }
    prevLoadingRef.current = isLoading ?? false;
  }, [isLoading, query.length, handwritingOpen]);

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
    setHandwritingOpen(false); // switch to text mode
  }, []);

  const handleBlur = useCallback(() => {
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

  const handlePadClear = useCallback(() => {
    setCandidates([]);
    setStrokeCount(0);
  }, []);

  const handleCandidateSelect = useCallback(
    (char: string) => {
      onQueryChange(query + char);
      // Stay in handwriting mode — clear canvas so user can draw the next character immediately
      setPadKey((k) => k + 1);
      setCandidates([]);
      setStrokeCount(0);
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

  const showResults =
    (!collapsible || focused) && !handwritingOpen && query.length > 0 && !isLoading;

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
          setHandwritingOpen(false);
          onEscape?.();
        }}
        onHandwriting={() => setHandwritingOpen((v) => !v)}
      />

      <RecentSearch words={recentSearches} onSelect={onRecentSearchSelect} />

      {/* ── Results list / no-match message ────────────────────────────── */}
      {showResults && (
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
        ) : (() => {
          const cjkChars = query.match(/[\u4e00-\u9fff]/g) ?? [];
          return (
            <div className="flex flex-col gap-2 px-1">
              <p className="text-xs text-muted-foreground">
                Không tìm thấy kết quả{cjkChars.length > 0 ? ", thử từng chữ:" : " phù hợp"}
              </p>
              {cjkChars.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {cjkChars.map((char, i) => (
                    <button
                      key={`${char}-${i}`}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => onResultSelect(char)}
                      className="font-chinese text-xl rounded-md border px-2.5 py-1 hover:bg-muted transition-colors"
                    >
                      {char}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })()
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

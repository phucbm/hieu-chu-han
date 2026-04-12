"use client";

/**
 * page.tsx — Trang chủ Hiểu Chữ Hán
 *
 * Desktop layout (≥1024px): 3 columns
 *   Col 1 (fixed left,  w-80):  AppSidebar — logo + search + recent searches
 *   Col 2 (flex-1, pl-80 pr-72): main content — word detail
 *   Col 3 (fixed right, w-72):  RecentViewedPanel — full view history
 *
 * Mobile layout (<1024px): stacked
 *   Row 1 sticky: AppHeader
 *   Row 2 sticky: SearchInput + RecentSearch + SuggestionBox overlay
 *   Row 3 scroll: word detail
 *   HistoryBottomSheet: overlay for viewed words
 *
 * All word navigation flows through openWord(simp):
 *   suggestion click, related word, etymology component,
 *   viewed word, ?word= URL param on mount
 *
 * Recent search badge click appends to current input (does not replace).
 */

import {
  useState,
  useCallback,
  useTransition,
  useRef,
  useEffect,
} from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { HistoryBottomSheet } from "@/components/layout/HistoryBottomSheet";
import { RecentViewedPanel } from "@/components/layout/RecentViewedPanel";
import { SearchInput } from "@/components/search/SearchInput";
import { SuggestionBox } from "@/components/search/SuggestionBox";
import { RecentSearch } from "@/components/search/RecentSearch";
import { WordTabs } from "@/components/word/WordTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { searchWords, getWordEntries } from "@/app/actions";
import { useViewedWords } from "@/hooks/useViewedWords";
import type { WordEntry, WordSummary } from "@/core/types";

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function HomePage() {
  // Search input state
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 600);

  // Search results: top 20, fetched on debounce, drives both desktop list and mobile dropdown
  const [results, setResults] = useState<WordSummary[]>([]);

  // Desktop: results list visible whenever input has a value (no focus requirement)
  const showResults = results.length > 0 && query.trim().length > 0;

  // Mobile: floating dropdown — top 10, only while input is focused
  const [inputFocused, setInputFocused] = useState(false);
  const mobileSuggestions = results.slice(0, 10);
  const showMobileSuggestions = inputFocused && mobileSuggestions.length > 0;

  // Selected word detail
  const [selectedEntries, setSelectedEntries] = useState<WordEntry[]>([]);

  // Mobile history sheet
  const [historyOpen, setHistoryOpen] = useState(false);

  // Loading states
  const [isSuggestPending, startSuggestTransition] = useTransition();
  const [isDetailPending, startDetailTransition] = useTransition();

  // Viewed words history
  const { viewedWords, addViewedWord, removeViewedWord } = useViewedWords();

  // ── Fetch results: 600ms debounce, top 20 ────────────────────────────────
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([]);
      return;
    }
    startSuggestTransition(async () => {
      const items = await searchWords(debouncedQuery);
      setResults(items);
    });
  }, [debouncedQuery]);

  // ── openWord — single shared handler for all word navigation ─────────────
  const openWord = useCallback(
    (simp: string) => {
      if (!simp.trim()) return;
      setQuery(simp);
      setInputFocused(false);
      startDetailTransition(async () => {
        const entries = await getWordEntries(simp);
        setSelectedEntries(entries);
        if (entries[0]) {
          addViewedWord({
            simp: entries[0].simp,
            trad: entries[0].trad,
            pinyin: entries[0].pinyin,
            sinoViet: entries[0].sinoVietnamese || undefined,
          });
          // Update URL without triggering a navigation
          window.history.replaceState(
            null,
            "",
            `?word=${encodeURIComponent(entries[0].simp)}`
          );
        }
      });
    },
    [addViewedWord]
  );

  // Keep a stable ref so the mount effect can call the latest openWord
  const openWordRef = useRef(openWord);
  openWordRef.current = openWord;

  // ── Handle ?word= URL param on first mount ───────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const word = params.get("word");
    if (word) openWordRef.current(word);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Handlers ─────────────────────────────────────────────────────────────
  /** Hides the mobile floating dropdown (clears input focus flag) */
  const dismissMobileSuggestions = useCallback(() => {
    setInputFocused(false);
  }, []);

  /**
   * Recent search badge: appends simp to the current input value.
   * Does NOT replace — lets users compose compound queries.
   * The debounce will then fetch suggestions for the combined string.
   */
  const handleRecentSearchAppend = useCallback((simp: string) => {
    setQuery((prev) => prev + simp);
  }, []);

  // ── Detail content ───────────────────────────────────────────────────────
  const detailContent = isDetailPending ? (
    <div className="flex flex-col gap-4 py-4">
      <Skeleton className="h-36 w-full rounded-xl" />
      <Skeleton className="h-52 w-full rounded-xl" />
    </div>
  ) : selectedEntries.length > 0 ? (
    <WordTabs entries={selectedEntries} onWordClick={openWord} />
  ) : null;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background">
      {/* ── Col 1: Desktop left sidebar ───────────────────────────────────── */}
      <AppSidebar
        query={query}
        onQueryChange={setQuery}
        results={results}
        showResults={showResults}
        onResultSelect={openWord}
        onInputFocus={() => setInputFocused(true)}
        onDismissResults={() => setResults([])}
        isLoading={isSuggestPending}
        recentSearches={viewedWords.slice(0, 5)}
        onRecentSearchSelect={handleRecentSearchAppend}
      />

      {/* ── Col 3: Desktop right viewed-words panel ───────────────────────── */}
      <RecentViewedPanel
        viewedWords={viewedWords}
        onSelect={openWord}
        onRemove={removeViewedWord}
      />

      {/* ── Mobile: sticky header + search area (hidden on desktop) ──────── */}
      <div className="lg:hidden">
        <AppHeader onOpenHistory={() => setHistoryOpen(true)} />

        {/* Row 2: sticky below header */}
        <div className="sticky top-14 z-20 bg-background border-b px-4 py-3">
          {/* Relative container for SuggestionBox positioning */}
          <div
            className="relative"
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                dismissMobileSuggestions();
              }
            }}
          >
            <SearchInput
              value={query}
              onChange={setQuery}
              isLoading={isSuggestPending}
              onFocus={() => setInputFocused(true)}
              onEscape={dismissMobileSuggestions}
            />
            <SuggestionBox
              visible={showMobileSuggestions}
              suggestions={mobileSuggestions}
              onSelect={(simp) => {
                dismissMobileSuggestions();
                openWord(simp);
              }}
            />
          </div>
          <RecentSearch
            words={viewedWords.slice(0, 5)}
            onSelect={handleRecentSearchAppend}
          />
        </div>
      </div>

      {/* ── Col 2: Main content ───────────────────────────────────────────── */}
      {/* Desktop: inset between sidebar (pl-80) and right panel (pr-72) */}
      {/* Mobile: normal document flow */}
      <main className="lg:pl-80 lg:pr-72 lg:h-screen lg:overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
        {detailContent ? (
          <div className="max-w-3xl mx-auto">{detailContent}</div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center text-muted-foreground gap-3">
            <span className="font-chinese text-7xl opacity-15 select-none">
              漢
            </span>
            <p className="text-sm">Nhập chữ Hán để tra cứu</p>
          </div>
        )}
      </main>

      {/* ── Mobile history bottom sheet ───────────────────────────────────── */}
      <HistoryBottomSheet
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        viewedWords={viewedWords}
        onSelect={(simp) => {
          setHistoryOpen(false);
          openWord(simp);
        }}
      />
    </div>
  );
}

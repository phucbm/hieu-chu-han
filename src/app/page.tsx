"use client";

/**
 * page.tsx — Trang chủ Hiểu Chữ Hán
 *
 * Layout:
 *   Desktop (≥1024px): Fixed sidebar (AppSidebar) + scrollable main content
 *   Mobile (<1024px):  Sticky header (AppHeader) + sticky search area + scrollable main
 *
 * All word navigation flows through openWord(simp):
 *   suggestion click → openWord
 *   recent search badge → setQuery + openWord
 *   etymology component → openWord
 *   related word → openWord
 *   viewed word badge → openWord
 *   ?word= URL param (on mount) → openWord
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
import { SearchInput } from "@/components/search/SearchInput";
import { SuggestionBox } from "@/components/search/SuggestionBox";
import { RecentSearch } from "@/components/search/RecentSearch";
import { WordTabs } from "@/components/word/WordTabs";
import { Skeleton } from "@/components/ui/skeleton";
import { suggestWords, getWordEntries } from "@/app/actions";
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
  const debouncedQuery = useDebounce(query, 300);

  // Auto-suggest dropdown
  const [suggestions, setSuggestions] = useState<WordSummary[]>([]);
  // Track focus so suggestions only appear while input is active
  const [inputFocused, setInputFocused] = useState(false);
  const showSuggestions = inputFocused && suggestions.length > 0;

  // Selected word detail
  const [selectedEntries, setSelectedEntries] = useState<WordEntry[]>([]);

  // Mobile history sheet
  const [historyOpen, setHistoryOpen] = useState(false);

  // Loading states
  const [isSuggestPending, startSuggestTransition] = useTransition();
  const [isDetailPending, startDetailTransition] = useTransition();

  // Viewed words history
  const { viewedWords, addViewedWord } = useViewedWords();

  // ── Auto-suggest: fires 300ms after the user stops typing ─────────────────
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSuggestions([]);
      return;
    }
    startSuggestTransition(async () => {
      const items = await suggestWords(debouncedQuery);
      setSuggestions(items);
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
  const dismissSuggestions = useCallback(() => {
    setInputFocused(false);
  }, []);

  /**
   * Recent search / viewed badge: fills input AND opens the word.
   */
  const handleWordSelect = useCallback(
    (simp: string) => {
      setQuery(simp);
      openWord(simp);
    },
    [openWord]
  );

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
      {/* ── Desktop sidebar (hidden on mobile) ───────────────────────────── */}
      <AppSidebar
        query={query}
        onQueryChange={setQuery}
        suggestions={suggestions}
        showSuggestions={showSuggestions}
        onSuggestionSelect={openWord}
        onInputFocus={() => setInputFocused(true)}
        onDismissSuggestions={dismissSuggestions}
        isLoadingSuggestions={isSuggestPending}
        recentSearches={viewedWords.slice(0, 5)}
        onRecentSearchSelect={handleWordSelect}
        viewedWords={viewedWords}
        onViewedWordSelect={openWord}
      />

      {/* ── Mobile: sticky header + search area (hidden on desktop) ──────── */}
      <div className="lg:hidden">
        <AppHeader onOpenHistory={() => setHistoryOpen(true)} />

        {/* Row 2: sticky below header */}
        <div className="sticky top-14 z-20 bg-background border-b px-4 py-3">
          {/* Relative container for SuggestionBox positioning */}
          <div
            className="relative"
            onFocus={() => setInputFocused(true)}
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                dismissSuggestions();
              }
            }}
          >
            <SearchInput
              value={query}
              onChange={setQuery}
              isLoading={isSuggestPending}
              onEscape={dismissSuggestions}
            />
            <SuggestionBox
              visible={showSuggestions}
              suggestions={suggestions}
              onSelect={(simp) => {
                dismissSuggestions();
                openWord(simp);
              }}
            />
          </div>
          <RecentSearch
            words={viewedWords.slice(0, 5)}
            onSelect={handleWordSelect}
          />
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      {/* Desktop: offset by sidebar width + independently scrollable */}
      {/* Mobile: normal document flow */}
      <main className="lg:pl-80 lg:h-screen lg:overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">
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

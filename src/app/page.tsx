"use client";

/**
 * page.tsx — Trang chủ Hiểu Chữ Hán
 *
 * UX flow:
 *   User types → auto-suggest dropdown (debounced 300ms)
 *   Enter / Search button → results list (up to 20)
 *   Click result → CharCard / TabView rendered
 *   Related word click → same flow as clicking a result
 *   Input empty + focused → history dropdown
 *   History item click → CharCard directly (skip results list)
 *
 * Responsive layout:
 *   Mobile (< 768px):    single column
 *   Tablet (768–1023px): single column, centered, wider
 *   Desktop (≥ 1024px):  two columns — left: search+results, right: card
 */

import {
  useState,
  useCallback,
  useTransition,
  useRef,
  useEffect,
} from "react";
import { SearchBar } from "@/components/SearchBar";
import { SearchResults } from "@/components/SearchResults";
import { ResultView } from "@/components/ResultView";
import { Skeleton } from "@/components/ui/skeleton";
import { suggestWords, searchWords, getWordEntries } from "@/app/actions";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import type { WordEntry, WordSummary, HistoryItem } from "@/core/types";

// ── Debounce hook ─────────────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ── Page component ────────────────────────────────────────────────────────────
export default function HomePage() {
  const inputRef = useRef<HTMLInputElement>(null);

  // Search state
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 300);

  // Dropdown visibility
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Auto-suggest items (populated via server action)
  const [suggestions, setSuggestions] = useState<WordSummary[]>([]);

  // Results list (shown after Enter/Search)
  const [results, setResults] = useState<WordSummary[] | null>(null);

  // Full entry for CharCard display
  const [selectedEntries, setSelectedEntries] = useState<WordEntry[]>([]);

  // Loading states
  const [isSuggestPending, startSuggestTransition] = useTransition();
  const [isSearchPending, startSearchTransition] = useTransition();
  const [isDetailPending, startDetailTransition] = useTransition();

  const isLoading = isSuggestPending || isSearchPending || isDetailPending;

  // History
  const { history, addToHistory, clearHistory } = useSearchHistory();

  // ── Auto-suggest: fire when debounced query changes ─────────────────────────
  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    startSuggestTransition(async () => {
      const items = await suggestWords(debouncedQuery);
      setSuggestions(items);
      setShowSuggestions(items.length > 0);
      setShowHistory(false);
    });
  }, [debouncedQuery]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  /** Called when user changes the input text */
  const handleQueryChange = useCallback((value: string) => {
    setQuery(value);
    if (!value.trim()) {
      // Clear suggestions; history shown on focus
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, []);

  /** Called when input is focused — show history if empty */
  const handleInputFocus = useCallback(() => {
    if (!query.trim()) {
      setShowHistory(true);
      setShowSuggestions(false);
    }
  }, [query]);

  /** Close all dropdowns */
  const handleDismiss = useCallback(() => {
    setShowSuggestions(false);
    setShowHistory(false);
  }, []);

  /** Enter / Search button: fetch results list */
  const handleSearch = useCallback(() => {
    if (!query.trim()) return;
    handleDismiss();
    setSelectedEntries([]);
    startSearchTransition(async () => {
      const items = await searchWords(query);
      setResults(items);
    });
  }, [query, handleDismiss]);

  /**
   * User selected a suggestion from dropdown — fetch full entry directly,
   * bypass results list (same UX as clicking a result item).
   */
  const handleSuggestionSelect = useCallback((summary: WordSummary) => {
    setQuery(summary.simp);
    setResults(null);
    addToHistory({
      simp: summary.simp,
      trad: summary.trad,
      pinyin: summary.pinyin,
      vi: summary.vi,
    });
    startDetailTransition(async () => {
      const entries = await getWordEntries(summary.simp);
      setSelectedEntries(entries);
    });
  }, [addToHistory]);

  /**
   * User clicked a result item in the results list — fetch full entry.
   */
  const handleResultSelect = useCallback((summary: WordSummary) => {
    setResults(null);
    setQuery(summary.simp);
    addToHistory({
      simp: summary.simp,
      trad: summary.trad,
      pinyin: summary.pinyin,
      vi: summary.vi,
    });
    startDetailTransition(async () => {
      const entries = await getWordEntries(summary.simp);
      setSelectedEntries(entries);
    });
  }, [addToHistory]);

  /**
   * User clicked a history item — fetch full entry directly, skip results list.
   */
  const handleHistorySelect = useCallback((item: HistoryItem) => {
    setQuery(item.simp);
    setResults(null);
    addToHistory({
      simp: item.simp,
      trad: item.trad,
      pinyin: item.pinyin,
      vi: item.vi,
    });
    startDetailTransition(async () => {
      const entries = await getWordEntries(item.simp);
      setSelectedEntries(entries);
    });
  }, [addToHistory]);

  /**
   * Related word chip clicked inside CharCard — treat as new search.
   */
  const handleRelatedWordClick = useCallback((word: string) => {
    setQuery(word);
    setResults(null);
    startDetailTransition(async () => {
      const entries = await getWordEntries(word);
      setSelectedEntries(entries);
      // Add to history if we got a result
      if (entries[0]) {
        addToHistory({
          simp: entries[0].simp,
          trad: entries[0].trad,
          pinyin: entries[0].pinyin,
          vi: entries[0].definitionVi,
        });
      }
    });
  }, [addToHistory]);

  // ── Shared left-column content ─────────────────────────────────────────────
  const leftContent = (
    <>
      {/* App header */}
      <header className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Hiểu Chữ Hán
        </h1>
        <p className="text-sm text-muted-foreground">
          Tra cứu chữ Hán · Hán Việt · Nét chữ · Tự nguyên
        </p>
      </header>

      {/* Search bar with suggestion/history dropdown */}
      <div
        className="w-full max-w-[600px]"
        onFocus={handleInputFocus}
      >
        <SearchBar
          ref={inputRef}
          value={query}
          onChange={handleQueryChange}
          onSearch={handleSearch}
          onSuggestionSelect={handleSuggestionSelect}
          suggestions={suggestions}
          showSuggestions={showSuggestions && !showHistory}
          onDismiss={handleDismiss}
          history={history}
          showHistory={showHistory}
          onHistorySelect={handleHistorySelect}
          onClearHistory={clearHistory}
          loading={isSuggestPending}
        />
      </div>

      {/* Results list (after search, before card selection) */}
      {isSearchPending && (
        <div className="w-full max-w-[600px] flex flex-col gap-2">
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
          <Skeleton className="h-14 w-full rounded-lg" />
        </div>
      )}
      {!isSearchPending && results !== null && (
        <div className="w-full max-w-[600px]">
          <SearchResults results={results} onSelect={handleResultSelect} />
        </div>
      )}
    </>
  );

  // CharCard / TabView section
  const detailContent = isDetailPending ? (
    <div className="w-full flex flex-col gap-4">
      <Skeleton className="h-40 w-full rounded-xl" />
      <Skeleton className="h-52 w-full rounded-xl" />
    </div>
  ) : selectedEntries.length > 0 ? (
    <ResultView
      entries={selectedEntries}
      onRelatedWordClick={handleRelatedWordClick}
    />
  ) : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    // Desktop: flex-row two-column; Mobile/Tablet: flex-col single column
    <div className="flex flex-col lg:flex-row flex-1 min-h-screen">
      {/* ── Left column: header + search + results ──────────────────────── */}
      <div className="flex flex-col items-center gap-6 px-4 py-8
                      lg:w-[420px] lg:shrink-0 lg:border-r lg:overflow-y-auto
                      lg:sticky lg:top-0 lg:h-screen">
        {leftContent}

        {/* On mobile/tablet: card renders here (below results) */}
        {detailContent && (
          <div className="w-full max-w-[680px] lg:hidden">
            {detailContent}
          </div>
        )}
      </div>

      {/* ── Right column: CharCard / TabView (desktop only) ─────────────── */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-start
                      px-6 py-8 overflow-y-auto">
        {detailContent ? (
          <div className="w-full max-w-[640px]">
            {detailContent}
          </div>
        ) : (
          /* Placeholder when no card is selected */
          <div className="flex flex-col items-center justify-center flex-1
                          text-center text-muted-foreground gap-2">
            <span className="font-chinese text-5xl opacity-20">漢</span>
            <p className="text-sm">Chọn một từ để xem chi tiết</p>
          </div>
        )}
      </div>
    </div>
  );
}

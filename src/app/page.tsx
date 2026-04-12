"use client";

/**
 * page.tsx — Trang chủ Hiểu Chữ Hán
 * Mobile-first dictionary search page.
 *
 * Layout:
 * - Header: app name + tagline
 * - Search bar
 * - Results (CharCard or TabView)
 */

import { useState, useCallback, useTransition } from "react";
import { SearchBar } from "@/components/SearchBar";
import { ResultView } from "@/components/ResultView";
import { searchDictionary } from "@/app/actions";
import type { WordEntry } from "@/core/types";

export default function HomePage() {
  const [query, setQuery] = useState("");
  const [entries, setEntries] = useState<WordEntry[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isPending, startTransition] = useTransition();

  /**
   * Run a search via the server action (server-side dictionary lookup).
   */
  const runSearch = useCallback((input: string) => {
    startTransition(async () => {
      const results = await searchDictionary(input);
      setEntries(results);
      setHasSearched(true);
    });
  }, []);

  /**
   * Handle related word click — update query and run new search.
   */
  const handleRelatedWordClick = useCallback(
    (word: string) => {
      setQuery(word);
      runSearch(word);
    },
    [runSearch]
  );

  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8 min-h-screen gap-8">
      {/* ── App header ─────────────────────────────────── */}
      <header className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-primary">
          Hiểu Chữ Hán
        </h1>
        <p className="text-sm text-muted-foreground">
          Tra cứu chữ Hán · Hán Việt · Nét chữ · Tự nguyên
        </p>
      </header>

      {/* ── Search bar ──────────────────────────────────── */}
      <SearchBar
        value={query}
        onChange={setQuery}
        onSearch={runSearch}
        loading={isPending}
      />

      {/* ── Results ─────────────────────────────────────── */}
      <section className="w-full flex flex-col items-center">
        <ResultView
          entries={entries}
          loading={isPending}
          hasSearched={hasSearched}
          onRelatedWordClick={handleRelatedWordClick}
        />
      </section>
    </main>
  );
}

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
 *   Row 2 sticky: SearchBox (input + recent searches + collapsible results)
 *   Row 3 scroll: word detail
 *   HistoryBottomSheet: overlay for viewed words
 *
 * All word navigation flows through openWord(simp):
 *   suggestion click, related word, etymology component,
 *   viewed word, ?word= URL param on mount
 *
 * Recent search badge click appends to current input (does not replace).
 */

import {useCallback, useEffect, useRef, useState, useTransition,} from "react";
import Image from "next/image";
import {AppSidebar} from "@/components/layout/AppSidebar";
import {AppHeader} from "@/components/layout/AppHeader";
import {HistoryBottomSheet} from "@/components/layout/HistoryBottomSheet";
import {RecentViewedPanel} from "@/components/layout/RecentViewedPanel";
import {SearchBox} from "@/components/search/SearchBox";
import {WordTabs} from "@/components/word/WordTabs";
import {Skeleton} from "@/components/ui/skeleton";
import {getWordEntries, searchWords} from "@/app/actions";
import {useViewedWords} from "@/hooks/useViewedWords";
import {wordKey, type WordEntry} from "@/core/types";
import pkg from "../../package.json";

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
    const [results, setResults] = useState<WordEntry[]>([]);

    // Selected word detail
    const [selectedEntries, setSelectedEntries] = useState<WordEntry[]>([]);
    const [activeTab, setActiveTab] = useState<string | undefined>(undefined);

    // Mobile history sheet
    const [historyOpen, setHistoryOpen] = useState(false);

    // Loading states
    const [isSuggestPending, startSuggestTransition] = useTransition();
    const [isDetailPending, startDetailTransition] = useTransition();

    // Viewed words history
    const {viewedWords, addViewedWord, removeViewedWord} = useViewedWords();

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
        (simp: string, preferredTab?: string) => {
            if (!simp.trim()) return;
            setQuery(simp);
            startDetailTransition(async () => {
                const entries = await getWordEntries(simp);
                setSelectedEntries(entries);
                if (entries[0]) {
                    const tab = preferredTab ?? wordKey(entries[0]);
                    setActiveTab(tab);
                    addViewedWord({
                        simp: wordKey(entries[0]),
                        trad: entries[0].trad,
                        pinyin: entries[0].pinyin,
                        sinoViet: entries[0].sinoVietnamese || undefined,
                        entry: entries[0],
                    });
                    const defaultTab = wordKey(entries[0]);
                    const url = tab === defaultTab
                        ? `?word=${encodeURIComponent(simp)}`
                        : `?word=${encodeURIComponent(simp)}&active=${encodeURIComponent(tab)}`;
                    window.history.replaceState(null, "", url);
                }
            });
        },
        [addViewedWord]
    );

    // ── Tab change ───────────────────────────────────────────────────────────
    const handleTabChange = useCallback((tab: string) => {
        setActiveTab(tab);
        const params = new URLSearchParams(window.location.search);
        const defaultTab = selectedEntries[0] ? wordKey(selectedEntries[0]) : null;
        if (tab === defaultTab) {
            params.delete("active");
        } else {
            params.set("active", tab);
        }
        window.history.replaceState(null, "", `?${params.toString()}`);
    }, [selectedEntries]);

    // Keep a stable ref so the mount effect can call the latest openWord
    const openWordRef = useRef(openWord);
    openWordRef.current = openWord;

    // ── Handle ?word= URL param on first mount ───────────────────────────────
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const word = params.get("word");
        const active = params.get("active") ?? undefined;
        if (word) openWordRef.current(word, active);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Handlers ─────────────────────────────────────────────────────────────
    /**
     * Recent search badge: appends simp to the current input value.
     * Does NOT replace — lets users compose compound queries.
     * The debounce will then fetch suggestions for the combined string.
     */
    const handleRecentSearchAppend = useCallback((simp: string) => {
        setQuery((prev) => prev + simp);
    }, []);

    // ── Auto-open when search returns no results ─────────────────────────────
    // Only fires for multi-CJK queries (e.g. "的办") — avoids Latin/pinyin noise.
    useEffect(() => {
        const cjkChars = (debouncedQuery.match(/[\u4e00-\u9fff]/g) || []).length;
        if (!isSuggestPending && results.length === 0 && cjkChars >= 2) {
            openWord(debouncedQuery);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isSuggestPending, debouncedQuery, results.length]);

    // ── Detail content ───────────────────────────────────────────────────────
    const detailContent = isDetailPending ? (
        <div className="flex flex-col gap-4 py-4">
            <Skeleton className="h-36 w-full rounded-xl"/>
            <Skeleton className="h-52 w-full rounded-xl"/>
        </div>
    ) : selectedEntries.length > 0 ? (
        <WordTabs entries={selectedEntries} onWordClick={openWord} activeTab={activeTab} onTabChange={handleTabChange}/>
    ) : null;

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="bg-background lg:grid lg:grid-cols-[320px_1fr_288px] lg:h-screen">
            {/* ── Col 1: Desktop left sidebar ───────────────────────────────────── */}
            <AppSidebar
                query={query}
                onQueryChange={setQuery}
                results={results}
                onResultSelect={openWord}
                onDismissResults={() => setResults([])}
                isLoading={isSuggestPending}
                recentSearches={viewedWords.slice(0, 5)}
                onRecentSearchSelect={handleRecentSearchAppend}
            />

            {/* ── Mobile: sticky header + search area (hidden on desktop) ──────── */}
            <div className="lg:hidden">
                <AppHeader onOpenHistory={() => setHistoryOpen(true)}/>

                {/* Row 2: sticky below header */}
                <div className="sticky top-14 z-20 bg-background border-b px-4 py-3">
                    <SearchBox
                        collapsible
                        query={query}
                        onQueryChange={setQuery}
                        results={results}
                        isLoading={isSuggestPending}
                        recentSearches={viewedWords.slice(0, 5)}
                        onRecentSearchSelect={handleRecentSearchAppend}
                        onResultSelect={openWord}
                    />
                </div>
            </div>

            {/* ── Col 2: Main content ───────────────────────────────────────────── */}
            {/* Desktop: middle grid column, scrolls within h-screen */}
            {/* Mobile: normal document flow */}
            <main className="px-4 py-6 lg:px-8 lg:py-8 lg:overflow-y-auto">
                {detailContent ? (
                    <div className="">{detailContent}</div>
                ) : (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4 py-8">
                        <Image src="/icon.png" alt="Hiểu Chữ Hán" width={72} height={72} className="rounded-2xl shadow-md"/>
                        <div className="flex flex-col gap-1">
                            <p className="font-semibold text-foreground">Hiểu Chữ Hán</p>
                            <p className="text-sm text-muted-foreground max-w-xs">{pkg.description}</p>
                        </div>
                        <div className="text-xs text-muted-foreground/60 flex flex-col gap-1 max-w-xs">
                            <p>Mã nguồn mở · Dữ liệu tổng hợp từ:</p>
                            <ul className="space-y-0.5">
                                <li>chinese-lexicon</li>
                                <li>CC-CEDICT / CVDICT</li>
                                <li>Unicode kVietnamese</li>
                                <li>makemeahanzi</li>
                            </ul>
                        </div>
                        <a
                            href="https://github.com/phucbm/hieu-chu-han"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                        >
                            github.com/phucbm/hieu-chu-han
                        </a>
                    </div>
                )}
            </main>


            {/* ── Col 3: Desktop right viewed-words panel ───────────────────────── */}
            <RecentViewedPanel
                viewedWords={viewedWords}
                onSelect={openWord}
                onRemove={removeViewedWord}
            />

            {/* ── Mobile history bottom sheet ───────────────────────────────────── */}
            <HistoryBottomSheet
                open={historyOpen}
                onClose={() => setHistoryOpen(false)}
                viewedWords={viewedWords}
                onSelect={openWord}
                onRemove={removeViewedWord}
            />
        </div>
    );
}

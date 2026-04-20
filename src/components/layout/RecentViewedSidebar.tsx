"use client";

/**
 * RecentViewedSidebar — Viewed word badges at the bottom of the desktop sidebar.
 * Display data is looked up from the client dictionary, not stored in ViewedWord.
 */

import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WordBadge } from "@/components/shared/WordBadge";
import { getWordDetail } from "@/core/client-dictionary";
import type { ViewedWord } from "@/hooks/useViewedWords";
import type { WordEntry } from "@/core/types";

interface RecentViewedSidebarProps {
  viewedWords: ViewedWord[];
  onSelect: (simp: string) => void;
}

export function RecentViewedSidebar({
  viewedWords,
  onSelect,
}: RecentViewedSidebarProps) {
  const [entryMap, setEntryMap] = useState<Map<string, WordEntry>>(new Map());

  useEffect(() => {
    if (viewedWords.length === 0) return;
    Promise.all(
      viewedWords.map((w) =>
        getWordDetail(w.simp).then((entry) => ({ simp: w.simp, entry }))
      )
    ).then((results) => {
      setEntryMap(
        new Map(
          results
            .filter((r): r is { simp: string; entry: WordEntry } => r.entry !== null)
            .map((r) => [r.simp, r.entry])
        )
      );
    });
  }, [viewedWords]);

  const enriched = viewedWords
    .map((w) => entryMap.get(w.simp))
    .filter((e): e is WordEntry => e !== undefined);

  if (enriched.length === 0) return null;

  return (
    <div className="flex flex-col min-h-0">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-5 py-3 border-t">
        Đã xem
      </p>
      <ScrollArea className="flex-1">
        <div className="flex flex-wrap gap-2 px-5 pb-5">
          {enriched.map((entry) => (
            <WordBadge
              key={entry.simp}
              entry={entry}
              onClick={() => onSelect(entry.simp)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

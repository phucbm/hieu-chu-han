"use client";

/**
 * WordTabs — Tab navigation for compound words.
 * Single entry: renders WordTabContent directly (no tab bar).
 * Multiple entries: tabs[0] = full compound, tabs[1+] = individual chars.
 * Data source: WordEntry[] from getWordEntries()
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WordTabContent } from "@/components/word/WordTabContent";
import type { WordEntry } from "@/core/types";

interface WordTabsProps {
  entries: WordEntry[];
  onWordClick: (simp: string) => void;
}

export function WordTabs({ entries, onWordClick }: WordTabsProps) {
  if (entries.length === 0) return null;

  // Deduplicate by simp — e.g. 一生一世 may produce two 一 entries from segmentation
  const unique = entries.filter(
    (e, i) => entries.findIndex((x) => x.simp === e.simp) === i
  );

  if (unique.length === 1) {
    return <WordTabContent entry={unique[0]} onWordClick={onWordClick} />;
  }

  return (
    <Tabs defaultValue={unique[0].simp} className="w-full">
      <TabsList className="w-full flex-wrap h-auto gap-1 p-1 sticky top-0 z-20">
        {unique.map((entry, i) => (
          <TabsTrigger
            key={`${entry.simp}-${i}`}
            value={entry.simp}
            className="flex-1 text-xl font-chinese font-medium min-w-[3rem] py10"
          >
            {entry.simp}
          </TabsTrigger>
        ))}
      </TabsList>
      {unique.map((entry, i) => (
        <TabsContent key={`${entry.simp}-${i}`} value={entry.simp}>
          <WordTabContent entry={entry} onWordClick={onWordClick} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

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
      <div className="sticky top-0 z-20 bg-background">
        <TabsList className="w-full overflow-x-auto h-auto gap-1 p-1 flex flex-nowrap justify-start">
          {unique.map((entry, i) => (
            <TabsTrigger
              key={`${entry.simp}-${i}`}
              value={entry.simp}
              className="shrink-0 text-xl font-chinese font-medium w-auto"
            >
              {entry.simp}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {unique.map((entry, i) => (
        <TabsContent key={`${entry.simp}-${i}`} value={entry.simp}>
          <WordTabContent entry={entry} onWordClick={onWordClick} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

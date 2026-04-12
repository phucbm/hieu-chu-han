"use client";

/**
 * TabView — Hiển thị từng chữ trong từ ghép
 * Shows tabs for compound words.
 * Tab order: [full compound] [char1] [char2] ...
 * e.g. 酸疼 → tabs: 酸疼 | 酸 | 疼
 * Uses shadcn Tabs component.
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CharCard } from "@/components/CharCard";
import type { WordEntry } from "@/core/types";

interface TabViewProps {
  /**
   * Array of entries where entries[0] is the full compound word
   * and entries[1+] are individual characters.
   * Produced by getWordEntries() for compound inputs.
   */
  entries: WordEntry[];
  /** Called when user clicks a related word chip inside any CharCard */
  onRelatedWordClick?: (word: string) => void;
}

/**
 * Tab-based view for compound words.
 * The first entry is the full compound; subsequent entries are individual characters.
 */
export function TabView({ entries, onRelatedWordClick }: TabViewProps) {
  if (entries.length === 0) return null;

  return (
    <Tabs defaultValue={entries[0].simp} className="w-full">
      <TabsList className="w-full flex-wrap h-auto gap-1 p-1">
        {entries.map((entry) => (
          <TabsTrigger
            key={entry.simp}
            value={entry.simp}
            className="flex-1 text-xl font-chinese font-medium min-w-[3rem]"
          >
            {entry.simp}
          </TabsTrigger>
        ))}
      </TabsList>
      {entries.map((entry) => (
        <TabsContent key={entry.simp} value={entry.simp} className="mt-4">
          <CharCard entry={entry} onRelatedWordClick={onRelatedWordClick} />
        </TabsContent>
      ))}
    </Tabs>
  );
}

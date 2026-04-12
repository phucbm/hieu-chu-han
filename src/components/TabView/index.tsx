"use client";

/**
 * TabView — Hiển thị từng chữ trong từ ghép
 * Shows one tab per character in a compound word.
 * Uses shadcn Tabs component.
 */

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CharCard } from "@/components/CharCard";
import type { WordEntry } from "@/core/types";

interface TabViewProps {
  /** Array of entries — one per character in the compound word */
  entries: WordEntry[];
  /** Called when user clicks a related word chip inside any CharCard */
  onRelatedWordClick?: (word: string) => void;
}

/**
 * Tab-based view for compound words.
 * Each tab shows the simplified character as label,
 * and its full CharCard as content.
 */
export function TabView({ entries, onRelatedWordClick }: TabViewProps) {
  if (entries.length === 0) return null;

  return (
    <Tabs defaultValue={entries[0].simp} className="w-full max-w-md">
      <TabsList className="w-full">
        {entries.map((entry) => (
          <TabsTrigger
            key={entry.simp}
            value={entry.simp}
            className="flex-1 text-xl font-medium"
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

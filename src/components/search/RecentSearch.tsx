"use client"

import type { ViewedWord } from "@/hooks/useViewedWords"

interface RecentSearchProps {
  words: ViewedWord[]
  onSelect: (simp: string) => void
}

export function RecentSearch({ words, onSelect }: RecentSearchProps) {
  if (words.length === 0) return null

  return (
    <div className="px-4 py-3">
      <p className="text-xs text-muted-foreground mb-2">Tìm kiếm gần đây</p>
      <div className="flex flex-wrap gap-1.5">
        {words.slice(0, 5).map((w) => (
          <button
            key={w.simp}
            type="button"
            onClick={() => onSelect(w.simp)}
            className="font-chinese text-sm rounded-md border px-2.5 py-1 hover:bg-muted transition-colors"
          >
            {w.simp}
          </button>
        ))}
      </div>
    </div>
  )
}

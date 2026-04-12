"use client";

/**
 * SearchHistory — Lịch sử tìm kiếm
 * Shows previously searched words when the search input is empty and focused.
 * Each item is clickable → renders CharCard directly (skips results list).
 * Uses shadcn ScrollArea for long lists.
 */

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Clock, Trash2 } from "lucide-react";
import type { HistoryItem } from "@/core/types";

interface SearchHistoryProps {
  history: HistoryItem[];
  /** Called when user clicks a history item */
  onSelect: (item: HistoryItem) => void;
  /** Called when user clicks "Xóa lịch sử" */
  onClear: () => void;
}

/**
 * History list panel shown inside the search dropdown when input is empty.
 */
export function SearchHistory({ history, onSelect, onClear }: SearchHistoryProps) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-4 px-3">
        Chưa có lịch sử tìm kiếm.
      </p>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground border-b">
        <Clock className="h-3 w-3" />
        <span>Lịch sử tìm kiếm</span>
      </div>
      <ScrollArea className="max-h-64">
        <ul className="divide-y divide-border">
          {history.map((item) => (
            <li key={`${item.simp}-${item.timestamp}`}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors"
              >
                <span className="font-chinese text-xl font-medium w-8 shrink-0 text-center leading-none">
                  {item.simp}
                </span>
                <span className="flex flex-col min-w-0">
                  <span className="text-xs text-muted-foreground leading-tight">
                    {item.pinyin}
                    {item.trad && item.trad !== item.simp && (
                      <span className="ml-1 font-chinese">({item.trad})</span>
                    )}
                  </span>
                  {item.vi && (
                    <span className="text-sm truncate">{item.vi}</span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </ScrollArea>
      {/* Clear history button */}
      <div className="border-t p-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClear}
          className="w-full text-muted-foreground hover:text-destructive gap-1.5"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Xóa lịch sử
        </Button>
      </div>
    </div>
  );
}

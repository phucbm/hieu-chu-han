"use client";

/**
 * HistoryBottomSheet — Mobile-only bottom sheet for viewed word history.
 * Opens from the bottom with a backdrop. Shows all viewed words as WordBadges.
 * Data source: useViewedWords hook (hch_viewed_words localStorage)
 */

import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { WordBadge } from "@/components/shared/WordBadge";
import { X } from "lucide-react";
import type { ViewedWord } from "@/hooks/useViewedWords";

interface HistoryBottomSheetProps {
  open: boolean;
  onClose: () => void;
  viewedWords: ViewedWord[];
  onSelect: (simp: string) => void;
}

export function HistoryBottomSheet({
  open,
  onClose,
  viewedWords,
  onSelect,
}: HistoryBottomSheetProps) {
  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 ${
          open
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className={`fixed inset-x-0 bottom-0 z-50 flex flex-col bg-background border-t
                    rounded-t-2xl max-h-[70vh] transition-transform duration-300 ease-out ${
          open ? "translate-y-0" : "translate-y-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Lịch sử xem"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b shrink-0">
          <p className="font-semibold">Đã xem</p>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Đóng"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        {viewedWords.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">
            Chưa có từ nào được xem.
          </p>
        ) : (
          <ScrollArea className="flex-1 min-h-0">
            <div className="flex flex-wrap gap-2 p-4">
              {viewedWords.map((w) => (
                <WordBadge
                  key={w.simp}
                  simp={w.simp}
                  pinyin={w.pinyin}
                  onClick={() => {
                    onClose();
                    onSelect(w.simp);
                  }}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </>
  );
}

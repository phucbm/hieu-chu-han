"use client";

/**
 * HistorySheet — Mobile-only right-side sheet for viewed word history.
 * Slides in from the right with a backdrop.
 */

import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { ViewedWordList } from "@/components/layout/ViewedWordList";
import type { ViewedWord } from "@/hooks/useViewedWords";

interface HistoryBottomSheetProps {
  open: boolean;
  onClose: () => void;
  viewedWords: ViewedWord[];
  onSelect: (simp: string) => void;
  onRemove: (simp: string) => void;
}

export function HistoryBottomSheet({
  open,
  onClose,
  viewedWords,
  onSelect,
  onRemove,
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

      {/* Sheet — slides from right */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex flex-col w-72 bg-background border-l
                    transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Lịch sử xem"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5 border-b shrink-0">
          <p className="font-semibold text-sm">Đã xem</p>
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

        <ViewedWordList
          viewedWords={viewedWords}
          onSelect={(simp) => {
            onClose();
            onSelect(simp);
          }}
          onRemove={onRemove}
        />
      </div>
    </>
  );
}

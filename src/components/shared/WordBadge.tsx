"use client";

/**
 * WordBadge — Reusable word badge
 * Displays a Chinese word (simp) with optional pinyin subtitle.
 * Renders as a <button> if onClick is provided, otherwise a <div>.
 */

import type {WordEntry} from "@/core/types";

interface WordBadgeProps {
    entry: WordEntry;
  onClick?: () => void;
  className?: string;
}

export function WordBadge({entry, onClick, className}: WordBadgeProps) {
    const {simp, pinyin, sinoVietnamese} = entry;
  const base =
      "inline-flex flex-col items-center rounded-lg border px-3 py-1.5 text-center min-w-[3rem] bg-card";
    const interactive = "cursor-pointer hover:bg-accent transition-colors";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} ${interactive} ${className ?? ""}`}
      >
        <span className="font-chinese font-medium text-lg leading-tight">
          {simp}
        </span>
          <span className="flex gap-1">
            {pinyin && (
                <span className="text-sm text-muted-foreground leading-tight">
            {pinyin}
          </span>
            )}
              {sinoVietnamese && (
                  <span className="text-sm leading-tight text-sinoviet">
            {sinoVietnamese}
          </span>
              )}
        </span>
      </button>
    );
  }

  return (
    <div className={`${base} ${className ?? ""}`}>
      <span className="font-chinese font-medium text-base leading-tight">
        {simp}
      </span>
      {pinyin && (
        <span className="text-xs text-muted-foreground leading-tight">
          {pinyin}
        </span>
      )}
    </div>
  );
}

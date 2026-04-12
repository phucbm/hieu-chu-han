"use client";

/**
 * WordRow — Generic word list row.
 * Used in SuggestionBox (search results), AppSidebar inline list,
 * and RecentViewedPanel (history with view count).
 *
 * Layout:
 *   Left:   large Chinese character for quick visual ID
 *   Middle: row 1 = simp + trad (if diff)
 *           row 2 = pinyin · vi/en  [👁 N  if viewCount provided]
 *   Right:  optional X remove button, visible on hover
 */

import { X, Eye } from "lucide-react";

interface WordRowProps {
  simp: string;
  trad?: string;
  pinyin?: string;
  vi?: string;
  en?: string;
  onSelect: () => void;
  /** When provided, shows 👁 N in row 2 */
  viewCount?: number;
  /** When provided, shows an X button on row hover */
  onRemove?: () => void;
}

export function WordRow({
  simp,
  trad,
  pinyin,
  vi,
  en,
  onSelect,
  viewCount,
  onRemove,
}: WordRowProps) {
  const showTrad = trad && trad !== simp;
  const definition = vi || en;

  return (
    <div className="group flex items-stretch">
      {/* Select area */}
      <button
        type="button"
        // Prevent input blur before click fires (search dropdown use)
        onMouseDown={(e) => e.preventDefault()}
        onClick={onSelect}
        className="flex-1 flex items-center gap-3 px-3 py-2.5 text-left hover:bg-muted transition-colors min-w-0"
      >
        {/* Large character anchor */}
        <span className="hidden font-chinese text-2xl font-medium w-9 shrink-0 text-center leading-none">
          {simp}
        </span>

        {/* Text info */}
        <span className="flex flex-col min-w-0 flex-1">
          {/* Row 1: simp + optional trad */}
          <span className="flex items-baseline gap-1.5 leading-tight">
            <span className="font-chinese font-medium text-sm">{simp}</span>
            {showTrad && (
              <span className="font-chinese text-xs text-muted-foreground">
                ({trad})
              </span>
            )}
          </span>
          {/* Row 2: pinyin · definition · view count */}
          <span className="flex items-center gap-1.5 min-w-0 leading-tight">
            {pinyin && (
              <span className="text-xs text-muted-foreground shrink-0">
                {pinyin}
              </span>
            )}
            {definition && (
              <span className="text-xs truncate flex-1">{definition}</span>
            )}
            {viewCount !== undefined && (
              <span className="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0 ml-auto">
                <Eye className="h-3 w-3" />
                {viewCount}
              </span>
            )}
          </span>
        </span>
      </button>

      {/* Remove button — visible on group hover */}
      {onRemove && (
        <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onRemove}
          tabIndex={-1}
          aria-label="Xóa khỏi lịch sử"
          className="flex items-center px-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive shrink-0"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

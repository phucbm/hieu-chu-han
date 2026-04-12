"use client";

/**
 * WordBadge — Reusable word badge
 * Displays a Chinese word (simp) with optional pinyin subtitle.
 * Renders as a <button> if onClick is provided, otherwise a <div>.
 */

interface WordBadgeProps {
  simp: string;
  pinyin?: string;
  onClick?: () => void;
  className?: string;
}

export function WordBadge({ simp, pinyin, onClick, className }: WordBadgeProps) {
  const base =
    "inline-flex flex-col items-center rounded-lg border px-3 py-1.5 text-center min-w-[3rem]";
  const interactive = "cursor-pointer hover:bg-muted transition-colors";

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} ${interactive} ${className ?? ""}`}
      >
        <span className="font-chinese font-medium text-base leading-tight">
          {simp}
        </span>
        {pinyin && (
          <span className="text-xs text-muted-foreground leading-tight">
            {pinyin}
          </span>
        )}
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

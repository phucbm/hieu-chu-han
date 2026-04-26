"use client";

interface AiCreditBadgeProps {
  remaining: number | null;
  limit: number;
  className?: string;
}

export function AiCreditBadge({ remaining, limit, className }: AiCreditBadgeProps) {
  if (remaining === null) return null;
  const isLow = remaining <= 0;
  return (
    <span
      className={`text-xs tabular-nums ${isLow ? "text-destructive" : "text-muted-foreground"} ${className ?? ""}`}
    >
      {remaining}/{limit} lượt
    </span>
  );
}

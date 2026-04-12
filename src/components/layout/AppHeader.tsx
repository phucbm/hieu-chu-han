"use client";

/**
 * AppHeader — Mobile sticky header (row 1, < 1024px only).
 * Left: app logo. Right: history button + more button (reserved).
 */

import { AppLogo } from "@/components/layout/AppLogo";
import { Button } from "@/components/ui/button";
import { History, MoreHorizontal } from "lucide-react";

interface AppHeaderProps {
  onOpenHistory: () => void;
}

export function AppHeader({ onOpenHistory }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-14 px-4 bg-background border-b">
      <AppLogo compact />
      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onOpenHistory}
          aria-label="Lịch sử xem"
        >
          <History className="h-5 w-5" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled
          aria-label="Thêm tùy chọn"
        >
          <MoreHorizontal className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

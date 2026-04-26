"use client"

import { useState } from "react"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { ViewedWordList } from "@/components/layout/ViewedWordList"
import type { ViewedWord } from "@/hooks/useViewedWords"

const TABS = [
  { id: "history", label: "Đã xem" },
  { id: "notes",   label: "Ghi chú" },
]

interface RightSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  viewedWords: ViewedWord[]
  onSelect: (simp: string) => void
  onRemove: (simp: string) => void
}

export function RightSheet({
  open,
  onOpenChange,
  viewedWords,
  onSelect,
  onRemove,
}: RightSheetProps) {
  const [activeTab, setActiveTab] = useState("history")

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 p-0 flex flex-col gap-0 overflow-hidden">

        <SheetHeader className="px-4 py-3! border-b shrink-0">
          <SheetTitle className="text-sm font-semibold">Sổ tay</SheetTitle>
        </SheetHeader>

        <div className="flex border-b shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex-1 text-xs py-2.5 transition-colors",
                activeTab === tab.id
                  ? "border-b-2 border-primary font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "history" && (
          <ScrollArea className="flex-1 min-h-0">
            <div className="p-3">
              <ViewedWordList
                viewedWords={viewedWords}
                onSelect={onSelect}
                onRemove={onRemove}
              />
            </div>
          </ScrollArea>
        )}

        {activeTab === "notes" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 px-4 text-center">
            <p className="text-sm text-muted-foreground">Ghi chú cá nhân</p>
            <p className="text-xs text-muted-foreground/60">Tính năng đang phát triển</p>
          </div>
        )}

      </SheetContent>
    </Sheet>
  )
}

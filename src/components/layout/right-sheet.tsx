"use client"

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ViewedWordList } from "@/components/layout/ViewedWordList"
import type { ViewedWord } from "@/hooks/useViewedWords"

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
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-80 p-0 flex flex-col gap-0 overflow-hidden">

        <SheetHeader className="px-4 py-3! border-b shrink-0">
          <SheetTitle className="text-sm font-semibold">Đã xem</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 min-h-0">
          <div className="p-3">
            <ViewedWordList
              viewedWords={viewedWords}
              onSelect={onSelect}
              onRemove={onRemove}
            />
          </div>
        </ScrollArea>

      </SheetContent>
    </Sheet>
  )
}

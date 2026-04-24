"use client"

/**
 * V2SearchDialog — Full search experience behind Ctrl+K / Cmd+K.
 *
 * Desktop: 60% text search left | 40% handwriting right, both always visible.
 * Mobile: mode toggle at top, one panel at a time.
 */

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import { PenLineIcon, SearchIcon } from "lucide-react"
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { searchWords } from "@/app/actions"
import { HandwritingPad } from "@/components/HandwritingPad"
import { HandwritingRecognizer, type Candidate } from "@/core/handwriting"
import type { WordEntry } from "@/core/types"

type SearchMode = "text" | "draw"

interface V2SearchDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (simp: string) => void
}

export function V2SearchDialog({ open, onOpenChange, onSelect }: V2SearchDialogProps) {
  const [mode, setMode]               = useState<SearchMode>("text")
  const [query, setQuery]             = useState("")
  const [results, setResults]         = useState<WordEntry[]>([])
  const [candidates, setCandidates]   = useState<Candidate[]>([])
  const [strokeCount, setStrokeCount] = useState(0)
  const strokesRef = useRef<number[][][]>([])
  const recognizer = useRef<HandwritingRecognizer | null>(null)
  const [, startSearch] = useTransition()

  // Real search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    startSearch(async () => {
      setResults(await searchWords(query))
    })
  }, [query])

  // Handwriting recognizer lifecycle — init on open, destroy on close
  useEffect(() => {
    if (!open) return
    const r = new HandwritingRecognizer()
    r.init((c) => setCandidates(c.slice(0, 8)))
    recognizer.current = r
    return () => { r.destroy(); recognizer.current = null }
  }, [open])

  // Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        onOpenChange(true)
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onOpenChange])

  const handleSelect = useCallback((simp: string) => {
    onSelect(simp)
    onOpenChange(false)
    setQuery("")
    setCandidates([])
    setStrokeCount(0)
    strokesRef.current = []
  }, [onSelect, onOpenChange])

  const handleStrokeEnd = useCallback((strokes: number[][][]) => {
    strokesRef.current = strokes
    setStrokeCount(strokes.length)
    recognizer.current?.lookup(strokes)
  }, [])

  const handleUndo = useCallback(() => {
    const next = strokesRef.current.slice(0, -1)
    strokesRef.current = next
    setStrokeCount(next.length)
    if (next.length > 0) recognizer.current?.lookup(next)
    else setCandidates([])
  }, [])

  const handleClear = useCallback(() => {
    strokesRef.current = []
    setStrokeCount(0)
    setCandidates([])
  }, [])

  return (
    <CommandDialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v)
        if (!v) { setQuery(""); setCandidates([]); setStrokeCount(0); strokesRef.current = [] }
      }}
      title="Tìm kiếm"
      description="Tìm chữ Hán theo ký tự, pinyin hoặc Hán Việt"
      // Override both max-w-[calc(100%-2rem)] (base) and sm:max-w-sm to force wide dialog
      className="max-w-[95vw]! sm:max-w-[900px]! max-h-[85vh]! flex flex-col overflow-hidden"
    >
      <Command className="flex flex-col flex-1 min-h-0 overflow-hidden rounded-none!">

        {/* Mobile mode toggle */}
        <div className="flex lg:hidden border-b px-3 py-2 gap-1 shrink-0">
          {(["text", "draw"] as SearchMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                mode === m ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {m === "text" ? <SearchIcon className="size-3" /> : <PenLineIcon className="size-3" />}
              {m === "text" ? "Gõ tìm kiếm" : "Viết tay"}
            </button>
          ))}
        </div>

        {/* Two-column body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Left 60%: text search */}
          <div className={cn(
            "flex flex-col min-w-0 min-h-0 border-r",
            "flex-[3]",
            mode === "draw" && "hidden lg:flex"
          )}>
            <div className="shrink-0">
              <CommandInput
                placeholder="Nhập chữ Hán, pinyin, Hán Việt..."
                value={query}
                onValueChange={setQuery}
              />
            </div>
            <CommandList className="flex-1 overflow-y-auto max-h-none">
              <CommandEmpty>Không tìm thấy kết quả.</CommandEmpty>
              <CommandGroup heading="Kết quả">
                {results.map((r, i) => (
                  <CommandItem
                    key={`${r.simp}-${i}`}
                    value={`${r.simp}-${i}`}
                    onSelect={() => handleSelect(r.simp)}
                  >
                    <span className="font-chinese text-2xl w-10 text-center leading-none shrink-0">
                      {r.simp}
                    </span>
                    <span className="flex flex-col min-w-0">
                      <span className="text-sm font-medium">
                        {r.sinoVietnamese || r.simp}
                        {r.trad && r.trad !== r.simp && (
                          <span className="ml-2 text-xs text-muted-foreground font-chinese">({r.trad})</span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground truncate">
                        {r.pinyin}{r.definitionVi && ` · ${r.definitionVi}`}
                      </span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </div>

          {/* Right 40%: handwriting */}
          <div className={cn(
            "flex flex-col gap-3 p-4 overflow-y-auto",
            "flex-[2]",
            mode === "text" ? "hidden lg:flex" : "flex flex-1"
          )}>
            <p className="text-xs text-muted-foreground uppercase tracking-widest shrink-0">Viết tay</p>

            {/* Full-width canvas */}
            <div className="w-full">
              <HandwritingPad
                onStrokeEnd={handleStrokeEnd}
                onClear={handleClear}
                strokeCount={strokeCount}
                onUndo={handleUndo}
              />
            </div>

            {/* Candidates */}
            {candidates.length > 0 && (
              <div className="flex flex-col gap-1.5 shrink-0">
                <p className="text-xs text-muted-foreground">Gợi ý</p>
                <div className="flex gap-1.5 flex-wrap">
                  {candidates.map((c) => (
                    <button
                      key={c.hanzi}
                      onClick={() => handleSelect(c.hanzi)}
                      className="font-chinese text-xl px-2.5 py-1 rounded-lg border bg-muted/50 hover:bg-muted transition-colors"
                    >
                      {c.hanzi}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>
      </Command>
    </CommandDialog>
  )
}

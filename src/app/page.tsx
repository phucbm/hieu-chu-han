"use client"

import { useCallback, useEffect, useRef, useState, useTransition } from "react"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { SearchIcon, BookOpenIcon } from "lucide-react"
import { HchSidebar } from "@/components/layout/hch-sidebar"
import { SearchDialog } from "@/components/search/search-dialog"
import { RightSheet } from "@/components/layout/right-sheet"
import { ContentArea } from "@/components/layout/content-area"
import { getWordEntries } from "@/app/actions"
import { useViewedWords } from "@/hooks/useViewedWords"
import { wordKey, type WordEntry } from "@/core/types"

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function HomePage() {
  const [searchOpen, setSearchOpen]       = useState(false)
  const [notebookOpen, setNotebookOpen]   = useState(false)
  const [entries, setEntries]             = useState<WordEntry[]>([])
  const [activeTab, setActiveTab]         = useState<string | undefined>()
  const [, startDetailTransition]         = useTransition()

  const { viewedWords, addViewedWord, removeViewedWord } = useViewedWords()

  const openWord = useCallback(
    (simp: string, preferredTab?: string) => {
      if (!simp.trim()) return
      startDetailTransition(async () => {
        const result = await getWordEntries(simp)
        setEntries(result)
        if (result[0]) {
          const key = preferredTab ?? wordKey(result[0])
          setActiveTab(key)
          addViewedWord(wordKey(result[0]))
          const url = key === wordKey(result[0])
            ? `?word=${encodeURIComponent(simp)}`
            : `?word=${encodeURIComponent(simp)}&active=${encodeURIComponent(key)}`
          window.history.replaceState(null, "", url)
        }
      })
    },
    [addViewedWord]
  )

  const openWordRef = useRef(openWord)
  openWordRef.current = openWord

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const word   = params.get("word")
    const active = params.get("active") ?? undefined
    if (word) openWordRef.current(word, active)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab)
    const params = new URLSearchParams(window.location.search)
    const defaultKey = entries[0] ? wordKey(entries[0]) : null
    if (tab === defaultKey) params.delete("active")
    else params.set("active", tab)
    window.history.replaceState(null, "", `?${params.toString()}`)
  }, [entries])

  const currentWord = entries[0] ? wordKey(entries[0]) : undefined

  return (
    <SidebarProvider>
      <HchSidebar />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb className="flex-1 min-w-0">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage className="truncate">
                  {currentWord
                    ? <span className="font-chinese font-medium">{currentWord}</span>
                    : "Hiểu Chữ Hán"}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-muted-foreground font-normal hidden sm:flex"
            onClick={() => setSearchOpen(true)}
          >
            <SearchIcon data-icon="inline-start" />
            <span>Tìm kiếm</span>
            <kbd className="ml-1 text-xs border rounded px-1 py-0.5 bg-muted leading-none">⌘K</kbd>
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8 sm:hidden"
            onClick={() => setSearchOpen(true)}>
            <SearchIcon />
          </Button>

          <Button variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => setNotebookOpen(true)} aria-label="Mở sổ tay">
            <BookOpenIcon />
          </Button>
        </header>

        <div className="flex flex-1 flex-col p-4 pt-0 overflow-y-auto">
          <ContentArea
            entries={entries}
            activeTab={activeTab}
            onTabChange={handleTabChange}
            onWordClick={openWord}
          />
        </div>
      </SidebarInset>

      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelect={openWord}
      />

      <RightSheet
        open={notebookOpen}
        onOpenChange={setNotebookOpen}
        viewedWords={viewedWords}
        onSelect={(simp) => { openWord(simp); setNotebookOpen(false) }}
        onRemove={removeViewedWord}
      />
    </SidebarProvider>
  )
}

"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SearchIcon, BookOpenIcon } from "lucide-react";
import { HchSidebar } from "@/components/layout/hch-sidebar";
import { SearchDialog } from "@/components/search/search-dialog";
import { RightSheet } from "@/components/layout/right-sheet";
import { ContentArea } from "@/components/layout/content-area";
import { getWordEntries } from "@/app/actions";
import { useViewedWords } from "@/hooks/useViewedWords";
import { upsertViewedWord } from "@/app/actions/history";
import { wordKey, type WordEntry } from "@/core/types";

interface WordDetailPageProps {
  simp: string;
}

export function WordDetailPage({ simp }: WordDetailPageProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notebookOpen, setNotebookOpen] = useState(false);
  const [entries, setEntries] = useState<WordEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string | undefined>();
  const [, startTransition] = useTransition();

  // TODO: remove addViewedWord call here once homepage panel no longer increments view count
  const { viewedWords, addViewedWord, removeViewedWord } = useViewedWords();

  // Load word on mount and increment view count (canonical view tracking for shareable URLs)
  useEffect(() => {
    startTransition(async () => {
      const result = await getWordEntries(simp);
      setEntries(result);
      if (result[0]) {
        setActiveTab(wordKey(result[0]));
      }
    });
    // Canonical view count increment for /word/[simp] page
    upsertViewedWord(simp);
  }, [simp]); // eslint-disable-line react-hooks/exhaustive-deps

  const openWord = useCallback(
    (newSimp: string, preferredTab?: string) => {
      if (!newSimp.trim()) return;
      window.location.href = `/word/${encodeURIComponent(newSimp)}${preferredTab ? `?active=${encodeURIComponent(preferredTab)}` : ""}`;
    },
    []
  );

  // Also keep local history in sync when this page is viewed
  const hasTrackedRef = useRef(false);
  useEffect(() => {
    if (hasTrackedRef.current || entries.length === 0) return;
    hasTrackedRef.current = true;
    addViewedWord(wordKey(entries[0]));
  }, [entries, addViewedWord]);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const currentWord = entries[0] ? wordKey(entries[0]) : simp;

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
                  <span className="font-chinese font-medium">{currentWord}</span>
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
        onSelect={(newSimp) => {
          window.location.href = `/word/${encodeURIComponent(newSimp)}`;
        }}
        viewedWords={viewedWords}
      />

      <RightSheet
        open={notebookOpen}
        onOpenChange={setNotebookOpen}
        viewedWords={viewedWords}
        onSelect={(newSimp) => {
          window.location.href = `/word/${encodeURIComponent(newSimp)}`;
          setNotebookOpen(false);
        }}
        onRemove={removeViewedWord}
      />
    </SidebarProvider>
  );
}

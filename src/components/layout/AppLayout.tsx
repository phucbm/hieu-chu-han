"use client";

import { useState } from "react";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { SearchIcon, BookOpenIcon } from "lucide-react";
import { HchSidebar } from "@/components/layout/hch-sidebar"
import type { NotebookGroup } from "@/core/notebook-types";
import { SearchDialog } from "@/components/search/search-dialog";
import { RightSheet } from "@/components/layout/right-sheet";
import { useViewedWords } from "@/hooks/useViewedWords";

interface AppLayoutProps {
  breadcrumb: React.ReactNode;
  headerActions?: React.ReactNode;
  /** Pre-fetched groups to seed the sidebar (avoids CLS on initial render). */
  initialGroups?: NotebookGroup[];
  /** Override search-dialog select behavior. Defaults to navigating to /word/[simp]. */
  onSearchSelect?: (simp: string) => void;
  children: React.ReactNode;
}

export function AppLayout({
  breadcrumb,
  headerActions,
  initialGroups,
  onSearchSelect,
  children,
}: AppLayoutProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notebookOpen, setNotebookOpen] = useState(false);

  const { viewedWords, removeViewedWord } = useViewedWords();

  function handleSearchSelect(simp: string) {
    setSearchOpen(false);
    if (onSearchSelect) {
      onSearchSelect(simp);
    } else {
      window.location.href = `/word/${encodeURIComponent(simp)}`;
    }
  }

  return (
    <SidebarProvider>
      <HchSidebar initialGroups={initialGroups} />

      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 px-4">
          {/* ── Left ── */}
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-vertical:h-4 data-vertical:self-auto"
          />
          <Breadcrumb className="flex-1 min-w-0">
            <BreadcrumbList>{breadcrumb}</BreadcrumbList>
          </Breadcrumb>

          {/* ── Right: page actions + Search + Notebook ── */}
          {headerActions}

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

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 sm:hidden"
            onClick={() => setSearchOpen(true)}
          >
            <SearchIcon />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setNotebookOpen(true)}
            aria-label="Mở sổ tay"
          >
            <BookOpenIcon />
          </Button>
        </header>

        <div className="flex flex-1 flex-col p-4 pt-0 overflow-y-auto">
          {children}
        </div>
      </SidebarInset>

      <SearchDialog
        open={searchOpen}
        onOpenChange={setSearchOpen}
        onSelect={handleSearchSelect}
        viewedWords={viewedWords}
      />

      <RightSheet
        open={notebookOpen}
        onOpenChange={setNotebookOpen}
        viewedWords={viewedWords}
        onSelect={(simp) => {
          handleSearchSelect(simp);
          setNotebookOpen(false);
        }}
        onRemove={removeViewedWord}
      />
    </SidebarProvider>
  );
}

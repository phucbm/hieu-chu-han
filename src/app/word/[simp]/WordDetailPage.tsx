"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import {
  BreadcrumbItem,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { AppLayout } from "@/components/layout/AppLayout";
import { ContentArea } from "@/components/layout/content-area";
import { getWordEntries } from "@/app/actions";
import { useViewedWords } from "@/hooks/useViewedWords";
import { upsertViewedWord } from "@/app/actions/history";
import { wordKey, type WordEntry } from "@/core/types";

interface WordDetailPageProps {
  simp: string;
}

export function WordDetailPage({ simp }: WordDetailPageProps) {
  const [entries, setEntries] = useState<WordEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string | undefined>();
  const [, startTransition] = useTransition();

  // TODO: remove addViewedWord here once homepage panel no longer increments view count
  const { addViewedWord } = useViewedWords();

  useEffect(() => {
    startTransition(async () => {
      const result = await getWordEntries(simp);
      setEntries(result);
      if (result[0]) setActiveTab(wordKey(result[0]));
    });
    // Canonical view count increment for /word/[simp] page
    upsertViewedWord(simp);
  }, [simp]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep local history in sync
  const hasTrackedRef = useRef(false);
  useEffect(() => {
    if (hasTrackedRef.current || entries.length === 0) return;
    hasTrackedRef.current = true;
    addViewedWord(wordKey(entries[0]));
  }, [entries, addViewedWord]);

  const openWord = useCallback((newSimp: string) => {
    window.location.href = `/word/${encodeURIComponent(newSimp)}`;
  }, []);

  const handleTabChange = useCallback((tab: string) => {
    setActiveTab(tab);
  }, []);

  const currentWord = entries[0] ? wordKey(entries[0]) : simp;

  const breadcrumb = (
    <BreadcrumbItem>
      <BreadcrumbPage className="truncate">
        <span className="font-chinese font-medium">{currentWord}</span>
      </BreadcrumbPage>
    </BreadcrumbItem>
  );

  return (
    <AppLayout breadcrumb={breadcrumb}>
      <ContentArea
        entries={entries}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onWordClick={openWord}
      />
    </AppLayout>
  );
}

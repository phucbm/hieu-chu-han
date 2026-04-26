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
import { wordKey, type WordEntry } from "@/core/types";

export default function HomePage() {
  const [entries, setEntries]   = useState<WordEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string | undefined>();
  const [, startDetailTransition] = useTransition();

  // TODO: remove addViewedWord here once homepage panel no longer increments view count
  const { addViewedWord } = useViewedWords();

  const openWord = useCallback(
    (simp: string, preferredTab?: string) => {
      if (!simp.trim()) return;
      startDetailTransition(async () => {
        const result = await getWordEntries(simp);
        setEntries(result);
        if (result[0]) {
          const key = preferredTab ?? wordKey(result[0]);
          setActiveTab(key);
          addViewedWord(wordKey(result[0]));
          const url =
            key === wordKey(result[0])
              ? `?word=${encodeURIComponent(simp)}`
              : `?word=${encodeURIComponent(simp)}&active=${encodeURIComponent(key)}`;
          window.history.replaceState(null, "", url);
        }
      });
    },
    [addViewedWord],
  );

  const openWordRef = useRef(openWord);
  openWordRef.current = openWord;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const word   = params.get("word");
    const active = params.get("active") ?? undefined;
    if (word) openWordRef.current(word, active);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleTabChange = useCallback(
    (tab: string) => {
      setActiveTab(tab);
      const params = new URLSearchParams(window.location.search);
      const defaultKey = entries[0] ? wordKey(entries[0]) : null;
      if (tab === defaultKey) params.delete("active");
      else params.set("active", tab);
      window.history.replaceState(null, "", `?${params.toString()}`);
    },
    [entries],
  );

  const currentWord = entries[0] ? wordKey(entries[0]) : undefined;

  const breadcrumb = (
    <BreadcrumbItem>
      <BreadcrumbPage className="truncate">
        {currentWord ? (
          <span className="font-chinese font-medium">{currentWord}</span>
        ) : (
          "Hiểu Chữ Hán"
        )}
      </BreadcrumbPage>
    </BreadcrumbItem>
  );

  return (
    <AppLayout breadcrumb={breadcrumb} onSearchSelect={openWord}>
      <ContentArea
        entries={entries}
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onWordClick={openWord}
      />
    </AppLayout>
  );
}

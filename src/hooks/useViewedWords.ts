"use client";

/**
 * useViewedWords — Lịch sử từ đã xem
 * Persists every word the user opens in localStorage.
 * Key: 'hch_viewed_words'. Unlimited entries, newest first.
 */

import { useState, useEffect, useCallback } from "react";

export interface ViewedWord {
  simp: string;
  trad?: string;
  pinyin?: string;
  sinoViet?: string;
  /** ISO datetime of first view */
  firstViewedAt: string;
  /** ISO datetime of most recent view */
  lastViewedAt: string;
  /** Every view datetime (for future stats) */
  viewedAt: string[];
}

const STORAGE_KEY = "hch_viewed_words";

export function useViewedWords() {
  const [viewedWords, setViewedWords] = useState<ViewedWord[]>([]);

  // Hydrate from localStorage on mount (client only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setViewedWords(JSON.parse(raw) as ViewedWord[]);
    } catch {
      // Ignore corrupted storage
    }
  }, []);

  /**
   * Record a word view. Deduplicates by simp; updates timestamps.
   * Moves the entry to the front of the list on re-view.
   */
  const addViewedWord = useCallback(
    (item: Omit<ViewedWord, "firstViewedAt" | "lastViewedAt" | "viewedAt">) => {
      setViewedWords((prev) => {
        const now = new Date().toISOString();
        const existing = prev.find((w) => w.simp === item.simp);
        let next: ViewedWord[];

        if (existing) {
          // Update existing entry and move to front
          const updated: ViewedWord = {
            ...existing,
            ...item,
            lastViewedAt: now,
            viewedAt: [...existing.viewedAt, now],
          };
          next = [updated, ...prev.filter((w) => w.simp !== item.simp)];
        } else {
          next = [
            { ...item, firstViewedAt: now, lastViewedAt: now, viewedAt: [now] },
            ...prev,
          ];
        }

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore quota errors
        }
        return next;
      });
    },
    []
  );

  const clearViewedWords = useCallback(() => {
    setViewedWords([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return { viewedWords, addViewedWord, clearViewedWords };
}

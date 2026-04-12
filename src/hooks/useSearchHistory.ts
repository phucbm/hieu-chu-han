"use client";

/**
 * useSearchHistory — Lịch sử tìm kiếm
 * Manages search history persisted in localStorage.
 * Key: 'hieu-chu-han:history', max 20 items, newest first.
 */

import { useState, useEffect, useCallback } from "react";
import type { HistoryItem } from "@/core/types";

const STORAGE_KEY = "hieu-chu-han:history";
const MAX_ITEMS = 20;

export function useSearchHistory() {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  // Load from localStorage on mount (client only)
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw) as HistoryItem[]);
    } catch {
      // Ignore parse errors (corrupted storage)
    }
  }, []);

  /**
   * Add a word to history. Deduplicates by simp; newest entry wins.
   */
  const addToHistory = useCallback(
    (item: Omit<HistoryItem, "timestamp">) => {
      setHistory((prev) => {
        // Remove existing entry for the same word
        const filtered = prev.filter((h) => h.simp !== item.simp);
        const next = [
          { ...item, timestamp: Date.now() },
          ...filtered,
        ].slice(0, MAX_ITEMS);
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // Ignore storage errors (e.g. private browsing quota)
        }
        return next;
      });
    },
    []
  );

  /**
   * Clear all history from state and localStorage.
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
  }, []);

  return { history, addToHistory, clearHistory };
}

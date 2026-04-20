"use client";

/**
 * useViewedWords — Lịch sử từ đã xem
 *
 * - Guest (not signed in): persists in localStorage under 'hch_viewed_words'
 * - Signed in: reads/writes Turso via server actions; on first sign-in merges
 *   local history into the cloud then switches to cloud-only reads.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import type { WordEntry } from "@/core/types";
import {
  getViewedWords,
  upsertViewedWord,
  removeViewedWord as removeViewedWordAction,
  clearViewedWords as clearViewedWordsAction,
  mergeViewedWords,
} from "@/app/actions/history";

export interface ViewedWord {
  simp: string;
  trad?: string;
  pinyin?: string;
  sinoViet?: string;
  entry?: WordEntry;
  /** ISO datetime of first view */
  firstViewedAt: string;
  /** ISO datetime of most recent view */
  lastViewedAt: string;
  /** Every view datetime (for future stats) */
  viewedAt: string[];
}

const STORAGE_KEY = "hch_viewed_words";

function readLocalStorage(): ViewedWord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ViewedWord[]) : [];
  } catch {
    return [];
  }
}

function writeLocalStorage(words: ViewedWord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
  } catch {
    // Ignore quota errors
  }
}

export function useViewedWords() {
  const { userId, isLoaded } = useAuth();
  const [viewedWords, setViewedWords] = useState<ViewedWord[]>([]);

  // Track previous userId to detect sign-in transition
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  // ── Hydrate on mount / userId change ──────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;

    if (userId) {
      // Signed in: fetch from Turso
      getViewedWords().then(setViewedWords);
    } else {
      // Guest: hydrate from localStorage
      setViewedWords(readLocalStorage());
    }
  }, [userId, isLoaded]);

  // ── Merge localStorage → Turso on sign-in ─────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    const wasGuest = prevUserIdRef.current === null;
    const isNowSignedIn = !!userId;

    if (wasGuest && isNowSignedIn) {
      const local = readLocalStorage();
      if (local.length > 0) {
        mergeViewedWords(local).then(setViewedWords);
      }
    }

    prevUserIdRef.current = userId ?? null;
  }, [userId, isLoaded]);

  // ── Add / update ───────────────────────────────────────────────────────────
  const addViewedWord = useCallback(
    (item: Omit<ViewedWord, "firstViewedAt" | "lastViewedAt" | "viewedAt">) => {
      if (userId) {
        upsertViewedWord(item).then((updated) => {
          if (!updated) return;
          setViewedWords((prev) => [
            updated,
            ...prev.filter((w) => w.simp !== item.simp),
          ]);
        });
      } else {
        setViewedWords((prev) => {
          const now = new Date().toISOString();
          const existing = prev.find((w) => w.simp === item.simp);
          let next: ViewedWord[];

          if (existing) {
            const updated: ViewedWord = {
              ...existing,
              ...item,
              lastViewedAt: now,
              viewedAt: [...existing.viewedAt, now],
            };
            next = [updated, ...prev.filter((w) => w.simp !== item.simp)];
          } else {
            next = [
              {
                ...item,
                firstViewedAt: now,
                lastViewedAt: now,
                viewedAt: [now],
              },
              ...prev,
            ];
          }

          writeLocalStorage(next);
          return next;
        });
      }
    },
    [userId]
  );

  // ── Remove ─────────────────────────────────────────────────────────────────
  const removeViewedWord = useCallback(
    (simp: string) => {
      if (userId) {
        removeViewedWordAction(simp);
      } else {
        setViewedWords((prev) => {
          const next = prev.filter((w) => w.simp !== simp);
          writeLocalStorage(next);
          return next;
        });
      }
      setViewedWords((prev) => prev.filter((w) => w.simp !== simp));
    },
    [userId]
  );

  // ── Clear all ──────────────────────────────────────────────────────────────
  const clearViewedWords = useCallback(() => {
    if (userId) {
      clearViewedWordsAction();
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // Ignore
      }
    }
    setViewedWords([]);
  }, [userId]);

  return { viewedWords, addViewedWord, removeViewedWord, clearViewedWords };
}

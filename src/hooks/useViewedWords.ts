"use client";

/**
 * useViewedWords — Lịch sử từ đã xem
 *
 * - Guest: persists in localStorage ('hch_viewed_words'), minimal shape
 * - Signed in: reads/writes Turso via server actions
 * - On sign-in: merges local history into Turso then switches to cloud
 *
 * Display data (trad, pinyin, definition) is NOT stored here — it is looked
 * up from the client dictionary in ViewedWordList at render time.
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@clerk/nextjs";
import {
  getViewedWords,
  upsertViewedWord,
  removeViewedWord as removeViewedWordAction,
  clearViewedWords as clearViewedWordsAction,
  mergeViewedWords,
} from "@/app/actions/history";

export interface ViewedWord {
  id?: string;           // UUID from Turso (absent for guests)
  simp: string;
  viewCount: number;
  firstViewedAt: string;
  lastViewedAt: string;
}

const STORAGE_KEY = "hch_viewed_words";

function readLocalStorage(): ViewedWord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (JSON.parse(raw) as any[]).map((w) => ({
      simp: w.simp as string,
      // Migrate from old shape that had viewedAt: string[]
      viewCount: (w.viewCount as number | undefined) ?? (w.viewedAt as string[] | undefined)?.length ?? 1,
      firstViewedAt: w.firstViewedAt as string,
      lastViewedAt: w.lastViewedAt as string,
    }));
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
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  // ── Hydrate on mount / userId change ──────────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    if (userId) {
      getViewedWords().then(setViewedWords);
    } else {
      setViewedWords(readLocalStorage());
    }
  }, [userId, isLoaded]);

  // ── Merge localStorage → Turso on sign-in ─────────────────────────────────
  useEffect(() => {
    if (!isLoaded) return;
    if (prevUserIdRef.current === null && !!userId) {
      const local = readLocalStorage();
      if (local.length > 0) {
        mergeViewedWords(local).then(setViewedWords);
      }
    }
    prevUserIdRef.current = userId ?? null;
  }, [userId, isLoaded]);

  // ── Add / update ───────────────────────────────────────────────────────────
  const addViewedWord = useCallback(
    (simp: string) => {
      if (userId) {
        upsertViewedWord(simp).then((updated) => {
          if (!updated) return;
          setViewedWords((prev) => [
            updated,
            ...prev.filter((w) => w.simp !== simp),
          ]);
        });
      } else {
        setViewedWords((prev) => {
          const now = new Date().toISOString();
          const existing = prev.find((w) => w.simp === simp);
          const next: ViewedWord[] = existing
            ? [
                {
                  ...existing,
                  viewCount: existing.viewCount + 1,
                  lastViewedAt: now,
                },
                ...prev.filter((w) => w.simp !== simp),
              ]
            : [
                { simp, viewCount: 1, firstViewedAt: now, lastViewedAt: now },
                ...prev,
              ];
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
      if (userId) removeViewedWordAction(simp);
      setViewedWords((prev) => {
        const next = prev.filter((w) => w.simp !== simp);
        if (!userId) writeLocalStorage(next);
        return next;
      });
    },
    [userId]
  );

  // ── Clear all ──────────────────────────────────────────────────────────────
  const clearViewedWords = useCallback(() => {
    if (userId) {
      clearViewedWordsAction();
    } else {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    }
    setViewedWords([]);
  }, [userId]);

  return { viewedWords, addViewedWord, removeViewedWord, clearViewedWords };
}

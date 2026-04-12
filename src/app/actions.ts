"use server";

/**
 * actions.ts — Next.js Server Actions for dictionary lookup
 * Runs server-side; chinese-lexicon uses Node.js `fs` and cannot be bundled for the browser.
 */

import { lookupWord, getWordDetail } from "@/core/dictionary";
import { isCompound, segmentWord } from "@/core/segmenter";
import type { WordEntry, WordSummary } from "@/core/types";

/**
 * Convert a full WordEntry to a lightweight WordSummary for dropdowns/lists.
 */
function toWordSummary(entry: WordEntry): WordSummary {
  return {
    simp: entry.simp,
    trad: entry.trad,
    pinyin: entry.pinyin,
    vi: entry.definitionVi,
    en: entry.definitionsEn[0] ?? "",
  };
}

/**
 * Get auto-suggest results while the user is typing (top 8).
 * Source: chinese-lexicon search, enriched with CVDICT + kVietnamese
 */
export async function suggestWords(query: string): Promise<WordSummary[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return lookupWord(trimmed).slice(0, 8).map(toWordSummary);
}

/**
 * Get a results list when the user submits a search (top 20).
 * Source: chinese-lexicon search, enriched with CVDICT + kVietnamese
 */
export async function searchWords(query: string): Promise<WordSummary[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return lookupWord(trimmed).slice(0, 20).map(toWordSummary);
}

/**
 * Get full WordEntry array for a selected word to render CharCard / TabView.
 * For compound words: returns [fullWordEntry, char1Entry, char2Entry, ...].
 * For single chars/pinyin: returns [singleEntry].
 * Source: chinese-lexicon getEntries/search, enriched with CVDICT + kVietnamese
 */
export async function getWordEntries(input: string): Promise<WordEntry[]> {
  const trimmed = input.trim();
  if (!trimmed) return [];

  if (isCompound(trimmed)) {
    // segmentWord returns [fullWord, char1, char2, ...]
    const segments = segmentWord(trimmed);
    return segments
      .map((seg): WordEntry | null => {
        const detail = getWordDetail(seg);
        if (detail) return detail;
        // Fallback: first search result for the segment
        return lookupWord(seg)[0] ?? null;
      })
      .filter((e): e is WordEntry => e !== null);
  }

  // Single character or pinyin: try exact match first, then search
  const detail = getWordDetail(trimmed);
  if (detail) return [detail];
  return lookupWord(trimmed).slice(0, 1);
}

/**
 * @deprecated Use getWordEntries + searchWords instead.
 * Kept for backwards compatibility during the transition.
 */
export async function searchDictionary(input: string): Promise<WordEntry[]> {
  return getWordEntries(input);
}

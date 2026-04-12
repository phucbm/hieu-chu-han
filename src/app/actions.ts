/**
 * actions.ts — Dictionary lookup functions
 *
 * Runs client-side: data is fetched from /data/dictionary.json (generated
 * once by `npx tsx scripts/build-dictionary.ts` and committed to the repo).
 * No server required — compatible with `output: 'export'` (static site).
 */

import { lookupWord, getWordDetail } from "@/core/client-dictionary";
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
 * Get auto-suggest results while the user is typing (top 10).
 */
export async function suggestWords(query: string): Promise<WordSummary[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return (await lookupWord(trimmed)).slice(0, 10).map(toWordSummary);
}

/**
 * Get a results list when the user submits a search (top 20).
 */
export async function searchWords(query: string): Promise<WordSummary[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];
  return (await lookupWord(trimmed)).slice(0, 20).map(toWordSummary);
}

/**
 * Get full WordEntry array for a selected word to render CharCard / TabView.
 * For compound words: returns [fullWordEntry, char1Entry, char2Entry, ...].
 * For single chars/pinyin: returns [singleEntry].
 */
export async function getWordEntries(input: string): Promise<WordEntry[]> {
  const trimmed = input.trim();
  if (!trimmed) return [];

  if (isCompound(trimmed)) {
    const rawSegments = segmentWord(trimmed);
    const seen = new Set<string>();
    const segments = rawSegments.filter((seg) => {
      if (seen.has(seg)) return false;
      seen.add(seg);
      return true;
    });
    const results = await Promise.all(
      segments.map(async (seg): Promise<WordEntry | null> => {
        const detail = await getWordDetail(seg);
        if (detail) return detail;
        const found = await lookupWord(seg);
        return found[0] ?? null;
      })
    );
    return results.filter((e): e is WordEntry => e !== null);
  }

  const detail = await getWordDetail(trimmed);
  if (detail) return [detail];
  const found = await lookupWord(trimmed);
  return found.slice(0, 1);
}

"use server";

/**
 * actions.ts — Next.js Server Actions for dictionary lookup
 * These run on the server, where chinese-lexicon's `fs` usage is valid.
 */

import { lookupWord, getWordDetail } from "@/core/dictionary";
import { isCompound, segmentWord } from "@/core/segmenter";
import type { WordEntry } from "@/core/types";

/**
 * Search the dictionary for a user query.
 * Handles single chars, compound words, and pinyin input.
 */
export async function searchDictionary(input: string): Promise<WordEntry[]> {
  const trimmed = input.trim();
  if (!trimmed) return [];

  if (isCompound(trimmed)) {
    // Compound word: look up each character individually for tabs
    const chars = segmentWord(trimmed);
    const results = chars
      .map((ch) => getWordDetail(ch))
      .filter((e): e is WordEntry => e !== null);

    // Fallback: try the compound as a whole
    if (results.length === 0) {
      return lookupWord(trimmed).slice(0, 1);
    }
    return results;
  }

  // Single character or pinyin: try exact match first, then search
  const detail = getWordDetail(trimmed);
  if (detail) return [detail];

  return lookupWord(trimmed).slice(0, 1);
}

/**
 * segmenter.ts — Word segmentation utilities for Hiểu Chữ Hán
 * Framework-agnostic. No React/Next.js imports.
 *
 * Detects if input is a single character or compound word,
 * and splits compound words into individual characters for tab display.
 */

/** Regex matching a single CJK Unified Ideograph character */
const CJK_CHAR = /[\u4E00-\u9FFF\u3400-\u4DBF\u{20000}-\u{2A6DF}]/u;

/**
 * Count the number of CJK characters in a string.
 */
function countCJKChars(input: string): number {
  return [...input].filter((ch) => CJK_CHAR.test(ch)).length;
}

/**
 * Returns true if the input contains more than one Chinese character.
 * e.g. "疼痛" → true, "疼" → false
 */
export function isCompound(input: string): boolean {
  return countCJKChars(input) > 1;
}

/**
 * Split a compound Chinese word into its individual characters.
 * Non-CJK characters (e.g. punctuation) are ignored.
 * e.g. "疼痛" → ["疼", "痛"]
 */
export function segmentWord(input: string): string[] {
  return [...input].filter((ch) => CJK_CHAR.test(ch));
}

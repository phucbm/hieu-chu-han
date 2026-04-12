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
 * Split a compound Chinese word into [fullWord, ...individualChars].
 * The full word is always first so it renders as the first tab.
 * Non-CJK characters (e.g. punctuation) are ignored from individual chars.
 * e.g. "酸疼" → ["酸疼", "酸", "疼"]
 * e.g. "疼" (single) → ["疼"]  (no duplication for single chars)
 */
export function segmentWord(input: string): string[] {
  const chars = [...input].filter((ch) => CJK_CHAR.test(ch));
  if (chars.length <= 1) return chars;
  return [input, ...chars];
}

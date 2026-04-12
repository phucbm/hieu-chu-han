/**
 * dictionary.ts — Dictionary lookup engine for Hiểu Chữ Hán
 * Framework-agnostic. No React/Next.js imports.
 *
 * Data sources:
 * - chinese-lexicon: search, definitions (EN), etymology, HSK, frequency
 * - cvdict.json: Vietnamese meaning (parsed from CVDICT by ph0ngp)
 * - kVietnamese.json: Sino-Vietnamese reading (from Unicode Unihan database)
 */

import {
  search,
  getEntries,
  type LexiconEntry,
} from "chinese-lexicon";
import cvdictRaw from "../data/cvdict.json";
import kVietnameseRaw from "../data/kVietnamese.json";
import sinoVietOverridesRaw from "../data/sinoViet-overrides.json";
import type { WordEntry, EtymologyComponent, Etymology } from "./types";

// Source: cvdict.json (parsed from CVDICT.u8 by ph0ngp)
type CVDictMap = Record<string, { trad: string; pinyin: string; vi: string }>;
const cvdict = cvdictRaw as CVDictMap;

// Source: kVietnamese.json (Unicode Unihan database 12.1.0)
// Format: { "漢": ["hán"], "字": ["tự", "chữ"], ... }
// Keys are actual Chinese characters; values are arrays of Sino-Vietnamese readings.
type KVietnameseMap = Record<string, string[]>;
const kVietnamese = kVietnameseRaw as unknown as KVietnameseMap;
const sinoVietOverrides = sinoVietOverridesRaw as unknown as KVietnameseMap;

/**
 * Look up Sino-Vietnamese reading from kVietnamese (Unihan database).
 * For compound words, looks up the first character only.
 * Returns space-separated readings joined by " / " if multiple, or empty string.
 * Source: kVietnamese.json
 */
function getSinoVietnamese(simp: string, trad?: string): string {
  const simpChar = [...simp][0] ?? "";
  const tradChar = trad ? ([...trad][0] ?? "") : "";
  const readings =
    (kVietnamese[simpChar]?.length ? kVietnamese[simpChar] : undefined) ??
    (tradChar && tradChar !== simpChar ? kVietnamese[tradChar] : undefined) ??
    sinoVietOverrides[simpChar] ??
    (tradChar && tradChar !== simpChar ? sinoVietOverrides[tradChar] : undefined);
  if (!readings || readings.length === 0) return "";
  return readings.join(" / ");
}

/**
 * Look up Vietnamese meaning from CVDICT.
 * Returns the meaning string or empty string if not found.
 * Source: cvdict.json (CVDICT by ph0ngp)
 */
function getVietnameseMeaning(simp: string): string {
  return cvdict[simp]?.vi ?? "";
}

/**
 * Map etymology components and enrich with Sino-Vietnamese readings.
 * depth guards against infinite recursion when entries reference each other.
 */
function buildEtymology(
  raw: NonNullable<LexiconEntry["simpEtymology"]>,
  depth: number
): Etymology {
  const components: EtymologyComponent[] = raw.components.map((c) => {
    const compEntries = depth < 1 ? getEntries(c.char) : [];
    return {
      char: c.char,
      type:
        c.type === "meaning"
          ? "meaning"
          : c.type === "sound"
            ? "sound"
            : "unknown",
      definition: c.definition,
      pinyin: c.pinyin,
      sinoVietnamese: getSinoVietnamese(c.char, compEntries[0]?.trad),
      entry: compEntries[0] ? enrichEntry(compEntries[0], depth + 1) : undefined,
    };
  });

  return {
    notes: raw.notes,
    components,
  };
}

/**
 * Convert a LexiconEntry to a full WordEntry, enriched with VI/Sino-Viet data.
 * depth guards against infinite recursion when entries reference each other.
 */
function enrichEntry(raw: LexiconEntry, depth = 0): WordEntry {
  const sinoVietnamese = getSinoVietnamese(raw.simp, raw.trad);
  const chars = [...raw.simp];
  const inferredSinoVietnamese =
    depth === 0 && chars.length > 1
      ? chars
          .map((c) => {
            const trad = getEntries(c)[0]?.trad;
            return getSinoVietnamese(c, trad) || `[${c}]`;
          })
          .join(" ")
      : "";
  const definitionVi = getVietnameseMeaning(raw.simp);
  const etymology = raw.simpEtymology
    ? buildEtymology(raw.simpEtymology, depth)
    : undefined;

  const stats = raw.statistics ?? {};
  const relatedWords = (stats.topWords ?? [])
    .filter((w) => w.word !== raw.simp)
    .slice(0, 8)
    .map((w) => {
      const relEntries = depth < 1 ? getEntries(w.word) : [];
      return {
        word: w.word,
        trad: w.trad,
        gloss: w.gloss,
        entry: relEntries[0] ? enrichEntry(relEntries[0], depth + 1) : undefined,
      };
    });

  return {
    simp: raw.simp,
    trad: raw.trad,
    pinyin: raw.pinyin,
    pinyinTones: raw.pinyinTones,
    sinoVietnamese,
    inferredSinoVietnamese,
    definitionsEn: raw.definitions,
    definitionVi,
    etymology,
    statistics: {
      hskLevel: stats.hskLevel,
      movieWordRank: stats.movieWordRank,
      bookWordRank: stats.bookWordRank,
    },
    relatedWords,
  };
}

/**
 * Search the dictionary for a query string.
 * Supports Chinese characters, pinyin with/without tones.
 * Source: chinese-lexicon (search), enriched with CVDICT + kVietnamese
 */
export function lookupWord(input: string): WordEntry[] {
  const results = search(input);
  return results.map(enrichEntry);
}

/**
 * Get full details for a single simplified Chinese word/character.
 * Returns null if not found.
 * Source: chinese-lexicon (getEntries), enriched with CVDICT + kVietnamese
 */
export function getWordDetail(simp: string): WordEntry | null {
  const entries = getEntries(simp);
  if (!entries || entries.length === 0) return null;
  return enrichEntry(entries[0]);
}

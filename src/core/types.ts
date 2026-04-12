/**
 * types.ts — Shared TypeScript interfaces for Hiểu Chữ Hán
 * Framework-agnostic. No React/Next.js imports.
 */

// Source enum for tracking where data came from
export enum DictionarySource {
  ChineseLexicon = "chinese-lexicon",
  CVDICT = "cvdict",
  KVietnamese = "kVietnamese",
}

// A single etymology component (e.g. 疒 = meaning, 冬 = sound)
export interface EtymologyComponent {
  char: string;
  type: "meaning" | "sound" | "unknown";
  definition: string;
  pinyin: string;
  /** Sino-Vietnamese reading, enriched from kVietnamese */
  sinoVietnamese?: string;
}

// Etymology breakdown for a character
export interface Etymology {
  notes: string;
  components: EtymologyComponent[];
}

// Frequency / usage statistics
export interface WordStatistics {
  hskLevel?: number;
  movieWordRank?: number;
  bookWordRank?: number;
}

// Full word/character entry returned to the UI
export interface WordEntry {
  /** Simplified Chinese character or word */
  simp: string;
  /** Traditional Chinese character or word (same as simp if identical) */
  trad: string;
  /** Pinyin with tone marks, e.g. "téng​tòng" */
  pinyin: string;
  /** Pinyin with tone numbers, e.g. "teng2tong4" */
  pinyinTones: string;
  /** Sino-Vietnamese reading from kVietnamese (Unihan) */
  sinoVietnamese: string;
  /** English definitions — Source: chinese-lexicon */
  definitionsEn: string[];
  /** Vietnamese meaning — Source: CVDICT */
  definitionVi: string;
  /** Etymology breakdown (single characters only) */
  etymology?: Etymology;
  /** Usage statistics */
  statistics: WordStatistics;
  /** Related/compound words */
  relatedWords: Array<{ word: string; trad: string; gloss: string }>;
}

// Search results array
export type SearchResult = WordEntry[];

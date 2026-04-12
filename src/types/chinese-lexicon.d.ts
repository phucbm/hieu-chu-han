/**
 * Type declarations for chinese-lexicon (no official @types package).
 */
declare module "chinese-lexicon" {
  export interface LexiconStatistics {
    hskLevel?: number;
    movieWordCount?: number;
    movieWordCountPercent?: number;
    movieWordRank?: number;
    movieWordContexts?: number;
    movieWordContextsPercent?: number;
    bookWordCount?: number;
    bookWordCountPercent?: number;
    bookWordRank?: number;
    movieCharCount?: number;
    movieCharCountPercent?: number;
    movieCharRank?: number;
    movieCharContexts?: number;
    movieCharContextsPercent?: number;
    bookCharCount?: number;
    bookCharCountPercent?: number;
    bookCharRank?: number;
    topWords?: Array<{ word: string; trad: string; gloss: string; share: number }>;
  }

  export interface EtymologyComponent {
    type: string;
    char: string;
    fragment?: number[];
    definition: string;
    pinyin: string;
    notes?: string;
  }

  export interface SimplifiedEtymology {
    notes: string;
    definition: string;
    components: EtymologyComponent[];
    images?: unknown[];
    pinyin: string;
  }

  export interface LexiconEntry {
    simp: string;
    trad: string;
    definitions: string[];
    pinyin: string;
    searchablePinyin: string;
    pinyinTones: string;
    simpEtymology?: SimplifiedEtymology;
    statistics?: LexiconStatistics;
    boost?: number;
    relevance?: number;
    usedAsComponentIn?: {
      simp: { count: number };
      trad: { count: number };
    };
  }

  export function search(query: string): LexiconEntry[];
  export function getEntries(simp: string): LexiconEntry[];
  export function getGloss(simp: string): string;
  export function getEtymology(simp: string): SimplifiedEtymology | null;
}

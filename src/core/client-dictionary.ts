/**
 * client-dictionary.ts — Browser-side dictionary engine
 *
 * Lazily fetches /data/dictionary.json on first use and caches it in memory.
 * Implements lookupWord() and getWordDetail() with the same signatures as
 * dictionary.ts so actions.ts can swap with no other changes.
 *
 * Search logic mirrors chinese-lexicon/index.js:
 *   - substring match on simp, trad, searchablePinyin, pinyinTones, pinyin
 *   - rank by boost × relevance
 */

import type { WordEntry, EtymologyComponent, Etymology, WordStatistics } from "./types";

// ── Compact entry shape stored in dictionary.json ────────────────────────────

interface DictEntry {
  s: string;     // simp
  t: string;     // trad
  p: string;     // pinyin (tone marks)
  pt: string;    // pinyinTones
  sp: string;    // searchablePinyin
  b: number;     // boost
  vi: string;    // Vietnamese definition
  sv: string;    // Sino-Vietnamese reading
  en: string[];  // English definitions
  hsk?: number;
  mwr?: number;
  bwr?: number;
  tw?: Array<{ word: string; trad: string; gloss: string }>;
  etym?: {
    notes: string;
    components: Array<{
      char: string;
      type: string;
      def: string;
      p: string;
      sv: string;
    }>;
  };
}

// ── Module-level cache ────────────────────────────────────────────────────────

let entries: DictEntry[] = [];
let simpMap: Map<string, DictEntry> = new Map();
let loaded = false;
let loadPromise: Promise<void> | null = null;

async function loadDictionary(): Promise<void> {
  if (loaded) return;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const res = await fetch("/data/dictionary.json");
    if (!res.ok) throw new Error(`Failed to load dictionary: ${res.status}`);
    const data: DictEntry[] = await res.json();
    entries = data;
    simpMap = new Map(data.map((e) => [e.s, e]));
    loaded = true;
  })();

  return loadPromise;
}

// ── Entry → WordEntry conversion ──────────────────────────────────────────────

function toWordEntry(e: DictEntry, depth = 0): WordEntry {
  let etymology: Etymology | undefined;
  if (e.etym) {
    const components: EtymologyComponent[] = e.etym.components.map((c) => {
      const compDict = depth < 1 ? simpMap.get(c.char) : undefined;
      return {
        char: c.char,
        type: c.type === "meaning" ? "meaning" : c.type === "sound" ? "sound" : "unknown",
        definition: c.def,
        pinyin: c.p,
        sinoVietnamese: c.sv,
        entry: compDict ? toWordEntry(compDict, depth + 1) : undefined,
      };
    });
    etymology = { notes: e.etym.notes, components };
  }

  const statistics: WordStatistics = {
    hskLevel: e.hsk,
    movieWordRank: e.mwr,
    bookWordRank: e.bwr,
  };

  const relatedWords = (e.tw ?? []).map((w) => {
    const relDict = depth < 1 ? simpMap.get(w.word) : undefined;
    return {
      word: w.word,
      trad: w.trad,
      gloss: w.gloss,
      entry: relDict ? toWordEntry(relDict, depth + 1) : undefined,
    };
  });

  const chars = [...e.s];
  const inferredSinoVietnamese =
    depth === 0 && chars.length > 1
      ? chars
          .map((c) => {
            const entry = simpMap.get(c);
            const sv = entry?.sv || (entry?.t && entry.t !== c ? simpMap.get(entry.t)?.sv : "");
            return sv || `[${c}]`;
          })
          .join(" ")
      : "";

  return {
    simp: e.s,
    trad: e.t,
    pinyin: e.p,
    pinyinTones: e.pt,
    sinoVietnamese: e.sv,
    inferredSinoVietnamese,
    definitionsEn: e.en,
    definitionVi: e.vi,
    etymology,
    statistics,
    relatedWords,
  };
}

// ── Search helpers (mirrors chinese-lexicon/index.js) ─────────────────────────

function isSubstringMatch(text: string | undefined, term: string): boolean {
  if (!text) return false;
  return text.includes(term);
}

function calcRelevance(e: DictEntry, term: string): number {
  let relevance = 1;
  const defs = e.en;
  for (let i = 0; i < defs.length; i++) {
    const def = defs[i].toLowerCase();
    if (def.includes(term)) {
      relevance += 1 / (i + 1);
    }
  }
  // Whole-word bonus on primary fields
  if (e.s === term || e.t === term || e.sp === term || e.pt === term) {
    relevance += 10;
  }
  return relevance;
}

function isPlaceholder(e: DictEntry): boolean {
  return e.p === "xx";
}

function runSearch(term: string, limit: number): WordEntry[] {
  const t = term.toLowerCase();
  return entries
    .filter(
      (e) =>
        !isPlaceholder(e) && (
          isSubstringMatch(e.s, t) ||
          isSubstringMatch(e.t, t) ||
          isSubstringMatch(e.sp, t) ||
          isSubstringMatch(e.pt, t) ||
          isSubstringMatch(e.p.toLowerCase(), t)
        )
    )
    .map((e) => ({ e, rel: calcRelevance(e, t) }))
    .sort((a, b) => b.e.b * b.rel - a.e.b * a.rel)
    .slice(0, limit)
    .map(({ e }) => toWordEntry(e));
}

// ── Public API — same signatures as dictionary.ts ─────────────────────────────

/** Search the dictionary (top N results, sorted by boost × relevance). */
export async function lookupWord(input: string): Promise<WordEntry[]> {
  await loadDictionary();
  return runSearch(input.trim(), 100);
}

/** Get full details for a single simplified Chinese word/character. */
export async function getWordDetail(simp: string): Promise<WordEntry | null> {
  await loadDictionary();
  const e = simpMap.get(simp.trim());
  return e && !isPlaceholder(e) ? toWordEntry(e) : null;
}

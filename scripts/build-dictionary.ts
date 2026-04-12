/**
 * build-dictionary.ts
 * Generates public/data/dictionary.json from chinese-lexicon + CVDICT + kVietnamese.
 *
 * Run ONCE locally whenever source data changes:
 *   npx tsx scripts/build-dictionary.ts
 *
 * The output file is committed to the repo and used at runtime by the browser.
 * It is NOT regenerated on every `npm run build`.
 *
 * ── Feature flags ────────────────────────────────────────────────────────────
 * USE_MAKEMEAHANZI — when true:
 *   1. Fills missing etymology from makemeahanzi/dictionary.txt (fallback only;
 *      chinese-lexicon etymology always takes priority).
 *   2. Emits additional entries for traditional characters that have makemeahanzi
 *      data but no simp entry in chinese-lexicon (e.g. 殺 separate from 杀).
 * Set to false to build from chinese-lexicon + CVDICT + kVietnamese only.
 */

// ── Feature flags ─────────────────────────────────────────────────────────────
const USE_MAKEMEAHANZI = true;

import fs from "fs";
import path from "path";

// Use require() because chinese-lexicon is CommonJS
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { allEntries } = require("../node_modules/chinese-lexicon");

const cvdict: Record<string, { trad: string; pinyin: string; vi: string }> =
  JSON.parse(fs.readFileSync(path.join(__dirname, "../src/data/cvdict.json"), "utf-8"));

const kVietnamese: Record<string, string[]> = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../src/data/kVietnamese.json"), "utf-8")
);

const sinoVietOverrides: Record<string, string[]> = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../src/data/sinoViet-overrides.json"), "utf-8")
);

const OUTPUT = path.join(__dirname, "../public/data/dictionary.json");

// ── makemeahanzi types ────────────────────────────────────────────────────────

interface MakemeahanziEtym {
  type: "pictophonetic" | "ideographic" | "pictographic";
  hint?: string;
  semantic?: string;
  phonetic?: string;
}

interface MakemeahanziEntry {
  character: string;
  definition?: string;
  pinyin?: string[];
  decomposition?: string;
  etymology?: MakemeahanziEtym;
  radical?: string;
}

// ── Load makemeahanzi ─────────────────────────────────────────────────────────

let mmMap: Map<string, MakemeahanziEntry> = new Map();

if (USE_MAKEMEAHANZI) {
  const mmPath = path.join(__dirname, "../src/data/makemeahanzi-dictionary.txt");
  const lines = fs.readFileSync(mmPath, "utf-8").trim().split("\n");
  for (const line of lines) {
    try {
      const entry: MakemeahanziEntry = JSON.parse(line);
      mmMap.set(entry.character, entry);
    } catch {
      // skip malformed lines
    }
  }
  console.log(`Loaded ${mmMap.size} makemeahanzi entries`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getSinoViet(simp: string, trad?: string): string {
  const simpChar = [...simp][0] ?? "";
  const tradChar = trad ? ([...trad][0] ?? "") : "";
  const readings =
    kVietnamese[simpChar] ??
    (tradChar && tradChar !== simpChar ? kVietnamese[tradChar] : undefined) ??
    sinoVietOverrides[simpChar] ??
    (tradChar && tradChar !== simpChar ? sinoVietOverrides[tradChar] : undefined);
  return readings?.join(" / ") ?? "";
}

// Compact entry shape — short keys to minimise file size
export interface DictEntry {
  s: string;     // simp
  t: string;     // trad
  p: string;     // pinyin (with tone marks)
  pt: string;    // pinyinTones (tone numbers)
  sp: string;    // searchablePinyin (no tones, for fuzzy search)
  b: number;     // boost score for ranking
  vi: string;    // Vietnamese definition (CVDICT)
  sv: string;    // Sino-Vietnamese reading (kVietnamese)
  en: string[];  // English definitions
  hsk?: number;
  mwr?: number;
  bwr?: number;
  tw?: Array<{ word: string; trad: string; gloss: string }>;
  etym?: {
    notes: string;
    components: Array<{ char: string; type: string; def: string; p: string; sv: string }>;
  };
}

/** Convert a makemeahanzi etymology to our etym format. */
function mmEtymToEtym(etym: MakemeahanziEtym): DictEntry["etym"] {
  const components: DictEntry["etym"]["components"] = [];
  if (etym.semantic) {
    components.push({ char: etym.semantic, type: "meaning", def: "", p: "", sv: getSinoViet(etym.semantic) });
  }
  if (etym.phonetic) {
    components.push({ char: etym.phonetic, type: "sound", def: "", p: "", sv: getSinoViet(etym.phonetic) });
  }
  return { notes: etym.hint ?? etym.type, components };
}

// ── Convert chinese-lexicon entry ─────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function convertEntry(raw: any): DictEntry {
  const entry: DictEntry = {
    s: raw.simp,
    t: raw.trad,
    p: raw.pinyin ?? "",
    pt: raw.pinyinTones ?? "",
    sp: raw.searchablePinyin ?? "",
    b: Math.round((raw.boost ?? 0) * 10) / 10,
    vi: cvdict[raw.simp]?.vi ?? "",
    sv: getSinoViet(raw.simp, raw.trad),
    en: raw.definitions ?? [],
  };

  const stats = raw.statistics ?? {};
  if (stats.hskLevel) entry.hsk = stats.hskLevel;
  if (stats.movieWordRank) entry.mwr = stats.movieWordRank;
  if (stats.bookWordRank) entry.bwr = stats.bookWordRank;
  if (stats.topWords?.length) {
    entry.tw = stats.topWords
      .filter((w: { word: string }) => w.word !== raw.simp)
      .slice(0, 8);
  }

  if (raw.simpEtymology) {
    // chinese-lexicon etymology takes priority
    entry.etym = {
      notes: raw.simpEtymology.notes ?? "",
      components: (raw.simpEtymology.components ?? []).map(
        (c: { char: string; trad?: string; type: string; definition: string; pinyin: string }) => ({
          char: c.char,
          type: c.type,
          def: c.definition ?? "",
          p: c.pinyin ?? "",
          sv: getSinoViet(c.char, c.trad),
        })
      ),
    };
  } else if (USE_MAKEMEAHANZI) {
    // Fallback: try makemeahanzi for this simp character
    const mm = mmMap.get(raw.simp) ?? mmMap.get(raw.trad);
    if (mm?.etymology) {
      entry.etym = mmEtymToEtym(mm.etymology);
    }
  }

  return entry;
}

// ── Emit trad-only entries from makemeahanzi ──────────────────────────────────

/**
 * For traditional characters that exist in makemeahanzi but have no dedicated
 * simp entry in chinese-lexicon (e.g. 殺 — paired with 杀 but never its own entry).
 * These get a minimal DictEntry so they can be looked up and displayed separately.
 */
function buildTradOnlyEntries(simpSet: Set<string>): DictEntry[] {
  if (!USE_MAKEMEAHANZI) return [];

  const extra: DictEntry[] = [];

  for (const [char, mm] of mmMap) {
    // Skip if already covered as a simp entry
    if (simpSet.has(char)) continue;
    // Skip radicals / CJK components (not standalone words)
    if (!mm.pinyin?.length || !mm.definition) continue;

    const pinyin = mm.pinyin.join(" / ");
    entry: {
      const e: DictEntry = {
        s: char,
        t: char,
        p: pinyin,
        pt: pinyin,   // approximation — no tone-number conversion
        sp: pinyin,   // approximation — includes tone marks
        b: 0.5,       // low boost so it appears below established entries
        vi: cvdict[char]?.vi ?? "",
        sv: getSinoViet(char),
        en: mm.definition ? [mm.definition] : [],
      };
      if (mm.etymology) {
        e.etym = mmEtymToEtym(mm.etymology);
      }
      extra.push(e);
    }
  }

  return extra;
}

// ── Main ──────────────────────────────────────────────────────────────────────

function main(): void {
  console.log(`Converting ${allEntries.length} chinese-lexicon entries...`);

  const result: DictEntry[] = allEntries.map(convertEntry);
  const simpSet = new Set(result.map((e) => e.s));

  const tradExtra = buildTradOnlyEntries(simpSet);
  if (tradExtra.length > 0) {
    console.log(`Adding ${tradExtra.length} trad-only entries from makemeahanzi...`);
    result.push(...tradExtra);
  }

  const dir = path.dirname(OUTPUT);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const json = JSON.stringify(result);
  fs.writeFileSync(OUTPUT, json, "utf-8");

  const sizeMB = (json.length / 1024 / 1024).toFixed(1);
  console.log(`Written ${result.length} entries → ${OUTPUT} (${sizeMB} MB)`);
}

main();

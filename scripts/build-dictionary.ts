/**
 * build-dictionary.ts
 * Generates public/data/dictionary.json from chinese-lexicon + CVDICT + kVietnamese.
 *
 * Run ONCE locally whenever source data changes:
 *   npx tsx scripts/build-dictionary.ts
 *
 * The output file is committed to the repo and used at runtime by the browser.
 * It is NOT regenerated on every `npm run build`.
 */

import fs from "fs";
import path from "path";

// Use require() because chinese-lexicon is CommonJS
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { allEntries } = require("../node_modules/chinese-lexicon");

const cvdict: Record<string, { trad: string; pinyin: string; vi: string }> =
  JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "../src/data/cvdict.json"),
      "utf-8"
    )
  );

const kVietnamese: Record<string, string[]> = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../src/data/kVietnamese.json"),
    "utf-8"
  )
);

const OUTPUT = path.join(__dirname, "../public/data/dictionary.json");

function getSinoViet(simp: string): string {
  const char = [...simp][0] ?? "";
  const readings = kVietnamese[char];
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
  hsk?: number;  // HSK level
  mwr?: number;  // movie word rank
  bwr?: number;  // book word rank
  tw?: Array<{ word: string; trad: string; gloss: string }>; // top related words
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
    sv: getSinoViet(raw.simp),
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
    entry.etym = {
      notes: raw.simpEtymology.notes ?? "",
      components: (raw.simpEtymology.components ?? []).map(
        (c: { char: string; type: string; definition: string; pinyin: string }) => ({
          char: c.char,
          type: c.type,
          def: c.definition ?? "",
          p: c.pinyin ?? "",
          sv: getSinoViet(c.char),
        })
      ),
    };
  }

  return entry;
}

function main(): void {
  console.log(`Converting ${allEntries.length} entries...`);

  const result: DictEntry[] = allEntries.map(convertEntry);

  const dir = path.dirname(OUTPUT);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const json = JSON.stringify(result);
  fs.writeFileSync(OUTPUT, json, "utf-8");

  const sizeMB = (json.length / 1024 / 1024).toFixed(1);
  console.log(`Written ${result.length} entries → ${OUTPUT} (${sizeMB} MB)`);
}

main();

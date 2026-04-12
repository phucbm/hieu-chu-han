/**
 * parse-cvdict.ts
 * Parses CVDICT.u8 (Chinese-Vietnamese dictionary by ph0ngp) into JSON.
 *
 * Input format per line: Traditional Simplified [pinyin] /meaning1/meaning2/
 * Output: { [simplified]: { trad: string, pinyin: string, vi: string } }
 *
 * Source: https://github.com/ph0ngp/CVDICT
 * Run: npx tsx scripts/parse-cvdict.ts
 */

import fs from "fs";
import path from "path";

const INPUT = path.join(__dirname, "../src/data/CVDICT.u8");
const OUTPUT = path.join(__dirname, "../src/data/cvdict.json");

type CVDictEntry = {
  trad: string;
  pinyin: string;
  vi: string;
};

type CVDictMap = Record<string, CVDictEntry>;

function parseLine(line: string): [string, CVDictEntry] | null {
  // Skip comment lines and empty lines
  if (line.startsWith("#") || line.trim() === "") return null;

  // Format: Traditional Simplified [pinyin] /meaning1/meaning2/
  // Use regex to capture all parts
  const match = line.match(/^(\S+)\s+(\S+)\s+\[([^\]]+)\]\s+\/(.+)\/\s*$/);
  if (!match) return null;

  const [, trad, simp, pinyin, meaningRaw] = match;

  // Join multiple slash-separated meanings with " / "
  const vi = meaningRaw
    .split("/")
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" / ");

  return [simp, { trad, pinyin, vi }];
}

function main(): void {
  console.log("Reading CVDICT.u8...");
  const raw = fs.readFileSync(INPUT, "utf-8");
  const lines = raw.split("\n");

  const result: CVDictMap = {};
  let parsed = 0;
  let skipped = 0;

  for (const line of lines) {
    const entry = parseLine(line);
    if (entry) {
      const [simp, data] = entry;
      // Keep first occurrence (most common form comes first in CVDICT)
      if (!result[simp]) {
        result[simp] = data;
      }
      parsed++;
    } else {
      skipped++;
    }
  }

  console.log(`Parsed: ${parsed} entries`);
  console.log(`Skipped (comments/empty): ${skipped} lines`);
  console.log(`Unique simplified chars/words: ${Object.keys(result).length}`);

  fs.writeFileSync(OUTPUT, JSON.stringify(result, null, 0), "utf-8");
  console.log(`Output written to: ${OUTPUT}`);
}

main();

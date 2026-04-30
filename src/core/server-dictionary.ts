/**
 * server-dictionary.ts — Minimal server-side dictionary lookups.
 *
 * Reads public/data/dictionary.json from the filesystem (Node.js / Vercel).
 * On Cloudflare Workers the filesystem is unavailable — gracefully returns
 * undefined / empty so the caller's try/catch degrades silently.
 *
 * Avoids bundling chinese-lexicon (13 MB) into the server worker.
 */

interface SlimEntry {
  s: string;
  hsk?: number;
  etym?: { components: Array<{ char: string }> };
  tw?: Array<{ word: string }>;
}

let cache: Map<string, SlimEntry> | null = null;
let loading: Promise<Map<string, SlimEntry>> | null = null;

async function getCache(): Promise<Map<string, SlimEntry>> {
  if (cache) return cache;
  if (loading) return loading;
  loading = (async () => {
    try {
      const { readFile } = await import("fs/promises");
      const { join } = await import("path");
      const raw = await readFile(join(process.cwd(), "public/data/dictionary.json"), "utf-8");
      const data: SlimEntry[] = JSON.parse(raw);
      cache = new Map(data.map((e) => [e.s, e]));
    } catch {
      // Cloudflare Workers: filesystem unavailable — degrade gracefully
      cache = new Map();
    }
    return cache!;
  })();
  return loading;
}

export async function getServerHskLevel(simp: string): Promise<number | undefined> {
  return (await getCache()).get(simp)?.hsk;
}

export async function getServerEtymologyData(simp: string): Promise<{
  componentChars: string[];
  topWords: string[];
}> {
  const entry = (await getCache()).get(simp);
  return {
    componentChars: entry?.etym?.components.map((c) => c.char) ?? [],
    topWords: entry?.tw?.map((t) => t.word) ?? [],
  };
}

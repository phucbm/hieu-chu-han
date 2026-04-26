"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getWordDetail } from "@/core/client-dictionary";
import type { NotebookLyrics, UserWordExtended } from "@/core/notebook-types";

interface LyricsPanelProps {
  lyrics: NotebookLyrics;
  userWords: UserWordExtended[];
}

// CJK character regex
const CJK = /[一-鿿㐀-䶿]/;

function splitLineIntoTokens(line: string): string[] {
  const tokens: string[] = [];
  let buf = "";
  for (const ch of line) {
    if (CJK.test(ch)) {
      if (buf) { tokens.push(buf); buf = ""; }
      tokens.push(ch);
    } else {
      buf += ch;
    }
  }
  if (buf) tokens.push(buf);
  return tokens;
}

type WordStatus = "never" | "added-unseen" | "low" | "known" | "not-in-dict" | "non-chinese";

function getStatus(char: string, userWordMap: Map<string, UserWordExtended>, knownInDict: Set<string>): WordStatus {
  if (!CJK.test(char)) return "non-chinese";
  const uw = userWordMap.get(char);
  if (!uw) {
    if (!knownInDict.has(char)) return "not-in-dict";
    return "never";
  }
  if (uw.viewCount === 0) return "added-unseen";
  if (uw.viewCount < 5) return "low";
  return "known";
}

const STATUS_CLASS: Record<WordStatus, string> = {
  never: "bg-red-500/20 text-red-700 dark:text-red-400 rounded px-0.5 cursor-pointer hover:bg-red-500/30",
  "added-unseen": "bg-orange-500/20 text-orange-700 dark:text-orange-400 rounded px-0.5 cursor-pointer hover:bg-orange-500/30",
  low: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 rounded px-0.5 cursor-pointer hover:bg-yellow-500/30",
  known: "cursor-pointer hover:underline",
  "not-in-dict": "text-muted-foreground/50 cursor-default",
  "non-chinese": "",
};

export function LyricsPanel({ lyrics, userWords }: LyricsPanelProps) {
  const router = useRouter();
  const [dictWords, setDictWords] = useState<Set<string>>(new Set());
  const [pinyinMap, setPinyinMap] = useState<Map<string, string>>(new Map());

  const userWordMap = new Map(userWords.map((w) => [w.simp, w]));

  // Build set of chars that exist in the dictionary (for "not-in-dict" detection)
  useEffect(() => {
    const chars = new Set<string>();
    for (const line of lyrics.content.split("\n")) {
      for (const ch of line) {
        if (CJK.test(ch)) chars.add(ch);
      }
    }
    Promise.all(
      [...chars].map((ch) => getWordDetail(ch).then((entry) => ({ ch, found: !!entry, pinyin: entry?.pinyin ?? "" })))
    ).then((results) => {
      const found = new Set<string>();
      const pm = new Map<string, string>();
      for (const { ch, found: f, pinyin } of results) {
        if (f) { found.add(ch); pm.set(ch, pinyin); }
      }
      setDictWords(found);
      setPinyinMap(pm);
    });
  }, [lyrics.content]);

  const lines = lyrics.content.split("\n");

  return (
    <div className="flex flex-col gap-1">
      {lyrics.youtubeUrl && (
        <a
          href={lyrics.youtubeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-primary hover:underline mb-2 inline-block"
        >
          ▶ Xem trên YouTube
        </a>
      )}

      <div className="flex flex-col gap-4">
        {lines.map((line, lineIdx) => {
          if (!line.trim()) return <div key={lineIdx} className="h-3" />;
          const tokens = splitLineIntoTokens(line);

          return (
            <div key={lineIdx} className="flex flex-wrap items-end gap-x-0.5 gap-y-1 leading-relaxed">
              {tokens.map((token, tokenIdx) => {
                if (!CJK.test(token[0])) {
                  return <span key={tokenIdx} className="text-sm">{token}</span>;
                }

                const status = getStatus(token, userWordMap, dictWords);
                const pinyin = pinyinMap.get(token);
                const isClickable = status !== "not-in-dict" && status !== "non-chinese";

                return (
                  <span
                    key={tokenIdx}
                    className="flex flex-col items-center"
                    title={pinyin}
                  >
                    {pinyin && (
                      <span className="text-muted-foreground leading-none mb-0.5">{pinyin}</span>
                    )}
                    <span
                      className={`text-2xl font-chinese ${STATUS_CLASS[status]}`}
                      onClick={isClickable ? () => router.push(`/word/${encodeURIComponent(token)}`) : undefined}
                    >
                      {token}
                    </span>
                  </span>
                );
              })}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-500/20 inline-block" />
          Chưa từng xem
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-orange-500/20 inline-block" />
          Đã thêm, chưa tra
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-yellow-500/20 inline-block" />
          Đang học
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded text-muted-foreground/50 inline-block">字</span>
          Không có trong từ điển
        </span>
      </div>
    </div>
  );
}

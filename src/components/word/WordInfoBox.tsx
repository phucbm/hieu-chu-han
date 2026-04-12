"use client";

/**
 * WordInfoBox — Primary word information panel.
 * Shows simplified/traditional forms, pinyin, and Sino-Vietnamese reading.
 * Includes CopyShareButton and raw-data DebugDialog.
 * Data source: WordEntry from getWordEntries()
 */


import type {WordEntry} from "@/core/types";

interface WordInfoBoxProps {
  entry: WordEntry;
}

export function WordInfoBox({ entry }: WordInfoBoxProps) {
    const showTrad = entry.trad && entry.trad !== entry.simp;

  return (
    <>
      <div className="relative rounded-xl bg-stone-100 p-5">

        {/* Giản thể / Phồn thể */}
          <div className="flex flex-wrap justify-evenly gap-3 mb-5">
              <div className="flex flex-col justify-center items-center">
                  <span className="text-sm text-muted-foreground mb-1 text-center">
                      Giản thể
                  </span>
                  <span className="simp font-chinese text-6xl font-bold leading-none select-all text-nowrap">
                {entry.simp}
              </span>
              </div>
              {showTrad && (
                  <div className="flex flex-col justify-center items-center">
                      <span className="text-sm text-muted-foreground mb-1 text-center">Phồn thể</span>
                      <span
                          className="simp font-chinese text-6xl font-bold leading-none select-all text-nowrap text-green-500">
                {entry.trad}
              </span>
                  </div>
              )}
        </div>

        {/* Bính âm / Hán Việt */}
          <p className="text-sm text-muted-foreground mb-1 text-center">
          Bính âm - Hán Việt
        </p>
          <div className="flex items-baseline justify-center gap-3 text-center">
          <span className="text-xl text-muted-foreground">{entry.pinyin}</span>
          {entry.sinoVietnamese ? (
            <span className="text-xl font-medium text-primary">
              {entry.sinoVietnamese}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground italic">—</span>
          )}
        </div>
      </div>
    </>
  );
}

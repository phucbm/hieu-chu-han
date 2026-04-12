"use client";

/**
 * WordInfoBox — Primary word information panel.
 * Shows simplified/traditional forms, pinyin, and Sino-Vietnamese reading.
 * Includes CopyShareButton and raw-data DebugDialog.
 * Data source: WordEntry from getWordEntries()
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CopyShareButton } from "@/components/shared/CopyShareButton";
import { Braces } from "lucide-react";
import type { WordEntry } from "@/core/types";

interface WordInfoBoxProps {
  entry: WordEntry;
}

export function WordInfoBox({ entry }: WordInfoBoxProps) {
  const [debugOpen, setDebugOpen] = useState(false);
  const showTrad = entry.trad && entry.trad !== entry.simp;

  return (
    <>
      <div className="relative rounded-xl border bg-card p-5">
        {/* Action buttons — top right */}
        <div className="absolute top-2 right-2 flex items-center gap-0.5">
          <CopyShareButton simp={entry.simp} />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setDebugOpen(true)}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title="Xem dữ liệu thô"
            aria-label="Xem dữ liệu thô"
          >
            <Braces className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Giản thể / Phồn thể */}
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Giản thể – Phồn thể
        </p>
        <div className="flex items-baseline gap-3 mb-5">
          <span className="font-chinese text-6xl font-bold leading-none select-all">
            {entry.simp}
          </span>
          {showTrad ? (
            <span
              className="font-chinese text-2xl text-muted-foreground select-all"
              title="Phồn thể"
            >
              {entry.trad}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground italic">—</span>
          )}
        </div>

        {/* Bính âm / Hán Việt */}
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
          Bính âm – Hán Việt
        </p>
        <div className="flex items-baseline gap-3">
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

      {/* Debug dialog */}
      <Dialog open={debugOpen} onOpenChange={setDebugOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-chinese">
              Dữ liệu thô — {entry.simp}
            </DialogTitle>
            <DialogDescription>
              Nguồn: chinese-lexicon · CVDICT · Unihan kVietnamese
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto flex-1 min-h-0">
            <pre className="text-xs font-mono bg-muted rounded-md p-4 whitespace-pre-wrap break-words leading-relaxed">
              {JSON.stringify(entry, null, 2)}
            </pre>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

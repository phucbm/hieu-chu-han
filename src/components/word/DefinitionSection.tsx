"use client";

/**
 * DefinitionSection — Vietnamese + English definitions and usage statistics.
 * Data sources: CVDICT (VI), chinese-lexicon (EN, HSK level, frequency ranks)
 */

import {Badge} from "@/components/ui/badge";
import type {WordEntry} from "@/core/types";

interface DefinitionSectionProps {
  entry: WordEntry;
}

function hskVariant(
  level?: number
): "default" | "secondary" | "destructive" | "outline" {
  if (!level) return "outline";
  if (level <= 2) return "default";
  if (level <= 4) return "secondary";
  return "outline";
}

export function DefinitionSection({ entry }: DefinitionSectionProps) {
  const { statistics } = entry;
  const hasDefinitions =
    Boolean(entry.definitionVi) || entry.definitionsEn.length > 0;
  const hasStats =
    statistics.hskLevel ||
    statistics.movieWordRank ||
    statistics.bookWordRank;

  if (!hasDefinitions && !hasStats) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        Nghĩa
      </p>

      {/* Usage stats */}
      {hasStats && (
        <div className="flex flex-wrap gap-2">
          {statistics.hskLevel && (
            <Badge variant={hskVariant(statistics.hskLevel)}>
              HSK {statistics.hskLevel}
            </Badge>
          )}
            {/*{statistics.movieWordRank && (*/}
            {/*  <Badge variant="outline" className="text-xs">*/}
            {/*    Phim: #{statistics.movieWordRank}*/}
            {/*  </Badge>*/}
            {/*)}*/}
            {/*{statistics.bookWordRank && (*/}
            {/*  <Badge variant="outline" className="text-xs">*/}
            {/*    Sách: #{statistics.bookWordRank}*/}
            {/*  </Badge>*/}
            {/*)}*/}
        </div>
      )}

      {/* Definitions */}
      <div className="flex flex-col gap-2">
        {entry.definitionVi && (
          <div className="flex gap-2 items-start">
            <span className="text-sm shrink-0 mt-0.5">🇻🇳</span>
            <span className="text-sm">{entry.definitionVi}</span>
          </div>
        )}
        {entry.definitionsEn.length > 0 && (
          <div className="flex gap-2 items-start">
            <span className="text-sm shrink-0 mt-0.5">🇬🇧</span>
            <span className="text-sm text-muted-foreground">
              {entry.definitionsEn.join("; ")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

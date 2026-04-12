"use client";

/**
 * EtymologySection — Etymology breakdown for a character.
 * Shows notes text and component characters as clickable WordBadges.
 * Data source: chinese-lexicon etymology data (single chars only)
 */

import {WordBadge} from "@/components/shared/WordBadge";
import type {WordEntry} from "@/core/types";

interface EtymologySectionProps {
    entry: WordEntry;
    onWordClick: (simp: string) => void;
}

export function EtymologySection({ entry, onWordClick }: EtymologySectionProps) {
    const {etymology} = entry;
    if (!etymology || etymology.components.length === 0) return null;

    return (
        <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
                Phân tích chữ
            </p>

            <div className="rounded-xl p-4 bg-stone-100">

                {etymology.notes && (
                    <p className="text-sm text-muted-foreground italic">{etymology.notes}</p>
                )}

                <div className="flex flex-col gap-3">
                    {etymology.components.map((comp, i) => (
                        <div key={`${comp.char}-${i}`} className="">

                            <WordBadge
                                simp={comp.char}
                                pinyin={comp.pinyin || undefined}
                                onClick={() => onWordClick(comp.char)}
                            />
                            <div className="">
                                  <span className="text-xs text-muted-foreground">
                                    {comp.type === "meaning" ? "nghĩa" : "âm"}
                                  </span>
                                {comp.sinoVietnamese && (
                                    <span className="text-xs text-primary font-medium">
                  {comp.sinoVietnamese}
                </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

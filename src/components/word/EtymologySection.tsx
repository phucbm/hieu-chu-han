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
            <p className="text-sm">
                Phân tích chữ
            </p>

            <div className="rounded-xl p-4 bg-muted flex flex-col gap-3">

                {etymology.notes && (
                    <p className="text-sm italic">{etymology.notes}</p>
                )}

                <div className="flex flex-wrap gap-3">
                    {etymology.components.map((comp, i) => (
                        <div key={`${comp.char}-${i}`} className="">

                            {comp.entry ? (
                                <div className="flex flex-col justify-center items-center gap-1">
                                    <WordBadge
                                        entry={comp.entry}
                                        onClick={() => onWordClick(comp.char)}
                                    />
                                    <span className="hidden text-xs text-muted-foreground">
                                    {comp.type === "meaning" ? "(nghĩa)" : "(âm)"}
                                  </span>
                                </div>
                            ) : (
                                <span className="font-chinese font-medium text-base">{comp.char}</span>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

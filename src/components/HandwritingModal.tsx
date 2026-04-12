"use client";

/**
 * HandwritingModal — Dialog for drawing a Chinese character to search.
 * Manages HandwritingRecognizer lifecycle and candidate display.
 * Opens/closes the Web Worker with the dialog to avoid idle resource use.
 */

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { HandwritingPad } from "@/components/HandwritingPad";
import { HandwritingRecognizer, type Candidate } from "@/core/handwriting";

interface HandwritingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called when the user taps a candidate character. */
  onSelect: (char: string) => void;
}

export function HandwritingModal({ open, onOpenChange, onSelect }: HandwritingModalProps) {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [strokeCount, setStrokeCount] = useState(0);
  /** Incremented on each selection to remount HandwritingPad and reset its canvas. */
  const [padKey, setPadKey] = useState(0);
  const recognizer = useRef<HandwritingRecognizer | null>(null);

  /** Initialize recognizer when dialog opens, destroy when it closes. */
  useEffect(() => {
    if (open) {
      recognizer.current = new HandwritingRecognizer();
      recognizer.current.init((results) => setCandidates(results));
    } else {
      recognizer.current?.destroy();
      recognizer.current = null;
      setCandidates([]);
      setStrokeCount(0);
    }
  }, [open]);

  /** Called by HandwritingPad after every stroke change (add, undo, clear). */
  const handleStrokeEnd = useCallback((strokes: number[][][]) => {
    setStrokeCount(strokes.length);
    if (strokes.length === 0) {
      setCandidates([]);
    } else {
      recognizer.current?.lookup(strokes);
    }
  }, []);

  const handleUndo = useCallback(() => {
    // Stroke removal is handled inside HandwritingPad; strokeCount updates via handleStrokeEnd.
  }, []);

  const handleClear = useCallback(() => {
    setCandidates([]);
  }, []);

  const handleSelect = useCallback(
    (char: string) => {
      onSelect(char);
      // Reset pad so user can immediately draw the next character.
      setPadKey((k) => k + 1);
      setCandidates([]);
      setStrokeCount(0);
    },
    [onSelect]
  );

  return (
    <Dialog open={open} onOpenChange={(isOpen) => onOpenChange(isOpen)}>
      <DialogContent className="sm:max-w-sm" showCloseButton>
        <DialogHeader>
          <DialogTitle>Vẽ chữ Hán</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <HandwritingPad
            key={padKey}
            onStrokeEnd={handleStrokeEnd}
            onClear={handleClear}
            strokeCount={strokeCount}
            onUndo={handleUndo}
          />

          {/* Candidate characters */}
          {candidates.length > 0 ? (
            <div className="w-full">
              <p className="text-xs text-muted-foreground mb-2">Chọn chữ phù hợp:</p>
              <div className="grid grid-cols-8 gap-1">
                {candidates.map((c) => (
                  <button
                    key={c.hanzi}
                    type="button"
                    onClick={() => handleSelect(c.hanzi)}
                    className="font-chinese text-2xl rounded-md border py-1 hover:bg-muted transition-colors text-center"
                  >
                    {c.hanzi}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              {strokeCount === 0 ? "Vẽ một chữ Hán" : "Đang nhận dạng..."}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

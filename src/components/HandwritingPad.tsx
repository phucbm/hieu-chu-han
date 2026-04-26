"use client";

/**
 * HandwritingPad — Canvas component for drawing Chinese characters.
 * Supports mouse, touch, and stylus via Pointer Events API.
 * Manages its own stroke state internally; notifies parent via callbacks.
 */

import { useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Undo2, Trash2, ExternalLink, BotMessageSquare } from "lucide-react";

interface HandwritingPadProps {
  /** Called after each stroke ends (or after undo/clear) with all current strokes as raw pixel coords. */
  onStrokeEnd: (strokes: number[][][]) => void;
  onClear: () => void;
  /** Current stroke count — used to disable Undo when 0. */
  strokeCount: number;
  onUndo: () => void;
  /** Called with base64 PNG data URL when user requests AI recognition. */
  onAskAI?: (imageBase64: string) => void;
  askAILoading?: boolean;
}

const CANVAS_SIZE = 280;
const STROKE_COLOR = "#1a1a1a";
const LINE_WIDTH = 4;

export function HandwritingPad({
  onStrokeEnd,
  onClear,
  strokeCount,
  onUndo,
  onAskAI,
  askAILoading,
}: HandwritingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** All completed strokes — raw pixel coords [[x,y], ...] */
  const strokes = useRef<number[][][]>([]);
  /** Points in the stroke currently being drawn. */
  const currentStroke = useRef<number[][] | null>(null);

  /** Redraws all completed strokes + the in-progress stroke onto the canvas. */
  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = STROKE_COLOR;
    ctx.lineWidth = LINE_WIDTH;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const all = currentStroke.current
      ? [...strokes.current, currentStroke.current]
      : strokes.current;

    for (const stroke of all) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0][0], stroke[0][1]);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i][0], stroke[i][1]);
      }
      ctx.stroke();
    }
  }, []);

  /** Returns canvas-relative coordinates for a pointer event. */
  const getPoint = (e: React.PointerEvent<HTMLCanvasElement>): [number, number] => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return [e.clientX - rect.left, e.clientY - rect.top];
  };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      canvasRef.current?.setPointerCapture(e.pointerId);
      currentStroke.current = [getPoint(e)];
      redraw();
    },
    [redraw]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!currentStroke.current) return;
      currentStroke.current.push(getPoint(e));
      redraw();
    },
    [redraw]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!currentStroke.current) return;
      currentStroke.current.push(getPoint(e));
      strokes.current = [...strokes.current, currentStroke.current];
      currentStroke.current = null;
      redraw();
      onStrokeEnd(strokes.current);
    },
    [redraw, onStrokeEnd]
  );

  const handleUndo = useCallback(() => {
    strokes.current = strokes.current.slice(0, -1);
    currentStroke.current = null;
    redraw();
    onUndo();
    onStrokeEnd(strokes.current);
  }, [redraw, onUndo, onStrokeEnd]);

  const handleAskAI = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !onAskAI) return;
    const offscreen = document.createElement("canvas");
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    ctx.drawImage(canvas, 0, 0);
    onAskAI(offscreen.toDataURL("image/png"));
  }, [onAskAI]);

  const handleOpenAsImage = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const offscreen = document.createElement("canvas");
    offscreen.width = canvas.width;
    offscreen.height = canvas.height;
    const ctx = offscreen.getContext("2d")!;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    ctx.drawImage(canvas, 0, 0);
    offscreen.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
    }, "image/png");
  }, []);

  const handleClear = useCallback(() => {
    strokes.current = [];
    currentStroke.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
    onClear();
    onStrokeEnd([]);
  }, [onClear, onStrokeEnd]);

  return (
    <div className="flex flex-col items-center gap-3">
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        className="rounded-lg border bg-card cursor-crosshair"
        style={{ touchAction: "none", width: CANVAS_SIZE, height: CANVAS_SIZE }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleUndo}
          disabled={strokeCount === 0}
        >
          <Undo2 className="h-4 w-4 mr-1" />
          Undo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClear}
          disabled={strokeCount === 0}
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Xóa
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleOpenAsImage}
          disabled={strokeCount === 0}
        >
          <ExternalLink className="h-4 w-4 mr-1" />
          PNG
        </Button>
        {onAskAI && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAskAI}
            disabled={strokeCount === 0 || askAILoading}
          >
            <BotMessageSquare className="h-4 w-4 mr-1" />
            {askAILoading ? "Đang hỏi..." : "Hỏi AI"}
          </Button>
        )}
      </div>
    </div>
  );
}

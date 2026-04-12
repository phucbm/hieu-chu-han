/**
 * stroke.ts — Stroke animation wrapper for Hiểu Chữ Hán
 * Framework-agnostic. No React/Next.js imports.
 *
 * Wraps hanzi-writer library for reuse outside React context
 * (e.g. Zalo Mini App, vanilla JS).
 */

import HanziWriter from "hanzi-writer";

/** Default stroke animation configuration */
export const STROKE_CONFIG = {
  width: 140,
  height: 140,
  padding: 5,
  showOutline: true,
  strokeColor: "#1a1a1a",
  outlineColor: "#e5e7eb",
  drawingColor: "#ef4444",
  delayBetweenStrokes: 300,
  strokeAnimationSpeed: 1,
  radicalColor: "#ef4444",
} as const;

export type StrokeConfig = Partial<typeof STROKE_CONFIG> & {
  onLoadCharDataError?: () => void;
};

/**
 * Create a HanziWriter instance attached to a DOM element by ID.
 * Call .animateCharacter() to start animation.
 *
 * @param elementId - The DOM element ID to render into
 * @param character - The simplified Chinese character to draw
 * @param config    - Optional overrides for stroke config
 */
export function createStrokeWriter(
  elementId: string,
  character: string,
  config: StrokeConfig = {}
): HanziWriter {
  return HanziWriter.create(elementId, character, {
    ...STROKE_CONFIG,
    ...config,
  });
}

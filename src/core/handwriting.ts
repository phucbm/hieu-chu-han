/**
 * handwriting.ts — Web Worker lifecycle manager for hanzi_lookup WASM.
 * Framework-agnostic. Zero React/Next.js imports.
 * Reusable for Zalo Mini App port.
 *
 * Strokes are arrays of [x, y] coordinate pairs in raw canvas pixels.
 * The WASM library is scale-invariant and normalizes strokes internally.
 */

export type Candidate = { hanzi: string; score: number };

export class HandwritingRecognizer {
  private worker: Worker | null = null;
  private ready = false;
  /** Strokes queued before the worker signals ready. */
  private pendingLookup: number[][][] | null = null;
  private onResult: ((candidates: Candidate[]) => void) | null = null;

  /** Initialize the Web Worker and register the result callback. Call once on mount. */
  init(onResult: (candidates: Candidate[]) => void): void {
    this.onResult = onResult;
    this.worker = new Worker("/hanzi-worker.js");

    this.worker.onmessage = (e: MessageEvent<{ type: string; candidates?: Candidate[] }>) => {
      if (e.data.type === "ready") {
        this.ready = true;
        if (this.pendingLookup !== null) {
          this.worker!.postMessage({ strokes: this.pendingLookup });
          this.pendingLookup = null;
        }
      } else if (e.data.type === "result" && e.data.candidates) {
        this.onResult?.(e.data.candidates);
      }
    };
  }

  /**
   * Submit strokes for recognition (top 8 candidates returned via onResult callback).
   * If called before the worker is ready, the lookup is queued and fired once ready.
   * @param strokes Array of strokes; each stroke is an array of [x, y] pixel pairs.
   */
  lookup(strokes: number[][][]): void {
    if (!this.worker) return;
    if (!this.ready) {
      this.pendingLookup = strokes;
      return;
    }
    this.worker.postMessage({ strokes });
  }

  /** Terminate the Web Worker. Call on component unmount. */
  destroy(): void {
    this.worker?.terminate();
    this.worker = null;
    this.ready = false;
    this.pendingLookup = null;
    this.onResult = null;
  }
}

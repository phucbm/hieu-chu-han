/** Web Worker for hanzi handwriting recognition via hanzi_lookup WASM. */

importScripts("/hanzi_lookup.js");

wasm_bindgen("/hanzi_lookup_bg.wasm").then(() => {
  postMessage({ type: "ready" });
});

onmessage = (e) => {
  const { strokes } = e.data;
  const candidates = JSON.parse(wasm_bindgen.lookup(strokes, 8));
  postMessage({ type: "result", candidates });
};

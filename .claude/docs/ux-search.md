# Search & Handwriting UX — Hiểu Chữ Hán

## Opening the search dialog

- Click the Search button in the header, OR press **Cmd+K / Ctrl+K**
- Desktop (≥lg): two panels always visible side-by-side (60% text / 40% handwriting)
- Mobile (<lg): mode toggle at top switches between "Gõ tìm kiếm" and "Viết tay" panels

## Text search panel (left)

1. User types characters, pinyin, or Hán Việt into the plain input
2. **Nothing happens automatically** — no auto-search, no debounce
3. User clicks **Tìm** button or presses **Enter** → `searchWords(query)` fires → results list appears
4. Empty query → search button disabled, nothing happens
5. User clicks a result → `openWord(simp)` is called → dialog closes

## Handwriting panel (right)

1. User draws strokes on the canvas → `HandwritingRecognizer` sends strokes to WASM worker
2. Up to 8 candidate characters appear below the canvas
3. User clicks a candidate → the character is **appended** to the text input (e.g. 中 + 文 → "中文")
4. **No auto-search is triggered** — canvas stays as-is, dialog stays open
5. User can draw another character and append again, building a compound word
6. When ready, user clicks **Tìm** or presses **Enter** to search
7. **Undo** removes the last stroke; **Xóa** clears the entire canvas

## Multi-character / compound word behavior

When a multi-character string is searched (e.g. "中文" built via handwriting, or typed directly):

- `getWordEntries("中文")` calls `segmentWord()` which returns `["中文", "中", "文"]`
- `WordTabs` renders one tab per segment: full compound first, then individual chars
- If "中文" has no dictionary entry, that tab shows a "not found" state; the individual char tabs still work
- This means any string the user builds — even one with no combined meaning — will always show usable results for each character

## What does NOT happen automatically

- No search on keystroke
- No search on candidate click
- No canvas clear after candidate click
- No input clear after search
- No results cleared when query changes (results from last search stay until next search or dialog close)

# Hiểu Chữ Hán — Architecture

## What the app does

Từ điển offline Trung - Hán Việt, phân tích chữ Hán, bộ thủ. The user types a Chinese word or pinyin; the app returns:
- Vietnamese meaning (from CVDICT)
- Sino-Vietnamese reading (from Unicode Unihan kVietnamese)
- English definitions, HSK level, frequency stats (from chinese-lexicon / CC-CEDICT)
- Character stroke animation (hanzi-writer → CDN)
- Etymology breakdown for single characters
- Related/compound words

Live at: **hieuchuhan.phucbm.com**

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript strict |
| Styling | Tailwind v4 (`@theme inline`), shadcn/ui components |
| PWA | Serwist (`@serwist/next`) — service worker in `src/app/sw.ts` |
| Data | Static JSON served from `public/data/dictionary.json` |
| Deploy | Vercel (static export, `output: 'export'`) |

## Key architectural decision: static dictionary

`chinese-lexicon` is a Node.js-only package (CommonJS `require`). To run fully client-side:

1. **`scripts/build-dictionary.ts`** — run once locally to generate `public/data/dictionary.json` (28 MB, 116K entries enriched with CVDICT + kVietnamese). Committed to the repo.
2. **`src/core/client-dictionary.ts`** — fetches the JSON lazily on first search, builds in-memory indices, implements `lookupWord()` and `getWordDetail()`.
3. **`src/app/actions.ts`** — thin wrappers around `client-dictionary` with the same async signatures used throughout the app (`suggestWords`, `searchWords`, `getWordEntries`).

## Data sources

| File | Origin | Content |
|---|---|---|
| `public/data/dictionary.json` | Built by `scripts/build-dictionary.ts` | All entries: simp/trad, pinyin, EN defs, VI meaning, Sino-Viet, etymology, stats |
| `src/data/cvdict.json` | Parsed from `CVDICT.u8` by `scripts/parse-cvdict.ts` | Vietnamese meanings, keyed by simplified char |
| `src/data/kVietnamese.json` | Unicode Unihan 12.1 | Sino-Vietnamese readings, keyed by char |
| `node_modules/chinese-lexicon` | CC-CEDICT + Outlier Linguistics | EN defs, pinyin, etymology, HSK, frequency |

## Layout (desktop ≥1024px)

```
┌──────────────┬──────────────────────────┬────────────────┐
│  AppSidebar  │         <main>           │ RecentViewed   │
│  w-80 fixed  │  pl-80 pr-72 scrollable  │ Panel w-72     │
│  left-0      │                          │ fixed right-0  │
│              │                          │                │
│  Logo        │  WordTabs                │  ViewedWord    │
│  SearchInput │  (CharCard + tabs)       │  List          │
│  Results     │                          │  (WordRows)    │
│  RecentSearch│                          │                │
└──────────────┴──────────────────────────┴────────────────┘
```

## Layout (mobile <1024px)

```
┌────────────────────────────┐
│  AppHeader (sticky)        │  — hamburger opens HistorySheet
├────────────────────────────┤
│  SearchInput + RecentSearch│  — sticky below header
│  SuggestionBox (overlay)   │
├────────────────────────────┤
│  <main> (scrollable)       │
│  WordTabs                  │
└────────────────────────────┘
         HistorySheet ──► slides from right (overlay)
```

## Component tree

```
app/
  layout.tsx          — fonts, metadata (version in title), SwAutoUpdate
  page.tsx            — all state lives here; openWord() is the single navigation handler
  actions.ts          — searchWords / suggestWords / getWordEntries (async, client-side)
  sw.ts               — Serwist service worker (skipWaiting + clientsClaim → silent auto-update)

components/
  layout/
    AppSidebar        — desktop left column
    AppHeader         — mobile top bar
    RecentViewedPanel — desktop right column
    ViewedWordList    — shared WordRow list (used by panel + sheet)
    HistoryBottomSheet— mobile right-side sheet (wraps ViewedWordList)
  search/
    SearchInput       — controlled input, Escape + clear button
    SuggestionBox     — mobile floating dropdown (top 10, focus-gated)
    WordRow           — generic row: simp + trad + pinyin + vi + 👁N + ✕ on hover
    RecentSearch      — badge row for recent search append
  word/
    WordTabs          — tab strip: compound word → one tab per char
    CharCard          — main character card: pinyin, Sino-Viet, VI/EN defs, stats
    EtymologyView     — component breakdown diagram
    StrokeAnimation   — hanzi-writer canvas
    RelatedWords      — topWords chip list
  shared/
    WordBadge         — compact simp+pinyin chip

core/
  client-dictionary   — lazy-load dictionary.json, search + lookup
  dictionary.ts       — server-side version (not used at runtime, kept for reference)
  segmenter.ts        — isCompound(), segmentWord() — splits compounds into chars
  types.ts            — WordEntry, WordSummary, ViewedWord, etc.

hooks/
  useViewedWords      — localStorage persistence (hch_viewed_words), viewedAt[] for count
```

## Search flow

1. User types → 600ms debounce → `searchWords(query)` → `lookupWord()` → substring + pinyin match → sorted by `boost × relevance`
2. Desktop: results shown inline below search input (always visible when query has value)
3. Mobile: top-10 shown in `SuggestionBox` dropdown (only while input is focused)
4. Click result / badge → `openWord(simp)` → `getWordEntries(simp)` → `WordTabs`

## Viewed words flow

`openWord(simp)` → `addViewedWord()` → `hch_viewed_words` in localStorage → `viewedAt[]` grows on each view → `viewedAt.length` is the view count shown in `WordRow`.

## PWA / offline

- Service worker pre-caches all static assets at install time (Serwist precache)
- `dictionary.json` cached with CacheFirst strategy after first load
- hanzi-writer stroke data (CDN) cached with StaleWhileRevalidate
- On new deploy: new SW skips waiting, claims clients, `controllerchange` fires → `SwAutoUpdate` calls `window.location.reload()` — silent, automatic

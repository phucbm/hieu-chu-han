# Hiểu Chữ Hán

**Từ điển Hán Việt** — a Chinese–Vietnamese dictionary PWA.

Live: **[hieuchuhan.vercel.app](https://hieuchuhan.vercel.app)**

---

## What it does

Type a Chinese character, compound word, or pinyin — the app instantly shows:

- Vietnamese meaning
- Sino-Vietnamese (Hán Việt) reading
- English definitions
- Character stroke order animation
- Etymology (component breakdown)
- Related / compound words
- HSK level and frequency stats

Installable as a PWA. Works offline after first visit. Auto-updates silently on new deploys.

---

## Data sources

| Source | What it provides |
|---|---|
| [CC-CEDICT](https://cc-cedict.org) via [chinese-lexicon](https://github.com/mwdchang/chinese-lexicon) | English definitions, pinyin, etymology, HSK level, frequency |
| [CVDICT](https://github.com/ph0ngp/CVDICT) by ph0ngp | Vietnamese meanings |
| [Unicode Unihan](https://unicode.org/charts/unihan.html) (kVietnamese) | Sino-Vietnamese readings |
| [hanzi-writer](https://hanziwriter.org) | Stroke order animations |

---

## Dev setup

```bash
npm install
npm run dev
```

The dictionary data (`public/data/dictionary.json`) is pre-built and committed. Only regenerate it if the source data changes:

```bash
npm run build:dict
```

---

For codebase details — component structure, data flow, layout, PWA behaviour — see [ARCHITECTURE.md](./ARCHITECTURE.md).

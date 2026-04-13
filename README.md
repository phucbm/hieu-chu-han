# Hiểu Chữ Hán

Từ điển offline Trung - Hán Việt, phân tích chữ Hán, bộ thủ.

Live: **[hieuchuhan.phucbm.com](https://hieuchuhan.phucbm.com)**

---

## Câu chuyện

Là người Việt học chữ Hán, mình nhận ra rằng để nhớ lâu, không thể chỉ học thuộc lòng, mà cần **hiểu** chữ đó được tạo thành từ những thành phần nào, mang ý nghĩa gì. Hầu hết ứng dụng từ điển chỉ dừng lại ở việc dịch nghĩa, chưa chú trọng đến việc giúp người học thực sự **hiểu** cấu trúc của chữ.

Vì vậy mình xây dựng ứng dụng này với trọng tâm là phân tích chữ Hán: từ bộ thủ, tự nguyên, đến chữ truyền thống (giúp thấy rõ nguồn gốc hơn). Bên cạnh đó vẫn có đầy đủ tính năng cơ bản: hoạt ảnh nét bút, nhận dạng chữ viết tay. Với người Việt, âm Hán Việt còn là một "chìa khóa" giúp ghi nhớ dễ hơn, và tất nhiên không thể thiếu trong ứng dụng này.

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
| [makemeahanzi](https://github.com/skishore/makemeahanzi) | Character decomposition, etymology fallback |
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

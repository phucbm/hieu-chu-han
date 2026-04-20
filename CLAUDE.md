# Hiểu Chữ Hán

## Commands
- Dev: `npm run dev`
- Build: `npm run build`
- Build dictionary: `npm run build:dict` (only when source data changes)

## Rules
- Next.js 16 has breaking changes vs 13–15. Read `node_modules/next/dist/docs/` before writing any Next.js code; heed deprecation notices.
- Static export (`output: 'export'`) — no server runtime, no API routes, no `headers()`/`cookies()` in RSC.
- `chinese-lexicon` is Node.js-only (CommonJS). Never import it client-side. All dictionary access goes through `src/core/client-dictionary.ts`.
- `public/data/dictionary.json` (28 MB, 116K entries) is pre-built and committed. Do not regenerate unless source data changes.
- Serwist SW (`src/app/sw.ts`): requires `disable: process.env.NODE_ENV === 'development'` in next.config to avoid SW interference in dev.
- `kVietnamese` values in `src/data/kVietnamese.json` are raw Unicode Unihan — space-separated readings per codepoint key (e.g. `"U+4E2D": "trung"`).
- AI (GROQ) is opt-in, enabled only when `NEXT_PUBLIC_GROQ_API_KEY` is set. Rate limit tracked in Dexie `aiUsageLog` table (default 30 calls/24h).

@.claude/docs/architecture.md
@.claude/docs/agents.md

# AI Layer — Hiểu Chữ Hán

## Provider
- GROQ via OpenAI-compatible API (`https://api.groq.com/openai/v1/chat/completions`)
- Default model: `llama-3.1-8b-instant` (override via `GROQ_MODEL`)
- Stream: SSE, temperature: 0, max_tokens: 16384

## Entry point
`src/lib/groq.ts` — `streamWordAnalysis(simp, trad?)` returns `AsyncGenerator<string>`, proxied via `POST /api/ai/stream`

Prompt template loaded server-side from `public/prompts/word-analysis.md` via `fs.readFile`.
Placeholders: `{{simp}}`, `{{trad}}`, `{{trad_line}}`

## Rate limiting
`src/lib/aiRateLimit.ts` — daily per-device cap stored in Dexie (`aiUsageLog` table, `src/lib/db.ts`).
Default: 30 calls/24h (override via `NEXT_PUBLIC_AI_DAILY_LIMIT`).
Key functions: `getRemainingCalls()`, `recordAiCall()`, `getResetAt()`

## Usage tracking
`src/components/PWATracker.tsx` — tracks AI explanation calls via counterapi.dev (anonymous hit counter, no user data).

## Env vars
- `GROQ_API_KEY` — server-side only; route returns 503 if unset
- `GROQ_MODEL` — server-side only; optional model override
- `NEXT_PUBLIC_AI_DAILY_LIMIT` — client-side daily limit override (default 30)

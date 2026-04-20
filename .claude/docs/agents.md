# AI Layer — Hiểu Chữ Hán

## Provider
- GROQ via OpenAI-compatible API (`https://api.groq.com/openai/v1/chat/completions`)
- Default model: `llama-3.1-8b-instant` (override via `NEXT_PUBLIC_GROQ_MODEL`)
- Stream: SSE, temperature: 0, max_tokens: 16384

## Entry point
`src/lib/groq.ts` — `streamWordAnalysis(simp, trad?)` returns `AsyncGenerator<string>`

Prompt template loaded at runtime via `fetch('/prompts/word-analysis.md')` — not a static import.
Placeholders: `{{simp}}`, `{{trad}}`, `{{trad_line}}`

## Rate limiting
`src/lib/aiRateLimit.ts` — daily per-device cap stored in Dexie (`aiUsageLog` table, `src/lib/db.ts`).
Default: 30 calls/24h (override via `NEXT_PUBLIC_AI_DAILY_LIMIT`).
Key functions: `getRemainingCalls()`, `recordAiCall()`, `getResetAt()`

## Usage tracking
`src/components/PWATracker.tsx` — tracks AI explanation calls via counterapi.dev (anonymous hit counter, no user data).

## Env vars
- `NEXT_PUBLIC_GROQ_API_KEY` — required; feature disabled if unset
- `NEXT_PUBLIC_GROQ_MODEL` — optional model override
- `NEXT_PUBLIC_AI_DAILY_LIMIT` — optional daily limit override (default 30)

All vars are `NEXT_PUBLIC_` — exposed to the client bundle. No server-side secret handling.

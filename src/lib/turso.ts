import { createClient } from "@libsql/client";

// Singleton client — reused across server action invocations in the same process.
// Returns null when env vars are not configured (dev without Turso set up).
function createTursoClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) return null;
  return createClient({ url, authToken });
}

export const db = createTursoClient();

/** Ensures the viewed_words table exists. Call once at app startup or in a migration. */
export async function initSchema() {
  if (!db) return;
  await db.execute(`
    CREATE TABLE IF NOT EXISTS viewed_words (
      user_id        TEXT NOT NULL,
      simp           TEXT NOT NULL,
      trad           TEXT,
      pinyin         TEXT,
      sino_viet      TEXT,
      entry_json     TEXT,
      first_viewed_at TEXT NOT NULL,
      last_viewed_at  TEXT NOT NULL,
      viewed_at_json  TEXT NOT NULL DEFAULT '[]',
      PRIMARY KEY (user_id, simp)
    )
  `);
}

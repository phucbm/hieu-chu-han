import { createClient } from "@libsql/client";

function createTursoClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;
  if (!url || !authToken) return null;
  return createClient({ url, authToken });
}

export const db = createTursoClient();

// Run once per process — no-ops on subsequent cold starts thanks to IF NOT EXISTS / IF EXISTS
export async function initSchema() {
  if (!db) return;
  // Drop old table from initial implementation
  await db.execute(`DROP TABLE IF EXISTS viewed_words`);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS user_words (
      id              TEXT PRIMARY KEY,
      user_id         TEXT NOT NULL,
      simp            TEXT NOT NULL,
      view_count      INTEGER NOT NULL DEFAULT 1,
      first_viewed_at TEXT NOT NULL,
      last_viewed_at  TEXT NOT NULL,
      UNIQUE (user_id, simp)
    )
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ai_explanations (
      simp         TEXT NOT NULL,
      user_id      TEXT NOT NULL,
      content      TEXT NOT NULL,
      model        TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      PRIMARY KEY (simp, user_id)
    )
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_ai_explanations_simp_generated
    ON ai_explanations(simp, generated_at DESC)
  `);
  await db.execute(`
    CREATE TABLE IF NOT EXISTS ai_usage_log (
      id         TEXT PRIMARY KEY,
      user_id    TEXT NOT NULL,
      called_at  TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_ai_usage_log_user_called
    ON ai_usage_log(user_id, called_at)
  `);
}

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

  // Extend user_words with notebook columns.
  // libSQL does not support `ADD COLUMN IF NOT EXISTS` — check via PRAGMA first.
  const tableInfo = await db.execute(`PRAGMA table_info(user_words)`);
  const existingCols = new Set(
    tableInfo.rows.map((r) => (r as Record<string, unknown>).name as string)
  );
  for (const [col, def] of [
    ["group_ids",    "TEXT DEFAULT '[]'"],
    ["note",         "TEXT"],
    ["custom_links", "TEXT DEFAULT '[]'"],
  ] as [string, string][]) {
    if (!existingCols.has(col)) {
      await db.execute(`ALTER TABLE user_words ADD COLUMN ${col} ${def}`);
    }
  }

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

  // ── Notebook tables ────────────────────────────────────────────────────────
  await db.execute(`
    CREATE TABLE IF NOT EXISTS notebook_groups (
      id          TEXT PRIMARY KEY,
      user_id     TEXT NOT NULL,
      title       TEXT NOT NULL,
      description TEXT,
      type        TEXT NOT NULL DEFAULT 'manual',
      sort_order  INTEGER DEFAULT 0,
      created_at  TEXT NOT NULL,
      updated_at  TEXT NOT NULL
    )
  `);
  await db.execute(`
    CREATE INDEX IF NOT EXISTS idx_notebook_groups_user
    ON notebook_groups(user_id, sort_order)
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS notebook_lyrics (
      id             TEXT PRIMARY KEY,
      group_id       TEXT NOT NULL UNIQUE REFERENCES notebook_groups(id) ON DELETE CASCADE,
      content        TEXT NOT NULL,
      youtube_url    TEXT,
      translation    TEXT,
      translated_at  TEXT,
      auto_extract   INTEGER DEFAULT 0,
      created_at     TEXT NOT NULL,
      updated_at     TEXT NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS word_etymology_links (
      word                 TEXT PRIMARY KEY,
      etymological_related TEXT DEFAULT '[]',
      created_at           TEXT NOT NULL,
      updated_at           TEXT NOT NULL
    )
  `);
}

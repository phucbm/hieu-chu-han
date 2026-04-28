"use server";

import { auth } from "@clerk/nextjs/server";
import { db, initSchema } from "@/lib/turso";
import type { ViewedWord } from "@/hooks/useViewedWords";

// ── Schema init guard (once per process) ─────────────────────────────────────

let schemaReady = false;

async function ready(): Promise<boolean> {
  if (!db) return false;
  if (!schemaReady) {
    await initSchema();
    schemaReady = true;
  }
  return true;
}

// ── Row → ViewedWord ──────────────────────────────────────────────────────────

function toViewedWord(row: Record<string, unknown>): ViewedWord {
  return {
    id: row.id as string,
    simp: row.simp as string,
    viewCount: row.view_count as number,
    firstViewedAt: row.first_viewed_at as string,
    lastViewedAt: row.last_viewed_at as string,
  };
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function getViewedWords(): Promise<ViewedWord[]> {
  const { userId } = await auth();
  if (!userId || !(await ready())) return [];

  const result = await db!.execute({
    sql: "SELECT * FROM user_words WHERE user_id = ? ORDER BY last_viewed_at DESC",
    args: [userId],
  });

  return result.rows.map((r) => toViewedWord(r as Record<string, unknown>));
}

export async function upsertViewedWord(simp: string): Promise<ViewedWord | null> {
  const { userId } = await auth();
  if (!userId || !(await ready())) return null;

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  const result = await db!.execute({
    sql: `
      INSERT INTO user_words (id, user_id, simp, view_count, first_viewed_at, last_viewed_at)
      VALUES (?, ?, ?, 1, ?, ?)
      ON CONFLICT(user_id, simp) DO UPDATE SET
        view_count     = view_count + 1,
        last_viewed_at = excluded.last_viewed_at
      RETURNING *
    `,
    args: [id, userId, simp, now, now],
  });

  return result.rows[0]
    ? toViewedWord(result.rows[0] as Record<string, unknown>)
    : null;
}

export async function removeViewedWord(simp: string): Promise<void> {
  const { userId } = await auth();
  if (!userId || !(await ready())) return;

  await db!.execute({
    sql: "DELETE FROM user_words WHERE user_id = ? AND simp = ?",
    args: [userId, simp],
  });
}

export async function clearViewedWords(): Promise<void> {
  const { userId } = await auth();
  if (!userId || !(await ready())) return;

  await db!.execute({
    sql: "DELETE FROM user_words WHERE user_id = ?",
    args: [userId],
  });
}

/**
 * Bulk-upsert localStorage words into Turso on first sign-in.
 * On conflict: keeps highest view_count, earliest first_viewed_at, latest last_viewed_at.
 */
export async function mergeViewedWords(
  localWords: ViewedWord[]
): Promise<ViewedWord[]> {
  const { userId } = await auth();
  if (!userId || !(await ready()) || localWords.length === 0) return [];

  await db!.batch(
    localWords.map((word) => ({
      sql: `
        INSERT INTO user_words (id, user_id, simp, view_count, first_viewed_at, last_viewed_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, simp) DO UPDATE SET
          view_count      = MAX(view_count, excluded.view_count),
          first_viewed_at = MIN(first_viewed_at, excluded.first_viewed_at),
          last_viewed_at  = MAX(last_viewed_at, excluded.last_viewed_at)
      `,
      args: [
        crypto.randomUUID(),
        userId,
        word.simp,
        word.viewCount,
        word.firstViewedAt,
        word.lastViewedAt,
      ],
    })),
    "write"
  );

  return getViewedWords();
}

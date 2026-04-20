"use server";

import { auth } from "@clerk/nextjs/server";
import { db, initSchema } from "@/lib/turso";
import type { ViewedWord } from "@/hooks/useViewedWords";

// ── Helpers ───────────────────────────────────────────────────────────────────

function rowToViewedWord(row: Record<string, unknown>): ViewedWord {
  return {
    simp: row.simp as string,
    trad: (row.trad as string) || undefined,
    pinyin: (row.pinyin as string) || undefined,
    sinoViet: (row.sino_viet as string) || undefined,
    entry: row.entry_json ? JSON.parse(row.entry_json as string) : undefined,
    firstViewedAt: row.first_viewed_at as string,
    lastViewedAt: row.last_viewed_at as string,
    viewedAt: JSON.parse((row.viewed_at_json as string) || "[]"),
  };
}

async function ready() {
  if (!db) return false;
  await initSchema();
  return true;
}

// ── Actions ───────────────────────────────────────────────────────────────────

export async function getViewedWords(): Promise<ViewedWord[]> {
  const { userId } = await auth();
  if (!userId || !(await ready())) return [];

  const result = await db!.execute({
    sql: "SELECT * FROM viewed_words WHERE user_id = ? ORDER BY last_viewed_at DESC",
    args: [userId],
  });

  return result.rows.map((r) => rowToViewedWord(r as Record<string, unknown>));
}

export async function upsertViewedWord(
  item: Omit<ViewedWord, "firstViewedAt" | "lastViewedAt" | "viewedAt">
): Promise<ViewedWord | null> {
  const { userId } = await auth();
  if (!userId || !(await ready())) return null;

  const now = new Date().toISOString();

  // Fetch existing to preserve firstViewedAt and append to viewedAt
  const existing = await db!.execute({
    sql: "SELECT first_viewed_at, viewed_at_json FROM viewed_words WHERE user_id = ? AND simp = ?",
    args: [userId, item.simp],
  });

  const firstViewedAt =
    existing.rows.length > 0
      ? (existing.rows[0].first_viewed_at as string)
      : now;
  const prevViewedAt: string[] =
    existing.rows.length > 0
      ? JSON.parse((existing.rows[0].viewed_at_json as string) || "[]")
      : [];
  const viewedAt = [...prevViewedAt, now];

  await db!.execute({
    sql: `
      INSERT INTO viewed_words
        (user_id, simp, trad, pinyin, sino_viet, entry_json, first_viewed_at, last_viewed_at, viewed_at_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, simp) DO UPDATE SET
        trad           = excluded.trad,
        pinyin         = excluded.pinyin,
        sino_viet      = excluded.sino_viet,
        entry_json     = excluded.entry_json,
        last_viewed_at = excluded.last_viewed_at,
        viewed_at_json = excluded.viewed_at_json
    `,
    args: [
      userId,
      item.simp,
      item.trad ?? null,
      item.pinyin ?? null,
      item.sinoViet ?? null,
      item.entry ? JSON.stringify(item.entry) : null,
      firstViewedAt,
      now,
      JSON.stringify(viewedAt),
    ],
  });

  return {
    ...item,
    firstViewedAt,
    lastViewedAt: now,
    viewedAt,
  };
}

export async function removeViewedWord(simp: string): Promise<void> {
  const { userId } = await auth();
  if (!userId || !(await ready())) return;

  await db!.execute({
    sql: "DELETE FROM viewed_words WHERE user_id = ? AND simp = ?",
    args: [userId, simp],
  });
}

export async function clearViewedWords(): Promise<void> {
  const { userId } = await auth();
  if (!userId || !(await ready())) return;

  await db!.execute({
    sql: "DELETE FROM viewed_words WHERE user_id = ?",
    args: [userId],
  });
}

/**
 * Bulk-upsert local words into Turso on first sign-in.
 * For conflicts: keeps the higher view count (more viewed wins).
 */
export async function mergeViewedWords(
  localWords: ViewedWord[]
): Promise<ViewedWord[]> {
  const { userId } = await auth();
  if (!userId || !(await ready()) || localWords.length === 0) return [];

  for (const word of localWords) {
    const existing = await db!.execute({
      sql: "SELECT first_viewed_at, viewed_at_json FROM viewed_words WHERE user_id = ? AND simp = ?",
      args: [userId, word.simp],
    });

    let firstViewedAt = word.firstViewedAt;
    let viewedAt = word.viewedAt;

    if (existing.rows.length > 0) {
      const remoteViewedAt: string[] = JSON.parse(
        (existing.rows[0].viewed_at_json as string) || "[]"
      );
      // Merge viewedAt arrays, deduplicate, sort
      const merged = Array.from(
        new Set([...remoteViewedAt, ...word.viewedAt])
      ).sort();
      viewedAt = merged;
      // Keep the earliest firstViewedAt
      const remoteFirst = existing.rows[0].first_viewed_at as string;
      firstViewedAt =
        remoteFirst < word.firstViewedAt ? remoteFirst : word.firstViewedAt;
    }

    const lastViewedAt = viewedAt[viewedAt.length - 1] ?? word.lastViewedAt;

    await db!.execute({
      sql: `
        INSERT INTO viewed_words
          (user_id, simp, trad, pinyin, sino_viet, entry_json, first_viewed_at, last_viewed_at, viewed_at_json)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, simp) DO UPDATE SET
          trad           = excluded.trad,
          pinyin         = excluded.pinyin,
          sino_viet      = excluded.sino_viet,
          entry_json     = excluded.entry_json,
          first_viewed_at = excluded.first_viewed_at,
          last_viewed_at = excluded.last_viewed_at,
          viewed_at_json = excluded.viewed_at_json
      `,
      args: [
        userId,
        word.simp,
        word.trad ?? null,
        word.pinyin ?? null,
        word.sinoViet ?? null,
        word.entry ? JSON.stringify(word.entry) : null,
        firstViewedAt,
        lastViewedAt,
        JSON.stringify(viewedAt),
      ],
    });
  }

  return getViewedWords();
}

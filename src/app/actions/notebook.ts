"use server";

import { auth } from "@clerk/nextjs/server";
import { db, initSchema } from "@/lib/turso";
import { getEntries } from "chinese-lexicon";
import { generateSlug } from "@/lib/slugify";
import type { NotebookGroup, NotebookLyrics, UserWordExtended, WordEtymologyLinks } from "@/core/notebook-types";

let schemaReady = false;

async function ready(): Promise<boolean> {
  if (!db) return false;
  if (!schemaReady) {
    await initSchema();
    schemaReady = true;
  }
  return true;
}

// ── Row mappers ───────────────────────────────────────────────────────────────

function toGroup(row: Record<string, unknown>): NotebookGroup {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    title: row.title as string,
    description: (row.description as string | null) ?? undefined,
    type: (row.type as "manual" | "lyrics") ?? "manual",
    sortOrder: row.sort_order as number,
    slug: (row.slug as string | null) ?? (row.id as string),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function toLyrics(row: Record<string, unknown>): NotebookLyrics {
  return {
    id: row.id as string,
    groupId: row.group_id as string,
    content: row.content as string,
    youtubeUrl: (row.youtube_url as string | null) ?? undefined,
    translation: (row.translation as string | null) ?? undefined,
    translatedAt: (row.translated_at as string | null) ?? undefined,
    autoExtract: row.auto_extract === 1,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

function toUserWordExtended(row: Record<string, unknown>): UserWordExtended {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    simp: row.simp as string,
    viewCount: row.view_count as number,
    firstViewedAt: row.first_viewed_at as string,
    lastViewedAt: row.last_viewed_at as string,
    groupIds: JSON.parse((row.group_ids as string | null) ?? "[]") as string[],
    note: (row.note as string | null) ?? undefined,
    customLinks: JSON.parse((row.custom_links as string | null) ?? "[]") as string[],
  };
}

function parseJsonArray(value: unknown): string[] {
  try {
    const parsed = JSON.parse((value as string | null) ?? "[]");
    return Array.isArray(parsed) ? (parsed as string[]) : [];
  } catch {
    return [];
  }
}

// ── Group CRUD ────────────────────────────────────────────────────────────────

/** Resolve a slug (or UUID fallback for old rows) to a group owned by the current user. */
export async function getGroupBySlug(slug: string): Promise<NotebookGroup | null> {
  const { userId } = await auth();
  if (!userId || !(await ready())) return null;

  const result = await db!.execute({
    sql: "SELECT * FROM notebook_groups WHERE (slug = ? OR id = ?) AND user_id = ? LIMIT 1",
    args: [slug, slug, userId],
  });

  return result.rows[0] ? toGroup(result.rows[0] as Record<string, unknown>) : null;
}

export async function getGroups(): Promise<NotebookGroup[]> {
  const { userId } = await auth();
  if (!userId || !(await ready())) return [];

  const result = await db!.execute({
    sql: "SELECT * FROM notebook_groups WHERE user_id = ? ORDER BY sort_order ASC, created_at ASC",
    args: [userId],
  });

  return result.rows.map((r) => toGroup(r as Record<string, unknown>));
}

export async function createGroup(
  title: string,
  description?: string,
  type: "manual" | "lyrics" = "manual"
): Promise<NotebookGroup | null> {
  const { userId } = await auth();
  if (!userId || !(await ready())) return null;

  const now = new Date().toISOString();
  const id = crypto.randomUUID();
  const slug = generateSlug(title);

  const maxResult = await db!.execute({
    sql: "SELECT MAX(sort_order) as max_order FROM notebook_groups WHERE user_id = ?",
    args: [userId],
  });
  const maxOrder = ((maxResult.rows[0] as Record<string, unknown>).max_order as number | null) ?? -1;

  await db!.execute({
    sql: `INSERT INTO notebook_groups (id, user_id, title, description, type, sort_order, slug, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, userId, title.trim(), description?.trim() ?? null, type, maxOrder + 1, slug, now, now],
  });

  const result = await db!.execute({
    sql: "SELECT * FROM notebook_groups WHERE id = ?",
    args: [id],
  });

  return result.rows[0] ? toGroup(result.rows[0] as Record<string, unknown>) : null;
}

export async function updateGroup(
  groupId: string,
  title: string,
  description?: string
): Promise<void> {
  const { userId } = await auth();
  if (!userId || !(await ready())) return;

  await db!.execute({
    sql: "UPDATE notebook_groups SET title = ?, description = ?, updated_at = ? WHERE id = ? AND user_id = ?",
    args: [title.trim(), description?.trim() ?? null, new Date().toISOString(), groupId, userId],
  });
}

export async function deleteGroup(groupId: string): Promise<void> {
  const { userId } = await auth();
  if (!userId || !(await ready())) return;

  await db!.execute({
    sql: "DELETE FROM notebook_groups WHERE id = ? AND user_id = ?",
    args: [groupId, userId],
  });

  // Remove this groupId from all user_words
  const words = await db!.execute({
    sql: "SELECT id, group_ids FROM user_words WHERE user_id = ?",
    args: [userId],
  });
  for (const row of words.rows) {
    const r = row as Record<string, unknown>;
    const ids = parseJsonArray(r.group_ids);
    if (ids.includes(groupId)) {
      const updated = ids.filter((id) => id !== groupId);
      await db!.execute({
        sql: "UPDATE user_words SET group_ids = ? WHERE id = ?",
        args: [JSON.stringify(updated), r.id as string],
      });
    }
  }
}

export async function reorderGroups(orderedIds: string[]): Promise<void> {
  const { userId } = await auth();
  if (!userId || !(await ready())) return;

  const now = new Date().toISOString();
  for (let i = 0; i < orderedIds.length; i++) {
    await db!.execute({
      sql: "UPDATE notebook_groups SET sort_order = ?, updated_at = ? WHERE id = ? AND user_id = ?",
      args: [i, now, orderedIds[i], userId],
    });
  }
}

// ── Word management ───────────────────────────────────────────────────────────

export async function addWordToGroup(groupId: string, simp: string): Promise<void> {
  const { userId } = await auth();
  if (!userId || !(await ready())) return;

  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  // Upsert user_words row
  await db!.execute({
    sql: `INSERT INTO user_words (id, user_id, simp, view_count, first_viewed_at, last_viewed_at, group_ids, note, custom_links)
          VALUES (?, ?, ?, 0, ?, ?, '[]', NULL, '[]')
          ON CONFLICT(user_id, simp) DO NOTHING`,
    args: [id, userId, simp, now, now],
  });

  // Append groupId to group_ids if not already present
  const result = await db!.execute({
    sql: "SELECT id, group_ids FROM user_words WHERE user_id = ? AND simp = ?",
    args: [userId, simp],
  });
  if (!result.rows[0]) return;

  const row = result.rows[0] as Record<string, unknown>;
  const ids = parseJsonArray(row.group_ids);
  if (!ids.includes(groupId)) {
    ids.push(groupId);
    await db!.execute({
      sql: "UPDATE user_words SET group_ids = ? WHERE id = ?",
      args: [JSON.stringify(ids), row.id as string],
    });
  }

  // Auto-compute etymology links for this word if not yet stored
  void getOrCreateEtymologyLinks(simp);
}

export async function removeWordFromGroup(groupId: string, simp: string): Promise<void> {
  const { userId } = await auth();
  if (!userId || !(await ready())) return;

  const result = await db!.execute({
    sql: "SELECT id, group_ids FROM user_words WHERE user_id = ? AND simp = ?",
    args: [userId, simp],
  });
  if (!result.rows[0]) return;

  const row = result.rows[0] as Record<string, unknown>;
  const ids = parseJsonArray(row.group_ids).filter((id) => id !== groupId);
  await db!.execute({
    sql: "UPDATE user_words SET group_ids = ? WHERE id = ?",
    args: [JSON.stringify(ids), row.id as string],
  });
}

export interface GroupWord {
  userWord: UserWordExtended;
  hskLevel?: number;
  etymologySuggestions: string[];
}

export async function getGroupWords(groupId: string): Promise<GroupWord[]> {
  const { userId } = await auth();
  if (!userId || !(await ready())) return [];

  const result = await db!.execute({
    sql: `SELECT * FROM user_words WHERE user_id = ? AND JSON_EXTRACT(group_ids, '$') LIKE ?`,
    args: [userId, `%${groupId}%`],
  });

  const userSimpSet = new Set<string>();
  const rows = result.rows.map((r) => {
    const uw = toUserWordExtended(r as Record<string, unknown>);
    userSimpSet.add(uw.simp);
    return uw;
  });

  const filtered = rows.filter((uw) => uw.groupIds.includes(groupId));

  const groupWords: GroupWord[] = [];
  for (const uw of filtered) {
    // HSK level from chinese-lexicon (server-side)
    let hskLevel: number | undefined;
    try {
      const entries = getEntries(uw.simp);
      hskLevel = entries[0]?.statistics?.hskLevel ?? undefined;
    } catch {
      // word not in lexicon
    }

    // Etymology suggestions: related words that are also in user's user_words
    let etymologySuggestions: string[] = [];
    const etymLinks = await db!.execute({
      sql: "SELECT etymological_related FROM word_etymology_links WHERE word = ?",
      args: [uw.simp],
    });
    if (etymLinks.rows[0]) {
      const related = parseJsonArray((etymLinks.rows[0] as Record<string, unknown>).etymological_related);
      etymologySuggestions = related.filter((w) => userSimpSet.has(w) && w !== uw.simp);
    }

    groupWords.push({ userWord: uw, hskLevel, etymologySuggestions });
  }

  return groupWords;
}

export async function updateWordNote(simp: string, note: string): Promise<void> {
  const { userId } = await auth();
  if (!userId || !(await ready())) return;

  await db!.execute({
    sql: "UPDATE user_words SET note = ? WHERE user_id = ? AND simp = ?",
    args: [note.trim() || null, userId, simp],
  });
}

// ── Etymology links ───────────────────────────────────────────────────────────

export async function getOrCreateEtymologyLinks(word: string): Promise<WordEtymologyLinks | null> {
  if (!(await ready())) return null;

  const existing = await db!.execute({
    sql: "SELECT * FROM word_etymology_links WHERE word = ?",
    args: [word],
  });
  if (existing.rows[0]) {
    const r = existing.rows[0] as Record<string, unknown>;
    return {
      word: r.word as string,
      etymologicalRelated: parseJsonArray(r.etymological_related),
      createdAt: r.created_at as string,
      updatedAt: r.updated_at as string,
    };
  }

  // Compute related words from etymology components via chinese-lexicon
  const related: string[] = [];
  try {
    const entries = getEntries(word);
    for (const entry of entries) {
      const components = entry.simpEtymology?.components ?? [];
      for (const comp of components) {
        if (comp.char && comp.char !== word) related.push(comp.char);
      }
      // Also include compound words that share characters
      const topWords = entry.statistics?.topWords ?? [];
      for (const tw of topWords.slice(0, 10)) {
        if (tw.word && tw.word !== word) related.push(tw.word);
      }
    }
  } catch {
    // word not in lexicon — store empty array
  }

  const deduped = [...new Set(related)];
  const now = new Date().toISOString();

  await db!.execute({
    sql: `INSERT INTO word_etymology_links (word, etymological_related, created_at, updated_at)
          VALUES (?, ?, ?, ?)
          ON CONFLICT(word) DO NOTHING`,
    args: [word, JSON.stringify(deduped), now, now],
  });

  return { word, etymologicalRelated: deduped, createdAt: now, updatedAt: now };
}

export async function addCustomLink(word: string, linkedWord: string): Promise<void> {
  const { userId } = await auth();
  if (!userId || !(await ready())) return;

  const now = new Date().toISOString();

  // Add linkedWord to word's custom_links in user_words
  for (const [a, b] of [[word, linkedWord], [linkedWord, word]] as [string, string][]) {
    const result = await db!.execute({
      sql: "SELECT id, custom_links FROM user_words WHERE user_id = ? AND simp = ?",
      args: [userId, a],
    });
    if (!result.rows[0]) continue;
    const row = result.rows[0] as Record<string, unknown>;
    const links = parseJsonArray(row.custom_links);
    if (!links.includes(b)) {
      links.push(b);
      await db!.execute({
        sql: "UPDATE user_words SET custom_links = ? WHERE id = ?",
        args: [JSON.stringify(links), row.id as string],
      });
    }
  }
}

// ── Lyrics ────────────────────────────────────────────────────────────────────

export async function createLyricsGroup(
  title: string,
  content: string,
  youtubeUrl?: string,
  autoExtract = false
): Promise<NotebookGroup | null> {
  const { userId } = await auth();
  if (!userId || !(await ready())) return null;

  const group = await createGroup(title, undefined, "lyrics");
  if (!group) return null;

  const now = new Date().toISOString();
  const lyricsId = crypto.randomUUID();

  await db!.execute({
    sql: `INSERT INTO notebook_lyrics (id, group_id, content, youtube_url, auto_extract, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
    args: [lyricsId, group.id, content.trim(), youtubeUrl?.trim() ?? null, autoExtract ? 1 : 0, now, now],
  });

  return group;
}

export async function updateLyrics(
  groupId: string,
  content: string,
  youtubeUrl?: string,
  autoExtract?: boolean
): Promise<void> {
  const { userId } = await auth();
  if (!userId || !(await ready())) return;

  // Verify ownership
  const group = await db!.execute({
    sql: "SELECT id FROM notebook_groups WHERE id = ? AND user_id = ?",
    args: [groupId, userId],
  });
  if (!group.rows[0]) return;

  const now = new Date().toISOString();
  const existing = await db!.execute({
    sql: "SELECT id, auto_extract FROM notebook_lyrics WHERE group_id = ?",
    args: [groupId],
  });

  if (existing.rows[0]) {
    const current = existing.rows[0] as Record<string, unknown>;
    const newAutoExtract = autoExtract !== undefined ? (autoExtract ? 1 : 0) : ((current.auto_extract as number) ?? 0);
    await db!.execute({
      sql: "UPDATE notebook_lyrics SET content = ?, youtube_url = ?, auto_extract = ?, updated_at = ? WHERE group_id = ?",
      args: [content.trim(), youtubeUrl?.trim() ?? null, newAutoExtract, now, groupId],
    });
  } else {
    await db!.execute({
      sql: `INSERT INTO notebook_lyrics (id, group_id, content, youtube_url, auto_extract, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)`,
      args: [crypto.randomUUID(), groupId, content.trim(), youtubeUrl?.trim() ?? null, autoExtract ? 1 : 0, now, now],
    });
  }

  await db!.execute({
    sql: "UPDATE notebook_groups SET updated_at = ? WHERE id = ?",
    args: [now, groupId],
  });
}

export async function getLyrics(groupId: string): Promise<NotebookLyrics | null> {
  const { userId } = await auth();
  if (!userId || !(await ready())) return null;

  // Verify ownership
  const group = await db!.execute({
    sql: "SELECT id FROM notebook_groups WHERE id = ? AND user_id = ?",
    args: [groupId, userId],
  });
  if (!group.rows[0]) return null;

  const result = await db!.execute({
    sql: "SELECT * FROM notebook_lyrics WHERE group_id = ?",
    args: [groupId],
  });

  return result.rows[0] ? toLyrics(result.rows[0] as Record<string, unknown>) : null;
}

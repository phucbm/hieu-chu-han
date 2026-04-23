"use server";

import { auth } from "@clerk/nextjs/server";
import { db, initSchema } from "@/lib/turso";
import { GUEST_USER_ID, GUEST_DAILY_LIMIT, USER_DAILY_LIMIT, AI_WINDOW_MS } from "@/lib/aiConstants";

export interface AiExplanation {
  simp: string;
  userId: string;
  content: string;
  model: string;
  generatedAt: string;
}

let schemaReady = false;

async function ready(): Promise<boolean> {
  if (!db) return false;
  if (!schemaReady) {
    await initSchema();
    schemaReady = true;
  }
  return true;
}

function toExplanation(row: Record<string, unknown>): AiExplanation {
  return {
    simp: row.simp as string,
    userId: row.user_id as string,
    content: row.content as string,
    model: row.model as string,
    generatedAt: row.generated_at as string,
  };
}

export async function getAiExplanation(simp: string): Promise<AiExplanation | null> {
  if (!(await ready())) return null;

  const { userId } = await auth();

  if (userId) {
    const own = await db!.execute({
      sql: "SELECT * FROM ai_explanations WHERE simp = ? AND user_id = ?",
      args: [simp, userId],
    });
    if (own.rows[0]) return toExplanation(own.rows[0] as Record<string, unknown>);
  }

  const latest = await db!.execute({
    sql: "SELECT * FROM ai_explanations WHERE simp = ? ORDER BY generated_at DESC LIMIT 1",
    args: [simp],
  });
  return latest.rows[0] ? toExplanation(latest.rows[0] as Record<string, unknown>) : null;
}

export async function saveAiExplanation(
  simp: string,
  content: string,
  model: string
): Promise<void> {
  if (!(await ready())) return;

  const { userId } = await auth();
  const uid = userId ?? GUEST_USER_ID;
  const now = new Date().toISOString();

  await db!.execute({
    sql: `
      INSERT INTO ai_explanations (simp, user_id, content, model, generated_at)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(simp, user_id) DO UPDATE SET
        content      = excluded.content,
        model        = excluded.model,
        generated_at = excluded.generated_at
    `,
    args: [simp, uid, content, model, now],
  });
}

export async function getAiUsageStatus(): Promise<{
  remaining: number;
  limit: number;
  isSignedIn: boolean;
}> {
  const { userId } = await auth();

  if (!userId) {
    return { remaining: GUEST_DAILY_LIMIT, limit: GUEST_DAILY_LIMIT, isSignedIn: false };
  }

  if (!(await ready())) {
    return { remaining: USER_DAILY_LIMIT, limit: USER_DAILY_LIMIT, isSignedIn: true };
  }

  const cutoff = new Date(Date.now() - AI_WINDOW_MS).toISOString();
  const result = await db!.execute({
    sql: "SELECT COUNT(*) as count FROM ai_usage_log WHERE user_id = ? AND called_at > ?",
    args: [userId, cutoff],
  });

  const count = (result.rows[0] as Record<string, unknown>).count as number;
  return {
    remaining: Math.max(0, USER_DAILY_LIMIT - count),
    limit: USER_DAILY_LIMIT,
    isSignedIn: true,
  };
}

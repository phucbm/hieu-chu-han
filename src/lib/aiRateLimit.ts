import { db } from "@/lib/db";

const WINDOW_MS = 24 * 60 * 60 * 1000;

function getLimit(): number {
    const raw = process.env.NEXT_PUBLIC_AI_DAILY_LIMIT;
    const n = raw ? parseInt(raw, 10) : NaN;
    return isNaN(n) ? 30 : n;
}

export function getDailyLimit(): number {
    return getLimit();
}

export async function getRemainingCalls(): Promise<number> {
    const limit = getLimit();
    const cutoff = Date.now() - WINDOW_MS;
    const count = await db.aiUsageLog.where("calledAt").above(cutoff).count();
    return Math.max(0, limit - count);
}

/** Returns the timestamp (ms) when the oldest in-window call expires, or null if under limit. */
export async function getResetAt(): Promise<number | null> {
    const limit = getLimit();
    const cutoff = Date.now() - WINDOW_MS;
    const count = await db.aiUsageLog.where("calledAt").above(cutoff).count();
    if (count < limit) return null;
    const oldest = await db.aiUsageLog.where("calledAt").above(cutoff).first();
    return oldest ? oldest.calledAt + WINDOW_MS : null;
}

export async function recordAiCall(): Promise<void> {
    await db.aiUsageLog.add({ calledAt: Date.now() });
}

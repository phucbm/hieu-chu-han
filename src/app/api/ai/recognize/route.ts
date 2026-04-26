import { NextRequest } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { auth } from "@clerk/nextjs/server";
import { db, initSchema } from "@/lib/turso";
import { GUEST_DAILY_LIMIT, USER_DAILY_LIMIT, AI_WINDOW_MS } from "@/lib/aiConstants";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

let schemaReady = false;

async function ensureSchema() {
  if (!schemaReady && db) {
    await initSchema();
    schemaReady = true;
  }
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

export async function POST(req: NextRequest) {
  const key = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  if (!key) {
    return new Response("AI chưa được cấu hình.", { status: 503 });
  }

  const { strokeData } = await req.json();
  if (!strokeData || typeof strokeData !== "string") {
    return new Response("Dữ liệu không hợp lệ.", { status: 400 });
  }

  const { userId } = await auth();
  await ensureSchema();

  const cutoff = new Date(Date.now() - AI_WINDOW_MS).toISOString();

  if (userId) {
    if (db) {
      const result = await db.execute({
        sql: "SELECT COUNT(*) as count FROM ai_usage_log WHERE user_id = ? AND called_at > ?",
        args: [userId, cutoff],
      });
      const count = (result.rows[0] as Record<string, unknown>).count as number;
      if (count >= USER_DAILY_LIMIT) {
        return new Response(
          `Đã dùng hết ${USER_DAILY_LIMIT} lượt AI hôm nay. Vui lòng thử lại sau 24 giờ.`,
          { status: 429 }
        );
      }
      await db.execute({
        sql: "INSERT INTO ai_usage_log (id, user_id, called_at) VALUES (?, ?, ?)",
        args: [crypto.randomUUID(), userId, new Date().toISOString()],
      });
    }
  } else {
    if (db) {
      const ip = getClientIp(req);
      const result = await db.execute({
        sql: "SELECT COUNT(*) as count FROM ai_usage_log WHERE user_id = ? AND called_at > ?",
        args: [`ip:${ip}`, cutoff],
      });
      const count = (result.rows[0] as Record<string, unknown>).count as number;
      if (count >= GUEST_DAILY_LIMIT * 2) {
        return new Response(
          `Đã vượt giới hạn. Tạo tài khoản để dùng thêm ${USER_DAILY_LIMIT} lượt mỗi ngày.`,
          { status: 429 }
        );
      }
      await db.execute({
        sql: "INSERT INTO ai_usage_log (id, user_id, called_at) VALUES (?, ?, ?)",
        args: [crypto.randomUUID(), `ip:${ip}`, new Date().toISOString()],
      });
    }
  }

  const promptPath = path.join(process.cwd(), "public/prompts/char-recognize.md");
  const template = await readFile(promptPath, "utf-8");
  const prompt = template.replace("{{stroke_data}}", strokeData);

  const upstream = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model,
      stream: false,
      temperature: 0,
      max_tokens: 64,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!upstream.ok) {
    const err = await upstream.text();
    return new Response(`Lỗi từ GROQ (${upstream.status}): ${err}`, { status: 502 });
  }

  const data = await upstream.json();
  const raw = data.choices?.[0]?.message?.content ?? "[]";

  try {
    const candidates = JSON.parse(raw);
    if (!Array.isArray(candidates)) throw new Error("not array");
    return Response.json({ candidates });
  } catch {
    // Try to extract JSON array from the response if model added extra text
    const match = raw.match(/\["[\s\S]*?"\]/);
    if (match) {
      try {
        const candidates = JSON.parse(match[0]);
        return Response.json({ candidates });
      } catch {}
    }
    return Response.json({ candidates: [] });
  }
}

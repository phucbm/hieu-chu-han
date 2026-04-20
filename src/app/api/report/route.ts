import { NextRequest, NextResponse } from "next/server";

const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL ?? "";

export async function POST(req: NextRequest) {
    if (!WEBHOOK_URL) {
        return NextResponse.json({ error: "Not configured" }, { status: 503 });
    }

    const { content } = await req.json();
    if (!content || typeof content !== "string") {
        return NextResponse.json({ error: "Invalid body" }, { status: 400 });
    }

    const res = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
    });

    if (!res.ok) {
        return NextResponse.json({ error: "Upstream error" }, { status: 502 });
    }

    return NextResponse.json({ ok: true });
}

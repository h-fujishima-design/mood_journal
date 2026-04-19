import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

const DAILY_LIMIT = 3;

// In-memory rate limit store: ip → { count, date }
const rateLimitStore = new Map<string, { count: number; date: string }>();

function getToday(): string {
  return new Date().toISOString().slice(0, 10); // "2026-04-18"
}

function getIP(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string): { allowed: boolean; remaining: number } {
  const today = getToday();
  const record = rateLimitStore.get(ip);

  if (!record || record.date !== today) {
    rateLimitStore.set(ip, { count: 1, date: today });
    return { allowed: true, remaining: DAILY_LIMIT - 1 };
  }

  if (record.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: DAILY_LIMIT - record.count };
}

export async function POST(req: NextRequest) {
  const ip = getIP(req);
  const { allowed, remaining } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: "You've used your 3 free analyses for today. Come back tomorrow!" },
      { status: 429 }
    );
  }

  const { entry } = await req.json();

  if (!entry || typeof entry !== "string" || entry.trim().length < 10) {
    return NextResponse.json(
      { error: "Please write at least a sentence about your day." },
      { status: 400 }
    );
  }

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-7",
      max_tokens: 512,
      system: `You are a warm, empathetic mood journal AI. Analyze the user's journal entry and respond with a JSON object containing exactly these three fields:
- "mood": a single emoji + 1-3 word mood label (e.g. "😊 Content", "😔 Melancholy", "😤 Frustrated")
- "insight": 1-2 sentences reflecting what you notice about their emotional state or situation
- "encouragement": 1 sentence of genuine, specific encouragement based on what they shared

Respond ONLY with valid JSON. No markdown, no explanation.`,
      messages: [
        {
          role: "user",
          content: `My journal entry for today:\n\n${entry.trim()}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    const result = JSON.parse(text);
    return NextResponse.json(result, {
      headers: { "X-RateLimit-Remaining": String(remaining) },
    });
  } catch (err) {
    console.error("[analyze] error:", err);
    return NextResponse.json(
      { error: "Analysis failed. Please try again in a moment." },
      { status: 500 }
    );
  }
}
import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  const { entry } = await req.json();

  if (!entry || typeof entry !== "string" || entry.trim().length < 10) {
    return NextResponse.json(
      { error: "Please write at least a sentence about your day." },
      { status: 400 }
    );
  }

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
  return NextResponse.json(result);
}
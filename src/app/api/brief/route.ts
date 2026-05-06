import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildSetupPrompt } from "@/lib/prompts";
import { safeParseJson } from "@/lib/jsonRepair";

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { messages, language } = await req.json();
    const prompt = buildSetupPrompt(messages || [], language || "en");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = safeParseJson(text);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Setup error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

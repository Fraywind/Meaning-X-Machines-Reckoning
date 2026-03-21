import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildDecomposePrompt } from "@/lib/prompts";
import { safeParseJson } from "@/lib/jsonRepair";

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { goal, existingNodes, existingValues, judgmentContext } = await req.json();

    const prompt = buildDecomposePrompt(goal, existingNodes || [], existingValues || [], judgmentContext);

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    const parsed = safeParseJson(text);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Decompose error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

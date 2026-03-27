import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildCounterfactualPrompt } from "@/lib/prompts";
import { safeParseJson } from "@/lib/jsonRepair";

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { goal, node, chosenOption, alternateOption, existingValues, language } = await req.json();

    const prompt = buildCounterfactualPrompt(
      goal,
      node,
      chosenOption,
      alternateOption,
      existingValues || [],
      language || "en"
    );

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";

    const parsed = safeParseJson(text);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Counterfactual error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

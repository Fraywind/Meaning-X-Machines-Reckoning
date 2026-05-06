import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildCustomPersonaPrompt } from "@/lib/prompts";
import { safeParseJson } from "@/lib/jsonRepair";

const anthropic = new Anthropic();

/**
 * Generate a single user-specified Subject Matter Expert persona with full
 * dossier (expertise, pushFor, vocabulary) from a free-text description.
 * The Setup persona normally recommends 2 to 4 personas including domain
 * experts, this endpoint lets the user add a specific one of their own
 * choosing on top of that list.
 */
export async function POST(req: NextRequest) {
  try {
    const { description, goal, language } = await req.json();
    if (!description || typeof description !== "string") {
      return NextResponse.json({ error: "description is required" }, { status: 400 });
    }
    const prompt = buildCustomPersonaPrompt(description, goal || "", language || "en");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = safeParseJson(text);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Custom persona error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

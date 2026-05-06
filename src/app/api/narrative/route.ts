import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildNarrativePrompt } from "@/lib/prompts";

const anthropic = new Anthropic();

/**
 * Generate a second-person narrative summary of the user's deliberation
 * session. Takes the full session state (Setup conversation, persona
 * conversations, judgment nodes resolved, recommended personas) and
 * returns a short story of what happened. The user reads it after the
 * experience to map the territory of their own deliberation.
 */
export async function POST(req: NextRequest) {
  try {
    const {
      goal,
      briefMessages,
      castConversations,
      recommendedPersonas,
      nodes,
      language,
    } = await req.json();

    const prompt = buildNarrativePrompt(
      {
        goal: typeof goal === "string" ? goal : "",
        briefMessages: Array.isArray(briefMessages) ? briefMessages : [],
        castConversations: castConversations || {},
        recommendedPersonas: Array.isArray(recommendedPersonas) ? recommendedPersonas : [],
        nodes: nodes || {},
      },
      language || "en",
    );

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ narrative: text });
  } catch (error) {
    console.error("Narrative error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

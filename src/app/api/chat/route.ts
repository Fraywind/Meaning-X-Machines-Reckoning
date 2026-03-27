import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildLanguageInstruction } from "@/lib/i18n";
import type { AppLanguage } from "@/lib/i18n";

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { message, goalText, language } = await req.json();
    const lang = (language || "en") as AppLanguage;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `You are an assistant helping someone who is working through a structured deliberation about: "${goalText}"

They have a question or comment during this process. Answer it directly and concisely. If it relates to their goal, connect it back briefly. Keep your response to 2-4 sentences unless more detail is clearly needed.

Their message: "${message}"${buildLanguageInstruction(lang)}`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({
      reply: "Sorry, I couldn't process that. Try again.",
    });
  }
}

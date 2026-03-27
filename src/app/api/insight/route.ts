import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildLanguageInstruction } from "@/lib/i18n";
import type { AppLanguage } from "@/lib/i18n";

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const { resolvedNodes, goalText, language } = await req.json();

    const lang = (language || "en") as AppLanguage;

    const prompt = `You are observing someone making decisions about: "${goalText}"

Here are their most recent resolved decisions:
${resolvedNodes.map((n: { label: string; choice: string }, i: number) => `${i + 1}. "${n.label}" — they chose: "${n.choice}"`).join("\n")}

In 2-3 sentences, identify one interesting pattern or cognitive tendency reflected in these choices. Be specific to their situation — reference their actual decisions. Frame it as a reflection ("You tend to..." or "Your choices suggest..."), not a lecture. Keep it conversational and insightful, like something a thoughtful friend would notice. Don't use jargon or academic language.

Respond with ONLY valid JSON:
{
  "insight": "Your 2-3 sentence reflection here"
}${buildLanguageInstruction(lang)}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return NextResponse.json(parsed);
    }
    return NextResponse.json({ insight: null });
  } catch (error) {
    console.error("Insight error:", error);
    return NextResponse.json({ insight: null });
  }
}

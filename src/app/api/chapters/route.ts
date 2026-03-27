import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildLanguageInstruction } from "@/lib/i18n";
import type { AppLanguage } from "@/lib/i18n";

const anthropic = new Anthropic();

interface BranchSummaryInput {
  branchLabel: string;
  decisions: { label: string; choice: string }[];
  values: { label: string; strength: number }[];
}

export async function POST(req: NextRequest) {
  try {
    const { branches, goalText, language } = await req.json();
    const lang = (language || "en") as AppLanguage;

    const prompt = `You are writing short, reflective chapter summaries for someone who just completed a structured deliberation about: "${goalText}"

For each branch below, write a 2-3 sentence narrative that reads like a story about the person's choices. Be specific — reference their actual decisions. Frame it as observational and reflective, like a thoughtful narrator. Don't be preachy.

Branches:
${(branches as BranchSummaryInput[]).map((b, i) => `
Branch ${i + 1}: "${b.branchLabel}"
Decisions: ${b.decisions.map((d) => `"${d.label}" → ${d.choice}`).join("; ")}
Top values engaged: ${b.values.map((v) => v.label).join(", ") || "none identified"}
`).join("\n")}

Respond with ONLY valid JSON:
{
  "chapters": [
    {
      "branchLabel": "The branch label",
      "narrative": "Your 2-3 sentence narrative here"
    }
  ]
}${buildLanguageInstruction(lang)}`;

    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "";
    const match = text.match(/\{[\s\S]*\}/);
    if (match) {
      const parsed = JSON.parse(match[0]);
      return NextResponse.json(parsed);
    }
    return NextResponse.json({ chapters: [] });
  } catch (error) {
    console.error("Chapters error:", error);
    return NextResponse.json({ chapters: [] });
  }
}

import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import {
  buildSkepticPrompt,
  buildPragmatistPrompt,
  buildStressTestPrompt,
  buildExpertPrompt,
  buildAnchorPrompt,
} from "@/lib/prompts";
import { safeParseJson } from "@/lib/jsonRepair";

const anthropic = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const {
      personaId,
      archetype,
      name,
      role,
      messages,
      context,
      language,
      otherPersonas,
      crossCheckUsed,
      expertise,
      pushFor,
      vocabulary,
      panelContext,
      priorPersonaSummaries,
    } = await req.json();
    const ctx = context || { goal: "", values: [], constraints: [] };
    const lang = language || "en";
    // If this persona has already fired a cross-check in this conversation, drop the spec.
    const others = crossCheckUsed ? [] : Array.isArray(otherPersonas) ? otherPersonas : [];
    // Validate panel context shape before forwarding.
    const pc =
      panelContext && typeof panelContext.otherName === "string" && panelContext.otherName
        ? {
            otherName: panelContext.otherName,
            otherLastMessage:
              typeof panelContext.otherLastMessage === "string" ? panelContext.otherLastMessage : "",
          }
        : null;

    // Validate prior summaries (passed only when this persona is Anchor).
    const priorSums = Array.isArray(priorPersonaSummaries)
      ? priorPersonaSummaries
          .filter(
            (s: { name?: string; summary?: string }) =>
              s && typeof s.name === "string" && typeof s.summary === "string" && s.summary.trim(),
          )
          .map((s: { name: string; summary: string }) => ({ name: s.name, summary: s.summary }))
      : [];

    let prompt = "";
    if (personaId === "skeptic" || archetype === "skeptic") {
      prompt = buildSkepticPrompt(messages || [], ctx, lang, others, pc);
    } else if (personaId === "pragmatist" || archetype === "pragmatist") {
      prompt = buildPragmatistPrompt(messages || [], ctx, lang, others, pc);
    } else if (personaId === "stress-test" || archetype === "stress-test") {
      prompt = buildStressTestPrompt(messages || [], ctx, lang, others, pc);
    } else if (personaId === "anchor" || archetype === "anchor") {
      prompt = buildAnchorPrompt(messages || [], ctx, lang, others, pc, priorSums);
    } else {
      // Domain-specific or unknown → Expert with role injection + dossier priming
      // (expertise/pushFor/vocabulary) so the persona reads as a real practitioner.
      const expertName = name || "Expert";
      const expertRole = role || "a domain expert in this area";
      prompt = buildExpertPrompt(
        messages || [],
        ctx,
        expertName,
        expertRole,
        lang,
        others,
        personaId || "expert",
        typeof expertise === "string" ? expertise : "",
        typeof pushFor === "string" ? pushFor : "",
        Array.isArray(vocabulary) ? vocabulary.filter((v) => typeof v === "string") : [],
        pc,
      );
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    const parsed = safeParseJson(text);
    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Persona error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}

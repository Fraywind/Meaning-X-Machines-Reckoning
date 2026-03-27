import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { DivergencePoint, TreeComparison, DecisionNode } from "@/types";
import { getSharedTree } from "@/lib/gallery-store";

const anthropic = new Anthropic();

/** Simple word-overlap similarity */
function similarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}

function findDivergences(
  nodesA: Record<string, DecisionNode>,
  nodesB: Record<string, DecisionNode>,
): { divergences: DivergencePoint[]; shared: string[] } {
  const resolvedA = Object.values(nodesA).filter((n) => n.type === "resolved");
  const resolvedB = Object.values(nodesB).filter((n) => n.type === "resolved");

  const divergences: DivergencePoint[] = [];
  const shared: string[] = [];
  const matchedB = new Set<string>();

  for (const nodeA of resolvedA) {
    // Find best matching node in B
    let bestMatch: DecisionNode | null = null;
    let bestSim = 0;

    for (const nodeB of resolvedB) {
      if (matchedB.has(nodeB.id)) continue;
      const sim = similarity(nodeA.label, nodeB.label);
      if (sim > bestSim && sim > 0.4) {
        bestSim = sim;
        bestMatch = nodeB;
      }
    }

    if (!bestMatch) continue;
    matchedB.add(bestMatch.id);

    const choiceA =
      nodeA.options?.find((o) => o.id === nodeA.selectedOption)?.label ||
      nodeA.selectedOption ||
      "Unknown";
    const choiceB =
      bestMatch.options?.find((o) => o.id === bestMatch!.selectedOption)?.label ||
      bestMatch.selectedOption ||
      "Unknown";

    if (choiceA === choiceB || similarity(choiceA, choiceB) > 0.8) {
      shared.push(nodeA.label);
    } else {
      // Determine significance based on child tree differences
      const childrenA = Object.values(nodesA).filter(
        (n) => n.parentId === nodeA.id,
      ).length;
      const childrenB = Object.values(nodesB).filter(
        (n) => n.parentId === bestMatch!.id,
      ).length;
      const structuralDiff = Math.abs(childrenA - childrenB);

      divergences.push({
        nodeLabel: nodeA.label,
        treeAChoice: choiceA,
        treeBChoice: choiceB,
        treeAValues: nodeA.valueImplications || [],
        treeBValues: bestMatch.valueImplications || [],
        significance:
          structuralDiff > 3
            ? "fundamental"
            : structuralDiff > 1
              ? "major"
              : "minor",
      });
    }
  }

  return { divergences, shared };
}

export async function POST(req: NextRequest) {
  try {
    const { treeAId, treeBId } = await req.json();

    if (!treeAId || !treeBId) {
      return NextResponse.json(
        { error: "Two tree IDs required" },
        { status: 400 },
      );
    }

    const [treeA, treeB] = await Promise.all([
      getSharedTree(treeAId),
      getSharedTree(treeBId),
    ]);

    if (!treeA || !treeB) {
      return NextResponse.json(
        { error: "One or both trees not found" },
        { status: 404 },
      );
    }

    const { divergences, shared } = findDivergences(treeA.nodes, treeB.nodes);

    // Generate AI narrative comparison
    let summary = "";
    if (divergences.length > 0) {
      try {
        const divergenceText = divergences
          .map(
            (d) =>
              `- "${d.nodeLabel}": Person A chose "${d.treeAChoice}", Person B chose "${d.treeBChoice}" (${d.significance} divergence)`,
          )
          .join("\n");

        const msg = await anthropic.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 400,
          messages: [
            {
              role: "user",
              content: `Two people deliberated on the same goal: "${treeA.goalText}"

They agreed on: ${shared.length > 0 ? shared.join(", ") : "nothing"}

They diverged on:
${divergenceText}

Person A's top values: ${treeA.values.slice(0, 3).map((v) => v.label).join(", ") || "unknown"}
Person B's top values: ${treeB.values.slice(0, 3).map((v) => v.label).join(", ") || "unknown"}

Write a 2-3 paragraph insightful comparison of what these different choices reveal about their values and priorities. Be specific, not generic. Reference the actual decisions.`,
            },
          ],
        });
        summary =
          msg.content[0].type === "text" ? msg.content[0].text : "";
      } catch {
        summary =
          "Could not generate comparison narrative. Review the divergence points above to see where these deliberations differed.";
      }
    } else {
      summary =
        "These two deliberations reached remarkably similar conclusions, suggesting shared values and priorities despite being made independently.";
    }

    const comparison: TreeComparison = {
      treeA,
      treeB,
      divergencePoints: divergences,
      sharedDecisions: shared,
      summary,
    };

    return NextResponse.json(comparison);
  } catch (err) {
    console.error("Compare error:", err);
    return NextResponse.json(
      { error: "Comparison failed" },
      { status: 500 },
    );
  }
}

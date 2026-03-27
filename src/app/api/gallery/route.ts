import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import Anthropic from "@anthropic-ai/sdk";
import { SharedTree, DecisionNode, UserValue } from "@/types";
import { computeValueDna } from "@/lib/valueDna";
import { saveSharedTree, getRecentTrees, getGalleryStats } from "@/lib/gallery-store";

const anthropic = new Anthropic();

async function normalizeGoal(goalText: string): Promise<string> {
  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 50,
      messages: [
        {
          role: "user",
          content: `Reduce this goal to a 3-5 word canonical slug (lowercase, hyphens, no punctuation). Just output the slug, nothing else.\n\nGoal: "${goalText}"`,
        },
      ],
    });
    const text = msg.content[0].type === "text" ? msg.content[0].text.trim() : "";
    return text.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").slice(0, 60);
  } catch {
    // Fallback: simple normalization
    return goalText
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, "")
      .split(" ")
      .slice(0, 5)
      .join("-");
  }
}

// GET — list recent shared trees
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = Math.min(Number(url.searchParams.get("limit") || 20), 50);
  const offset = Number(url.searchParams.get("offset") || 0);

  try {
    const [trees, stats] = await Promise.all([
      getRecentTrees(limit, offset),
      getGalleryStats(),
    ]);

    return NextResponse.json({
      trees,
      total: stats.totalTrees,
      totalGoals: stats.totalGoals,
    });
  } catch (err) {
    console.error("Gallery GET error:", err);
    return NextResponse.json({ trees: [], total: 0 }, { status: 500 });
  }
}

// POST — share a tree
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      userId,
      userName,
      goalText,
      nodes,
      values,
      critique,
    }: {
      userId: string;
      userName?: string;
      goalText: string;
      nodes: Record<string, DecisionNode>;
      values: UserValue[];
      critique: string | null;
    } = body;

    if (!userId || !goalText || !nodes || Object.keys(nodes).length === 0) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const nodeList = Object.values(nodes);
    const goalSlug = await normalizeGoal(goalText);
    const valueDna = computeValueDna(values || []);

    const tree: SharedTree = {
      id: uuidv4(),
      userId,
      userName,
      goalText,
      goalSlug,
      nodes,
      values: values || [],
      critique,
      sharedAt: Date.now(),
      stats: {
        totalNodes: nodeList.length,
        resolvedCount: nodeList.filter((n) => n.type === "resolved").length,
        judgmentCount: nodeList.filter(
          (n) => n.type === "judgment" || n.type === "resolved",
        ).length,
      },
      valueDna,
    };

    await saveSharedTree(tree);

    return NextResponse.json({ id: tree.id, goalSlug });
  } catch (err) {
    console.error("Gallery POST error:", err);
    return NextResponse.json(
      { error: "Failed to share tree" },
      { status: 500 },
    );
  }
}

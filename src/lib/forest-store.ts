import { DecisionNode, UserValue } from "@/types";
import { computeValueDna } from "@/lib/valueDna";

const FOREST_KEY = "cascade-forest";

export interface ForestTree {
  id: string;
  goalText: string;
  completedAt: number;
  nodes: Record<string, DecisionNode>;
  values: UserValue[];
  critique: string | null;
  valueDna: number[];
  stats: {
    totalNodes: number;
    resolvedCount: number;
    judgmentCount: number;
  };
}

export interface Forest {
  trees: ForestTree[];
  cumulativeValueDna: number[]; // averaged across all trees
  totalDecisions: number;
  firstTreeAt: number | null;
}

function readForest(): Forest {
  try {
    const raw = localStorage.getItem(FOREST_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { trees: [], cumulativeValueDna: new Array(12).fill(0), totalDecisions: 0, firstTreeAt: null };
}

function saveForest(forest: Forest): void {
  try {
    localStorage.setItem(FOREST_KEY, JSON.stringify(forest));
  } catch {}
}

/** Add a completed deliberation to the user's personal forest */
export function addToForest(
  goalText: string,
  nodes: Record<string, DecisionNode>,
  values: UserValue[],
  critique: string | null
): ForestTree {
  const forest = readForest();
  const nodeList = Object.values(nodes);
  const dna = computeValueDna(values);

  const tree: ForestTree = {
    id: `forest-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    goalText,
    completedAt: Date.now(),
    nodes,
    values,
    critique,
    valueDna: dna,
    stats: {
      totalNodes: nodeList.length,
      resolvedCount: nodeList.filter((n) => n.type === "resolved").length,
      judgmentCount: nodeList.filter((n) => n.type === "judgment" || n.type === "resolved").length,
    },
  };

  forest.trees.push(tree);
  forest.totalDecisions += tree.stats.resolvedCount;
  if (!forest.firstTreeAt) forest.firstTreeAt = Date.now();

  // Recompute cumulative DNA as average
  const len = forest.trees.length;
  forest.cumulativeValueDna = new Array(12).fill(0).map((_, i) =>
    forest.trees.reduce((sum, t) => sum + (t.valueDna[i] || 0), 0) / len
  );

  saveForest(forest);
  return tree;
}

export function getForest(): Forest {
  return readForest();
}

export function getForestTreeCount(): number {
  return readForest().trees.length;
}

/** Get how long the user has been growing their forest */
export function getForestAge(): string {
  const forest = readForest();
  if (!forest.firstTreeAt) return "just planted";
  const days = Math.floor((Date.now() - forest.firstTreeAt) / 86400000);
  if (days === 0) return "planted today";
  if (days === 1) return "1 day old";
  if (days < 30) return `${days} days old`;
  const months = Math.floor(days / 30);
  return months === 1 ? "1 month old" : `${months} months old`;
}

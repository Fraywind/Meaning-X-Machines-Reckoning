export type NodeType = "goal" | "reckoning" | "judgment" | "resolved" | "counterfactual";

export type ViewMode = "tree" | "notebook" | "chat";

export type ExportFormat = "prompt" | "notebook";

export interface DecisionNode {
  id: string;
  type: NodeType;
  label: string;
  description: string;
  parentId: string | null;
  children: string[];
  // Judgment-specific fields
  options?: JudgmentOption[];
  selectedOption?: string;
  conflict?: string;
  stakes?: string;
  // Value implications
  valueImplications?: string[];
  blindSpots?: string[];
  // Counterfactual
  isCounterfactual?: boolean;
  originalNodeId?: string;
  // Layout
  depth?: number;
  // Status
  status: "pending" | "active" | "resolved" | "conflict";
}

export interface JudgmentOption {
  id: string;
  label: string;
  description: string;
  tradeoffs: string[];
  consequences: string[];
}

export interface UserValue {
  id: string;
  label: string;
  description: string;
  strength: number; // 0-1 how strongly expressed
  sourceNodeIds: string[]; // which decisions revealed this value
  contradictions?: string[];
  reasoning?: string; // why this value is scored at this strength
  tradeoffImpacts?: string[]; // how specific tradeoffs affected the score
}

export interface DecompositionResponse {
  nodes: DecisionNode[];
  values: UserValue[];
  critique?: string;
}

export interface CounterfactualResponse {
  alternateNodes: DecisionNode[];
  comparison: string;
  insightsRevealed: string[];
}

// --- Gamification types ---

export interface SharedTree {
  id: string;
  userId: string;
  userName?: string;
  goalText: string;
  goalSlug: string; // AI-normalized canonical goal phrase
  nodes: Record<string, DecisionNode>;
  values: UserValue[];
  critique: string | null;
  sharedAt: number;
  stats: {
    totalNodes: number;
    resolvedCount: number;
    judgmentCount: number;
  };
  valueDna: number[]; // 12-dimensional value fingerprint
}

export interface DivergencePoint {
  nodeLabel: string;
  treeAChoice: string;
  treeBChoice: string;
  treeAValues: string[];
  treeBValues: string[];
  significance: "minor" | "major" | "fundamental";
}

export interface TreeComparison {
  treeA: SharedTree;
  treeB: SharedTree;
  divergencePoints: DivergencePoint[];
  sharedDecisions: string[];
  summary: string; // AI-generated comparison narrative
}

export type AchievementCategory = "depth" | "consistency" | "community" | "insight";

export interface Achievement {
  id: string;
  label: string;
  description: string;
  unlockedAt: number;
  category: AchievementCategory;
}

export interface GamificationProfile {
  userId: string;
  userName?: string;
  treesShared: number;
  totalDecisions: number;
  consistencyScore: number; // 0-1
  achievements: Achievement[];
  valueDnaHistory: { timestamp: number; vector: number[] }[];
}

export interface CommunityChallenge {
  id: string;
  prompt: string;
  description: string;
  startsAt: number;
  endsAt: number;
  treeCount: number;
}

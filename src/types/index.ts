export type NodeType = "goal" | "reckoning" | "judgment" | "resolved" | "counterfactual";

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

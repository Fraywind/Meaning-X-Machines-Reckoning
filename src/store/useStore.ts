"use client";

import { create } from "zustand";
import { DecisionNode, UserValue } from "@/types";

interface AppState {
  // Core state
  nodes: Record<string, DecisionNode>;
  values: UserValue[];
  goalText: string;
  isDecomposing: boolean;
  hasStarted: boolean;
  activeJudgmentId: string | null;
  counterfactualNodeId: string | null;
  showValuePanel: boolean;
  critique: string | null;

  // Actions
  setGoalText: (text: string) => void;
  setIsDecomposing: (v: boolean) => void;
  setHasStarted: (v: boolean) => void;
  addNodes: (nodes: DecisionNode[]) => void;
  updateNode: (id: string, updates: Partial<DecisionNode>) => void;
  setValues: (values: UserValue[]) => void;
  addValues: (values: UserValue[]) => void;
  setActiveJudgment: (id: string | null) => void;
  setCounterfactualNode: (id: string | null) => void;
  toggleValuePanel: () => void;
  setCritique: (c: string | null) => void;
  resolveJudgment: (nodeId: string, optionId: string) => void;
  reset: () => void;
}

export const useStore = create<AppState>((set) => ({
  nodes: {},
  values: [],
  goalText: "",
  isDecomposing: false,
  hasStarted: false,
  activeJudgmentId: null,
  counterfactualNodeId: null,
  showValuePanel: false,
  critique: null,

  setGoalText: (text) => set({ goalText: text }),
  setIsDecomposing: (v) => set({ isDecomposing: v }),
  setHasStarted: (v) => set({ hasStarted: v }),

  addNodes: (newNodes) =>
    set((state) => {
      const updated = { ...state.nodes };
      for (const node of newNodes) {
        updated[node.id] = node;
      }
      return { nodes: updated };
    }),

  updateNode: (id, updates) =>
    set((state) => ({
      nodes: {
        ...state.nodes,
        [id]: { ...state.nodes[id], ...updates },
      },
    })),

  setValues: (values) => set({ values }),

  addValues: (newValues) =>
    set((state) => {
      const existing = new Map(state.values.map((v) => [v.id, v]));
      for (const v of newValues) {
        if (existing.has(v.id)) {
          const old = existing.get(v.id)!;
          existing.set(v.id, {
            ...old,
            strength: Math.max(old.strength, v.strength),
            sourceNodeIds: [...new Set([...old.sourceNodeIds, ...v.sourceNodeIds])],
          });
        } else {
          existing.set(v.id, v);
        }
      }
      return { values: Array.from(existing.values()) };
    }),

  setActiveJudgment: (id) => set({ activeJudgmentId: id }),
  setCounterfactualNode: (id) => set({ counterfactualNodeId: id }),
  toggleValuePanel: () => set((s) => ({ showValuePanel: !s.showValuePanel })),
  setCritique: (c) => set({ critique: c }),

  resolveJudgment: (nodeId, optionId) =>
    set((state) => ({
      nodes: {
        ...state.nodes,
        [nodeId]: {
          ...state.nodes[nodeId],
          status: "resolved",
          type: "resolved",
          selectedOption: optionId,
        },
      },
      activeJudgmentId: null,
    })),

  reset: () =>
    set({
      nodes: {},
      values: [],
      goalText: "",
      isDecomposing: false,
      hasStarted: false,
      activeJudgmentId: null,
      counterfactualNodeId: null,
      showValuePanel: false,
      critique: null,
    }),
}));

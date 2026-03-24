"use client";

import { create } from "zustand";
import { DecisionNode, UserValue, ViewMode } from "@/types";
import { ThemeId } from "@/lib/themes";

export interface ChatMessage {
  id: string;
  role: "user" | "system";
  content: string;
  timestamp: number;
  relatedNodeIds?: string[];
}

export interface SavedSession {
  id: string;
  goalText: string;
  nodes: Record<string, DecisionNode>;
  values: UserValue[];
  critique: string | null;
  savedAt: number; // timestamp
}

interface AppState {
  // Core state
  nodes: Record<string, DecisionNode>;
  values: UserValue[];
  goalText: string;
  isDecomposing: boolean;
  hasStarted: boolean;
  activeJudgmentId: string | null;
  counterfactualNodeId: string | null;
  inspectedNodeId: string | null;
  showValuePanel: boolean;
  showSessionPanel: boolean;
  critique: string | null;
  savedSessions: SavedSession[];
  currentSessionId: string | null;
  // Theme
  theme: ThemeId;
  // View mode
  viewMode: ViewMode;
  // Chat messages (for chat mode)
  chatMessages: ChatMessage[];
  // Loading notes (user can add context while AI reckons)
  loadingNotes: string;
  // Summary dismissal
  summaryDismissed: boolean;
  // Force show summary even with pending judgments
  forceShowSummary: boolean;
  // Per-node processing state (for parallel judgment resolution)
  processingNodeIds: Set<string>;
  // Recently resolved nodes (for burst animation)
  recentlyResolvedIds: Set<string>;

  // Actions
  setGoalText: (text: string) => void;
  setIsDecomposing: (v: boolean) => void;
  addProcessingNode: (id: string) => void;
  removeProcessingNode: (id: string) => void;
  setHasStarted: (v: boolean) => void;
  addNodes: (nodes: DecisionNode[]) => void;
  updateNode: (id: string, updates: Partial<DecisionNode>) => void;
  setValues: (values: UserValue[]) => void;
  addValues: (values: UserValue[]) => void;
  setActiveJudgment: (id: string | null) => void;
  setCounterfactualNode: (id: string | null) => void;
  setInspectedNode: (id: string | null) => void;
  toggleValuePanel: () => void;
  toggleSessionPanel: () => void;
  setCritique: (c: string | null) => void;
  resolveJudgment: (nodeId: string, optionId: string) => void;
  setTheme: (theme: ThemeId) => void;
  setViewMode: (mode: ViewMode) => void;
  addChatMessage: (message: ChatMessage) => void;
  setLoadingNotes: (notes: string) => void;
  setSummaryDismissed: (v: boolean) => void;
  setForceShowSummary: (v: boolean) => void;
  // Session management
  saveCurrentSession: () => void;
  loadSession: (id: string) => void;
  deleteSession: (id: string) => void;
  loadSessionsFromStorage: () => void;
  reset: () => void;
}

const STORAGE_KEY = "reckoning-sessions";
const THEME_KEY = "reckoning-theme";
const VIEW_MODE_KEY = "reckoning-view-mode";

function readTheme(): ThemeId {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw === "starfield" || raw === "cybernetics" || raw === "light" || raw === "cute" || raw === "nature") return raw;
    return "starfield";
  } catch {
    return "starfield";
  }
}

function readViewMode(): ViewMode {
  try {
    const raw = localStorage.getItem(VIEW_MODE_KEY);
    if (raw === "tree" || raw === "notebook" || raw === "chat") return raw;
    return "tree";
  } catch {
    return "tree";
  }
}

function persistSessions(sessions: SavedSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    // localStorage might be full or unavailable
  }
}

function readSessions(): SavedSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export const useStore = create<AppState>((set, get) => ({
  nodes: {},
  values: [],
  goalText: "",
  isDecomposing: false,
  hasStarted: false,
  activeJudgmentId: null,
  counterfactualNodeId: null,
  inspectedNodeId: null,
  showValuePanel: false,
  showSessionPanel: false,
  critique: null,
  savedSessions: [],
  currentSessionId: null,
  theme: "starfield" as ThemeId,
  viewMode: "tree" as ViewMode,
  chatMessages: [],
  loadingNotes: "",
  summaryDismissed: false,
  forceShowSummary: false,
  processingNodeIds: new Set(),
  recentlyResolvedIds: new Set(),

  setGoalText: (text) => set({ goalText: text }),
  setIsDecomposing: (v) => set({ isDecomposing: v }),
  addProcessingNode: (id) =>
    set((state) => ({ processingNodeIds: new Set([...state.processingNodeIds, id]) })),
  removeProcessingNode: (id) =>
    set((state) => {
      const next = new Set(state.processingNodeIds);
      next.delete(id);
      return { processingNodeIds: next };
    }),
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
            reasoning: v.reasoning || old.reasoning,
            tradeoffImpacts: [
              ...new Set([...(old.tradeoffImpacts || []), ...(v.tradeoffImpacts || [])]),
            ],
          });
        } else {
          existing.set(v.id, v);
        }
      }
      return { values: Array.from(existing.values()) };
    }),

  setActiveJudgment: (id) => set({ activeJudgmentId: id, inspectedNodeId: null }),
  setCounterfactualNode: (id) => set({ counterfactualNodeId: id, inspectedNodeId: null }),
  setInspectedNode: (id) => set({ inspectedNodeId: id }),
  toggleValuePanel: () => set((s) => ({ showValuePanel: !s.showValuePanel })),
  toggleSessionPanel: () => set((s) => ({ showSessionPanel: !s.showSessionPanel })),
  setCritique: (c) => set({ critique: c }),

  resolveJudgment: (nodeId, optionId) => {
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
      summaryDismissed: false,
      recentlyResolvedIds: new Set([...state.recentlyResolvedIds, nodeId]),
    }));
    // Clear after animation completes
    setTimeout(() => {
      set((state) => {
        const next = new Set(state.recentlyResolvedIds);
        next.delete(nodeId);
        return { recentlyResolvedIds: next };
      });
    }, 800);
  },

  setTheme: (theme) => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
    set({ theme });
  },
  setViewMode: (mode) => {
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch {}
    set({ viewMode: mode });
  },
  addChatMessage: (message) =>
    set((state) => ({ chatMessages: [...state.chatMessages, message] })),
  setLoadingNotes: (notes) => set({ loadingNotes: notes }),
  setSummaryDismissed: (v) => set({ summaryDismissed: v }),
  setForceShowSummary: (v) => set({ forceShowSummary: v, summaryDismissed: false }),

  saveCurrentSession: () => {
    const state = get();
    if (!state.goalText || Object.keys(state.nodes).length === 0) return;

    const sessionId = state.currentSessionId || `session-${Date.now()}`;
    const session: SavedSession = {
      id: sessionId,
      goalText: state.goalText,
      nodes: state.nodes,
      values: state.values,
      critique: state.critique,
      savedAt: Date.now(),
    };

    const sessions = readSessions();
    const existingIdx = sessions.findIndex((s) => s.id === sessionId);
    if (existingIdx >= 0) {
      sessions[existingIdx] = session;
    } else {
      sessions.unshift(session);
    }
    // Keep max 10 sessions
    const trimmed = sessions.slice(0, 10);
    persistSessions(trimmed);
    set({ savedSessions: trimmed, currentSessionId: sessionId });
  },

  loadSession: (id) => {
    const sessions = readSessions();
    const session = sessions.find((s) => s.id === id);
    if (!session) return;

    set({
      nodes: session.nodes,
      values: session.values,
      goalText: session.goalText,
      critique: session.critique,
      hasStarted: true,
      isDecomposing: false,
      activeJudgmentId: null,
      counterfactualNodeId: null,
      showValuePanel: false,
      showSessionPanel: false,
      currentSessionId: id,
      processingNodeIds: new Set(),
      recentlyResolvedIds: new Set(),
    });
  },

  deleteSession: (id) => {
    const sessions = readSessions().filter((s) => s.id !== id);
    persistSessions(sessions);
    set({ savedSessions: sessions });
  },

  loadSessionsFromStorage: () => {
    set({ savedSessions: readSessions(), theme: readTheme(), viewMode: readViewMode() });
  },

  reset: () => {
    // Auto-save current session before resetting
    const state = get();
    if (state.goalText && Object.keys(state.nodes).length > 0) {
      state.saveCurrentSession();
    }

    set({
      nodes: {},
      values: [],
      goalText: "",
      isDecomposing: false,
      hasStarted: false,
      activeJudgmentId: null,
      counterfactualNodeId: null,
      inspectedNodeId: null,
      showValuePanel: false,
      showSessionPanel: false,
      critique: null,
      currentSessionId: null,
      chatMessages: [],
      loadingNotes: "",
      summaryDismissed: false,
      forceShowSummary: false,
      processingNodeIds: new Set(),
      recentlyResolvedIds: new Set(),
    });
  },
}));

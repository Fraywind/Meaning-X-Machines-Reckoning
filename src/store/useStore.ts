"use client";

import { create } from "zustand";
import { DecisionNode, UserValue, ViewMode } from "@/types";
import { ThemeId } from "@/lib/themes";
import { AppLanguage } from "@/lib/i18n";

export interface ChatMessage {
  id: string;
  role: "user" | "system";
  content: string;
  timestamp: number;
  relatedNodeIds?: string[];
}

export interface InsightCard {
  id: string;
  content: string;
  relatedNodeIds: string[];
  dismissed: boolean;
  generatedAt: number;
}

export interface BriefMessage {
  role: "setup" | "user";
  content: string;
  options?: string[];
  // When a persona's turn surfaces a value-laden fork the user must decide,
  // the persona attaches a judgmentMoment. The bubble renders distinctly
  // and a judgment node gets added to the tree state at the same time.
  judgmentMoment?: {
    nodeId: string;
    question: string;
    stakes: string;
    conflict: string;
    options: { label: string; description?: string; tradeoffs?: string[]; consequences?: string[] }[];
  };
}

export interface PersonaConcern {
  kind: "pushback" | "enhance";
  point: string;
  illustration: string;
  followupQuestion: string;
}

export interface BriefExtracted {
  goal: string | null;
  values: string[];
  constraints: string[];
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
  // Language
  language: AppLanguage;
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
  // Quick reckoning mode (3 levels max)
  quickMode: boolean;
  // Insight cards (pattern reflections after 3 resolutions)
  insightCards: InsightCard[];
  // Constraints (user-defined constraints for filtering)
  constraints: string[];
  // Setup persona (Brief) — first interaction, replaces textarea
  briefMessages: BriefMessage[];
  briefReady: boolean;
  briefExtracted: BriefExtracted;
  briefLoading: boolean;
  // Cast — additional personas (Skeptic, Pragmatist, etc.) reachable after Setup
  castConversations: Record<string, {
    messages: BriefMessage[];
    ready: boolean;
    summary: string;
    concerns: PersonaConcern[];
    loading: boolean;
  }>;
  currentCastPersona: string | null;
  visitedCastPersonas: string[];
  // Setup recommends 2-4 personas at ready — universal (skeptic, pragmatist, stress-test) and/or domain-specific.
  // Domain-expert personas additionally carry a dossier (expertise, pushFor, vocabulary) so the runtime
  // prompt for that persona has real domain priming rather than just a name + role label.
  recommendedPersonas: {
    id: string;
    name: string;
    role: string;
    archetype: string;
    expertise?: string;
    pushFor?: string;
    vocabulary?: string[];
    accessory?: string;
  }[];
  // A pending check-in from one persona suggesting another would have a take.
  // At most one active at a time. Cleared when user clicks the glow or switches personas.
  pendingCrossCheck: { fromPersonaId: string; targetPersonaId: string; oneLineTake: string } | null;
  // Track which (from→to) pairs have already fired a cross-check, capped at 1 per conversation.
  crossCheckHistory: string[];
  // Panel mode: user-moderated dialogue between two personas. Only available
  // after at least 2 cast personas have reached ready=true. The user controls
  // every turn (clicks an avatar to make that persona respond). 4-turn soft
  // budget. Direct address between personas only when there's real substance.
  panelMode: boolean;
  panelPersonaIds: [string, string] | null;
  panelMessages: { role: "user" | "persona"; personaId?: string; content: string }[];
  panelTurnsUsed: number;
  panelLoadingPersona: string | null;
  // Narrative view: end-of-experience second-person story of the session.
  narrativeOpen: boolean;

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
  setLanguage: (lang: AppLanguage) => void;
  setViewMode: (mode: ViewMode) => void;
  addChatMessage: (message: ChatMessage) => void;
  setLoadingNotes: (notes: string) => void;
  setSummaryDismissed: (v: boolean) => void;
  setForceShowSummary: (v: boolean) => void;
  setQuickMode: (v: boolean) => void;
  addInsightCard: (card: InsightCard) => void;
  dismissInsightCard: (id: string) => void;
  setConstraints: (c: string[]) => void;
  addConstraint: (c: string) => void;
  removeConstraint: (c: string) => void;
  // Setup actions
  addBriefMessage: (m: BriefMessage) => void;
  setBriefReady: (ready: boolean, extracted?: BriefExtracted) => void;
  setBriefLoading: (v: boolean) => void;
  resetBrief: () => void;
  // Cast actions
  addCastMessage: (personaId: string, m: BriefMessage) => void;
  setCastReady: (personaId: string, ready: boolean, summary?: string, concerns?: PersonaConcern[]) => void;
  setCastLoading: (personaId: string, v: boolean) => void;
  setCurrentCastPersona: (id: string | null) => void;
  markCastVisited: (id: string) => void;
  setRecommendedPersonas: (list: { id: string; name: string; role: string; archetype: string; expertise?: string; pushFor?: string; vocabulary?: string[]; accessory?: string }[]) => void;
  setPendingCrossCheck: (cc: { fromPersonaId: string; targetPersonaId: string; oneLineTake: string } | null) => void;
  clearPendingCrossCheck: () => void;
  enterPanelMode: (ids: [string, string]) => void;
  exitPanelMode: () => void;
  addPanelMessage: (m: { role: "user" | "persona"; personaId?: string; content: string }) => void;
  setPanelLoadingPersona: (id: string | null) => void;
  setNarrativeOpen: (v: boolean) => void;
  resetCast: () => void;
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
const LANGUAGE_KEY = "reckoning-language";

function readLanguage(): AppLanguage {
  try {
    const raw = localStorage.getItem(LANGUAGE_KEY);
    if (raw === "en" || raw === "zh" || raw === "hi" || raw === "es") return raw;
    return "en";
  } catch {
    return "en";
  }
}

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
  theme: "nature" as ThemeId,
  language: "en" as AppLanguage,
  viewMode: "tree" as ViewMode,
  chatMessages: [],
  loadingNotes: "",
  summaryDismissed: false,
  forceShowSummary: false,
  processingNodeIds: new Set(),
  recentlyResolvedIds: new Set(),
  quickMode: false,
  insightCards: [],
  constraints: [],
  briefMessages: [],
  briefReady: false,
  briefExtracted: { goal: null, values: [], constraints: [] },
  briefLoading: false,
  castConversations: {},
  currentCastPersona: null,
  visitedCastPersonas: [],
  recommendedPersonas: [],
  pendingCrossCheck: null,
  crossCheckHistory: [],
  panelMode: false,
  panelPersonaIds: null,
  panelMessages: [],
  panelTurnsUsed: 0,
  panelLoadingPersona: null,
  narrativeOpen: false,

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
  setLanguage: (lang) => {
    try {
      localStorage.setItem(LANGUAGE_KEY, lang);
    } catch {}
    set({ language: lang });
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
  setQuickMode: (v) => set({ quickMode: v }),
  addInsightCard: (card) => set((s) => ({ insightCards: [...s.insightCards, card] })),
  dismissInsightCard: (id) => set((s) => ({
    insightCards: s.insightCards.map((c) => c.id === id ? { ...c, dismissed: true } : c),
  })),
  setConstraints: (c) => set({ constraints: c }),
  addConstraint: (c) => set((s) => ({
    constraints: s.constraints.includes(c) ? s.constraints : [...s.constraints, c],
  })),
  removeConstraint: (c) => set((s) => ({
    constraints: s.constraints.filter((x) => x !== c),
  })),

  addBriefMessage: (m) => set((s) => ({ briefMessages: [...s.briefMessages, m] })),
  setBriefReady: (ready, extracted) =>
    set({
      briefReady: ready,
      briefExtracted: extracted || { goal: null, values: [], constraints: [] },
    }),
  setBriefLoading: (v) => set({ briefLoading: v }),
  resetBrief: () =>
    set({
      briefMessages: [],
      briefReady: false,
      briefExtracted: { goal: null, values: [], constraints: [] },
      briefLoading: false,
    }),

  addCastMessage: (personaId, m) =>
    set((s) => {
      const existing = s.castConversations[personaId] || {
        messages: [],
        ready: false,
        summary: "",
        concerns: [],
        loading: false,
      };
      return {
        castConversations: {
          ...s.castConversations,
          [personaId]: { ...existing, messages: [...existing.messages, m] },
        },
      };
    }),

  setCastReady: (personaId, ready, summary, concerns) =>
    set((s) => {
      const existing = s.castConversations[personaId] || {
        messages: [],
        ready: false,
        summary: "",
        concerns: [],
        loading: false,
      };
      return {
        castConversations: {
          ...s.castConversations,
          [personaId]: {
            ...existing,
            ready,
            summary: summary ?? existing.summary,
            concerns: concerns ?? existing.concerns,
          },
        },
      };
    }),

  setCastLoading: (personaId, v) =>
    set((s) => {
      const existing = s.castConversations[personaId] || {
        messages: [],
        ready: false,
        summary: "",
        concerns: [],
        loading: false,
      };
      return {
        castConversations: {
          ...s.castConversations,
          [personaId]: { ...existing, loading: v },
        },
      };
    }),

  setCurrentCastPersona: (id) => set({ currentCastPersona: id }),

  markCastVisited: (id) =>
    set((s) => ({
      visitedCastPersonas: s.visitedCastPersonas.includes(id)
        ? s.visitedCastPersonas
        : [...s.visitedCastPersonas, id],
    })),

  setRecommendedPersonas: (list) => set({ recommendedPersonas: list }),
  setPendingCrossCheck: (cc) =>
    set((s) =>
      cc
        ? {
            pendingCrossCheck: cc,
            crossCheckHistory: [...s.crossCheckHistory, `${cc.fromPersonaId}->${cc.targetPersonaId}`],
          }
        : { pendingCrossCheck: null },
    ),
  clearPendingCrossCheck: () => set({ pendingCrossCheck: null }),
  enterPanelMode: (ids) =>
    set({
      panelMode: true,
      panelPersonaIds: ids,
      panelMessages: [],
      panelTurnsUsed: 0,
      panelLoadingPersona: null,
      currentCastPersona: null,
    }),
  exitPanelMode: () =>
    set({
      panelMode: false,
      panelPersonaIds: null,
      panelMessages: [],
      panelTurnsUsed: 0,
      panelLoadingPersona: null,
    }),
  addPanelMessage: (m) =>
    set((s) => ({
      panelMessages: [...s.panelMessages, m],
      panelTurnsUsed: m.role === "persona" ? s.panelTurnsUsed + 1 : s.panelTurnsUsed,
    })),
  setPanelLoadingPersona: (id) => set({ panelLoadingPersona: id }),
  setNarrativeOpen: (v) => set({ narrativeOpen: v }),

  resetCast: () =>
    set({
      castConversations: {},
      currentCastPersona: null,
      visitedCastPersonas: [],
      recommendedPersonas: [],
      pendingCrossCheck: null,
      crossCheckHistory: [],
      panelMode: false,
      panelPersonaIds: null,
      panelMessages: [],
      panelTurnsUsed: 0,
      panelLoadingPersona: null,
    }),

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
      quickMode: false,
      insightCards: [],
      constraints: [],
      briefMessages: [],
      briefReady: false,
      briefExtracted: { goal: null, values: [], constraints: [] },
      briefLoading: false,
      castConversations: {},
      currentCastPersona: null,
      visitedCastPersonas: [],
      recommendedPersonas: [],
      pendingCrossCheck: null,
      crossCheckHistory: [],
      panelMode: false,
      panelPersonaIds: null,
      panelMessages: [],
      panelTurnsUsed: 0,
      panelLoadingPersona: null,
    });
  },
}));

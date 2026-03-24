"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeTypes,
  useNodesState,
  useEdgesState,
  ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";
import {
  ArrowRight,
  Send,
  CheckCircle2,
  AlertTriangle,
  CircleDot,
  Target,
  GitBranch,
  AlertCircle,
  Loader2,
  ChevronRight,
  MessageSquare,
} from "lucide-react";
import { DecisionNode } from "@/types";
import { useStore, ChatMessage } from "@/store/useStore";
import { safeFetch } from "@/lib/api";
import TreeNode from "./TreeNode";
import ThemeSwitcher from "./ThemeSwitcher";
import Starfield from "./Starfield";
import CritiqueBar from "./CritiqueBar";
import GuidePanel from "./GuidePanel";
import ReckoningLoader from "./ReckoningLoader";

const nodeTypes: NodeTypes = {
  treeNode: TreeNode,
};

function layoutTree(nodes: Record<string, DecisionNode>): {
  flowNodes: Node[];
  flowEdges: Edge[];
} {
  const flowNodes: Node[] = [];
  const flowEdges: Edge[] = [];
  const nodeList = Object.values(nodes);

  if (nodeList.length === 0) return { flowNodes, flowEdges };

  const childrenMap: Record<string, string[]> = {};
  for (const n of nodeList) {
    if (n.parentId && nodes[n.parentId]) {
      if (!childrenMap[n.parentId]) childrenMap[n.parentId] = [];
      childrenMap[n.parentId].push(n.id);
    }
  }

  const roots = nodeList.filter((n) => !n.parentId || !nodes[n.parentId]);
  const positions: Record<string, { x: number; y: number }> = {};
  const depths: Record<string, number> = {};
  const HORIZONTAL_SPACING = 360;
  const VERTICAL_SPACING = 220;

  let currentY = 0;

  function layoutSubtree(nodeId: string, depth: number, yOffset: number): number {
    depths[nodeId] = depth;
    const children = childrenMap[nodeId] || [];
    if (children.length === 0) {
      positions[nodeId] = { x: depth * HORIZONTAL_SPACING, y: yOffset };
      return yOffset + VERTICAL_SPACING;
    }
    let childY = yOffset;
    for (const childId of children) {
      childY = layoutSubtree(childId, depth + 1, childY);
    }
    const firstChildY = positions[children[0]].y;
    const lastChildY = positions[children[children.length - 1]].y;
    positions[nodeId] = {
      x: depth * HORIZONTAL_SPACING,
      y: (firstChildY + lastChildY) / 2,
    };
    return childY;
  }

  for (const root of roots) {
    currentY = layoutSubtree(root.id, 0, currentY);
  }

  for (const n of nodeList) {
    const pos = positions[n.id] || { x: 0, y: flowNodes.length * VERTICAL_SPACING };
    const depth = depths[n.id] ?? 0;
    flowNodes.push({
      id: n.id,
      type: "treeNode",
      position: pos,
      data: { ...n, depth },
    });
    if (n.parentId && nodes[n.parentId]) {
      flowEdges.push({
        id: `${n.parentId}-${n.id}`,
        source: n.parentId,
        target: n.id,
        animated: n.status !== "resolved" || n.type === "judgment",
        style: {
          stroke:
            n.type === "judgment"
              ? "#f59e0b"
              : n.type === "counterfactual"
                ? "#818cf8"
                : n.status === "resolved"
                  ? "#10b981"
                  : "#3b3b5c",
          strokeWidth: 2,
        },
      });
    }
  }

  return { flowNodes, flowEdges };
}

// Chat message bubble
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
    >
      <div
        className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? "bg-cosmos-glow/20 border border-cosmos-glow/30 text-cosmos-text rounded-br-md"
            : "bg-cosmos-surface/80 border border-cosmos-border/40 text-cosmos-text rounded-bl-md"
        }`}
      >
        {message.content}
      </div>
    </motion.div>
  );
}

// Inline decision prompt in chat
function ChatDecisionPrompt({ node }: { node: DecisionNode }) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [showClarify, setShowClarify] = useState(false);
  const [clarifyText, setClarifyText] = useState("");

  const {
    resolveJudgment, nodes, goalText, values, addNodes, addValues, setCritique,
    setIsDecomposing, loadingNotes, setLoadingNotes, addChatMessage,
  } = useStore();

  const handleResolve = async () => {
    if (!selectedId) return;
    setIsResolving(true);
    const chosenLabel = node.options?.find((o) => o.id === selectedId)?.label || selectedId;

    addChatMessage({
      id: `user-${Date.now()}`,
      role: "user",
      content: `I choose: "${chosenLabel}"`,
      timestamp: Date.now(),
      relatedNodeIds: [node.id],
    });

    resolveJudgment(node.id, selectedId);
    setIsDecomposing(true);

    try {
      const goalWithNotes = loadingNotes.trim()
        ? `${goalText}\n\n--- Additional context from user ---\n${loadingNotes}`
        : goalText;
      const data = await safeFetch("/api/decompose", {
        goal: goalWithNotes,
        existingNodes: Object.values(nodes),
        existingValues: values,
        judgmentContext: { nodeId: node.id, chosenOption: chosenLabel },
      });
      if (loadingNotes.trim()) setLoadingNotes("");
      if (data.nodes) {
        addNodes(data.nodes);
        const newJudgments = (data.nodes as DecisionNode[]).filter((n: DecisionNode) => n.type === "judgment");
        if (newJudgments.length > 0) {
          addChatMessage({
            id: `sys-${Date.now()}`,
            role: "system",
            content: `Your choice opens up ${data.nodes.length} new considerations. ${newJudgments.length} need your judgment.`,
            timestamp: Date.now(),
            relatedNodeIds: (data.nodes as DecisionNode[]).map((n: DecisionNode) => n.id),
          });
        } else {
          addChatMessage({
            id: `sys-${Date.now()}`,
            role: "system",
            content: `Mapped out ${data.nodes.length} new branches from your decision.`,
            timestamp: Date.now(),
          });
        }
      }
      if (data.values) addValues(data.values);
      if (data.critique) {
        setCritique(data.critique);
        addChatMessage({
          id: `critique-${Date.now()}`,
          role: "system",
          content: `Observation: ${data.critique}`,
          timestamp: Date.now(),
        });
      }
    } catch (err) {
      console.error("Failed:", err);
    } finally {
      setIsDecomposing(false);
      setIsResolving(false);
    }
  };

  const handleClarify = async () => {
    if (!clarifyText.trim()) return;
    setIsResolving(true);

    addChatMessage({
      id: `user-${Date.now()}`,
      role: "user",
      content: clarifyText,
      timestamp: Date.now(),
      relatedNodeIds: [node.id],
    });

    resolveJudgment(node.id, "user-clarification");
    setIsDecomposing(true);

    try {
      const data = await safeFetch("/api/decompose", {
        goal: goalText,
        existingNodes: Object.values(nodes),
        existingValues: values,
        judgmentContext: {
          nodeId: node.id,
          chosenOption: `User clarification: "${clarifyText}"`,
        },
      });
      if (data.nodes) {
        addNodes(data.nodes);
        addChatMessage({
          id: `sys-${Date.now()}`,
          role: "system",
          content: `Got it. I've rethought this part based on your input. ${(data.nodes as DecisionNode[]).length} new nodes added.`,
          timestamp: Date.now(),
        });
      }
      if (data.values) addValues(data.values);
      if (data.critique) setCritique(data.critique);
    } catch (err) {
      console.error("Failed:", err);
    } finally {
      setIsDecomposing(false);
      setIsResolving(false);
      setShowClarify(false);
      setClarifyText("");
    }
  };

  if (node.type !== "judgment" || node.status === "resolved") return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4 bg-cosmos-surface/80 border border-cosmos-judgment/30 rounded-xl p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <AlertTriangle className="w-4 h-4 text-cosmos-judgment" />
        <span className="text-xs font-medium text-cosmos-judgment uppercase tracking-wider">Decision Point</span>
      </div>

      <h4 className="text-sm font-medium text-cosmos-text mb-1">{node.label}</h4>
      <p className="text-xs text-cosmos-muted mb-3">{node.description}</p>

      {node.conflict && (
        <p className="text-xs text-cosmos-muted/70 italic mb-3">{node.conflict}</p>
      )}

      {node.options && node.options.length > 0 && (
        <div className="space-y-2 mb-3">
          {node.options.map((option, index) => (
            <button
              key={option.id}
              onClick={() => { setSelectedId(option.id); setShowClarify(false); }}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedId === option.id
                  ? "border-cosmos-judgment bg-cosmos-judgment/10"
                  : "border-cosmos-border/40 hover:border-cosmos-judgment/30 bg-cosmos-bg/30"
              }`}
            >
              <div className="text-xs font-medium text-cosmos-text">
                {String.fromCharCode(65 + index)}. {option.label}
              </div>
              <div className="text-[11px] text-cosmos-muted mt-0.5">{option.description}</div>
            </button>
          ))}
        </div>
      )}

      {selectedId && !showClarify && (
        <button
          onClick={handleResolve}
          disabled={isResolving}
          className="w-full py-2 bg-cosmos-judgment/20 border border-cosmos-judgment/40 rounded-lg text-cosmos-judgment text-xs font-medium hover:bg-cosmos-judgment/30 disabled:opacity-30 flex items-center justify-center gap-2 mb-2"
        >
          {isResolving ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
          {isResolving ? "Processing..." : "Confirm"}
        </button>
      )}

      {!showClarify ? (
        <button
          onClick={() => { setShowClarify(true); setSelectedId(null); }}
          className="w-full py-1.5 text-[11px] text-cosmos-muted/60 hover:text-cosmos-glow transition-colors"
        >
          None fit? Clarify instead
        </button>
      ) : (
        <div className="space-y-2">
          <textarea
            value={clarifyText}
            onChange={(e) => setClarifyText(e.target.value)}
            placeholder="Explain your situation..."
            className="w-full bg-cosmos-bg/30 border border-cosmos-border/40 rounded-lg px-3 py-2 text-xs text-cosmos-text placeholder:text-cosmos-muted/30 focus:outline-none focus:border-cosmos-glow/50 resize-none"
            rows={2}
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleClarify}
              disabled={!clarifyText.trim() || isResolving}
              className="flex-1 py-1.5 bg-cosmos-glow/20 border border-cosmos-glow/30 rounded-lg text-cosmos-glow text-xs disabled:opacity-30 flex items-center justify-center gap-1"
            >
              Send <ArrowRight className="w-3 h-3" />
            </button>
            <button
              onClick={() => { setShowClarify(false); setClarifyText(""); }}
              className="px-3 py-1.5 border border-cosmos-border/40 rounded-lg text-cosmos-muted text-xs"
            >
              Back
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function ChatView() {
  const {
    nodes, activeJudgmentId, counterfactualNodeId, inspectedNodeId,
    critique, isDecomposing, chatMessages, addChatMessage,
    goalText, values, addNodes, addValues, setCritique, setIsDecomposing,
    loadingNotes, setLoadingNotes,
  } = useStore();

  const [inputText, setInputText] = useState("");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { flowNodes, flowEdges } = useMemo(() => layoutTree(nodes), [nodes]);
  const [rfNodes, , onNodesChange] = useNodesState(flowNodes);
  const [rfEdges, , onEdgesChange] = useEdgesState(flowEdges);

  const nodeList = Object.values(nodes);
  const pendingJudgments = nodeList.filter((n) => n.type === "judgment" && n.status !== "resolved");

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, pendingJudgments.length]);

  const handleSendMessage = useCallback(async () => {
    const text = inputText.trim();
    if (!text) return;

    addChatMessage({
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    });
    setInputText("");

    // Send as additional context
    setIsDecomposing(true);
    try {
      const data = await safeFetch("/api/decompose", {
        goal: `${goalText}\n\n--- User message ---\n${text}`,
        existingNodes: Object.values(nodes),
        existingValues: values,
      });
      if (data.nodes && (data.nodes as DecisionNode[]).length > 0) {
        addNodes(data.nodes);
        addChatMessage({
          id: `sys-${Date.now()}`,
          role: "system",
          content: `I've updated the tree based on your input. ${(data.nodes as DecisionNode[]).filter((n: DecisionNode) => n.type === "judgment").length} new decisions surfaced.`,
          timestamp: Date.now(),
        });
      } else {
        addChatMessage({
          id: `sys-${Date.now()}`,
          role: "system",
          content: `Noted. The tree structure reflects your current deliberation. Try making a decision on a pending judgment node to continue.`,
          timestamp: Date.now(),
        });
      }
      if (data.values) addValues(data.values);
      if (data.critique) setCritique(data.critique);
    } catch (err) {
      console.error("Failed:", err);
      addChatMessage({
        id: `err-${Date.now()}`,
        role: "system",
        content: "Something went wrong. Please try again.",
        timestamp: Date.now(),
      });
    } finally {
      setIsDecomposing(false);
    }
  }, [inputText, goalText, nodes, values, addChatMessage, addNodes, addValues, setCritique, setIsDecomposing]);

  return (
    <div className="w-full h-screen relative flex">
      <Starfield />
      <ReckoningLoader />

      {/* Left: Chat panel */}
      <div className="w-[420px] h-full flex flex-col bg-cosmos-bg/95 backdrop-blur-md border-r border-cosmos-border/30 z-20 relative">
        {/* Chat header */}
        <div className="px-4 py-3 border-b border-cosmos-border/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-cosmos-glow/10 border border-cosmos-glow/30 flex items-center justify-center">
              <MessageSquare className="w-3.5 h-3.5 text-cosmos-glow" />
            </div>
            <div>
              <h2 className="text-sm font-display font-medium text-cosmos-text">Cascade Chat</h2>
              <p className="text-[10px] text-cosmos-muted/50">Interact with your deliberation</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => useStore.getState().setViewMode("tree")}
              className="px-2 py-1 text-[10px] rounded-md border border-cosmos-border text-cosmos-muted hover:border-cosmos-glow/30 transition-all"
            >
              Tree
            </button>
            <button
              onClick={() => useStore.getState().setViewMode("notebook")}
              className="px-2 py-1 text-[10px] rounded-md border border-cosmos-border text-cosmos-muted hover:border-cosmos-glow/30 transition-all"
            >
              Notebook
            </button>
          </div>
        </div>

        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {chatMessages.length === 0 && (
            <div className="text-center py-8">
              <p className="text-xs text-cosmos-muted/40 mb-2">Your conversation will appear here.</p>
              <p className="text-[10px] text-cosmos-muted/30">
                Make decisions on the tree, or type a message to add context.
              </p>
            </div>
          )}

          {chatMessages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}

          {/* Inline decision prompts for pending judgments */}
          {pendingJudgments.map((node) => (
            <ChatDecisionPrompt key={node.id} node={node} />
          ))}

          {isDecomposing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-xs text-cosmos-muted/50 mb-3"
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              Thinking...
            </motion.div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Chat input */}
        <div className="px-4 py-3 border-t border-cosmos-border/30 shrink-0">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Add context, ask questions, or provide details..."
              className="flex-1 bg-cosmos-surface/60 border border-cosmos-border/40 rounded-xl px-4 py-2.5 text-sm text-cosmos-text placeholder:text-cosmos-muted/30 focus:outline-none focus:border-cosmos-glow/50 resize-none transition-all"
              rows={1}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputText.trim() || isDecomposing}
              className="px-3 py-2.5 bg-cosmos-glow/20 border border-cosmos-glow/30 rounded-xl text-cosmos-glow hover:bg-cosmos-glow/30 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Right: Tree visualization */}
      <div className="flex-1 relative z-10">
        {/* Top bar */}
        <div className="absolute top-4 right-4 z-40 flex gap-2">
          <ThemeSwitcher />
          <button
            onClick={() => useStore.getState().saveCurrentSession()}
            className="px-3 py-1.5 text-xs rounded-lg border bg-cosmos-surface border-cosmos-border text-cosmos-muted hover:border-cosmos-resolved/30 hover:text-cosmos-resolved transition-all"
          >
            Save
          </button>
          <button
            onClick={() => useStore.getState().toggleValuePanel()}
            className="px-3 py-1.5 text-xs rounded-lg border bg-cosmos-surface border-cosmos-border text-cosmos-muted hover:border-cosmos-glow/30 transition-all"
          >
            Values
          </button>
          <button
            onClick={() => useStore.getState().reset()}
            className="px-3 py-1.5 text-xs rounded-lg border bg-cosmos-surface border-cosmos-border text-cosmos-muted hover:border-cosmos-conflict/30 hover:text-cosmos-conflict transition-all"
          >
            New Goal
          </button>
        </div>

        <ReactFlow
          nodes={flowNodes}
          edges={flowEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          connectionMode={ConnectionMode.Loose}
          fitView
          fitViewOptions={{ padding: 0.3 }}
          minZoom={0.1}
          maxZoom={2}
          defaultEdgeOptions={{ type: "smoothstep" }}
        >
          <Background color="#1e1e2e" gap={24} size={1} />
          <Controls position="bottom-left" />
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as DecisionNode;
              switch (data.type) {
                case "goal": return "#818cf8";
                case "judgment": return "#f59e0b";
                case "resolved": return "#10b981";
                case "counterfactual": return "#a78bfa";
                default: return "#6366f1";
              }
            }}
            maskColor="rgba(10, 10, 15, 0.8)"
          />
        </ReactFlow>

        {critique && <CritiqueBar />}
      </div>

      <GuidePanel />
    </div>
  );
}

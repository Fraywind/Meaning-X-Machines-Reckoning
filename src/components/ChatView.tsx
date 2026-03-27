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
  AlertTriangle,
  CircleDot,
  Target,
  GitBranch,
  AlertCircle,
  Loader2,
  ChevronRight,
  MessageSquare,
  PanelRightOpen,
  PanelRightClose,
  CheckCircle2,
  BookOpen,
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

// Chat message bubble — ChatGPT style
function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className={`py-4 ${isUser ? "" : "bg-cosmos-surface/40"}`}
    >
      <div className="max-w-2xl mx-auto px-6">
        <div className="flex gap-3">
          <div className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-medium ${
            isUser
              ? "bg-cosmos-glow/20 text-cosmos-glow border border-cosmos-glow/30"
              : "bg-cosmos-surface border border-cosmos-border text-cosmos-muted"
          }`}>
            {isUser ? "You" : "C"}
          </div>
          <div className="flex-1 text-sm text-cosmos-text leading-relaxed pt-0.5">
            {message.content}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Inline decision prompt in chat — card style
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
            content: `That choice opens up some new ground. I've mapped out ${data.nodes.length} new considerations, and ${newJudgments.length} of them will need your input.`,
            timestamp: Date.now(),
            relatedNodeIds: (data.nodes as DecisionNode[]).map((n: DecisionNode) => n.id),
          });
        } else {
          addChatMessage({
            id: `sys-${Date.now()}`,
            role: "system",
            content: `Got it. I've worked through the implications and added ${data.nodes.length} new branches from that decision.`,
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
        const clarifyJudgments = (data.nodes as DecisionNode[]).filter((n: DecisionNode) => n.type === "judgment");
        addChatMessage({
          id: `sys-${Date.now()}`,
          role: "system",
          content: clarifyJudgments.length > 0
            ? `Thanks for the context. I've reworked this section based on what you said. ${clarifyJudgments.length} new decision${clarifyJudgments.length !== 1 ? "s" : ""} came out of it.`
            : `Understood. I've adjusted the plan based on your input.`,
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
    <div className="py-4 bg-cosmos-surface/40">
      <div className="max-w-2xl mx-auto px-6">
        <div className="bg-cosmos-bg/60 border border-cosmos-judgment/30 rounded-xl p-5 space-y-4">
          {/* Header */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-4 h-4 text-cosmos-judgment" />
              <span className="text-xs font-medium text-cosmos-judgment uppercase tracking-wider">Decision Point</span>
            </div>
            <h4 className="text-sm font-medium text-cosmos-text mb-1">{node.label}</h4>
            <p className="text-xs text-cosmos-muted leading-relaxed">{node.description}</p>
          </div>

          {/* What's at stake */}
          {node.stakes && (
            <div className="p-3 bg-cosmos-conflict/8 border border-cosmos-conflict/20 rounded-lg">
              <div className="text-[10px] font-medium text-cosmos-conflict uppercase tracking-wider mb-1">What&apos;s at stake</div>
              <p className="text-xs text-cosmos-text/80 leading-relaxed">{node.stakes}</p>
            </div>
          )}

          {/* The conflict */}
          {node.conflict && (
            <div className="p-3 bg-cosmos-judgment/8 border border-cosmos-judgment/20 rounded-lg">
              <div className="text-[10px] font-medium text-cosmos-judgment uppercase tracking-wider mb-1">The conflict</div>
              <p className="text-xs text-cosmos-text/80 leading-relaxed">{node.conflict}</p>
            </div>
          )}

          {/* Blind spots */}
          {node.blindSpots && node.blindSpots.length > 0 && (
            <div className="p-3 bg-cosmos-glow/5 border border-cosmos-glow/15 rounded-lg">
              <div className="text-[10px] font-medium text-cosmos-glow/70 uppercase tracking-wider mb-1">Things to consider</div>
              <ul className="text-xs text-cosmos-muted space-y-1">
                {node.blindSpots.map((b, i) => (
                  <li key={i} className="leading-relaxed">&bull; {b}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Value implications */}
          {node.valueImplications && node.valueImplications.length > 0 && (
            <div className="p-3 bg-cosmos-glow/5 border border-cosmos-glow/15 rounded-lg">
              <div className="text-[10px] font-medium text-cosmos-glow/70 uppercase tracking-wider mb-1">How this connects to your values</div>
              <ul className="text-xs text-cosmos-muted space-y-1">
                {node.valueImplications.map((v, i) => (
                  <li key={i} className="leading-relaxed">&bull; {v}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Choose your path */}
          <div>
            <div className="text-xs font-medium text-cosmos-judgment uppercase tracking-wider mb-3">
              Choose your path
            </div>

            <div className="space-y-2.5">
              {node.options?.map((option, index) => (
                <button
                  key={option.id}
                  onClick={() => { setSelectedId(option.id); setShowClarify(false); }}
                  className={`w-full text-left p-3.5 rounded-lg border transition-all ${
                    selectedId === option.id
                      ? "border-cosmos-judgment bg-cosmos-judgment/10 ring-1 ring-cosmos-judgment/20"
                      : "border-cosmos-border/40 hover:border-cosmos-judgment/30 bg-cosmos-bg/30"
                  }`}
                >
                  <div className="text-xs font-medium text-cosmos-text mb-0.5">
                    {String.fromCharCode(65 + index)}. {option.label}
                  </div>
                  <div className="text-[11px] text-cosmos-muted leading-relaxed">{option.description}</div>
                  {option.tradeoffs && option.tradeoffs.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-cosmos-border/20">
                      <div className="text-[10px] text-cosmos-judgment/60 mb-1">Trade-offs:</div>
                      <ul className="text-[11px] text-cosmos-muted/70 space-y-0.5">
                        {option.tradeoffs.map((t, i) => (
                          <li key={i}>&bull; {t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {option.consequences && option.consequences.length > 0 && (
                    <div className="mt-1.5">
                      <div className="text-[10px] text-cosmos-conflict/60 mb-1">Consequences:</div>
                      <ul className="text-[11px] text-cosmos-muted/70 space-y-0.5">
                        {option.consequences.map((c, i) => (
                          <li key={i}>&bull; {c}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Confirm */}
          {selectedId && !showClarify && (
            <button
              onClick={handleResolve}
              disabled={isResolving}
              className="w-full py-2.5 bg-cosmos-judgment/20 border border-cosmos-judgment/40 rounded-lg text-cosmos-judgment text-sm font-medium hover:bg-cosmos-judgment/30 disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {isResolving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
              {isResolving ? "Processing..." : "Confirm choice"}
            </button>
          )}

          {/* Clarify */}
          {!showClarify ? (
            <button
              onClick={() => { setShowClarify(true); setSelectedId(null); }}
              className="w-full py-2 text-xs text-cosmos-muted/50 hover:text-cosmos-glow transition-colors"
            >
              None of these fit? Clarify your situation instead
            </button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-cosmos-muted/60">
                Explain what the AI got wrong or what it&apos;s missing about your situation.
              </p>
              <textarea
                value={clarifyText}
                onChange={(e) => setClarifyText(e.target.value)}
                placeholder={"e.g., \"This doesn't apply because...\" or \"Actually, my situation is...\""}
                className="w-full bg-cosmos-bg/50 border border-cosmos-border/40 rounded-lg px-4 py-3 text-sm text-cosmos-text placeholder:text-cosmos-muted/30 focus:outline-none focus:border-cosmos-glow/50 resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleClarify}
                  disabled={!clarifyText.trim() || isResolving}
                  className="flex-1 py-2 bg-cosmos-glow/20 border border-cosmos-glow/30 rounded-lg text-cosmos-glow text-sm disabled:opacity-30 flex items-center justify-center gap-1"
                >
                  Send <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => { setShowClarify(false); setClarifyText(""); }}
                  className="px-4 py-2 border border-cosmos-border/40 rounded-lg text-cosmos-muted text-sm"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ChatView() {
  const {
    nodes, critique, isDecomposing, chatMessages, addChatMessage,
    goalText, values, addNodes, addValues, setCritique, setIsDecomposing,
    loadingNotes, setLoadingNotes,
  } = useStore();

  const [inputText, setInputText] = useState("");
  const [showTree, setShowTree] = useState(true);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { flowNodes, flowEdges } = useMemo(() => layoutTree(nodes), [nodes]);
  const [rfNodes, , onNodesChange] = useNodesState(flowNodes);
  const [rfEdges, , onEdgesChange] = useEdgesState(flowEdges);

  const nodeList = Object.values(nodes);
  const pendingJudgments = nodeList.filter((n) => n.type === "judgment" && n.status !== "resolved");
  const resolvedCount = nodeList.filter((n) => n.type === "resolved").length;

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages, pendingJudgments.length]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

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
    if (inputRef.current) inputRef.current.style.height = "auto";

    setIsDecomposing(true);
    try {
      const data = await safeFetch("/api/decompose", {
        goal: `${goalText}\n\n--- User message ---\n${text}`,
        existingNodes: Object.values(nodes),
        existingValues: values,
      });
      if (data.nodes && (data.nodes as DecisionNode[]).length > 0) {
        addNodes(data.nodes);
        const msgJudgments = (data.nodes as DecisionNode[]).filter((n: DecisionNode) => n.type === "judgment");
        addChatMessage({
          id: `sys-${Date.now()}`,
          role: "system",
          content: msgJudgments.length > 0
            ? `I've factored that in and updated the plan. ${msgJudgments.length} new decision${msgJudgments.length !== 1 ? "s" : ""} surfaced that could use your input.`
            : `Good to know. I've incorporated that into the plan.`,
          timestamp: Date.now(),
        });
      } else {
        addChatMessage({
          id: `sys-${Date.now()}`,
          role: "system",
          content: `Noted. That doesn't change the current structure, but I'll keep it in mind. If there's a pending decision above, that's the next step.`,
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

      {/* Main chat area — full width when tree is hidden */}
      <div className={`${showTree ? "flex-1" : "w-full"} h-full flex flex-col bg-cosmos-bg/95 backdrop-blur-md z-20 relative`}>
        {/* Top bar */}
        <div className="px-4 py-2.5 border-b border-cosmos-border/30 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-cosmos-muted/50 uppercase tracking-wider">Format</span>
            <select
              value="chat"
              onChange={(e) => useStore.getState().setViewMode(e.target.value as "tree" | "notebook" | "chat")}
              className="bg-cosmos-surface/60 border border-cosmos-border/40 rounded-lg px-2.5 py-1.5 text-xs text-cosmos-text focus:outline-none focus:border-cosmos-glow/50 cursor-pointer"
            >
              <option value="tree">Tree</option>
              <option value="notebook">Notebook</option>
              <option value="chat">Dialogue</option>
            </select>

            <div className="text-[11px] text-cosmos-muted/50">
              {nodeList.length > 0 && (
                <span>{resolvedCount}/{nodeList.filter(n => n.type === "judgment" || n.type === "resolved").length} decisions resolved</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <button
              onClick={() => {
                if (confirm("This will download your session as a JSON file. You can reload it later with \"Resume from file\" on the home screen.\n\nDownload now?")) {
                  useStore.getState().saveCurrentSession();
                }
              }}
              className="px-2.5 py-1.5 text-xs rounded-lg border bg-cosmos-surface/60 border-cosmos-border text-cosmos-muted hover:border-cosmos-resolved/30 hover:text-cosmos-resolved transition-all"
              title="Download session as a file you can resume later"
            >
              Save to file
            </button>
            <button
              onClick={() => useStore.getState().toggleValuePanel()}
              className="px-2.5 py-1.5 text-xs rounded-lg border bg-cosmos-surface/60 border-cosmos-border text-cosmos-muted hover:border-cosmos-glow/30 transition-all"
            >
              Values
            </button>
            <button
              onClick={() => setShowTree(!showTree)}
              className="px-2.5 py-1.5 text-xs rounded-lg border bg-cosmos-surface/60 border-cosmos-border text-cosmos-muted hover:border-cosmos-glow/30 transition-all flex items-center gap-1"
            >
              {showTree ? <PanelRightClose className="w-3.5 h-3.5" /> : <PanelRightOpen className="w-3.5 h-3.5" />}
              Tree
            </button>
          </div>
        </div>

        {/* Chat messages — centered, ChatGPT-style */}
        <div className="flex-1 overflow-y-auto">
          {chatMessages.length === 0 && pendingJudgments.length === 0 && (
            <div className="max-w-2xl mx-auto px-6 py-16 text-center">
              <MessageSquare className="w-8 h-8 text-cosmos-muted/20 mx-auto mb-3" />
              <p className="text-sm text-cosmos-muted/50 mb-1">Your conversation will appear here</p>
              <p className="text-xs text-cosmos-muted/30">
                Make decisions on the tree, or type a message to add context and explore further.
              </p>
            </div>
          )}

          {chatMessages.map((msg) => (
            <ChatBubble key={msg.id} message={msg} />
          ))}

          {/* Inline decision prompts — one at a time with conversational framing */}
          {pendingJudgments.length > 0 && (
            <>
              {/* Conversational intro for the current judgment */}
              <motion.div
                key={`intro-${pendingJudgments[0].id}`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="py-4 bg-cosmos-surface/40"
              >
                <div className="max-w-2xl mx-auto px-6">
                  <div className="flex gap-3">
                    <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-medium bg-cosmos-surface border border-cosmos-border text-cosmos-muted">
                      C
                    </div>
                    <div className="flex-1 text-sm text-cosmos-text/80 leading-relaxed pt-0.5">
                      <p>
                        {pendingJudgments[0].conflict
                          ? pendingJudgments[0].conflict
                          : `This next part depends on your call. ${pendingJudgments[0].description || ""}`}
                      </p>
                      {pendingJudgments.length > 1 && (
                        <p className="text-xs text-cosmos-muted/50 mt-2">
                          {pendingJudgments.length - 1} more decision{pendingJudgments.length - 1 !== 1 ? "s" : ""} after this one.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Show only the first pending judgment */}
              <ChatDecisionPrompt key={pendingJudgments[0].id} node={pendingJudgments[0]} />
            </>
          )}

          {isDecomposing && (
            <div className="py-4 bg-cosmos-surface/40">
              <div className="max-w-2xl mx-auto px-6 flex items-center gap-3 text-sm text-cosmos-muted/60">
                <Loader2 className="w-4 h-4 animate-spin" />
                Thinking...
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Chat input — bottom, centered, ChatGPT-style */}
        <div className="border-t border-cosmos-border/20 bg-cosmos-bg/80">
          <div className="max-w-2xl mx-auto px-6 py-4">
            <div className="relative bg-cosmos-surface/60 border border-cosmos-border/40 rounded-2xl focus-within:border-cosmos-glow/50 transition-all">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Message Cascade..."
                className="w-full bg-transparent px-4 py-3.5 pr-12 text-sm text-cosmos-text placeholder:text-cosmos-muted/40 focus:outline-none resize-none max-h-[200px]"
                rows={1}
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputText.trim() || isDecomposing}
                className="absolute right-2 bottom-2 p-2 bg-cosmos-glow/20 border border-cosmos-glow/30 rounded-xl text-cosmos-glow hover:bg-cosmos-glow/30 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-cosmos-muted/30 text-center mt-2">
              Add context, ask questions, or provide additional details about your goal.
            </p>
          </div>
        </div>
      </div>

      {/* Right: Tree panel — collapsible */}
      <AnimatePresence>
        {showTree && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: "45%", opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full border-l border-cosmos-border/30 relative z-10 overflow-hidden"
          >
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
          </motion.div>
        )}
      </AnimatePresence>

      <GuidePanel />
    </div>
  );
}

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  CircleDot,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  AlertCircle,
  ChevronRight,
  X,
  MessageSquare,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { DecisionNode } from "@/types";
import { useStore } from "@/store/useStore";
import { safeFetch } from "@/lib/api";

const iconMap: Record<string, typeof Target> = {
  goal: Target,
  reckoning: CircleDot,
  judgment: AlertTriangle,
  resolved: CheckCircle2,
  counterfactual: GitBranch,
};

const typeLabels: Record<string, string> = {
  goal: "Your Goal",
  reckoning: "AI Reckoning",
  judgment: "Judgment Needed",
  resolved: "Resolved",
  counterfactual: "Alternate Path",
};

const typeColors: Record<string, string> = {
  goal: "text-cosmos-glow",
  reckoning: "text-cosmos-reckoning",
  judgment: "text-cosmos-judgment",
  resolved: "text-cosmos-resolved",
  counterfactual: "text-purple-400",
};

interface Props {
  node: DecisionNode;
}

export default function NodeDetailPanel({ node }: Props) {
  const {
    setInspectedNode, setActiveJudgment, setCounterfactualNode,
    nodes, goalText, values, addNodes, addValues, setCritique, setIsDecomposing,
  } = useStore();
  const [showClarify, setShowClarify] = useState(false);
  const [clarifyText, setClarifyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [clarified, setClarified] = useState(false);

  const Icon = iconMap[node.type] || CircleDot;
  const color = typeColors[node.type] || "text-cosmos-muted";
  const label = typeLabels[node.type] || node.type;

  const children = Object.values(nodes).filter((n) => n.parentId === node.id);
  const parent = node.parentId ? nodes[node.parentId] : null;

  const canClarify = node.type === "reckoning" || node.type === "goal";

  const handleClarify = async () => {
    if (!clarifyText.trim()) return;
    setIsSending(true);
    setIsDecomposing(true);

    try {
      const data = await safeFetch("/api/decompose", {
        goal: goalText,
        existingNodes: Object.values(nodes),
        existingValues: values,
        judgmentContext: {
          nodeId: node.id,
          chosenOption: `User added context to "${node.label}": "${clarifyText}"`,
        },
      });
      if (data.nodes) addNodes(data.nodes);
      if (data.values) addValues(data.values);
      if (data.critique) setCritique(data.critique);
      setClarified(true);
      setShowClarify(false);
      setClarifyText("");
    } catch (err) {
      console.error("Clarify failed:", err);
    } finally {
      setIsSending(false);
      setIsDecomposing(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        className="absolute top-0 right-0 h-full w-[400px] bg-cosmos-surface/95 backdrop-blur-md border-l border-cosmos-border z-50 overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Icon className={`w-5 h-5 ${color}`} />
              <span className={`text-xs font-medium uppercase tracking-wider ${color}`}>
                {label}
              </span>
            </div>
            <button
              onClick={() => setInspectedNode(null)}
              className="text-cosmos-muted hover:text-cosmos-text transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title & description */}
          <h3 className="text-base font-semibold text-cosmos-text mb-2">{node.label}</h3>
          <p className="text-sm text-cosmos-muted leading-relaxed mb-5">{node.description}</p>

          {/* Reckoning explanation */}
          {node.type === "reckoning" && (
            <div className="mb-5 p-3 bg-cosmos-reckoning/5 border border-cosmos-reckoning/15 rounded-lg">
              <p className="text-xs text-cosmos-muted">
                This is a <span className="text-cosmos-reckoning font-medium">reckoning node</span> &mdash;
                the AI determined this step based on logic and facts. No value judgment was needed here.
              </p>
            </div>
          )}

          {/* Goal explanation */}
          {node.type === "goal" && (
            <div className="mb-5 p-3 bg-cosmos-glow/5 border border-cosmos-glow/15 rounded-lg">
              <p className="text-xs text-cosmos-muted">
                This is your starting point. The AI decomposed this goal into the branches you see in the tree.
              </p>
            </div>
          )}

          {/* Judgment action */}
          {node.type === "judgment" && node.status === "conflict" && (
            <div className="mb-5">
              {node.conflict && (
                <div className="mb-3 p-3 bg-cosmos-judgment/10 border border-cosmos-judgment/20 rounded-lg">
                  <div className="text-xs font-medium text-cosmos-judgment mb-1">The conflict</div>
                  <p className="text-sm text-cosmos-text/80">{node.conflict}</p>
                </div>
              )}
              <button
                onClick={() => {
                  setInspectedNode(null);
                  setActiveJudgment(node.id);
                }}
                className="w-full py-3 flex items-center justify-center gap-2 bg-cosmos-judgment/20 border border-cosmos-judgment/40 rounded-lg text-cosmos-judgment font-semibold text-sm hover:bg-cosmos-judgment/30 transition-all"
              >
                Open decision panel
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Resolved info + what-if */}
          {node.type === "resolved" && node.selectedOption && (
            <div className="mb-5">
              <div className="p-3 bg-cosmos-resolved/10 border border-cosmos-resolved/20 rounded-lg mb-3">
                <div className="text-xs font-medium text-cosmos-resolved mb-1">You chose</div>
                <p className="text-sm text-cosmos-text/80">
                  {node.options?.find((o) => o.id === node.selectedOption)?.label || node.selectedOption}
                </p>
                {node.options?.find((o) => o.id === node.selectedOption)?.description && (
                  <p className="text-xs text-cosmos-muted mt-1">
                    {node.options.find((o) => o.id === node.selectedOption)?.description}
                  </p>
                )}
              </div>
              {node.options && node.options.length > 1 && (
                <button
                  onClick={() => {
                    setInspectedNode(null);
                    setCounterfactualNode(node.id);
                  }}
                  className="w-full py-2.5 flex items-center justify-center gap-2 border border-purple-500/30 rounded-lg text-purple-400 text-sm hover:bg-purple-500/10 transition-all"
                >
                  Explore &ldquo;What if?&rdquo;
                </button>
              )}
            </div>
          )}

          {/* Blind spots */}
          {node.blindSpots && node.blindSpots.length > 0 && (
            <div className="mb-5">
              <div className="text-xs font-medium text-cosmos-conflict/80 uppercase tracking-wider mb-2">
                Blind spots
              </div>
              <div className="space-y-2">
                {node.blindSpots.map((bs, i) => (
                  <div key={i} className="flex items-start gap-2 p-2.5 bg-cosmos-conflict/5 border border-cosmos-conflict/15 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 text-cosmos-conflict/70 mt-0.5 shrink-0" />
                    <span className="text-xs text-cosmos-text/70">{bs}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Value implications */}
          {node.valueImplications && node.valueImplications.length > 0 && (
            <div className="mb-5">
              <div className="text-xs font-medium text-cosmos-glow/80 uppercase tracking-wider mb-2">
                This choice reveals your values
              </div>
              <ul className="space-y-1">
                {node.valueImplications.map((v, i) => (
                  <li key={i} className="text-xs text-cosmos-muted flex items-start gap-2">
                    <span className="text-cosmos-glow mt-1">&bull;</span>
                    {v}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Stakes */}
          {node.stakes && (
            <div className="mb-5 p-3 bg-cosmos-conflict/5 border border-cosmos-conflict/15 rounded-lg">
              <div className="text-xs font-medium text-cosmos-conflict/70 mb-1">What&apos;s at stake</div>
              <p className="text-xs text-cosmos-text/70">{node.stakes}</p>
            </div>
          )}

          {/* Add context / clarify — for reckoning and goal nodes */}
          {canClarify && (
            <div className="mb-5">
              {clarified && !showClarify && (
                <div className="mb-3 p-2.5 bg-cosmos-resolved/10 border border-cosmos-resolved/20 rounded-lg">
                  <p className="text-xs text-cosmos-resolved">Context added — the tree has been updated.</p>
                </div>
              )}

              {!showClarify ? (
                <button
                  onClick={() => setShowClarify(true)}
                  className="w-full py-2.5 px-4 border border-cosmos-border rounded-lg text-cosmos-muted text-xs hover:border-cosmos-glow/30 hover:text-cosmos-glow transition-all flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  Add context or correct something
                </button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-3"
                >
                  <div className="text-xs text-cosmos-glow font-medium">
                    Add your context
                  </div>
                  <p className="text-[11px] text-cosmos-muted/60">
                    Is something wrong or missing? Add details the AI might not know.
                    For example: your audience, constraints, or why a blind spot
                    doesn&apos;t apply to your case.
                  </p>
                  <textarea
                    value={clarifyText}
                    onChange={(e) => setClarifyText(e.target.value)}
                    placeholder='e.g., "My target audience is specifically 4-5 year olds, not the full 3-5 range" or "We already have a legal team handling COPPA"'
                    className="w-full bg-cosmos-bg border border-cosmos-border rounded-lg px-4 py-3 text-sm text-cosmos-text placeholder:text-cosmos-muted/30 focus:outline-none focus:border-cosmos-glow/50 resize-none transition-all"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleClarify}
                      disabled={!clarifyText.trim() || isSending}
                      className="flex-1 py-2.5 bg-cosmos-glow/20 border border-cosmos-glow/30 rounded-lg text-cosmos-glow text-xs font-medium hover:bg-cosmos-glow/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isSending ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Updating tree...
                        </>
                      ) : (
                        <>
                          Send
                          <ArrowRight className="w-3 h-3" />
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        setShowClarify(false);
                        setClarifyText("");
                      }}
                      className="px-4 py-2.5 border border-cosmos-border rounded-lg text-cosmos-muted text-xs hover:border-cosmos-muted/50 transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Tree context */}
          <div className="pt-4 border-t border-cosmos-border/30 space-y-3">
            {parent && (
              <div>
                <div className="text-[10px] text-cosmos-muted/40 uppercase tracking-wider mb-1">Parent</div>
                <button
                  onClick={() => setInspectedNode(parent.id)}
                  className="text-xs text-cosmos-glow/70 hover:text-cosmos-glow transition-colors"
                >
                  &larr; {parent.label}
                </button>
              </div>
            )}
            {children.length > 0 && (
              <div>
                <div className="text-[10px] text-cosmos-muted/40 uppercase tracking-wider mb-1.5">
                  Branches ({children.length})
                </div>
                <div className="space-y-1">
                  {children.map((child) => {
                    const ChildIcon = iconMap[child.type] || CircleDot;
                    const childColor = typeColors[child.type] || "text-cosmos-muted";
                    return (
                      <button
                        key={child.id}
                        onClick={() => setInspectedNode(child.id)}
                        className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-cosmos-border/20 transition-colors"
                      >
                        <ChildIcon className={`w-3 h-3 ${childColor}`} />
                        <span className="text-xs text-cosmos-muted truncate">{child.label}</span>
                        <ChevronRight className="w-3 h-3 text-cosmos-muted/30 ml-auto shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

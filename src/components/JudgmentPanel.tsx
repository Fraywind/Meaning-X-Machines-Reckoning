"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DecisionNode } from "@/types";
import { useStore } from "@/store/useStore";

interface Props {
  node: DecisionNode;
}

export default function JudgmentPanel({ node }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    resolveJudgment,
    setActiveJudgment,
    goalText,
    nodes,
    values,
    addNodes,
    addValues,
    setCritique,
    setIsDecomposing,
  } = useStore();

  const handleResolve = async () => {
    if (!selectedId) return;
    setIsSubmitting(true);

    resolveJudgment(node.id, selectedId);

    // Trigger further decomposition based on this choice
    setIsDecomposing(true);
    try {
      const res = await fetch("/api/decompose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: goalText,
          existingNodes: Object.values(nodes),
          existingValues: values,
          judgmentContext: {
            nodeId: node.id,
            chosenOption:
              node.options?.find((o) => o.id === selectedId)?.label || selectedId,
          },
        }),
      });
      const data = await res.json();
      if (data.nodes) addNodes(data.nodes);
      if (data.values) addValues(data.values);
      if (data.critique) setCritique(data.critique);
    } catch (err) {
      console.error("Failed to continue decomposition:", err);
    } finally {
      setIsDecomposing(false);
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: 400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: 400, opacity: 0 }}
        className="absolute top-0 right-0 h-full w-[440px] bg-cosmos-surface/95 backdrop-blur-md border-l border-cosmos-judgment/30 z-50 overflow-y-auto"
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-cosmos-judgment text-lg">&#9888;</span>
              <h2 className="text-lg font-medium text-cosmos-text">Judgment Required</h2>
            </div>
            <button
              onClick={() => setActiveJudgment(null)}
              className="text-cosmos-muted hover:text-cosmos-text transition-colors"
            >
              &#10005;
            </button>
          </div>

          {/* Conflict description */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-cosmos-judgment mb-2">{node.label}</h3>
            <p className="text-sm text-cosmos-muted">{node.description}</p>
          </div>

          {/* Stakes */}
          {node.stakes && (
            <div className="mb-6 p-3 bg-cosmos-conflict/10 border border-cosmos-conflict/20 rounded-lg">
              <div className="text-xs font-medium text-cosmos-conflict mb-1">What&apos;s at stake</div>
              <p className="text-sm text-cosmos-text/80">{node.stakes}</p>
            </div>
          )}

          {/* Conflict */}
          {node.conflict && (
            <div className="mb-6 p-3 bg-cosmos-judgment/10 border border-cosmos-judgment/20 rounded-lg">
              <div className="text-xs font-medium text-cosmos-judgment mb-1">The conflict</div>
              <p className="text-sm text-cosmos-text/80">{node.conflict}</p>
            </div>
          )}

          {/* Options */}
          <div className="space-y-3 mb-6">
            <div className="text-xs font-medium text-cosmos-muted uppercase tracking-wider">
              Your options
            </div>
            {node.options?.map((option) => (
              <button
                key={option.id}
                onClick={() => setSelectedId(option.id)}
                className={`w-full text-left p-4 rounded-lg border transition-all ${
                  selectedId === option.id
                    ? "border-cosmos-judgment bg-cosmos-judgment/10"
                    : "border-cosmos-border hover:border-cosmos-judgment/30 bg-cosmos-bg"
                }`}
              >
                <div className="text-sm font-medium text-cosmos-text mb-1">{option.label}</div>
                <div className="text-xs text-cosmos-muted mb-2">{option.description}</div>
                {option.tradeoffs.length > 0 && (
                  <div className="mb-2">
                    <div className="text-xs text-cosmos-judgment/70 mb-1">Trade-offs:</div>
                    <ul className="text-xs text-cosmos-muted space-y-0.5">
                      {option.tradeoffs.map((t, i) => (
                        <li key={i}>&#8226; {t}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {option.consequences.length > 0 && (
                  <div>
                    <div className="text-xs text-cosmos-conflict/70 mb-1">Consequences:</div>
                    <ul className="text-xs text-cosmos-muted space-y-0.5">
                      {option.consequences.map((c, i) => (
                        <li key={i}>&#8226; {c}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Value implications */}
          {node.valueImplications && node.valueImplications.length > 0 && (
            <div className="mb-6 p-3 bg-cosmos-glow/5 border border-cosmos-glow/20 rounded-lg">
              <div className="text-xs font-medium text-cosmos-glow mb-1">
                This choice reveals your values
              </div>
              <ul className="text-xs text-cosmos-muted space-y-0.5">
                {node.valueImplications.map((v, i) => (
                  <li key={i}>&#8226; {v}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleResolve}
            disabled={!selectedId || isSubmitting}
            className="w-full py-3 bg-cosmos-judgment/20 border border-cosmos-judgment/40 rounded-lg text-cosmos-judgment font-medium hover:bg-cosmos-judgment/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Processing your judgment..." : "Make this judgment call"}
          </button>

          <p className="text-xs text-cosmos-muted/50 text-center mt-3">
            You can revisit this decision later to explore the road not taken.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

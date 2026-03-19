"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DecisionNode } from "@/types";
import { useStore } from "@/store/useStore";

interface Props {
  node: DecisionNode;
}

export default function CounterfactualPanel({ node }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [comparison, setComparison] = useState<string | null>(null);
  const [insights, setInsights] = useState<string[]>([]);
  const { setCounterfactualNode, goalText, values, addNodes } = useStore();

  const chosenOption = node.options?.find((o) => o.id === node.selectedOption);
  const alternateOptions = node.options?.filter((o) => o.id !== node.selectedOption) || [];

  const handleExplore = async (alternateOption: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/counterfactual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          goal: goalText,
          node,
          chosenOption: chosenOption?.label || node.selectedOption,
          alternateOption,
          existingValues: values,
        }),
      });
      const data = await res.json();
      if (data.alternateNodes) addNodes(data.alternateNodes);
      if (data.comparison) setComparison(data.comparison);
      if (data.insightsRevealed) setInsights(data.insightsRevealed);
    } catch (err) {
      console.error("Counterfactual failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ y: 400, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 400, opacity: 0 }}
      className="absolute bottom-0 left-0 right-0 h-[45vh] bg-cosmos-surface/95 backdrop-blur-md border-t border-purple-500/30 z-50 overflow-y-auto"
    >
      <div className="p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-purple-400 text-lg">&#8756;</span>
            <h2 className="text-lg font-medium text-cosmos-text">Counterfactual: What if?</h2>
          </div>
          <button
            onClick={() => setCounterfactualNode(null)}
            className="text-cosmos-muted hover:text-cosmos-text transition-colors"
          >
            &#10005;
          </button>
        </div>

        <div className="mb-4">
          <p className="text-sm text-cosmos-muted">
            At <span className="text-cosmos-text font-medium">{node.label}</span>, you chose{" "}
            <span className="text-cosmos-resolved font-medium">{chosenOption?.label}</span>.
          </p>
        </div>

        {/* Alternate options to explore */}
        {!comparison && (
          <div className="space-y-3">
            <p className="text-xs text-cosmos-muted uppercase tracking-wider">
              Explore alternate timelines
            </p>
            {alternateOptions.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleExplore(opt.label)}
                disabled={isLoading}
                className="w-full text-left p-4 rounded-lg border border-purple-500/20 bg-purple-500/5 hover:border-purple-500/40 transition-all disabled:opacity-50"
              >
                <div className="text-sm font-medium text-purple-300">
                  What if: {opt.label}?
                </div>
                <div className="text-xs text-cosmos-muted mt-1">{opt.description}</div>
              </button>
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-sm text-purple-400">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
                Unfolding alternate timeline...
              </div>
            )}
          </div>
        )}

        {/* Comparison view */}
        {comparison && (
          <div className="space-y-4">
            <div className="p-4 bg-cosmos-bg rounded-lg border border-purple-500/20">
              <h3 className="text-sm font-medium text-purple-300 mb-2">Path Comparison</h3>
              <p className="text-sm text-cosmos-text/80 whitespace-pre-wrap">{comparison}</p>
            </div>

            {insights.length > 0 && (
              <div className="p-4 bg-cosmos-glow/5 border border-cosmos-glow/20 rounded-lg">
                <h3 className="text-sm font-medium text-cosmos-glow mb-2">Insights Revealed</h3>
                <ul className="space-y-1">
                  {insights.map((insight, i) => (
                    <li key={i} className="text-sm text-cosmos-text/80">
                      &#8226; {insight}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => {
                setComparison(null);
                setInsights([]);
              }}
              className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
            >
              &larr; Explore another alternate timeline
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

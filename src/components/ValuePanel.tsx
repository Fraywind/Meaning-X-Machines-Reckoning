"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, TrendingUp, TrendingDown, Minus, Info } from "lucide-react";
import { useStore } from "@/store/useStore";
import { UserValue } from "@/types";

function ValueCard({ value }: { value: UserValue }) {
  const [expanded, setExpanded] = useState(false);
  const nodes = useStore((s) => s.nodes);

  // Resolve source node labels
  const sourceNodes = value.sourceNodeIds
    .map((id) => nodes[id])
    .filter(Boolean);

  return (
    <div className="rounded-lg border border-cosmos-border bg-cosmos-bg overflow-hidden">
      {/* Summary row — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 hover:bg-cosmos-border/10 transition-colors"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-medium text-cosmos-text">{value.label}</h3>
          <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-cosmos-border rounded-full overflow-hidden">
              <div
                className="h-full bg-cosmos-glow rounded-full transition-all duration-500"
                style={{ width: `${value.strength * 100}%` }}
              />
            </div>
            <span className="text-xs text-cosmos-muted w-8 text-right">
              {Math.round(value.strength * 100)}%
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-cosmos-muted transition-transform duration-200 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </div>
        </div>
        <p className="text-xs text-cosmos-muted">{value.description}</p>

        {value.contradictions && value.contradictions.length > 0 && (
          <div className="mt-2 p-2 bg-cosmos-conflict/10 border border-cosmos-conflict/20 rounded">
            <div className="text-xs text-cosmos-conflict">Potential contradiction:</div>
            {value.contradictions.map((c, i) => (
              <p key={i} className="text-xs text-cosmos-muted mt-0.5">
                {c}
              </p>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center gap-1.5 text-xs text-cosmos-muted/50">
          <Info className="w-3 h-3" />
          <span>
            Revealed by {value.sourceNodeIds.length} decision
            {value.sourceNodeIds.length !== 1 ? "s" : ""} &mdash; tap for details
          </span>
        </div>
      </button>

      {/* Expanded detail — only on click */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-cosmos-border/50 pt-3">
              {/* Reasoning */}
              {value.reasoning && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-cosmos-glow/60 mb-1.5">
                    Why this score
                  </div>
                  <p className="text-xs text-cosmos-text/80 leading-relaxed">
                    {value.reasoning}
                  </p>
                </div>
              )}

              {/* Tradeoff impacts */}
              {value.tradeoffImpacts && value.tradeoffImpacts.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-cosmos-glow/60 mb-1.5">
                    Tradeoff impacts on score
                  </div>
                  <div className="space-y-1.5">
                    {value.tradeoffImpacts.map((impact, i) => {
                      // Try to detect if impact is positive or negative
                      const isPositive = /\+|\bincreased\b|\braised\b|\bhigher\b|\bstrengthened\b/i.test(impact);
                      const isNegative = /\-|\bdecreased\b|\blowered\b|\breduced\b|\bweakened\b/i.test(impact);
                      const ImpactIcon = isPositive
                        ? TrendingUp
                        : isNegative
                          ? TrendingDown
                          : Minus;
                      const impactColor = isPositive
                        ? "text-cosmos-resolved"
                        : isNegative
                          ? "text-cosmos-conflict"
                          : "text-cosmos-muted";

                      return (
                        <div
                          key={i}
                          className="flex items-start gap-2 p-2 bg-cosmos-surface rounded border border-cosmos-border/30"
                        >
                          <ImpactIcon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${impactColor}`} />
                          <span className="text-xs text-cosmos-text/70">{impact}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Source decisions */}
              {sourceNodes.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-cosmos-glow/60 mb-1.5">
                    Decisions that revealed this
                  </div>
                  <div className="space-y-1">
                    {sourceNodes.map((node) => (
                      <div
                        key={node.id}
                        className="flex items-center gap-2 text-xs text-cosmos-muted/70"
                      >
                        <div
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            node.type === "resolved"
                              ? "bg-cosmos-resolved"
                              : node.type === "judgment"
                                ? "bg-cosmos-judgment"
                                : "bg-cosmos-reckoning"
                          }`}
                        />
                        <span className="truncate">{node.label}</span>
                        {node.selectedOption && node.options && (
                          <span className="text-cosmos-resolved/60 shrink-0">
                            &rarr; {node.options.find((o) => o.id === node.selectedOption)?.label}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* No reasoning fallback */}
              {!value.reasoning && (!value.tradeoffImpacts || value.tradeoffImpacts.length === 0) && (
                <p className="text-xs text-cosmos-muted/40 italic">
                  Score reasoning will become more detailed as you make more decisions.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ValuePanel() {
  const { values, toggleValuePanel } = useStore();

  return (
    <motion.div
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -400, opacity: 0 }}
      className="absolute top-0 left-0 h-full w-[380px] bg-cosmos-surface/95 backdrop-blur-md border-r border-cosmos-glow/20 z-50 overflow-y-auto"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium text-cosmos-text">Values Mirror</h2>
            <p className="text-xs text-cosmos-muted mt-1">
              Built from your choices, not your words
            </p>
          </div>
          <button
            onClick={toggleValuePanel}
            className="text-cosmos-muted hover:text-cosmos-text transition-colors"
          >
            &times;
          </button>
        </div>

        {values.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3 opacity-30">&#9826;</div>
            <p className="text-sm text-cosmos-muted">
              Your values will emerge as you make judgment calls.
            </p>
            <p className="text-xs text-cosmos-muted/50 mt-2">
              This mirror reflects what your choices reveal about your priorities.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-[10px] text-cosmos-muted/40 uppercase tracking-wider">
              Tap any value to see why it&apos;s scored this way
            </p>
            {values
              .sort((a, b) => b.strength - a.strength)
              .map((value) => (
                <ValueCard key={value.id} value={value} />
              ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

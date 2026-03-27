"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, TrendingUp, TrendingDown, Minus, Info, ArrowRight } from "lucide-react";
import { useStore } from "@/store/useStore";
import { UserValue } from "@/types";

/**
 * Extract what this value was traded against from tradeoffImpacts.
 * Returns the most meaningful tension label if found.
 */
function extractTension(value: UserValue, allValues: UserValue[]): string | null {
  // Look through tradeoff impacts for mentions of other values
  if (value.tradeoffImpacts && value.tradeoffImpacts.length > 0) {
    for (const impact of value.tradeoffImpacts) {
      const lower = impact.toLowerCase();
      for (const other of allValues) {
        if (other.id !== value.id && lower.includes(other.label.toLowerCase())) {
          return other.label;
        }
      }
    }
  }

  // Check contradictions
  if (value.contradictions && value.contradictions.length > 0) {
    for (const contradiction of value.contradictions) {
      const lower = contradiction.toLowerCase();
      for (const other of allValues) {
        if (other.id !== value.id && lower.includes(other.label.toLowerCase())) {
          return other.label;
        }
      }
    }
  }

  return null;
}

function ValueCard({ value, allValues }: { value: UserValue; allValues: UserValue[] }) {
  const [expanded, setExpanded] = useState(false);
  const nodes = useStore((s) => s.nodes);

  // Resolve source node labels
  const sourceNodes = value.sourceNodeIds
    .map((id) => nodes[id])
    .filter(Boolean);

  // Find what this value is in tension with
  const tensionLabel = useMemo(() => extractTension(value, allValues), [value, allValues]);

  // Get the most relevant source decision for the "because" line
  const keyDecision = sourceNodes.find((n) => n.type === "resolved" && n.selectedOption && n.options);
  const keyDecisionLabel = keyDecision
    ? `${keyDecision.label} → ${keyDecision.options?.find((o) => o.id === keyDecision.selectedOption)?.label || keyDecision.selectedOption}`
    : null;

  return (
    <div className="rounded-lg border border-cosmos-border bg-cosmos-bg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full text-left p-4 hover:bg-cosmos-border/10 transition-colors"
      >
        {/* Tension spectrum or value name */}
        {tensionLabel ? (
          <div className="mb-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-cosmos-glow">{value.label}</span>
              <span className="text-xs font-medium text-cosmos-judgment/70">{tensionLabel}</span>
            </div>
            {/* Spectrum bar */}
            <div className="relative h-2 bg-cosmos-border/40 rounded-full overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full rounded-full transition-all duration-500"
                style={{
                  width: `${value.strength * 100}%`,
                  background: `linear-gradient(90deg, rgb(var(--glow)), rgb(var(--glow) / 0.4))`,
                }}
              />
              {/* Center marker */}
              <div className="absolute top-0 left-1/2 w-px h-full bg-cosmos-muted/20" />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[9px] text-cosmos-muted/40">you lean here</span>
              <span className="text-[9px] text-cosmos-muted/40">
                {value.strength >= 0.6 ? "strong" : value.strength >= 0.4 ? "balanced" : "mild"}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-cosmos-text">{value.label}</h3>
            <div className="flex items-center gap-2">
              <div className="w-14 h-1.5 bg-cosmos-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-cosmos-glow rounded-full transition-all duration-500"
                  style={{ width: `${value.strength * 100}%` }}
                />
              </div>
              <span className="text-[10px] text-cosmos-muted/50">
                {value.strength >= 0.7 ? "strong" : value.strength >= 0.4 ? "moderate" : "emerging"}
              </span>
            </div>
          </div>
        )}

        {/* Grounded "because" line */}
        {keyDecisionLabel ? (
          <p className="text-[11px] text-cosmos-muted leading-relaxed">
            Because you chose <span className="text-cosmos-text/70">{keyDecisionLabel}</span>
          </p>
        ) : (
          <p className="text-xs text-cosmos-muted">{value.description}</p>
        )}

        {value.contradictions && value.contradictions.length > 0 && (
          <div className="mt-2 p-2 bg-cosmos-conflict/10 border border-cosmos-conflict/20 rounded">
            <div className="text-xs text-cosmos-conflict">Tension detected:</div>
            {value.contradictions.map((c, i) => (
              <p key={i} className="text-xs text-cosmos-muted mt-0.5">
                {c}
              </p>
            ))}
          </div>
        )}

        <div className="mt-2 flex items-center justify-between">
          <span className="text-[10px] text-cosmos-muted/40">
            {value.sourceNodeIds.length} decision{value.sourceNodeIds.length !== 1 ? "s" : ""}
          </span>
          <ChevronDown
            className={`w-3 h-3 text-cosmos-muted/40 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Expanded detail */}
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
                    What your choices reveal
                  </div>
                  <p className="text-xs text-cosmos-text/80 leading-relaxed">
                    {value.reasoning}
                  </p>
                </div>
              )}

              {/* Tradeoff impacts — reframed as "moments that shaped this" */}
              {value.tradeoffImpacts && value.tradeoffImpacts.length > 0 && (
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-cosmos-glow/60 mb-1.5">
                    Key moments
                  </div>
                  <div className="space-y-1.5">
                    {value.tradeoffImpacts.map((impact, i) => {
                      const isPositive = /\+|\bincreased\b|\braised\b|\bhigher\b|\bstrengthened\b|\bprioritized\b/i.test(impact);
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
                    Decisions that shaped this
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

              {!value.reasoning && (!value.tradeoffImpacts || value.tradeoffImpacts.length === 0) && (
                <p className="text-xs text-cosmos-muted/40 italic">
                  This will become clearer as you make more decisions.
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ValuesEvolution({ values }: { values: UserValue[] }) {
  const nodes = useStore((s) => s.nodes);
  const resolvedNodes = useMemo(
    () => Object.values(nodes).filter((n) => n.type === "resolved"),
    [nodes],
  );

  const insights = useMemo(() => {
    if (values.length < 2 || resolvedNodes.length < 2) return null;

    const sorted = [...values].sort((a, b) => b.strength - a.strength);
    const top = sorted[0];
    const emerging = sorted.find(
      (v) => v.sourceNodeIds.length === 1 && v.strength >= 0.3,
    );
    const dominant = sorted.filter((v) => v.strength >= 0.7);
    const contested = values.find(
      (v) => v.contradictions && v.contradictions.length > 0,
    );

    const lines: { label: string; detail: string; color: string }[] = [];

    if (dominant.length >= 2) {
      // Show top 3 max, with count of remaining
      const shown = dominant.slice(0, 3).map((v) => v.label);
      const remaining = dominant.length - shown.length;
      const listText = shown.join(", ") + (remaining > 0 ? ` (+${remaining} more)` : "");
      lines.push({
        label: "Consistent priorities",
        detail: `${listText} — strong across your decisions.`,
        color: "text-cosmos-resolved",
      });
    } else if (top) {
      lines.push({
        label: "Strongest signal",
        detail: `${top.label} (${Math.round(top.strength * 100)}%)`,
        color: "text-cosmos-glow",
      });
    }

    if (emerging) {
      lines.push({
        label: "Emerging",
        detail: `${emerging.label} — just surfaced, may grow or fade.`,
        color: "text-cosmos-judgment",
      });
    }

    if (contested) {
      lines.push({
        label: "Tension",
        detail: `${contested.label} — in tension with other choices. You're navigating a real tradeoff.`,
        color: "text-cosmos-conflict",
      });
    }

    return lines.length > 0 ? lines : null;
  }, [values, resolvedNodes]);

  if (!insights) return null;

  return (
    <div className="mb-4 p-3 bg-cosmos-glow/5 border border-cosmos-glow/15 rounded-lg space-y-2.5">
      <div className="text-[10px] text-cosmos-glow/70 uppercase tracking-wider font-medium">
        How your values are evolving
      </div>
      {insights.map((insight, i) => (
        <div key={i} className="flex items-start gap-2">
          <ArrowRight className={`w-3 h-3 mt-0.5 shrink-0 ${insight.color}`} />
          <div>
            <span className={`text-xs font-medium ${insight.color}`}>{insight.label}: </span>
            <span className="text-xs text-cosmos-muted">{insight.detail}</span>
          </div>
        </div>
      ))}
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
            <ValuesEvolution values={values} />
            <p className="text-[10px] text-cosmos-muted/40 uppercase tracking-wider">
              Tap any value to see why — grounded in your actual choices
            </p>
            {values
              .sort((a, b) => b.strength - a.strength)
              .map((value) => (
                <ValueCard key={value.id} value={value} allValues={values} />
              ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

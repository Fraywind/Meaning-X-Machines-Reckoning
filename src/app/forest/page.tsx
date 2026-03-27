"use client";

import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  TreePine,
  Sprout,
  Leaf,
  CheckCircle2,
  ChevronRight,
  GitBranch,
  X,
} from "lucide-react";
import { ForestTree, getForest, getForestAge, Forest } from "@/lib/forest-store";
import { getDnaLabels, VALUE_DIMENSIONS } from "@/lib/valueDna";
import ValueDnaRadar from "@/components/gamification/ValueDnaRadar";
import Starfield from "@/components/Starfield";
import { useStore } from "@/store/useStore";
import { applyTheme, getTheme } from "@/lib/themes";

/** Generate a procedural tree SVG based on node count and values */
function ForestTreeVisual({
  tree,
  index,
  totalTrees,
  onClick,
}: {
  tree: ForestTree;
  index: number;
  totalTrees: number;
  onClick: () => void;
}) {
  // Tree size based on complexity
  const complexity = Math.min(tree.stats.totalNodes / 5, 4); // 1-4 scale
  const height = 60 + complexity * 30;
  const trunkHeight = height * 0.35;
  const canopyRadius = 12 + complexity * 8;

  // Position trees in a natural forest layout
  const row = Math.floor(index / 5);
  const col = index % 5;
  const xOffset = col * 18 + (row % 2 === 1 ? 9 : 0) + Math.sin(index * 7.3) * 5;
  const yOffset = row * 14 + Math.cos(index * 3.1) * 3;

  // Color based on dominant value
  const topValue = getDnaLabels(tree.valueDna)[0];
  const hue = topValue
    ? (VALUE_DIMENSIONS.indexOf(topValue.label as typeof VALUE_DIMENSIONS[number]) / VALUE_DIMENSIONS.length) * 120 + 80
    : 120; // default green

  const leafColor = `hsl(${hue}, 50%, 40%)`;
  const leafColorLight = `hsl(${hue}, 45%, 55%)`;
  const trunkColor = `hsl(25, 40%, ${30 + complexity * 3}%)`;

  // Days since completion — older trees have more detail
  const daysOld = Math.floor((Date.now() - tree.completedAt) / 86400000);
  const maturity = Math.min(daysOld / 7 + 0.5, 1); // grows visually over first week

  return (
    <motion.g
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, type: "spring" }}
      style={{ cursor: "pointer" }}
      onClick={onClick}
    >
      <g transform={`translate(${xOffset}, ${100 - yOffset - height * 0.5})`}>
        {/* Shadow */}
        <ellipse
          cx="0"
          cy={trunkHeight + 2}
          rx={canopyRadius * 0.7}
          ry={3}
          fill="rgba(0,0,0,0.1)"
        />

        {/* Trunk */}
        <rect
          x={-2 - complexity}
          y={0}
          width={4 + complexity * 2}
          height={trunkHeight}
          rx="2"
          fill={trunkColor}
        />

        {/* Branches (for larger trees) */}
        {complexity > 1.5 && (
          <>
            <line
              x1={-1}
              y1={trunkHeight * 0.4}
              x2={-canopyRadius * 0.5}
              y2={trunkHeight * 0.2}
              stroke={trunkColor}
              strokeWidth={1.5}
            />
            <line
              x1={1}
              y1={trunkHeight * 0.5}
              x2={canopyRadius * 0.4}
              y2={trunkHeight * 0.3}
              stroke={trunkColor}
              strokeWidth={1.5}
            />
          </>
        )}

        {/* Canopy layers */}
        <ellipse
          cx={canopyRadius * 0.15}
          cy={-canopyRadius * 0.3}
          rx={canopyRadius * maturity}
          ry={canopyRadius * 0.85 * maturity}
          fill={leafColor}
          opacity={0.9}
        />
        <ellipse
          cx={-canopyRadius * 0.2}
          cy={-canopyRadius * 0.5}
          rx={canopyRadius * 0.75 * maturity}
          ry={canopyRadius * 0.65 * maturity}
          fill={leafColorLight}
          opacity={0.7}
        />
        {complexity > 2 && (
          <ellipse
            cx={canopyRadius * 0.3}
            cy={-canopyRadius * 0.7}
            rx={canopyRadius * 0.5 * maturity}
            ry={canopyRadius * 0.45 * maturity}
            fill={leafColor}
            opacity={0.5}
          />
        )}

        {/* Fruit/decision indicators */}
        {tree.stats.resolvedCount > 0 && maturity > 0.5 &&
          Array.from({ length: Math.min(tree.stats.resolvedCount, 5) }).map(
            (_, i) => (
              <circle
                key={i}
                cx={Math.cos(i * 1.8 + index) * canopyRadius * 0.5}
                cy={
                  -canopyRadius * 0.3 +
                  Math.sin(i * 2.1 + index) * canopyRadius * 0.35
                }
                r={2 + complexity * 0.5}
                fill="hsl(35, 80%, 55%)"
                opacity={0.7}
              />
            )
          )}

        {/* Label on hover via title */}
        <title>
          {tree.goalText.slice(0, 60)}
          {tree.goalText.length > 60 ? "..." : ""} — {tree.stats.resolvedCount}{" "}
          decisions
        </title>
      </g>
    </motion.g>
  );
}

function TreeDetailPanel({
  tree,
  onClose,
}: {
  tree: ForestTree;
  onClose: () => void;
}) {
  const topValues = getDnaLabels(tree.valueDna).slice(0, 5);
  const resolvedNodes = Object.values(tree.nodes).filter(
    (n) => n.type === "resolved"
  );

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed right-0 top-0 bottom-0 w-[420px] z-50 bg-cosmos-surface/95 backdrop-blur-md border-l border-cosmos-border/30 overflow-y-auto"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="text-[10px] text-cosmos-muted/50">
            {new Date(tree.completedAt).toLocaleDateString()}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-cosmos-muted hover:text-cosmos-text transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <h2 className="text-lg font-display font-bold text-cosmos-text mb-2">
          {tree.goalText}
        </h2>

        <div className="flex items-center gap-4 text-[11px] text-cosmos-muted mb-6">
          <span className="flex items-center gap-1">
            <GitBranch className="w-3 h-3" />
            {tree.stats.totalNodes} nodes
          </span>
          <span className="flex items-center gap-1 text-cosmos-resolved">
            <CheckCircle2 className="w-3 h-3" />
            {tree.stats.resolvedCount} decisions
          </span>
        </div>

        {/* Value DNA */}
        <div className="flex justify-center mb-6">
          <ValueDnaRadar dna={tree.valueDna} size={200} label="Value Fingerprint" />
        </div>

        {/* Top values */}
        {topValues.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[10px] text-cosmos-muted/50 uppercase tracking-wider mb-2">
              Values Revealed
            </h3>
            <div className="space-y-1.5">
              {topValues.map((v) => (
                <div
                  key={v.label}
                  className="flex items-center gap-2 text-xs"
                >
                  <div className="flex-1 text-cosmos-text">{v.label}</div>
                  <div className="w-20 h-1 bg-cosmos-border/30 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-cosmos-glow rounded-full"
                      style={{ width: `${v.strength * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-cosmos-muted w-8 text-right">
                    {Math.round(v.strength * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Decisions */}
        <div>
          <h3 className="text-[10px] text-cosmos-muted/50 uppercase tracking-wider mb-2">
            Judgment Calls
          </h3>
          <div className="space-y-2">
            {resolvedNodes.map((n) => (
              <div
                key={n.id}
                className="p-3 bg-cosmos-bg/40 border border-cosmos-border/20 rounded-lg"
              >
                <div className="text-xs font-medium text-cosmos-text">
                  {n.label}
                </div>
                <div className="text-[11px] text-cosmos-resolved/80 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  {n.options?.find((o) => o.id === n.selectedOption)?.label ||
                    n.selectedOption}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Critique */}
        {tree.critique && (
          <div className="mt-6 p-3 bg-cosmos-judgment/5 border border-cosmos-judgment/15 rounded-lg">
            <h3 className="text-[10px] text-cosmos-judgment/60 uppercase tracking-wider mb-1">
              AI Reflection
            </h3>
            <p className="text-xs text-cosmos-muted leading-relaxed">
              {tree.critique}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function ForestPage() {
  const [forest, setForest] = useState<Forest | null>(null);
  const [selectedTree, setSelectedTree] = useState<ForestTree | null>(null);
  const { theme } = useStore();

  useEffect(() => {
    // Ensure theme is applied
    const stored = localStorage.getItem("reckoning-theme");
    if (stored) {
      const t = getTheme(stored as "starfield" | "cybernetics" | "light" | "cute" | "nature");
      applyTheme(t);
    }
    setForest(getForest());
  }, []);

  const forestAge = getForestAge();
  const isNature = theme === "nature";

  // Ground color varies by theme
  const groundGradient = isNature
    ? "from-[#5a7a4e] via-[#6b8f58] to-[#7da068]"
    : "from-cosmos-border via-cosmos-surface to-cosmos-bg";

  if (!forest) return null;

  const treeCount = forest.trees.length;

  return (
    <div className="relative min-h-screen">
      <Starfield />

      {/* Detail panel */}
      <AnimatePresence>
        {selectedTree && (
          <TreeDetailPanel
            tree={selectedTree}
            onClose={() => setSelectedTree(null)}
          />
        )}
      </AnimatePresence>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <a
              href="/"
              className="flex items-center gap-1.5 text-xs text-cosmos-muted hover:text-cosmos-glow transition-colors mb-2"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Cascade
            </a>
            <h1 className="text-2xl font-display font-bold text-cosmos-text flex items-center gap-3">
              <TreePine className="w-6 h-6 text-cosmos-glow" />
              My Forest
            </h1>
            <p className="text-sm text-cosmos-muted mt-1">
              {treeCount === 0
                ? "Your forest is empty. Complete a deliberation to plant your first tree."
                : `${treeCount} ${treeCount === 1 ? "tree" : "trees"} growing \u00b7 ${forestAge} \u00b7 ${forest.totalDecisions} judgment calls made`}
            </p>
          </div>
        </div>

        {/* Cumulative value DNA */}
        {treeCount > 0 && (
          <div className="flex items-start gap-8 mb-8">
            <div className="flex-1 p-5 bg-cosmos-surface/60 border border-cosmos-border/30 rounded-xl">
              <h2 className="text-xs font-medium text-cosmos-text uppercase tracking-wider mb-1">
                Your Value Fingerprint
              </h2>
              <p className="text-[10px] text-cosmos-muted/50 mb-4">
                Averaged across all {treeCount} deliberation{treeCount !== 1 ? "s" : ""}. This evolves as you grow your forest.
              </p>
              <div className="flex justify-center">
                <ValueDnaRadar
                  dna={forest.cumulativeValueDna}
                  size={260}
                  label="Cumulative Values"
                />
              </div>
            </div>

            {/* Top values list */}
            <div className="w-56 p-4 bg-cosmos-surface/40 border border-cosmos-border/20 rounded-xl">
              <h3 className="text-[10px] text-cosmos-muted/50 uppercase tracking-wider mb-3">
                What your forest reveals
              </h3>
              {getDnaLabels(forest.cumulativeValueDna)
                .slice(0, 6)
                .map((v, i) => (
                  <div
                    key={v.label}
                    className="flex items-center gap-2 py-1.5 text-xs"
                  >
                    <span className="text-cosmos-muted/30 w-4 text-right">
                      {i + 1}.
                    </span>
                    <span className="flex-1 text-cosmos-text">{v.label}</span>
                    <span className="text-cosmos-muted/50">
                      {Math.round(v.strength * 100)}%
                    </span>
                  </div>
                ))}
              {getDnaLabels(forest.cumulativeValueDna).length === 0 && (
                <p className="text-[10px] text-cosmos-muted/30 italic">
                  Values emerge as you deliberate
                </p>
              )}
            </div>
          </div>
        )}

        {/* Forest visualization */}
        {treeCount > 0 && (
          <div className="mb-8">
            <div
              className={`relative rounded-2xl border border-cosmos-border/20 overflow-hidden ${
                isNature ? "bg-[#dde8df]" : "bg-cosmos-bg/60"
              }`}
              style={{ minHeight: Math.max(300, Math.ceil(treeCount / 5) * 80 + 160) }}
            >
              {/* Sky gradient */}
              <div
                className={`absolute inset-0 ${
                  isNature
                    ? "bg-gradient-to-b from-[#b5d4e8] via-[#d4e5d8] to-[#dde8df]"
                    : "bg-gradient-to-b from-cosmos-bg via-cosmos-surface/40 to-cosmos-surface/60"
                }`}
              />

              {/* Forest SVG */}
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 100 120"
                preserveAspectRatio="xMidYMax meet"
                className="relative z-10"
                style={{
                  minHeight: Math.max(300, Math.ceil(treeCount / 5) * 80 + 160),
                }}
              >
                {/* Ground */}
                <rect
                  x="0"
                  y="100"
                  width="100"
                  height="20"
                  fill={isNature ? "#6b8f58" : "rgb(var(--surface))"}
                  opacity={0.7}
                />

                {/* Trees */}
                {forest.trees.map((tree, i) => (
                  <ForestTreeVisual
                    key={tree.id}
                    tree={tree}
                    index={i}
                    totalTrees={treeCount}
                    onClick={() => setSelectedTree(tree)}
                  />
                ))}
              </svg>

              {/* Bottom ground gradient overlay */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t ${
                  isNature
                    ? "from-[#5a7a4e]/80 to-transparent"
                    : "from-cosmos-surface/60 to-transparent"
                }`}
              />
            </div>
            <p className="text-center text-[10px] text-cosmos-muted/30 mt-2">
              Click any tree to see its details. Each tree represents a completed deliberation.
            </p>
          </div>
        )}

        {/* Empty state */}
        {treeCount === 0 && (
          <div className="text-center py-20">
            <Sprout className="w-12 h-12 text-cosmos-muted/15 mx-auto mb-4" />
            <h3 className="text-sm text-cosmos-text mb-1.5">
              Plant your first tree
            </h3>
            <p className="text-xs text-cosmos-muted/50 max-w-sm mx-auto mb-6">
              Every completed deliberation becomes a tree in your forest.
              Over time, your forest reveals patterns in how you think,
              what you value, and how your judgment evolves.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-cosmos-glow/20 border border-cosmos-glow/30 rounded-xl text-cosmos-glow text-xs font-medium hover:bg-cosmos-glow/30 transition-all"
            >
              Start a deliberation
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Timeline of trees */}
        {treeCount > 0 && (
          <div>
            <h2 className="text-xs font-medium text-cosmos-text uppercase tracking-wider mb-4">
              Your Deliberation Timeline
            </h2>
            <div className="space-y-2">
              {[...forest.trees].reverse().map((tree) => {
                const topValues = getDnaLabels(tree.valueDna).slice(0, 3);
                return (
                  <motion.div
                    key={tree.id}
                    className="flex items-center gap-4 p-3 bg-cosmos-surface/50 border border-cosmos-border/20 rounded-xl hover:border-cosmos-glow/20 cursor-pointer transition-all group"
                    onClick={() => setSelectedTree(tree)}
                    whileHover={{ x: 4 }}
                  >
                    <TreePine className="w-4 h-4 text-cosmos-glow/50 group-hover:text-cosmos-glow transition-colors shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-cosmos-text truncate group-hover:text-cosmos-glow transition-colors">
                        {tree.goalText}
                      </div>
                      <div className="text-[10px] text-cosmos-muted/40 mt-0.5">
                        {new Date(tree.completedAt).toLocaleDateString()} &middot;{" "}
                        {tree.stats.resolvedCount} decisions
                      </div>
                    </div>
                    {/* Value pills */}
                    <div className="flex gap-1 shrink-0">
                      {topValues.map((v) => (
                        <span
                          key={v.label}
                          className="px-1.5 py-0.5 text-[8px] bg-cosmos-glow/8 border border-cosmos-glow/15 rounded-full text-cosmos-glow/60"
                        >
                          {v.label}
                        </span>
                      ))}
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-cosmos-muted/20 group-hover:text-cosmos-glow/50 transition-colors shrink-0" />
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

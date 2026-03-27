"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  ArrowLeft,
  Search,
  GitCompare,
  Loader2,
  Users,
  GitBranch,
  Trophy,
  X,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { SharedTree, TreeComparison, DivergencePoint } from "@/types";
import TreeCard from "@/components/gallery/TreeCard";
import ValueDnaRadar from "@/components/gamification/ValueDnaRadar";
import Starfield from "@/components/Starfield";
import { getDnaLabels } from "@/lib/valueDna";

function ComparisonView({
  comparison,
  onClose,
}: {
  comparison: TreeComparison;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] bg-cosmos-bg/90 backdrop-blur-md overflow-y-auto"
    >
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-lg font-display font-bold text-cosmos-text">
              Tree Comparison
            </h2>
            <p className="text-xs text-cosmos-muted mt-1">
              Same goal, different judgment calls
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-cosmos-muted hover:text-cosmos-text transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Goal */}
        <div className="p-4 bg-cosmos-surface/60 border border-cosmos-glow/20 rounded-xl mb-6">
          <div className="text-[10px] uppercase tracking-wider text-cosmos-glow/50 mb-1">
            Shared Goal
          </div>
          <p className="text-sm text-cosmos-text">
            {comparison.treeA.goalText}
          </p>
        </div>

        {/* Side-by-side Value DNA */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          <div className="p-4 bg-cosmos-surface/40 border border-cosmos-border/30 rounded-xl">
            <div className="text-xs font-medium text-cosmos-text mb-1">
              {comparison.treeA.userName || "Person A"}
            </div>
            <div className="text-[10px] text-cosmos-muted mb-3">
              {comparison.treeA.stats.resolvedCount} decisions &middot;{" "}
              {comparison.treeA.stats.totalNodes} nodes
            </div>
            <ValueDnaRadar
              dna={comparison.treeA.valueDna}
              size={180}
              color="rgb(var(--glow))"
              compareWith={comparison.treeB.valueDna}
              compareColor="rgb(var(--judgment))"
            />
          </div>
          <div className="p-4 bg-cosmos-surface/40 border border-cosmos-border/30 rounded-xl">
            <div className="text-xs font-medium text-cosmos-text mb-1">
              {comparison.treeB.userName || "Person B"}
            </div>
            <div className="text-[10px] text-cosmos-muted mb-3">
              {comparison.treeB.stats.resolvedCount} decisions &middot;{" "}
              {comparison.treeB.stats.totalNodes} nodes
            </div>
            <ValueDnaRadar
              dna={comparison.treeB.valueDna}
              size={180}
              color="rgb(var(--judgment))"
              compareWith={comparison.treeA.valueDna}
              compareColor="rgb(var(--glow))"
            />
          </div>
        </div>

        {/* Shared decisions */}
        {comparison.sharedDecisions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-medium text-cosmos-resolved uppercase tracking-wider mb-3">
              Where they agreed
            </h3>
            <div className="flex flex-wrap gap-2">
              {comparison.sharedDecisions.map((d, i) => (
                <span
                  key={i}
                  className="px-3 py-1.5 text-xs bg-cosmos-resolved/10 border border-cosmos-resolved/20 rounded-lg text-cosmos-resolved/80"
                >
                  <CheckCircle2 className="w-3 h-3 inline mr-1" />
                  {d}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Divergence points */}
        {comparison.divergencePoints.length > 0 && (
          <div className="mb-6">
            <h3 className="text-xs font-medium text-cosmos-judgment uppercase tracking-wider mb-3">
              Where they diverged
            </h3>
            <div className="space-y-3">
              {comparison.divergencePoints.map((d, i) => (
                <DivergenceCard
                  key={i}
                  point={d}
                  nameA={comparison.treeA.userName || "Person A"}
                  nameB={comparison.treeB.userName || "Person B"}
                />
              ))}
            </div>
          </div>
        )}

        {/* AI narrative */}
        {comparison.summary && (
          <div className="p-5 bg-cosmos-surface/60 border border-cosmos-border/30 rounded-xl">
            <h3 className="text-xs font-medium text-cosmos-text uppercase tracking-wider mb-3">
              What this reveals
            </h3>
            <p className="text-sm text-cosmos-muted leading-relaxed whitespace-pre-line">
              {comparison.summary}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function DivergenceCard({
  point,
  nameA,
  nameB,
}: {
  point: DivergencePoint;
  nameA: string;
  nameB: string;
}) {
  const sigColor =
    point.significance === "fundamental"
      ? "border-cosmos-conflict/40 bg-cosmos-conflict/5"
      : point.significance === "major"
        ? "border-cosmos-judgment/30 bg-cosmos-judgment/5"
        : "border-cosmos-border/30 bg-cosmos-surface/40";

  return (
    <div className={`p-4 border rounded-xl ${sigColor}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-cosmos-text">
          {point.nodeLabel}
        </span>
        <span
          className={`text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded ${
            point.significance === "fundamental"
              ? "text-cosmos-conflict bg-cosmos-conflict/10"
              : point.significance === "major"
                ? "text-cosmos-judgment bg-cosmos-judgment/10"
                : "text-cosmos-muted bg-cosmos-border/20"
          }`}
        >
          {point.significance}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="p-2.5 bg-cosmos-glow/5 border border-cosmos-glow/15 rounded-lg">
          <div className="text-[10px] text-cosmos-glow/60 mb-1">{nameA}</div>
          <div className="text-xs text-cosmos-text">{point.treeAChoice}</div>
        </div>
        <div className="p-2.5 bg-cosmos-judgment/5 border border-cosmos-judgment/15 rounded-lg">
          <div className="text-[10px] text-cosmos-judgment/60 mb-1">
            {nameB}
          </div>
          <div className="text-xs text-cosmos-text">{point.treeBChoice}</div>
        </div>
      </div>
    </div>
  );
}

export default function GalleryPage() {
  const [trees, setTrees] = useState<SharedTree[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalTrees, setTotalTrees] = useState(0);
  const [selectedForCompare, setSelectedForCompare] = useState<string[]>([]);
  const [comparison, setComparison] = useState<TreeComparison | null>(null);
  const [comparing, setComparing] = useState(false);
  const [expandedTree, setExpandedTree] = useState<SharedTree | null>(null);

  useEffect(() => {
    fetch("/api/gallery?limit=30")
      .then((r) => r.json())
      .then((data) => {
        setTrees(data.trees || []);
        setTotalTrees(data.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const toggleCompareSelect = (id: string) => {
    setSelectedForCompare((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) return [prev[1], id]; // replace oldest
      return [...prev, id];
    });
  };

  const handleCompare = async () => {
    if (selectedForCompare.length !== 2) return;
    setComparing(true);

    try {
      const res = await fetch("/api/compare", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          treeAId: selectedForCompare[0],
          treeBId: selectedForCompare[1],
        }),
      });
      const data = await res.json();
      if (data.treeA) setComparison(data);
    } catch (err) {
      console.error("Comparison failed:", err);
    } finally {
      setComparing(false);
    }
  };

  // Group trees by goalSlug for "same goal" indicators
  const goalGroups = new Map<string, SharedTree[]>();
  for (const tree of trees) {
    const group = goalGroups.get(tree.goalSlug) || [];
    group.push(tree);
    goalGroups.set(tree.goalSlug, group);
  }

  return (
    <div className="relative min-h-screen">
      <Starfield />

      {/* Comparison overlay */}
      <AnimatePresence>
        {comparison && (
          <ComparisonView
            comparison={comparison}
            onClose={() => {
              setComparison(null);
              setSelectedForCompare([]);
            }}
          />
        )}
      </AnimatePresence>

      {/* Expanded tree detail */}
      <AnimatePresence>
        {expandedTree && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-cosmos-bg/90 backdrop-blur-md overflow-y-auto"
          >
            <div className="max-w-3xl mx-auto px-6 py-8">
              <button
                onClick={() => setExpandedTree(null)}
                className="flex items-center gap-1.5 text-xs text-cosmos-muted hover:text-cosmos-glow transition-colors mb-6"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Back to gallery
              </button>

              <h2 className="text-xl font-display font-bold text-cosmos-text mb-2">
                {expandedTree.goalText}
              </h2>
              <div className="flex items-center gap-3 text-[11px] text-cosmos-muted/50 mb-6">
                {expandedTree.userName && <span>by {expandedTree.userName}</span>}
                <span>{expandedTree.stats.totalNodes} nodes</span>
                <span>{expandedTree.stats.resolvedCount} decisions</span>
              </div>

              {/* Value DNA */}
              <div className="flex justify-center mb-8">
                <ValueDnaRadar
                  dna={expandedTree.valueDna}
                  label="Value Fingerprint"
                  size={240}
                />
              </div>

              {/* Decisions list */}
              <div className="space-y-2">
                <h3 className="text-xs font-medium text-cosmos-resolved uppercase tracking-wider mb-3">
                  Decisions Made
                </h3>
                {Object.values(expandedTree.nodes)
                  .filter((n) => n.type === "resolved")
                  .map((n) => (
                    <div
                      key={n.id}
                      className="p-3 bg-cosmos-surface/60 border border-cosmos-border/30 rounded-lg"
                    >
                      <div className="text-xs font-medium text-cosmos-text">
                        {n.label}
                      </div>
                      <div className="text-[11px] text-cosmos-resolved/80 mt-0.5">
                        {n.options?.find((o) => o.id === n.selectedOption)
                          ?.label ||
                          n.selectedOption ||
                          "Custom"}
                      </div>
                      {n.description && (
                        <div className="text-[10px] text-cosmos-muted/50 mt-1">
                          {n.description}
                        </div>
                      )}
                    </div>
                  ))}
              </div>

              {/* Values */}
              {expandedTree.values.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xs font-medium text-cosmos-glow uppercase tracking-wider mb-3">
                    Values Revealed
                  </h3>
                  <div className="space-y-2">
                    {expandedTree.values
                      .sort((a, b) => b.strength - a.strength)
                      .slice(0, 6)
                      .map((v) => (
                        <div
                          key={v.id}
                          className="flex items-center gap-3 p-2 bg-cosmos-surface/40 border border-cosmos-border/20 rounded-lg"
                        >
                          <span className="text-xs text-cosmos-text flex-1">
                            {v.label}
                          </span>
                          <div className="w-16 h-1 bg-cosmos-border/30 rounded-full overflow-hidden">
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

              {/* Similar trees */}
              {goalGroups.get(expandedTree.goalSlug)?.filter((t) => t.id !== expandedTree.id).length ? (
                <div className="mt-8">
                  <h3 className="text-xs font-medium text-purple-400 uppercase tracking-wider mb-3">
                    Others who tackled this goal
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {goalGroups
                      .get(expandedTree.goalSlug)!
                      .filter((t) => t.id !== expandedTree.id)
                      .slice(0, 4)
                      .map((t) => (
                        <TreeCard
                          key={t.id}
                          tree={t}
                          onClick={() => setExpandedTree(t)}
                        />
                      ))}
                  </div>
                </div>
              ) : null}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main gallery */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <a
                href="/"
                className="flex items-center gap-1.5 text-xs text-cosmos-muted hover:text-cosmos-glow transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Cascade
              </a>
            </div>
            <h1 className="text-2xl font-display font-bold text-cosmos-text flex items-center gap-3">
              <Globe className="w-6 h-6 text-cosmos-glow" />
              Community Gallery
            </h1>
            <p className="text-sm text-cosmos-muted mt-1">
              Same goals, different judgment calls. See how others deliberate.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {selectedForCompare.length === 2 && (
              <button
                onClick={handleCompare}
                disabled={comparing}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 border border-purple-500/40 rounded-xl text-purple-400 text-xs font-medium hover:bg-purple-500/30 transition-all disabled:opacity-50"
              >
                {comparing ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <GitCompare className="w-3.5 h-3.5" />
                )}
                Compare selected
              </button>
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div className="flex items-center gap-6 mb-6 text-[11px] text-cosmos-muted/50">
          <span className="flex items-center gap-1">
            <GitBranch className="w-3 h-3" /> {totalTrees} deliberations
            shared
          </span>
          <span className="flex items-center gap-1">
            <Users className="w-3 h-3" /> {goalGroups.size} unique goals
          </span>
          {selectedForCompare.length > 0 && (
            <span className="text-purple-400">
              {selectedForCompare.length}/2 selected for comparison
              <button
                onClick={() => setSelectedForCompare([])}
                className="ml-1 text-cosmos-muted hover:text-cosmos-text"
              >
                (clear)
              </button>
            </span>
          )}
        </div>

        {/* Compare hint */}
        {selectedForCompare.length === 0 && trees.length >= 2 && (
          <div className="mb-4 p-3 bg-purple-500/5 border border-purple-500/15 rounded-xl text-xs text-purple-400/70 flex items-center gap-2">
            <GitCompare className="w-3.5 h-3.5 shrink-0" />
            <span>
              Select two trees to compare how different people approached the
              same problem. Click the compare icon on any card.
            </span>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-cosmos-glow animate-spin" />
          </div>
        )}

        {/* Empty state */}
        {!loading && trees.length === 0 && (
          <div className="text-center py-20">
            <Globe className="w-10 h-10 text-cosmos-muted/20 mx-auto mb-4" />
            <h3 className="text-sm text-cosmos-text mb-1">
              No deliberations shared yet
            </h3>
            <p className="text-xs text-cosmos-muted/50 mb-4">
              Be the first! Complete a deliberation and click &ldquo;Share to
              Gallery&rdquo; to add yours.
            </p>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-cosmos-glow/20 border border-cosmos-glow/30 rounded-xl text-cosmos-glow text-xs font-medium hover:bg-cosmos-glow/30 transition-all"
            >
              Start a deliberation
              <ChevronRight className="w-3.5 h-3.5" />
            </a>
          </div>
        )}

        {/* Tree grid */}
        {!loading && trees.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trees.map((tree, i) => {
              const isSelected = selectedForCompare.includes(tree.id);
              const sameGoalCount =
                (goalGroups.get(tree.goalSlug)?.length || 1) - 1;

              return (
                <div key={tree.id} className="relative">
                  {/* Compare checkbox */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCompareSelect(tree.id);
                    }}
                    className={`absolute top-3 right-3 z-10 w-6 h-6 rounded-lg border flex items-center justify-center transition-all ${
                      isSelected
                        ? "bg-purple-500/20 border-purple-500/50 text-purple-400"
                        : "bg-cosmos-surface/80 border-cosmos-border/40 text-cosmos-muted/30 hover:border-purple-500/30 hover:text-purple-400/60"
                    }`}
                    title="Select for comparison"
                  >
                    <GitCompare className="w-3 h-3" />
                  </button>

                  {/* Same-goal indicator */}
                  {sameGoalCount > 0 && (
                    <div className="absolute top-3 left-3 z-10 px-1.5 py-0.5 text-[9px] bg-purple-500/15 border border-purple-500/25 rounded-md text-purple-400">
                      +{sameGoalCount} similar
                    </div>
                  )}

                  <TreeCard
                    tree={tree}
                    delay={i * 0.05}
                    onClick={() => setExpandedTree(tree)}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

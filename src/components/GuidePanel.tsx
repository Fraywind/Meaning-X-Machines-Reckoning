"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  HelpCircle,
  X,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Lightbulb,
} from "lucide-react";
import { useStore } from "@/store/useStore";

export default function GuidePanel() {
  const [open, setOpen] = useState(false);
  const { nodes, values, critique } = useStore();

  const nodeList = useMemo(() => Object.values(nodes), [nodes]);

  const pendingJudgments = useMemo(
    () => nodeList.filter((n) => n.type === "judgment" && n.status !== "resolved"),
    [nodeList],
  );

  const resolvedJudgments = useMemo(
    () => nodeList.filter((n) => n.type === "resolved"),
    [nodeList],
  );

  const allBlindSpots = useMemo(
    () => nodeList.flatMap((n) => n.blindSpots || []),
    [nodeList],
  );

  const conflicts = useMemo(
    () => nodeList.filter((n) => n.conflict).map((n) => ({ label: n.label, conflict: n.conflict! })),
    [nodeList],
  );

  // Build contextual suggestion
  const suggestion = useMemo(() => {
    if (pendingJudgments.length > 0) {
      const next = pendingJudgments[0];
      return `You have ${pendingJudgments.length} decision${pendingJudgments.length > 1 ? "s" : ""} waiting. Try clicking "${next.label}" and hitting "Decide now" to move forward.`;
    }
    if (resolvedJudgments.length > 0 && pendingJudgments.length === 0 && nodeList.length > 2) {
      return "All judgment points are resolved. Check the summary to review your decisions or generate a build prompt.";
    }
    return "Explore the tree by clicking on nodes. Yellow nodes need your judgment.";
  }, [pendingJudgments, resolvedJudgments, nodeList]);

  if (nodeList.length < 2) return null;

  return (
    <>
      {/* Small floating button */}
      <button
        onClick={() => setOpen(!open)}
        className={`fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-all shadow-lg ${
          open
            ? "bg-cosmos-glow/20 border border-cosmos-glow/50 text-cosmos-glow"
            : "bg-cosmos-surface/90 border border-cosmos-border text-cosmos-muted hover:text-cosmos-glow hover:border-cosmos-glow/30"
        }`}
        title="Guide & History"
      >
        {open ? <X className="w-4 h-4" /> : <HelpCircle className="w-4 h-4" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-6 z-50 w-80 max-h-[70vh] bg-cosmos-surface/95 backdrop-blur-sm border border-cosmos-border rounded-xl shadow-xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-cosmos-border/50">
              <h3 className="text-sm font-medium text-cosmos-text">Guide & History</h3>
              <p className="text-[10px] text-cosmos-muted mt-0.5">What&apos;s happened and what to do next</p>
            </div>

            <div className="overflow-y-auto flex-1 p-3 space-y-3">
              {/* Suggestion */}
              <div className="flex items-start gap-2 p-2.5 bg-cosmos-glow/8 border border-cosmos-glow/20 rounded-lg">
                <Lightbulb className="w-3.5 h-3.5 text-cosmos-glow mt-0.5 shrink-0" />
                <p className="text-xs text-cosmos-glow/90 leading-relaxed">{suggestion}</p>
              </div>

              {/* Progress */}
              <div className="p-2.5 bg-cosmos-bg/50 rounded-lg">
                <div className="text-[10px] text-cosmos-muted uppercase tracking-wider mb-2">Progress</div>
                <div className="flex items-center gap-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-cosmos-resolved" />
                    <span className="text-cosmos-muted">{resolvedJudgments.length} resolved</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-cosmos-judgment" />
                    <span className="text-cosmos-muted">{pendingJudgments.length} pending</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-cosmos-reckoning" />
                    <span className="text-cosmos-muted">{nodeList.length} total</span>
                  </div>
                </div>
              </div>

              {/* Pending decisions */}
              {pendingJudgments.length > 0 && (
                <div>
                  <div className="text-[10px] text-cosmos-muted uppercase tracking-wider mb-1.5">Decisions waiting</div>
                  <div className="space-y-1">
                    {pendingJudgments.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => { useStore.getState().setInspectedNode(n.id); setOpen(false); }}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-cosmos-judgment/10 cursor-pointer transition-colors group"
                      >
                        <AlertTriangle className="w-3 h-3 text-cosmos-judgment shrink-0" />
                        <span className="text-xs text-cosmos-muted group-hover:text-cosmos-text truncate flex-1">{n.label}</span>
                        <ChevronRight className="w-3 h-3 text-cosmos-muted/30 group-hover:text-cosmos-judgment" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Resolved decisions */}
              {resolvedJudgments.length > 0 && (
                <div>
                  <div className="text-[10px] text-cosmos-muted uppercase tracking-wider mb-1.5">Resolved</div>
                  <div className="space-y-1">
                    {resolvedJudgments.map((n) => (
                      <div
                        key={n.id}
                        onClick={() => { useStore.getState().setInspectedNode(n.id); setOpen(false); }}
                        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-cosmos-resolved/10 cursor-pointer transition-colors group"
                      >
                        <CheckCircle2 className="w-3 h-3 text-cosmos-resolved/60 shrink-0" />
                        <span className="text-xs text-cosmos-muted/70 group-hover:text-cosmos-text truncate flex-1">{n.label}</span>
                        {n.selectedOption && (
                          <span className="text-[10px] text-cosmos-resolved/50 truncate max-w-[80px]">
                            {n.options?.find((o) => o.id === n.selectedOption)?.label || n.selectedOption}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Blind spots */}
              {allBlindSpots.length > 0 && (
                <div>
                  <div className="text-[10px] text-cosmos-muted uppercase tracking-wider mb-1.5">Blind spots flagged</div>
                  <div className="space-y-1">
                    {allBlindSpots.slice(0, 5).map((bs, i) => (
                      <div key={i} className="flex items-start gap-2 px-2.5 py-1.5">
                        <AlertCircle className="w-3 h-3 text-cosmos-conflict/60 mt-0.5 shrink-0" />
                        <span className="text-xs text-cosmos-muted/70 leading-relaxed">{bs}</span>
                      </div>
                    ))}
                    {allBlindSpots.length > 5 && (
                      <p className="text-[10px] text-cosmos-muted/40 px-2.5">+{allBlindSpots.length - 5} more</p>
                    )}
                  </div>
                </div>
              )}

              {/* Conflicts */}
              {conflicts.length > 0 && (
                <div>
                  <div className="text-[10px] text-cosmos-muted uppercase tracking-wider mb-1.5">Tensions & conflicts</div>
                  <div className="space-y-1">
                    {conflicts.slice(0, 4).map((c, i) => (
                      <div key={i} className="px-2.5 py-1.5">
                        <span className="text-xs text-cosmos-text/70">{c.label}:</span>
                        <span className="text-xs text-cosmos-muted/60 ml-1">{c.conflict}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Critique */}
              {critique && (
                <div>
                  <div className="text-[10px] text-cosmos-muted uppercase tracking-wider mb-1.5">Constructive feedback</div>
                  <p className="text-xs text-cosmos-muted/70 px-2.5 leading-relaxed">{critique}</p>
                </div>
              )}

              {/* Values discovered */}
              {values.length > 0 && (
                <div>
                  <div className="text-[10px] text-cosmos-muted uppercase tracking-wider mb-1.5">Values revealed so far</div>
                  <div className="flex flex-wrap gap-1.5 px-2.5">
                    {values.slice(0, 8).map((v, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 text-[10px] bg-cosmos-glow/10 border border-cosmos-glow/20 rounded-full text-cosmos-glow/70"
                      >
                        {v.label}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

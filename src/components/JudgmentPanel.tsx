"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, MessageSquare, ArrowRight, CheckCircle2 } from "lucide-react";
import { DecisionNode } from "@/types";
import { useStore } from "@/store/useStore";
import { safeFetch } from "@/lib/api";

interface Props {
  node: DecisionNode;
}

export default function JudgmentPanel({ node }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showClarify, setShowClarify] = useState(false);
  const [clarifyText, setClarifyText] = useState("");
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
    loadingNotes,
    setLoadingNotes,
  } = useStore();

  const handleResolve = async () => {
    if (!selectedId) return;
    setIsSubmitting(true);

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
        judgmentContext: {
          nodeId: node.id,
          chosenOption:
            node.options?.find((o) => o.id === selectedId)?.label || selectedId,
        },
      });
      if (loadingNotes.trim()) setLoadingNotes("");
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

  const handleClarify = async () => {
    if (!clarifyText.trim()) return;
    setIsSubmitting(true);

    // Resolve with a custom clarification instead of a preset option
    resolveJudgment(node.id, "user-clarification");

    setIsDecomposing(true);
    try {
      const goalWithNotes = loadingNotes.trim()
        ? `${goalText}\n\n--- Additional context from user ---\n${loadingNotes}`
        : goalText;
      const data = await safeFetch("/api/decompose", {
        goal: goalWithNotes,
        existingNodes: Object.values(nodes),
        existingValues: values,
        judgmentContext: {
          nodeId: node.id,
          chosenOption: `User clarification — none of the presented options fit. The user says: "${clarifyText}"`,
        },
      });
      if (loadingNotes.trim()) setLoadingNotes("");
      if (data.nodes) addNodes(data.nodes);
      if (data.values) addValues(data.values);
      if (data.critique) setCritique(data.critique);
    } catch (err) {
      console.error("Failed to continue decomposition:", err);
    } finally {
      setIsDecomposing(false);
      setIsSubmitting(false);
      setShowClarify(false);
      setClarifyText("");
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
              <AlertTriangle className="w-5 h-5 text-cosmos-judgment" />
              <h2 className="text-lg font-medium text-cosmos-text">Your Judgment Needed</h2>
            </div>
            <button
              onClick={() => setActiveJudgment(null)}
              className="text-cosmos-muted hover:text-cosmos-text transition-colors text-lg"
            >
              &times;
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

          {/* Options — clear instruction */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-medium text-cosmos-judgment uppercase tracking-wider">
                Choose one option
              </div>
              <div className="text-xs text-cosmos-muted/50">Select to continue</div>
            </div>

            {node.options?.map((option, index) => (
              <button
                key={option.id}
                onClick={() => {
                  setSelectedId(option.id);
                  setShowClarify(false);
                }}
                className={`w-full text-left p-4 rounded-lg border transition-all relative ${
                  selectedId === option.id
                    ? "border-cosmos-judgment bg-cosmos-judgment/10 ring-1 ring-cosmos-judgment/30"
                    : "border-cosmos-border hover:border-cosmos-judgment/30 bg-cosmos-bg"
                }`}
              >
                {/* Selection indicator */}
                <div className="flex items-start gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                      selectedId === option.id
                        ? "border-cosmos-judgment bg-cosmos-judgment/20"
                        : "border-cosmos-border"
                    }`}
                  >
                    {selectedId === option.id && (
                      <CheckCircle2 className="w-4 h-4 text-cosmos-judgment" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-cosmos-text mb-1">
                      {String.fromCharCode(65 + index)}. {option.label}
                    </div>
                    <div className="text-xs text-cosmos-muted mb-2">{option.description}</div>
                    {option.tradeoffs.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs text-cosmos-judgment/70 mb-1">Trade-offs:</div>
                        <ul className="text-xs text-cosmos-muted space-y-0.5">
                          {option.tradeoffs.map((t, i) => (
                            <li key={i}>&bull; {t}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {option.consequences.length > 0 && (
                      <div>
                        <div className="text-xs text-cosmos-conflict/70 mb-1">Consequences:</div>
                        <ul className="text-xs text-cosmos-muted space-y-0.5">
                          {option.consequences.map((c, i) => (
                            <li key={i}>&bull; {c}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Confirm selection */}
          {selectedId && !showClarify && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <button
                onClick={handleResolve}
                disabled={isSubmitting}
                className="w-full py-3 bg-cosmos-judgment/20 border border-cosmos-judgment/40 rounded-lg text-cosmos-judgment font-medium hover:bg-cosmos-judgment/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  "Processing your judgment..."
                ) : (
                  <>
                    Confirm choice
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.div>
          )}

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-cosmos-border" />
            <span className="text-xs text-cosmos-muted/40">or</span>
            <div className="flex-1 h-px bg-cosmos-border" />
          </div>

          {/* Clarify / redirect section */}
          {!showClarify ? (
            <button
              onClick={() => {
                setShowClarify(true);
                setSelectedId(null);
              }}
              className="w-full py-3 px-4 border border-cosmos-border rounded-lg text-cosmos-muted text-sm hover:border-cosmos-glow/30 hover:text-cosmos-glow transition-all flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              None of these fit — let me clarify
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-3"
            >
              <div className="text-xs text-cosmos-glow font-medium">
                Redirect this decision
              </div>
              <p className="text-xs text-cosmos-muted">
                Explain what the AI got wrong or what it&apos;s missing. For example: &ldquo;This
                doesn&apos;t apply because...&rdquo; or &ldquo;Actually, my situation is...&rdquo;
              </p>
              <textarea
                value={clarifyText}
                onChange={(e) => setClarifyText(e.target.value)}
                placeholder="e.g., This app is actually for my own local use — it should be free, so the payment model question doesn't apply here."
                className="w-full bg-cosmos-bg border border-cosmos-border rounded-lg px-4 py-3 text-sm text-cosmos-text placeholder:text-cosmos-muted/30 focus:outline-none focus:border-cosmos-glow/50 resize-none transition-all"
                rows={3}
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleClarify}
                  disabled={!clarifyText.trim() || isSubmitting}
                  className="flex-1 py-2.5 bg-cosmos-glow/20 border border-cosmos-glow/30 rounded-lg text-cosmos-glow text-sm font-medium hover:bg-cosmos-glow/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? "Rethinking..." : "Send clarification"}
                  {!isSubmitting && <ArrowRight className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => {
                    setShowClarify(false);
                    setClarifyText("");
                  }}
                  className="px-4 py-2.5 border border-cosmos-border rounded-lg text-cosmos-muted text-sm hover:border-cosmos-muted/50 transition-all"
                >
                  Back
                </button>
              </div>
            </motion.div>
          )}

          {/* Value implications */}
          {node.valueImplications && node.valueImplications.length > 0 && (
            <div className="mt-6 p-3 bg-cosmos-glow/5 border border-cosmos-glow/20 rounded-lg">
              <div className="text-xs font-medium text-cosmos-glow mb-1">
                Values at stake in this decision
              </div>
              <ul className="text-xs text-cosmos-muted space-y-0.5">
                {node.valueImplications.map((v, i) => (
                  <li key={i}>&bull; {v}</li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-cosmos-muted/50 text-center mt-4">
            You can revisit this decision later to explore the road not taken.
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Network, AlertTriangle, Eye, Send, ChevronDown } from "lucide-react";
import { useStore } from "@/store/useStore";

const phases = [
  { icon: Brain, label: "Analyzing goal structure...", duration: 3000 },
  { icon: Network, label: "Mapping decision pathways...", duration: 4000 },
  { icon: AlertTriangle, label: "Identifying value conflicts...", duration: 4000 },
  { icon: Eye, label: "Surfacing blind spots...", duration: 5000 },
];

export default function ReckoningLoader() {
  const { isDecomposing, loadingNotes, setLoadingNotes, goalText, nodes, values, addNodes, addValues, setCritique, setIsDecomposing } = useStore();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const startTime = useRef(Date.now());
  const noteRef = useRef<HTMLTextAreaElement>(null);

  // Cycle through phases
  useEffect(() => {
    if (!isDecomposing) {
      setPhaseIndex(0);
      setElapsed(0);
      setShowNotes(false);
      return;
    }

    startTime.current = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const diff = now - startTime.current;
      setElapsed(diff);

      // Determine phase based on cumulative durations
      let cumulative = 0;
      for (let i = 0; i < phases.length; i++) {
        cumulative += phases[i].duration;
        if (diff < cumulative) {
          setPhaseIndex(i);
          return;
        }
      }
      // Stay on last phase if still loading
      setPhaseIndex(phases.length - 1);
    }, 200);

    return () => clearInterval(interval);
  }, [isDecomposing]);

  if (!isDecomposing) return null;

  const totalEstimated = phases.reduce((sum, p) => sum + p.duration, 0);
  const progress = Math.min(elapsed / totalEstimated, 0.95); // Cap at 95% until done
  const CurrentIcon = phases[phaseIndex].icon;

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-[360px]">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-cosmos-surface/95 backdrop-blur-md border border-cosmos-glow/30 rounded-xl overflow-hidden shadow-lg"
      >
        {/* Phase indicator */}
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-3 mb-3">
            <motion.div
              key={phaseIndex}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-8 h-8 rounded-lg bg-cosmos-glow/15 border border-cosmos-glow/30 flex items-center justify-center"
            >
              <CurrentIcon className="w-4 h-4 text-cosmos-glow" />
            </motion.div>
            <div className="flex-1 min-w-0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={phaseIndex}
                  initial={{ y: 8, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-sm text-cosmos-glow font-medium"
                >
                  {phases[phaseIndex].label}
                </motion.div>
              </AnimatePresence>
              <div className="text-[10px] text-cosmos-muted mt-0.5">
                Step {phaseIndex + 1} of {phases.length}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 bg-cosmos-border rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full loading-shimmer"
              initial={{ width: "0%" }}
              animate={{ width: `${progress * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>

          {/* Phase dots */}
          <div className="flex justify-between mt-2 px-1">
            {phases.map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  i <= phaseIndex
                    ? "bg-cosmos-glow"
                    : "bg-cosmos-border"
                }`}
              />
            ))}
          </div>
        </div>

        {/* "While you wait" notes section */}
        <div className="border-t border-cosmos-border/50">
          <button
            onClick={() => {
              setShowNotes(!showNotes);
              if (!showNotes) {
                setTimeout(() => noteRef.current?.focus(), 100);
              }
            }}
            className="w-full px-4 py-2.5 flex items-center justify-between text-xs text-cosmos-muted hover:text-cosmos-glow transition-colors"
          >
            <span>Add more context while you wait</span>
            <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showNotes ? "rotate-180" : ""}`} />
          </button>

          <AnimatePresence>
            {showNotes && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-2">
                  <p className="text-[10px] text-cosmos-muted/60">
                    Thought of something the AI should know? Jot it down here
                    and it will be included in the next reckoning cycle.
                  </p>
                  <textarea
                    ref={noteRef}
                    value={loadingNotes}
                    onChange={(e) => setLoadingNotes(e.target.value)}
                    placeholder='e.g., "I forgot to mention I have a $10k budget constraint" or "The timeline is 3 months"'
                    className="w-full bg-cosmos-bg border border-cosmos-border rounded-lg px-3 py-2 text-xs text-cosmos-text placeholder:text-cosmos-muted/30 focus:outline-none focus:border-cosmos-glow/50 resize-none transition-all"
                    rows={2}
                  />
                  {loadingNotes.trim() && (
                    <div className="flex items-center gap-1.5 text-[10px] text-cosmos-resolved">
                      <Send className="w-3 h-3" />
                      Saved — will be included next time
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

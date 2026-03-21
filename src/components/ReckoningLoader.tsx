"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Network, AlertTriangle, Eye, Layers, Sparkles, Send, ChevronDown } from "lucide-react";
import { useStore } from "@/store/useStore";

const phases = [
  { icon: Brain, label: "Analyzing goal structure..." },
  { icon: Network, label: "Mapping decision pathways..." },
  { icon: Layers, label: "Weighing trade-offs..." },
  { icon: AlertTriangle, label: "Identifying value conflicts..." },
  { icon: Eye, label: "Surfacing blind spots..." },
  { icon: Sparkles, label: "Assembling your decision tree..." },
];

// Each phase advances after this many ms (cumulative pacing)
const PHASE_INTERVAL = 2500;

export default function ReckoningLoader() {
  const { isDecomposing, loadingNotes, setLoadingNotes } = useStore();
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const noteRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!isDecomposing) {
      setPhaseIndex(0);
      setShowNotes(false);
      return;
    }

    setPhaseIndex(0);

    const interval = setInterval(() => {
      setPhaseIndex((prev) => {
        // Cycle through phases continuously so it never looks frozen
        if (prev >= phases.length - 1) {
          return phases.length - 3; // loop back a couple phases to keep movement
        }
        return prev + 1;
      });
    }, PHASE_INTERVAL);

    return () => clearInterval(interval);
  }, [isDecomposing]);

  if (!isDecomposing) return null;

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
                AI is reckoning — this takes a moment
              </div>
            </div>
          </div>

          {/* Continuous progress bar — indeterminate shimmer */}
          <div className="w-full h-1.5 bg-cosmos-border rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full loading-shimmer"
              animate={{
                width: ["20%", "70%", "40%", "85%", "55%", "90%"],
              }}
              transition={{
                duration: 6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* Phase dots */}
          <div className="flex justify-center gap-1.5 mt-2">
            {phases.map((_, i) => (
              <motion.div
                key={i}
                animate={{
                  scale: i === phaseIndex ? 1.3 : 1,
                  opacity: i === phaseIndex ? 1 : i <= phaseIndex ? 0.6 : 0.2,
                }}
                transition={{ duration: 0.3 }}
                className={`w-1.5 h-1.5 rounded-full ${
                  i <= phaseIndex ? "bg-cosmos-glow" : "bg-cosmos-border"
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

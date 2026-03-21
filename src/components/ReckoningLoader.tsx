"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, ChevronDown } from "lucide-react";
import { useStore } from "@/store/useStore";

// Rotating "thinking out loud" messages — cycle every ~2.5s
const thinkingMessages = [
  "Decomposing your goal into sub-decisions...",
  "Identifying where your values come into play...",
  "Mapping trade-offs between competing priorities...",
  "Checking for blind spots you might not see...",
  "Tracing downstream consequences of each path...",
  "Finding where judgment calls are needed...",
  "Weighing what's at stake at each fork...",
  "Looking for hidden conflicts in your approach...",
  "Separating facts from value-laden choices...",
  "Building the branches of your decision tree...",
  "Considering edge cases and second-order effects...",
  "Detecting assumptions that need to be surfaced...",
];

// Tips that rotate in the bottom section
const tips = [
  "Yellow nodes are judgment points — only you can decide those.",
  "The Values Mirror shows what your choices reveal about your priorities.",
  "You can click any node to inspect it or add context the AI missed.",
  "After deciding, explore 'What if?' to see the road not taken.",
  "The AI does the reckoning. You do the judging.",
  "Blind spots are things you probably haven't considered yet.",
];

export default function ReckoningLoader() {
  const { isDecomposing, loadingNotes, setLoadingNotes } = useStore();
  const [messageIndex, setMessageIndex] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [nodeCount, setNodeCount] = useState(0);
  const startTime = useRef(Date.now());
  const noteRef = useRef<HTMLTextAreaElement>(null);

  // Cycle thinking messages
  useEffect(() => {
    if (!isDecomposing) {
      setMessageIndex(0);
      setTipIndex(0);
      setElapsed(0);
      setShowNotes(false);
      setNodeCount(0);
      return;
    }

    startTime.current = Date.now();

    // Rotate thinking messages every 2.5s
    const msgInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % thinkingMessages.length);
    }, 2500);

    // Rotate tips every 5s
    const tipInterval = setInterval(() => {
      setTipIndex((prev) => (prev + 1) % tips.length);
    }, 5000);

    // Update elapsed time every second
    const timeInterval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);

    // Simulate node discovery for visual feedback
    const nodeInterval = setInterval(() => {
      setNodeCount((prev) => prev + Math.floor(Math.random() * 2) + 1);
    }, 1800);

    return () => {
      clearInterval(msgInterval);
      clearInterval(tipInterval);
      clearInterval(timeInterval);
      clearInterval(nodeInterval);
    };
  }, [isDecomposing]);

  if (!isDecomposing) return null;

  const formatTime = (s: number) => {
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  };

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 w-[380px]">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-cosmos-surface/95 backdrop-blur-md border border-cosmos-glow/30 rounded-xl overflow-hidden shadow-lg"
      >
        {/* Main content */}
        <div className="px-4 pt-4 pb-3">
          {/* Header with live timer */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {/* Animated pulsing icon */}
              <div className="relative w-8 h-8">
                <motion.div
                  animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-lg bg-cosmos-glow/20"
                />
                <div className="absolute inset-0 rounded-lg bg-cosmos-glow/10 border border-cosmos-glow/30 flex items-center justify-center">
                  {/* Mini tree animation */}
                  <svg width="16" height="16" viewBox="0 0 16 16" className="text-cosmos-glow">
                    <motion.circle
                      cx="8" cy="3" r="2"
                      fill="currentColor"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <motion.line
                      x1="8" y1="5" x2="4" y2="10"
                      stroke="currentColor" strokeWidth="1"
                      animate={{ opacity: [0.2, 0.8, 0.2] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                    />
                    <motion.line
                      x1="8" y1="5" x2="12" y2="10"
                      stroke="currentColor" strokeWidth="1"
                      animate={{ opacity: [0.2, 0.8, 0.2] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.6 }}
                    />
                    <motion.circle
                      cx="4" cy="11" r="1.5"
                      fill="currentColor"
                      animate={{ opacity: [0.2, 0.9, 0.2] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.5 }}
                    />
                    <motion.circle
                      cx="12" cy="11" r="1.5"
                      fill="currentColor"
                      animate={{ opacity: [0.2, 0.9, 0.2] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.8 }}
                    />
                  </svg>
                </div>
              </div>
              <div>
                <div className="text-sm font-medium text-cosmos-text">AI is reckoning</div>
                <div className="text-[10px] text-cosmos-muted">Building your decision tree</div>
              </div>
            </div>
            {/* Live timer */}
            <div className="flex items-center gap-1.5 px-2 py-1 bg-cosmos-glow/10 border border-cosmos-glow/20 rounded-md">
              <motion.div
                animate={{ opacity: [1, 0.3, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-1.5 h-1.5 rounded-full bg-cosmos-glow"
              />
              <span className="text-[11px] text-cosmos-glow font-mono tabular-nums">
                {formatTime(elapsed)}
              </span>
            </div>
          </div>

          {/* Thinking message — rotates */}
          <div className="mb-3 min-h-[20px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={messageIndex}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.25 }}
                className="text-xs text-cosmos-glow/80"
              >
                {thinkingMessages[messageIndex]}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Activity bar — continuous flowing animation */}
          <div className="w-full h-1 bg-cosmos-border/50 rounded-full overflow-hidden mb-2">
            <motion.div
              className="h-full rounded-full bg-cosmos-glow"
              animate={{
                x: ["-100%", "200%"],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ width: "40%" }}
            />
          </div>

          {/* Stats — shows activity */}
          <div className="flex items-center justify-between text-[10px] text-cosmos-muted/60">
            <span>
              {nodeCount > 0 && (
                <motion.span
                  key={nodeCount}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 1 }}
                >
                  ~{Math.min(nodeCount, 12)} paths being explored
                </motion.span>
              )}
            </span>
            <span>Typically takes about a minute</span>
          </div>
        </div>

        {/* Rotating tip */}
        <div className="px-4 py-2.5 border-t border-cosmos-border/30 bg-cosmos-bg/30">
          <AnimatePresence mode="wait">
            <motion.div
              key={tipIndex}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="text-[10px] text-cosmos-muted/50 leading-relaxed"
            >
              <span className="text-cosmos-glow/40 font-medium">Tip:</span>{" "}
              {tips[tipIndex]}
            </motion.div>
          </AnimatePresence>
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

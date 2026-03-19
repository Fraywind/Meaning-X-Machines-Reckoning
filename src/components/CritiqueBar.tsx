"use client";

import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";

export default function CritiqueBar() {
  const { critique, setCritique } = useStore();

  if (!critique) return null;

  return (
    <motion.div
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -60, opacity: 0 }}
      className="absolute top-16 left-1/2 -translate-x-1/2 z-40 max-w-2xl w-full mx-auto"
    >
      <div className="mx-4 p-4 bg-cosmos-surface/95 backdrop-blur-md border border-cosmos-conflict/30 rounded-lg">
        <div className="flex items-start gap-3">
          <span className="text-cosmos-conflict text-sm mt-0.5 shrink-0">&#9670;</span>
          <div className="flex-1">
            <div className="text-xs font-medium text-cosmos-conflict mb-1">
              Constructive Criticism
            </div>
            <p className="text-sm text-cosmos-text/80">{critique}</p>
          </div>
          <button
            onClick={() => setCritique(null)}
            className="text-cosmos-muted hover:text-cosmos-text transition-colors text-sm shrink-0"
          >
            &#10005;
          </button>
        </div>
      </div>
    </motion.div>
  );
}

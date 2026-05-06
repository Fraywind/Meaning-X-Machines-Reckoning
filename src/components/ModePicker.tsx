"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { GitBranch, BookText } from "lucide-react";
import { ViewMode } from "@/types";
import { useStore } from "@/store/useStore";

const modes: { id: ViewMode; label: string; desc: string; icon: typeof GitBranch }[] = [
  {
    id: "tree",
    label: "Tree",
    desc: "Structured decision tree of your deliberation",
    icon: GitBranch,
  },
  {
    id: "journey",
    label: "Journey",
    desc: "Second-person story of what happened",
    icon: BookText,
  },
];

export default function ModePicker() {
  const { viewMode, setViewMode } = useStore();

  // If a stale viewMode (notebook / chat) is persisted from before, snap
  // to "tree" so the home picker shows a valid selection.
  useEffect(() => {
    if (viewMode !== "tree" && viewMode !== "journey") {
      setViewMode("tree");
    }
  }, [viewMode, setViewMode]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.6 }}
      className="mt-4 mb-4"
    >
      <div className="flex items-center justify-center gap-3">
        {modes.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setViewMode(id)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg border text-xs transition-all ${
              viewMode === id
                ? "bg-cosmos-glow/10 border-cosmos-glow/40 text-cosmos-glow"
                : "border-cosmos-border/30 text-cosmos-muted/50 hover:border-cosmos-glow/20 hover:text-cosmos-muted"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

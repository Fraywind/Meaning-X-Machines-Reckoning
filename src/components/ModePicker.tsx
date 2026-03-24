"use client";

import { motion } from "framer-motion";
import { GitBranch, BookOpen, MessageSquare } from "lucide-react";
import { ViewMode } from "@/types";
import { useStore } from "@/store/useStore";

const modes: { id: ViewMode; label: string; desc: string; icon: typeof GitBranch }[] = [
  {
    id: "tree",
    label: "Decision Tree",
    desc: "Visual map — drag, zoom, and explore branches",
    icon: GitBranch,
  },
  {
    id: "notebook",
    label: "Notebook",
    desc: "Focused, linear planning — read and decide top to bottom",
    icon: BookOpen,
  },
  {
    id: "chat",
    label: "Dialogue",
    desc: "Conversational flow with the tree alongside",
    icon: MessageSquare,
  },
];

export default function ModePicker() {
  const { viewMode, setViewMode } = useStore();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4, duration: 0.6 }}
      className="mt-6 mb-2"
    >
      <div className="flex items-center justify-center gap-2 mb-2.5">
        <span className="text-[10px] uppercase tracking-wider text-cosmos-muted/40">Experience</span>
        <div className="w-8 h-px bg-cosmos-border/30" />
        <span className="text-[10px] text-cosmos-muted/30">Pick what feels right — switch anytime</span>
      </div>

      <div className="flex gap-2 justify-center">
        {modes.map(({ id, label, desc, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setViewMode(id)}
            className={`group relative flex flex-col items-center gap-1.5 px-5 py-3 rounded-xl border transition-all text-center min-w-[130px] ${
              viewMode === id
                ? "bg-cosmos-glow/10 border-cosmos-glow/40 text-cosmos-glow"
                : "border-cosmos-border/40 text-cosmos-muted hover:border-cosmos-glow/20 hover:text-cosmos-text"
            }`}
          >
            <Icon className={`w-4 h-4 ${viewMode === id ? "text-cosmos-glow" : "text-cosmos-muted/60"}`} />
            <span className="text-xs font-medium">{label}</span>
            <span className={`text-[10px] leading-tight ${viewMode === id ? "text-cosmos-glow/60" : "text-cosmos-muted/40"}`}>
              {desc}
            </span>
            {viewMode === id && (
              <motion.div
                layoutId="mode-indicator"
                className="absolute -bottom-px left-1/4 right-1/4 h-0.5 bg-cosmos-glow rounded-full"
              />
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

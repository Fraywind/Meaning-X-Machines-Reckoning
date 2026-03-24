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
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.7 }}
      className="mt-6 mb-6 p-4 bg-cosmos-surface/40 backdrop-blur-sm border border-cosmos-border/30 rounded-2xl"
    >
      <div className="flex items-center justify-center gap-2 mb-3">
        <div className="h-px flex-1 max-w-[40px] bg-cosmos-border/30" />
        <span className="text-[10px] uppercase tracking-widest text-cosmos-muted/50 font-medium">
          Choose your experience
        </span>
        <div className="h-px flex-1 max-w-[40px] bg-cosmos-border/30" />
      </div>

      <div className="flex gap-2.5 justify-center">
        {modes.map(({ id, label, desc, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setViewMode(id)}
            className={`group relative flex flex-col items-center gap-2 px-5 py-3.5 rounded-xl border transition-all text-center min-w-[140px] ${
              viewMode === id
                ? "bg-cosmos-glow/12 border-cosmos-glow/40 text-cosmos-glow shadow-sm shadow-cosmos-glow/10"
                : "border-cosmos-border/30 text-cosmos-muted hover:border-cosmos-glow/25 hover:text-cosmos-text hover:bg-cosmos-surface/40"
            }`}
          >
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              viewMode === id
                ? "bg-cosmos-glow/15 border border-cosmos-glow/30"
                : "bg-cosmos-border/15 border border-cosmos-border/20"
            }`}>
              <Icon className={`w-4 h-4 ${viewMode === id ? "text-cosmos-glow" : "text-cosmos-muted/50 group-hover:text-cosmos-muted"}`} />
            </div>
            <span className="text-xs font-medium">{label}</span>
            <span className={`text-[10px] leading-tight max-w-[120px] ${viewMode === id ? "text-cosmos-glow/50" : "text-cosmos-muted/35"}`}>
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

      <p className="text-center text-[10px] text-cosmos-muted/30 mt-3">
        You can switch between modes at any time, even mid-session.
      </p>
    </motion.div>
  );
}

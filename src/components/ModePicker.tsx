"use client";

import { motion } from "framer-motion";
import { GitBranch, BookOpen, MessageSquare } from "lucide-react";
import { ViewMode } from "@/types";
import { useStore } from "@/store/useStore";

const modes: { id: ViewMode; label: string; desc: string; icon: typeof GitBranch }[] = [
  {
    id: "tree",
    label: "Tree",
    desc: "Visual map you can explore",
    icon: GitBranch,
  },
  {
    id: "notebook",
    label: "Notebook",
    desc: "Linear, focused planning",
    icon: BookOpen,
  },
  {
    id: "chat",
    label: "Dialogue",
    desc: "Chat with tree alongside",
    icon: MessageSquare,
  },
];

export default function ModePicker() {
  const { viewMode, setViewMode } = useStore();

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
      <p className="text-center text-[10px] text-cosmos-muted/25 mt-2">
        Pick a mode, or just start. You can switch anytime.
      </p>
    </motion.div>
  );
}

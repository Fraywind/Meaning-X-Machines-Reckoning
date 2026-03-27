"use client";

import { motion } from "framer-motion";
import { GitBranch, CheckCircle2, Heart, User } from "lucide-react";
import { SharedTree } from "@/types";
import { getDnaLabels } from "@/lib/valueDna";

function MiniTreeSilhouette({ nodes }: { nodes: Record<string, unknown> }) {
  // Generate a tiny branching SVG from node count
  const count = Math.min(Object.keys(nodes).length, 20);
  const levels = Math.ceil(Math.log2(count + 1));

  return (
    <svg width="60" height="40" viewBox="0 0 60 40" className="opacity-30">
      {/* Root */}
      <circle cx="30" cy="4" r="2" fill="rgb(var(--glow))" />
      {/* Branches */}
      {count > 1 && (
        <>
          <line x1="30" y1="6" x2="15" y2="16" stroke="rgb(var(--border))" strokeWidth="1" />
          <line x1="30" y1="6" x2="45" y2="16" stroke="rgb(var(--border))" strokeWidth="1" />
          <circle cx="15" cy="18" r="1.5" fill="rgb(var(--reckoning))" />
          <circle cx="45" cy="18" r="1.5" fill="rgb(var(--reckoning))" />
        </>
      )}
      {count > 4 && (
        <>
          <line x1="15" y1="20" x2="8" y2="28" stroke="rgb(var(--border))" strokeWidth="0.8" />
          <line x1="15" y1="20" x2="22" y2="28" stroke="rgb(var(--border))" strokeWidth="0.8" />
          <line x1="45" y1="20" x2="38" y2="28" stroke="rgb(var(--border))" strokeWidth="0.8" />
          <line x1="45" y1="20" x2="52" y2="28" stroke="rgb(var(--border))" strokeWidth="0.8" />
          <circle cx="8" cy="30" r="1.5" fill="rgb(var(--judgment))" />
          <circle cx="22" cy="30" r="1.5" fill="rgb(var(--resolved))" />
          <circle cx="38" cy="30" r="1.5" fill="rgb(var(--resolved))" />
          <circle cx="52" cy="30" r="1.5" fill="rgb(var(--judgment))" />
        </>
      )}
      {count > 8 && (
        <>
          <line x1="8" y1="32" x2="4" y2="38" stroke="rgb(var(--border))" strokeWidth="0.5" />
          <line x1="8" y1="32" x2="12" y2="38" stroke="rgb(var(--border))" strokeWidth="0.5" />
          <circle cx="4" cy="39" r="1" fill="rgb(var(--resolved))" />
          <circle cx="12" cy="39" r="1" fill="rgb(var(--reckoning))" />
        </>
      )}
    </svg>
  );
}

export default function TreeCard({
  tree,
  onClick,
  delay = 0,
}: {
  tree: SharedTree;
  onClick?: () => void;
  delay?: number;
}) {
  const topValues = getDnaLabels(tree.valueDna).slice(0, 3);
  const timeAgo = getTimeAgo(tree.sharedAt);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      onClick={onClick}
      className="group p-4 bg-cosmos-surface/70 border border-cosmos-border/40 rounded-xl hover:border-cosmos-glow/30 hover:bg-cosmos-surface/90 transition-all cursor-pointer"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-cosmos-text line-clamp-2 group-hover:text-cosmos-glow transition-colors">
            {tree.goalText}
          </h3>
          <div className="flex items-center gap-2 mt-1.5 text-[10px] text-cosmos-muted/50">
            {tree.userName && (
              <span className="flex items-center gap-1">
                <User className="w-2.5 h-2.5" />
                {tree.userName}
              </span>
            )}
            <span>{timeAgo}</span>
          </div>
        </div>
        <MiniTreeSilhouette nodes={tree.nodes} />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 mb-3 text-[10px] text-cosmos-muted">
        <span className="flex items-center gap-1">
          <GitBranch className="w-3 h-3" />
          {tree.stats.totalNodes} nodes
        </span>
        <span className="flex items-center gap-1 text-cosmos-resolved">
          <CheckCircle2 className="w-3 h-3" />
          {tree.stats.resolvedCount} decided
        </span>
      </div>

      {/* Value pills */}
      {topValues.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {topValues.map((v) => (
            <span
              key={v.label}
              className="px-2 py-0.5 text-[9px] bg-cosmos-glow/8 border border-cosmos-glow/15 rounded-full text-cosmos-glow/70"
            >
              {v.label} {Math.round(v.strength * 100)}%
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

function getTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

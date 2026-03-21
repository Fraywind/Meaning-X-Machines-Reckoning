"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { motion } from "framer-motion";
import {
  Target,
  CircleDot,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  AlertCircle,
  ChevronRight,
  RotateCcw,
} from "lucide-react";
import { DecisionNode } from "@/types";
import { useStore } from "@/store/useStore";

const iconMap = {
  goal: Target,
  reckoning: CircleDot,
  judgment: AlertTriangle,
  resolved: CheckCircle2,
  counterfactual: GitBranch,
};

function TreeNode({ data }: NodeProps<DecisionNode>) {
  const { setActiveJudgment, setCounterfactualNode, setInspectedNode } = useStore();

  const depth = data.depth ?? 0;
  const Icon = iconMap[data.type] || CircleDot;

  // Visual hierarchy: earlier nodes are larger and more prominent
  const isRoot = depth === 0;
  const isPivot = depth <= 1;
  const isMid = depth === 2;
  // depth >= 3 is deep/leaf

  const sizeClass = isRoot
    ? "min-w-[280px] max-w-[340px] px-5 py-4"
    : isPivot
      ? "min-w-[250px] max-w-[310px] px-5 py-4"
      : isMid
        ? "min-w-[220px] max-w-[280px] px-4 py-3"
        : "min-w-[180px] max-w-[240px] px-3 py-2.5";

  const titleClass = isRoot
    ? "text-base font-semibold"
    : isPivot
      ? "text-sm font-semibold"
      : isMid
        ? "text-sm font-medium"
        : "text-xs font-medium";

  const descClass = isPivot
    ? "text-xs text-cosmos-muted mt-1.5 line-clamp-3"
    : isMid
      ? "text-xs text-cosmos-muted mt-1 line-clamp-2"
      : "text-[11px] text-cosmos-muted/70 mt-1 line-clamp-2";

  const iconSize = isPivot ? "w-5 h-5" : isMid ? "w-4 h-4" : "w-3.5 h-3.5";

  const opacityClass = depth >= 3 ? "opacity-80" : "";

  const borderWidth = isPivot ? "border-2" : "border";

  const glowClass =
    data.type === "judgment"
      ? "glow-judgment"
      : data.type === "resolved"
        ? "glow-resolved"
        : data.status === "conflict"
          ? "glow-conflict"
          : data.type === "counterfactual"
            ? "glow-reckoning"
            : "";

  const borderColor =
    data.type === "judgment"
      ? "border-cosmos-judgment/60"
      : data.type === "resolved"
        ? "border-cosmos-resolved/60"
        : data.type === "counterfactual"
          ? "border-purple-500/60"
          : data.type === "goal"
            ? "border-cosmos-glow/60"
            : depth >= 3
              ? "border-cosmos-border/40"
              : "border-cosmos-border";

  const iconColor =
    data.type === "judgment"
      ? "text-cosmos-judgment"
      : data.type === "resolved"
        ? "text-cosmos-resolved"
        : data.type === "counterfactual"
          ? "text-purple-400"
          : data.type === "goal"
            ? "text-cosmos-glow"
            : "text-cosmos-reckoning";

  const bgClass = isPivot
    ? "bg-cosmos-surface"
    : "bg-cosmos-surface/80";

  const handleClick = () => {
    // Every node opens the detail panel; judgment "Decide now" button
    // inside the panel then opens the full judgment panel
    setInspectedNode(data.id);
  };

  const handleDecideClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveJudgment(data.id);
  };

  const handleWhatIfClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCounterfactualNode(data.id);
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, type: "spring" }}
      onClick={handleClick}
      className={`
        rounded-xl ${borderWidth} ${bgClass} backdrop-blur-sm
        ${borderColor} ${glowClass} ${sizeClass} ${opacityClass}
        cursor-pointer hover:brightness-110 transition-all
        ${data.type === "judgment" && data.status !== "resolved" ? "animate-pulse-glow" : ""}
      `}
    >
      <Handle type="target" position={Position.Left} className="!bg-cosmos-glow !w-2 !h-2" />

      <div className="flex items-start gap-2.5">
        <Icon className={`${iconSize} mt-0.5 shrink-0 ${iconColor}`} />
        <div className="flex-1 min-w-0">
          <div className={`${titleClass} text-cosmos-text truncate`}>{data.label}</div>
          <div className={descClass}>{data.description}</div>

          {data.type === "judgment" && data.status !== "resolved" && (
            <div
              onClick={handleDecideClick}
              className={`mt-3 flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-cosmos-judgment/15 border border-cosmos-judgment/40 hover:bg-cosmos-judgment/25 transition-all cursor-pointer ${depth >= 3 ? "text-[10px]" : "text-xs"}`}
            >
              <span className="text-cosmos-judgment font-semibold">Decide now</span>
              <ChevronRight className="w-3.5 h-3.5 text-cosmos-judgment" />
            </div>
          )}

          {data.type === "resolved" && data.selectedOption && (
            <div className="mt-2">
              <div className={`flex items-center gap-1.5 text-cosmos-resolved/80 ${depth >= 3 ? "text-[10px]" : "text-xs"}`}>
                <CheckCircle2 className="w-3 h-3" />
                {data.options?.find((o) => o.id === data.selectedOption)?.label || data.selectedOption}
              </div>
              {data.options && data.options.length > 1 && (
                <div
                  onClick={handleWhatIfClick}
                  className={`mt-1.5 flex items-center gap-1.5 text-purple-400/60 hover:text-purple-400 transition-colors cursor-pointer ${depth >= 3 ? "text-[10px]" : "text-xs"}`}
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>What if?</span>
                </div>
              )}
            </div>
          )}

          {data.blindSpots && data.blindSpots.length > 0 && (
            <div className={`mt-2 px-2 py-1 bg-cosmos-conflict/10 border border-cosmos-conflict/20 rounded-lg flex items-start gap-1.5 ${depth >= 3 ? "text-[10px]" : "text-xs"}`}>
              <AlertCircle className="w-3 h-3 text-cosmos-conflict/80 mt-0.5 shrink-0" />
              <span className="text-cosmos-conflict/80">{data.blindSpots[0]}</span>
            </div>
          )}
        </div>
      </div>

      {/* Depth indicator for root / click hint for others */}
      {isRoot ? (
        <div className="mt-2 pt-2 border-t border-cosmos-glow/10">
          <div className="text-[10px] text-cosmos-glow/40 uppercase tracking-widest">Your Goal</div>
        </div>
      ) : data.type === "reckoning" ? (
        <div className="mt-2 pt-1.5 border-t border-cosmos-border/20">
          <div className="text-[10px] text-cosmos-muted/30">Click to inspect</div>
        </div>
      ) : null}

      <Handle type="source" position={Position.Right} className="!bg-cosmos-glow !w-2 !h-2" />
    </motion.div>
  );
}

export default memo(TreeNode);

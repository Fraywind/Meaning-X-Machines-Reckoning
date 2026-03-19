"use client";

import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import { motion } from "framer-motion";
import { DecisionNode } from "@/types";
import { useStore } from "@/store/useStore";

function TreeNode({ data }: NodeProps<DecisionNode>) {
  const { setActiveJudgment, setCounterfactualNode } = useStore();

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
            : "border-cosmos-border";

  const iconMap: Record<string, string> = {
    goal: "\u25C9",
    reckoning: "\u25CB",
    judgment: "\u26A0",
    resolved: "\u2714",
    counterfactual: "\u2234",
  };

  const handleClick = () => {
    if (data.type === "judgment" && data.status === "conflict") {
      setActiveJudgment(data.id);
    } else if (data.type === "resolved" && data.options && data.options.length > 1) {
      setCounterfactualNode(data.id);
    }
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.4, type: "spring" }}
      onClick={handleClick}
      className={`
        px-4 py-3 rounded-xl border bg-cosmos-surface
        ${borderColor} ${glowClass}
        min-w-[200px] max-w-[280px]
        cursor-pointer hover:brightness-110 transition-all
        ${data.type === "judgment" && data.status === "conflict" ? "animate-pulse-glow" : ""}
      `}
    >
      <Handle type="target" position={Position.Left} className="!bg-cosmos-glow !w-2 !h-2" />

      <div className="flex items-start gap-2">
        <span className="text-sm mt-0.5 shrink-0">
          {data.type === "judgment" ? (
            <span className="text-cosmos-judgment">{iconMap.judgment}</span>
          ) : data.type === "resolved" ? (
            <span className="text-cosmos-resolved">{iconMap.resolved}</span>
          ) : data.type === "goal" ? (
            <span className="text-cosmos-glow">{iconMap.goal}</span>
          ) : data.type === "counterfactual" ? (
            <span className="text-purple-400">{iconMap.counterfactual}</span>
          ) : (
            <span className="text-cosmos-reckoning">{iconMap.reckoning}</span>
          )}
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-cosmos-text truncate">{data.label}</div>
          <div className="text-xs text-cosmos-muted mt-1 line-clamp-2">{data.description}</div>

          {data.type === "judgment" && data.status === "conflict" && (
            <div className="mt-2 text-xs text-cosmos-judgment/80 font-medium">
              Judgment needed &rarr;
            </div>
          )}

          {data.type === "resolved" && data.selectedOption && (
            <div className="mt-2 text-xs text-cosmos-resolved/80">
              Chose: {data.options?.find((o) => o.id === data.selectedOption)?.label || data.selectedOption}
            </div>
          )}

          {data.blindSpots && data.blindSpots.length > 0 && (
            <div className="mt-2 px-2 py-1 bg-cosmos-conflict/10 border border-cosmos-conflict/20 rounded text-xs text-cosmos-conflict/80">
              Blind spot: {data.blindSpots[0]}
            </div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Right} className="!bg-cosmos-glow !w-2 !h-2" />
    </motion.div>
  );
}

export default memo(TreeNode);

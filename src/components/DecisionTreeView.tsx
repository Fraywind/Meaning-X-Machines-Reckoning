"use client";

import { useMemo, useCallback } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  NodeTypes,
  useNodesState,
  useEdgesState,
  ConnectionMode,
} from "reactflow";
import "reactflow/dist/style.css";
import { useStore } from "@/store/useStore";
import TreeNode from "./TreeNode";
import JudgmentPanel from "./JudgmentPanel";
import ValuePanel from "./ValuePanel";
import CritiqueBar from "./CritiqueBar";
import CounterfactualPanel from "./CounterfactualPanel";
import SessionPanel from "./SessionPanel";
import NodeDetailPanel from "./NodeDetailPanel";
import ReckoningLoader from "./ReckoningLoader";
import ReckoningSummary from "./ReckoningSummary";
import ThemeSwitcher from "./ThemeSwitcher";
import Starfield from "./Starfield";
import { DecisionNode } from "@/types";

const nodeTypes: NodeTypes = {
  treeNode: TreeNode,
};

function layoutTree(nodes: Record<string, DecisionNode>): {
  flowNodes: Node[];
  flowEdges: Edge[];
} {
  const flowNodes: Node[] = [];
  const flowEdges: Edge[] = [];
  const nodeList = Object.values(nodes);

  if (nodeList.length === 0) return { flowNodes, flowEdges };

  // Build adjacency
  const childrenMap: Record<string, string[]> = {};
  for (const n of nodeList) {
    if (n.parentId && nodes[n.parentId]) {
      if (!childrenMap[n.parentId]) childrenMap[n.parentId] = [];
      childrenMap[n.parentId].push(n.id);
    }
  }

  // Find roots
  const roots = nodeList.filter((n) => !n.parentId || !nodes[n.parentId]);

  // BFS layout
  const positions: Record<string, { x: number; y: number }> = {};
  const depths: Record<string, number> = {};
  const HORIZONTAL_SPACING = 360;
  const VERTICAL_SPACING = 220;

  let currentY = 0;

  function layoutSubtree(nodeId: string, depth: number, yOffset: number): number {
    depths[nodeId] = depth;
    const children = childrenMap[nodeId] || [];
    if (children.length === 0) {
      positions[nodeId] = { x: depth * HORIZONTAL_SPACING, y: yOffset };
      return yOffset + VERTICAL_SPACING;
    }

    let childY = yOffset;
    for (const childId of children) {
      childY = layoutSubtree(childId, depth + 1, childY);
    }

    const firstChildY = positions[children[0]].y;
    const lastChildY = positions[children[children.length - 1]].y;
    positions[nodeId] = {
      x: depth * HORIZONTAL_SPACING,
      y: (firstChildY + lastChildY) / 2,
    };

    return childY;
  }

  for (const root of roots) {
    currentY = layoutSubtree(root.id, 0, currentY);
  }

  // Create flow nodes and edges with depth info
  for (const n of nodeList) {
    const pos = positions[n.id] || { x: 0, y: flowNodes.length * VERTICAL_SPACING };
    const depth = depths[n.id] ?? 0;
    flowNodes.push({
      id: n.id,
      type: "treeNode",
      position: pos,
      data: { ...n, depth },
    });

    if (n.parentId && nodes[n.parentId]) {
      flowEdges.push({
        id: `${n.parentId}-${n.id}`,
        source: n.parentId,
        target: n.id,
        animated: n.status === "conflict" || n.type === "judgment",
        style: {
          stroke:
            n.type === "judgment"
              ? "#f59e0b"
              : n.type === "counterfactual"
                ? "#818cf8"
                : n.status === "resolved"
                  ? "#10b981"
                  : "#3b3b5c",
          strokeWidth: 2,
        },
      });
    }
  }

  return { flowNodes, flowEdges };
}

export default function DecisionTreeView() {
  const { nodes, activeJudgmentId, counterfactualNodeId, inspectedNodeId, showValuePanel, showSessionPanel, critique, isDecomposing } =
    useStore();

  const { flowNodes, flowEdges } = useMemo(() => layoutTree(nodes), [nodes]);

  const [rfNodes, , onNodesChange] = useNodesState(flowNodes);
  const [rfEdges, , onEdgesChange] = useEdgesState(flowEdges);

  // Sync when store changes
  useMemo(() => {
    // This triggers re-render with new nodes
  }, [flowNodes, flowEdges]);

  const activeJudgmentNode = activeJudgmentId ? nodes[activeJudgmentId] : null;
  const counterfactualNode = counterfactualNodeId ? nodes[counterfactualNodeId] : null;
  const inspectedNode = inspectedNodeId ? nodes[inspectedNodeId] : null;

  return (
    <div className="w-full h-screen relative">
      <Starfield />

      {/* Loading overlay */}
      <ReckoningLoader />

      {/* Reckoning Summary — shows when all judgments resolved */}
      <ReckoningSummary />

      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        connectionMode={ConnectionMode.Loose}
        fitView
        fitViewOptions={{ padding: 0.3 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{ type: "smoothstep" }}
      >
        <Background color="#1e1e2e" gap={24} size={1} />
        <Controls position="bottom-left" />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as DecisionNode;
            switch (data.type) {
              case "goal":
                return "#818cf8";
              case "judgment":
                return "#f59e0b";
              case "resolved":
                return "#10b981";
              case "counterfactual":
                return "#a78bfa";
              default:
                return "#6366f1";
            }
          }}
          maskColor="rgba(10, 10, 15, 0.8)"
        />
      </ReactFlow>

      {/* Node Detail Panel — shows for any clicked node unless judgment/counterfactual is open */}
      {inspectedNode && !activeJudgmentNode && <NodeDetailPanel node={inspectedNode} />}

      {/* Judgment Panel */}
      {activeJudgmentNode && <JudgmentPanel node={activeJudgmentNode} />}

      {/* Counterfactual Panel */}
      {counterfactualNode && <CounterfactualPanel node={counterfactualNode} />}

      {/* Value Panel */}
      {showValuePanel && <ValuePanel />}

      {/* Session Panel */}
      {showSessionPanel && <SessionPanel />}

      {/* Critique Bar */}
      {critique && <CritiqueBar />}

      {/* Top bar */}
      <div className="absolute top-4 right-4 z-40 flex gap-2">
        <ThemeSwitcher />
        <button
          onClick={() => useStore.getState().saveCurrentSession()}
          className="px-3 py-1.5 text-xs rounded-lg border bg-cosmos-surface border-cosmos-border text-cosmos-muted hover:border-cosmos-resolved/30 hover:text-cosmos-resolved transition-all"
        >
          Save
        </button>
        <button
          onClick={() => {
            useStore.getState().loadSessionsFromStorage();
            useStore.getState().toggleSessionPanel();
          }}
          className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
            showSessionPanel
              ? "bg-cosmos-glow/20 border-cosmos-glow/50 text-cosmos-glow"
              : "bg-cosmos-surface border-cosmos-border text-cosmos-muted hover:border-cosmos-glow/30"
          }`}
        >
          Sessions
        </button>
        <button
          onClick={() => useStore.getState().toggleValuePanel()}
          className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
            showValuePanel
              ? "bg-cosmos-glow/20 border-cosmos-glow/50 text-cosmos-glow"
              : "bg-cosmos-surface border-cosmos-border text-cosmos-muted hover:border-cosmos-glow/30"
          }`}
        >
          Values Mirror
        </button>
        <button
          onClick={() => useStore.getState().reset()}
          className="px-3 py-1.5 text-xs rounded-lg border bg-cosmos-surface border-cosmos-border text-cosmos-muted hover:border-cosmos-conflict/30 hover:text-cosmos-conflict transition-all"
        >
          New Goal
        </button>
      </div>
    </div>
  );
}

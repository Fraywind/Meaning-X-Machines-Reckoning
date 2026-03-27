"use client";

import { useMemo, useCallback, useState, useEffect, useRef } from "react";
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
import InsightCardComponent from "./InsightCard";
import ThemeSwitcher from "./ThemeSwitcher";
import Starfield from "./Starfield";
import GuidePanel from "./GuidePanel";
import { DecisionNode } from "@/types";
import { AnimatePresence } from "framer-motion";

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
        animated: n.status !== "resolved" || n.type === "judgment",
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
  const { nodes, activeJudgmentId, counterfactualNodeId, inspectedNodeId, showValuePanel, showSessionPanel, critique, isDecomposing, forceShowSummary, setForceShowSummary, insightCards, addInsightCard, dismissInsightCard, goalText } =
    useStore();
  const [showReadyConfirm, setShowReadyConfirm] = useState(false);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const lastInsightCountRef = useRef(0);

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

  const nodeList = Object.values(nodes);
  const resolvedCount = nodeList.filter((n) => n.type === "resolved").length;
  const pendingCount = nodeList.filter((n) => n.type === "judgment" && n.status !== "resolved").length;
  const canShowReady = resolvedCount > 0 && !forceShowSummary;

  // Generate insight card every 3 resolutions
  useEffect(() => {
    if (resolvedCount > 0 && resolvedCount % 3 === 0 && resolvedCount !== lastInsightCountRef.current) {
      lastInsightCountRef.current = resolvedCount;
      const resolvedNodes = nodeList
        .filter((n) => n.type === "resolved")
        .slice(-3)
        .map((n) => ({
          label: n.label,
          choice: n.options?.find((o) => o.id === n.selectedOption)?.label || n.selectedOption || "Custom",
        }));

      fetch("/api/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolvedNodes, goalText }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.insight) {
            addInsightCard({
              id: `insight-${Date.now()}`,
              content: data.insight,
              relatedNodeIds: nodeList.filter((n) => n.type === "resolved").slice(-3).map((n) => n.id),
              dismissed: false,
              generatedAt: Date.now(),
            });
          }
        })
        .catch(() => {});
    }
  }, [resolvedCount]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-dismiss insight cards after 15 seconds
  useEffect(() => {
    const visible = insightCards.filter((c) => !c.dismissed);
    if (visible.length === 0) return;
    const latest = visible[visible.length - 1];
    const age = Date.now() - latest.generatedAt;
    const remaining = Math.max(0, 15000 - age);
    const timer = setTimeout(() => {
      dismissInsightCard(latest.id);
    }, remaining);
    return () => clearTimeout(timer);
  }, [insightCards, dismissInsightCard]);

  // Only show the most recent undismissed insight
  const visibleInsight = insightCards.filter((c) => !c.dismissed).slice(-1);

  return (
    <div className="w-full h-screen relative">
      <Starfield />

      {/* Loading overlay */}
      <ReckoningLoader />

      {/* Reckoning Summary — shows when all judgments resolved or user is ready */}
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
        {/* MiniMap — hidden by default, shows on hover */}
        <div
          className="absolute bottom-0 right-0 z-10"
          onMouseEnter={() => setShowMiniMap(true)}
          onMouseLeave={() => setShowMiniMap(false)}
          style={{ width: showMiniMap ? "auto" : 40, height: showMiniMap ? "auto" : 40 }}
        >
          {showMiniMap ? (
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
          ) : (
            <div className="w-10 h-10 flex items-center justify-center text-cosmos-muted/30 hover:text-cosmos-muted/60 transition-colors cursor-default text-[10px]">
              Map
            </div>
          )}
        </div>
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

      {/* Insight card — bottom right, one at a time, auto-dismisses */}
      {visibleInsight.length > 0 && (
        <div className="fixed bottom-20 right-4 z-40 w-80">
          <AnimatePresence>
            {visibleInsight.map((card) => (
              <InsightCardComponent
                key={card.id}
                card={card}
                onDismiss={() => dismissInsightCard(card.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Complexity indicator */}
      {resolvedCount > 0 && (
        <div className="fixed bottom-6 right-4 z-30 flex items-center gap-2 px-3 py-1.5 bg-cosmos-surface/80 border border-cosmos-border/30 rounded-lg text-[10px] text-cosmos-muted/50">
          <span className="text-cosmos-resolved">{resolvedCount}</span> decided
          <span className="w-0.5 h-3 bg-cosmos-border/30" />
          <span className="text-cosmos-judgment">{pendingCount}</span> pending
          <span className="w-0.5 h-3 bg-cosmos-border/30" />
          <span>{nodeList.length}</span> nodes
        </div>
      )}

      {/* Guide Panel — bottom right */}
      <GuidePanel />

      {/* Finish button — bottom left, next to ReactFlow controls */}
      {canShowReady && (
        <div className="fixed bottom-6 left-[52px] z-50">
          {showReadyConfirm ? (
            <div className="bg-cosmos-surface/95 backdrop-blur-sm border border-cosmos-glow/30 rounded-xl p-3 shadow-lg w-64">
              <p className="text-xs text-cosmos-text font-medium mb-1">Finish and generate your final output?</p>
              <p className="text-[10px] text-cosmos-muted mb-3">
                {pendingCount > 0
                  ? `You still have ${pendingCount} unresolved decision${pendingCount > 1 ? "s" : ""}. Any skipped decisions won't appear in the output.`
                  : "All decisions are resolved. Your output will reflect every choice you made."}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setForceShowSummary(true);
                    setShowReadyConfirm(false);
                  }}
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-cosmos-resolved/20 border border-cosmos-resolved/40 text-cosmos-resolved hover:bg-cosmos-resolved/30 transition-all"
                >
                  Finish
                </button>
                <button
                  onClick={() => setShowReadyConfirm(false)}
                  className="flex-1 px-2.5 py-1.5 text-xs rounded-lg bg-cosmos-surface border border-cosmos-border text-cosmos-muted hover:text-cosmos-text transition-all"
                >
                  Keep going
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowReadyConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border bg-cosmos-surface/90 border-cosmos-border text-cosmos-muted hover:border-cosmos-resolved/30 hover:text-cosmos-resolved transition-all shadow-sm"
            >
              <span>&#10003;</span>
              <span>Finish &amp; generate output</span>
            </button>
          )}
        </div>
      )}

      {/* Top bar — mode dropdown left, controls right */}
      <div className="absolute top-4 left-4 z-40 flex items-center gap-2">
        <span className="text-[10px] text-cosmos-muted/50 uppercase tracking-wider">Format</span>
        <select
          value="tree"
          onChange={(e) => useStore.getState().setViewMode(e.target.value as "tree" | "notebook" | "chat")}
          className="bg-cosmos-surface/80 border border-cosmos-border rounded-lg px-2.5 py-1.5 text-xs text-cosmos-text focus:outline-none focus:border-cosmos-glow/50 cursor-pointer"
        >
          <option value="tree">Tree</option>
          <option value="notebook">Notebook</option>
          <option value="chat">Dialogue</option>
        </select>
      </div>
      <div className="absolute top-4 right-4 z-40 flex gap-2">
        <ThemeSwitcher />
        <button
          onClick={() => {
            if (confirm("This will download your session as a JSON file. You can reload it later with \"Resume from file\" on the home screen.\n\nDownload now?")) {
              useStore.getState().saveCurrentSession();
            }
          }}
          className="px-3 py-1.5 text-xs rounded-lg border bg-cosmos-surface border-cosmos-border text-cosmos-muted hover:border-cosmos-resolved/30 hover:text-cosmos-resolved transition-all"
          title="Download session as a file you can resume later"
        >
          Save to file
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
      </div>
    </div>
  );
}

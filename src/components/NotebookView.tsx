"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Target,
  CircleDot,
  AlertTriangle,
  CheckCircle2,
  GitBranch,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Heart,
  ArrowRight,
  MessageSquare,
  Loader2,
  RotateCcw,
  Copy,
  Check,
  FileText,
  Terminal,
} from "lucide-react";
import { DecisionNode, ExportFormat } from "@/types";
import { useStore } from "@/store/useStore";
import { safeFetch } from "@/lib/api";
import ThemeSwitcher from "./ThemeSwitcher";
import Starfield from "./Starfield";
import ReckoningLoader from "./ReckoningLoader";
import CritiqueBar from "./CritiqueBar";
import GuidePanel from "./GuidePanel";

const iconMap: Record<string, typeof Target> = {
  goal: Target,
  reckoning: CircleDot,
  judgment: AlertTriangle,
  resolved: CheckCircle2,
  counterfactual: GitBranch,
};

const typeLabels: Record<string, string> = {
  goal: "Starting Point",
  reckoning: "Analysis",
  judgment: "Your Decision",
  resolved: "Decided",
  counterfactual: "Alternate Path",
};

// Notebook node card
function NotebookNodeCard({ node, depth }: { node: DecisionNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth <= 1);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [showClarify, setShowClarify] = useState(false);
  const [clarifyText, setClarifyText] = useState("");

  const {
    nodes, goalText, values, resolveJudgment,
    addNodes, addValues, setCritique, setIsDecomposing,
    loadingNotes, setLoadingNotes,
  } = useStore();

  const Icon = iconMap[node.type] || CircleDot;
  const isJudgmentPending = node.type === "judgment" && node.status !== "resolved";
  const children = Object.values(nodes).filter((n) => n.parentId === node.id);

  const borderColor =
    node.type === "judgment"
      ? "border-l-cosmos-judgment"
      : node.type === "resolved"
        ? "border-l-cosmos-resolved"
        : node.type === "counterfactual"
          ? "border-l-purple-400"
          : node.type === "goal"
            ? "border-l-cosmos-glow"
            : "border-l-cosmos-reckoning/40";

  const iconColor =
    node.type === "judgment"
      ? "text-cosmos-judgment"
      : node.type === "resolved"
        ? "text-cosmos-resolved"
        : node.type === "counterfactual"
          ? "text-purple-400"
          : node.type === "goal"
            ? "text-cosmos-glow"
            : "text-cosmos-reckoning";

  const handleResolve = async () => {
    if (!selectedOptionId) return;
    setIsResolving(true);
    resolveJudgment(node.id, selectedOptionId);
    setIsDecomposing(true);
    try {
      const goalWithNotes = loadingNotes.trim()
        ? `${goalText}\n\n--- Additional context from user ---\n${loadingNotes}`
        : goalText;
      const data = await safeFetch("/api/decompose", {
        goal: goalWithNotes,
        existingNodes: Object.values(nodes),
        existingValues: values,
        judgmentContext: {
          nodeId: node.id,
          chosenOption: node.options?.find((o) => o.id === selectedOptionId)?.label || selectedOptionId,
        },
      });
      if (loadingNotes.trim()) setLoadingNotes("");
      if (data.nodes) addNodes(data.nodes);
      if (data.values) addValues(data.values);
      if (data.critique) setCritique(data.critique);
    } catch (err) {
      console.error("Failed:", err);
    } finally {
      setIsDecomposing(false);
      setIsResolving(false);
    }
  };

  const handleClarify = async () => {
    if (!clarifyText.trim()) return;
    setIsResolving(true);
    resolveJudgment(node.id, "user-clarification");
    setIsDecomposing(true);
    try {
      const goalWithNotes = loadingNotes.trim()
        ? `${goalText}\n\n--- Additional context from user ---\n${loadingNotes}`
        : goalText;
      const data = await safeFetch("/api/decompose", {
        goal: goalWithNotes,
        existingNodes: Object.values(nodes),
        existingValues: values,
        judgmentContext: {
          nodeId: node.id,
          chosenOption: `User clarification: "${clarifyText}"`,
        },
      });
      if (loadingNotes.trim()) setLoadingNotes("");
      if (data.nodes) addNodes(data.nodes);
      if (data.values) addValues(data.values);
      if (data.critique) setCritique(data.critique);
    } catch (err) {
      console.error("Failed:", err);
    } finally {
      setIsDecomposing(false);
      setIsResolving(false);
      setShowClarify(false);
      setClarifyText("");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mb-2"
    >
      <div
        className={`border-l-[3px] ${borderColor} bg-cosmos-surface/70 backdrop-blur-sm rounded-r-lg border border-cosmos-border/40 overflow-hidden`}
        style={{ borderLeftWidth: "3px", marginLeft: `${depth * 24}px` }}
      >
        {/* Header — always visible */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-cosmos-border/10 transition-colors"
        >
          <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-cosmos-text truncate">{node.label}</span>
              <span className={`text-[10px] uppercase tracking-wider ${iconColor} opacity-60`}>
                {typeLabels[node.type] || node.type}
              </span>
            </div>
          </div>
          {node.type === "resolved" && node.selectedOption && (
            <span className="text-xs text-cosmos-resolved/80 flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3 h-3" />
              {node.options?.find((o) => o.id === node.selectedOption)?.label || "Decided"}
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-cosmos-muted/40 transition-transform shrink-0 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Expanded content */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 border-t border-cosmos-border/20 pt-3 space-y-3">
                <p className="text-sm text-cosmos-muted leading-relaxed">{node.description}</p>

                {/* Stakes */}
                {node.stakes && (
                  <div className="p-3 bg-cosmos-conflict/8 border border-cosmos-conflict/20 rounded-lg">
                    <div className="text-xs font-medium text-cosmos-conflict mb-1">What&apos;s at stake</div>
                    <p className="text-xs text-cosmos-text/80">{node.stakes}</p>
                  </div>
                )}

                {/* Conflict */}
                {node.conflict && (
                  <div className="p-3 bg-cosmos-judgment/8 border border-cosmos-judgment/20 rounded-lg">
                    <div className="text-xs font-medium text-cosmos-judgment mb-1">The tension</div>
                    <p className="text-xs text-cosmos-text/80">{node.conflict}</p>
                  </div>
                )}

                {/* Judgment options */}
                {isJudgmentPending && node.options && node.options.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-medium text-cosmos-judgment uppercase tracking-wider">
                      Choose your path
                    </div>
                    {node.options.map((option, index) => (
                      <button
                        key={option.id}
                        onClick={() => { setSelectedOptionId(option.id); setShowClarify(false); }}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedOptionId === option.id
                            ? "border-cosmos-judgment bg-cosmos-judgment/10"
                            : "border-cosmos-border hover:border-cosmos-judgment/30 bg-cosmos-bg/50"
                        }`}
                      >
                        <div className="text-xs font-medium text-cosmos-text">
                          {String.fromCharCode(65 + index)}. {option.label}
                        </div>
                        <div className="text-[11px] text-cosmos-muted mt-1">{option.description}</div>
                        {option.tradeoffs.length > 0 && (
                          <div className="mt-1.5 text-[10px] text-cosmos-judgment/70">
                            Trade-offs: {option.tradeoffs.join("; ")}
                          </div>
                        )}
                      </button>
                    ))}

                    {selectedOptionId && !showClarify && (
                      <button
                        onClick={handleResolve}
                        disabled={isResolving}
                        className="w-full py-2.5 bg-cosmos-judgment/20 border border-cosmos-judgment/40 rounded-lg text-cosmos-judgment text-sm font-medium hover:bg-cosmos-judgment/30 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                      >
                        {isResolving ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Processing...</>
                        ) : (
                          <>Confirm <ArrowRight className="w-3.5 h-3.5" /></>
                        )}
                      </button>
                    )}

                    <div className="flex items-center gap-3 my-2">
                      <div className="flex-1 h-px bg-cosmos-border/40" />
                      <span className="text-[10px] text-cosmos-muted/30">or</span>
                      <div className="flex-1 h-px bg-cosmos-border/40" />
                    </div>

                    {!showClarify ? (
                      <button
                        onClick={() => { setShowClarify(true); setSelectedOptionId(null); }}
                        className="w-full py-2 px-4 border border-cosmos-border/40 rounded-lg text-cosmos-muted text-xs hover:border-cosmos-glow/30 hover:text-cosmos-glow transition-all flex items-center justify-center gap-2"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        None fit — clarify
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          value={clarifyText}
                          onChange={(e) => setClarifyText(e.target.value)}
                          placeholder="Explain your situation..."
                          className="w-full bg-cosmos-bg/50 border border-cosmos-border/40 rounded-lg px-3 py-2.5 text-xs text-cosmos-text placeholder:text-cosmos-muted/30 focus:outline-none focus:border-cosmos-glow/50 resize-none"
                          rows={2}
                          autoFocus
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleClarify}
                            disabled={!clarifyText.trim() || isResolving}
                            className="flex-1 py-2 bg-cosmos-glow/20 border border-cosmos-glow/30 rounded-lg text-cosmos-glow text-xs font-medium hover:bg-cosmos-glow/30 disabled:opacity-30 flex items-center justify-center gap-2"
                          >
                            {isResolving ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3" />}
                            Send
                          </button>
                          <button
                            onClick={() => { setShowClarify(false); setClarifyText(""); }}
                            className="px-3 py-2 border border-cosmos-border/40 rounded-lg text-cosmos-muted text-xs"
                          >
                            Back
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Resolved info */}
                {node.type === "resolved" && node.selectedOption && (
                  <div className="p-3 bg-cosmos-resolved/8 border border-cosmos-resolved/20 rounded-lg">
                    <div className="text-xs font-medium text-cosmos-resolved mb-1">Your choice</div>
                    <p className="text-sm text-cosmos-text/80">
                      {node.options?.find((o) => o.id === node.selectedOption)?.label || node.selectedOption}
                    </p>
                  </div>
                )}

                {/* Blind spots */}
                {node.blindSpots && node.blindSpots.length > 0 && (
                  <div className="space-y-1.5">
                    {node.blindSpots.map((bs, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-cosmos-muted">
                        <AlertCircle className="w-3 h-3 text-cosmos-conflict/60 mt-0.5 shrink-0" />
                        <span>{bs}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Value implications */}
                {node.valueImplications && node.valueImplications.length > 0 && (
                  <div className="text-xs text-cosmos-muted/70">
                    <span className="text-cosmos-glow/60 font-medium">Values: </span>
                    {node.valueImplications.join(", ")}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Render children recursively */}
      {expanded && children.length > 0 && (
        <div className="mt-1">
          {children.map((child) => (
            <NotebookNodeCard key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Export format selector
function ExportPanel() {
  const { nodes, values, goalText } = useStore();
  const [format, setFormat] = useState<ExportFormat>("prompt");
  const [copied, setCopied] = useState(false);

  const nodeList = Object.values(nodes);
  const resolvedNodes = nodeList.filter((n) => n.type === "resolved");
  const allResolved = nodeList.filter((n) => n.type === "judgment").length === 0 && resolvedNodes.length > 0;

  if (!allResolved) return null;

  const decisions = resolvedNodes.map((n) => {
    const chosenOption = n.options?.find((o) => o.id === n.selectedOption);
    return {
      label: n.label,
      choice: chosenOption?.label || n.selectedOption || "Custom",
      tradeoffs: chosenOption?.tradeoffs || [],
      description: chosenOption?.description || "",
    };
  });

  const topValues = values.sort((a, b) => b.strength - a.strength).slice(0, 5);
  const blindSpots = [...new Set(nodeList.flatMap((n) => n.blindSpots || []))];

  const generatePromptFormat = () => {
    const lines = [
      `I've completed a structured deliberation about the following goal. Here is the full context:`,
      ``,
      `## Goal`,
      goalText,
      ``,
      `## Key Decisions`,
      ...decisions.map((d, i) => `${i + 1}. **${d.label}** — I chose: "${d.choice}"${d.tradeoffs.length > 0 ? `\n   Trade-offs: ${d.tradeoffs.join("; ")}` : ""}`),
      ``,
      `## Priorities`,
      ...topValues.map((v) => `- **${v.label}** (${Math.round(v.strength * 100)}%) — ${v.description}`),
    ];
    if (blindSpots.length > 0) {
      lines.push(``, `## Blind Spots`, ...blindSpots.map((bs) => `- ${bs}`));
    }
    lines.push(``, `## Next Steps`, `Help me build this. Start with a concrete plan that respects these decisions.`);
    return lines.join("\n");
  };

  const generateNotebookFormat = () => {
    const lines = [
      `# Decision Notebook`,
      ``,
      `## Goal`,
      `> ${goalText}`,
      ``,
      `---`,
      ``,
      `## Decision Log`,
      ``,
    ];

    decisions.forEach((d, i) => {
      lines.push(
        `### ${i + 1}. ${d.label}`,
        ``,
        `**Decision:** ${d.choice}`,
        d.description ? `\n${d.description}` : "",
        d.tradeoffs.length > 0 ? `\n**Trade-offs accepted:**\n${d.tradeoffs.map((t) => `- ${t}`).join("\n")}` : "",
        ``,
      );
    });

    lines.push(`---`, ``, `## Values & Priorities`, ``);
    topValues.forEach((v) => {
      lines.push(`- **${v.label}** (${Math.round(v.strength * 100)}%): ${v.description}`);
    });

    if (blindSpots.length > 0) {
      lines.push(``, `## Watch List`, ``);
      blindSpots.forEach((bs) => lines.push(`- [ ] ${bs}`));
    }

    lines.push(``, `---`, ``, `## Notes`, ``, `_Add your own notes here..._`, ``);
    lines.push(``, `> Generated by Cascade — AI maps the terrain, you choose the path.`);

    return lines.join("\n");
  };

  const output = format === "prompt" ? generatePromptFormat() : generateNotebookFormat();

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-6 p-5 bg-cosmos-surface/80 border border-cosmos-glow/30 rounded-xl"
    >
      <div className="flex items-center gap-2 mb-3">
        <CheckCircle2 className="w-5 h-5 text-cosmos-resolved" />
        <h3 className="text-sm font-medium text-cosmos-text">All decisions made</h3>
      </div>

      <p className="text-xs text-cosmos-muted mb-4">
        Choose how you&apos;d like to export your deliberation:
      </p>

      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setFormat("prompt")}
          className={`flex-1 py-2.5 px-3 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-2 ${
            format === "prompt"
              ? "bg-cosmos-glow/15 border-cosmos-glow/40 text-cosmos-glow"
              : "border-cosmos-border text-cosmos-muted hover:border-cosmos-glow/20"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          Build Prompt
        </button>
        <button
          onClick={() => setFormat("notebook")}
          className={`flex-1 py-2.5 px-3 rounded-lg border text-xs font-medium transition-all flex items-center justify-center gap-2 ${
            format === "notebook"
              ? "bg-cosmos-glow/15 border-cosmos-glow/40 text-cosmos-glow"
              : "border-cosmos-border text-cosmos-muted hover:border-cosmos-glow/20"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Notebook Document
        </button>
      </div>

      <pre className="text-[11px] text-cosmos-muted bg-cosmos-bg/60 border border-cosmos-border/40 rounded-lg p-3 max-h-52 overflow-y-auto whitespace-pre-wrap font-sans leading-relaxed mb-3">
        {output}
      </pre>

      <button
        onClick={handleCopy}
        className="w-full py-2.5 bg-cosmos-glow/20 border border-cosmos-glow/40 rounded-lg text-cosmos-glow text-sm font-medium hover:bg-cosmos-glow/30 transition-all flex items-center justify-center gap-2"
      >
        {copied ? (
          <><Check className="w-4 h-4" /> Copied!</>
        ) : (
          <><Copy className="w-4 h-4" /> Copy {format === "prompt" ? "prompt" : "document"}</>
        )}
      </button>
    </motion.div>
  );
}

export default function NotebookView() {
  const { nodes, values, goalText, critique, isDecomposing, showValuePanel, toggleValuePanel, reset } = useStore();

  const nodeList = Object.values(nodes);
  const roots = nodeList.filter((n) => !n.parentId || !nodes[n.parentId!]);
  const topValues = [...values].sort((a, b) => b.strength - a.strength).slice(0, 5);

  const stats = useMemo(() => {
    const resolved = nodeList.filter((n) => n.type === "resolved").length;
    const pending = nodeList.filter((n) => n.type === "judgment" && n.status !== "resolved").length;
    return { total: nodeList.length, resolved, pending };
  }, [nodeList]);

  return (
    <div className="w-full h-screen relative flex">
      <Starfield />
      <ReckoningLoader />

      {/* Main notebook area */}
      <div className="flex-1 overflow-y-auto relative z-10">
        {/* Top bar */}
        <div className="sticky top-0 z-40 bg-cosmos-bg/90 backdrop-blur-md border-b border-cosmos-border/30 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-cosmos-muted/50 uppercase tracking-wider">Format</span>
            <select
              value="notebook"
              onChange={(e) => useStore.getState().setViewMode(e.target.value as "tree" | "notebook" | "chat")}
              className="bg-cosmos-surface/80 border border-cosmos-border rounded-lg px-2.5 py-1.5 text-xs text-cosmos-text focus:outline-none focus:border-cosmos-glow/50 cursor-pointer"
            >
              <option value="tree">Tree</option>
              <option value="notebook">Notebook</option>
              <option value="chat">Dialogue</option>
            </select>
            <div className="flex items-center gap-3 text-[10px] text-cosmos-muted/50">
              <span>{stats.total} nodes</span>
              <span className="text-cosmos-resolved">{stats.resolved} decided</span>
              {stats.pending > 0 && (
                <span className="text-cosmos-judgment">{stats.pending} pending</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <button
              onClick={toggleValuePanel}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                showValuePanel
                  ? "bg-cosmos-glow/20 border-cosmos-glow/50 text-cosmos-glow"
                  : "bg-cosmos-surface border-cosmos-border text-cosmos-muted hover:border-cosmos-glow/30"
              }`}
            >
              Values
            </button>
          </div>
        </div>

        {critique && <CritiqueBar />}

        {/* Notebook content */}
        <div className="max-w-3xl mx-auto px-6 py-8">
          {/* Goal header */}
          <div className="mb-8">
            <div className="text-[10px] uppercase tracking-wider text-cosmos-glow/50 mb-2">Your Goal</div>
            <h2 className="text-xl font-display font-bold text-cosmos-text leading-snug">{goalText}</h2>
            <div className="mt-3 h-px bg-gradient-to-r from-cosmos-glow/30 via-cosmos-border/30 to-transparent" />
          </div>

          {/* Nodes as notebook entries */}
          <div className="space-y-1">
            {roots.map((root) => (
              <NotebookNodeCard key={root.id} node={root} depth={0} />
            ))}
          </div>

          {/* Export panel */}
          <ExportPanel />
        </div>
      </div>

      {/* Values sidebar (collapsed by default) */}
      <AnimatePresence>
        {showValuePanel && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 320, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full border-l border-cosmos-border/30 bg-cosmos-surface/95 backdrop-blur-md overflow-y-auto overflow-x-hidden z-20 relative"
          >
            <div className="p-5 w-[320px]">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-cosmos-text">Values Mirror</h3>
                <button onClick={toggleValuePanel} className="text-cosmos-muted hover:text-cosmos-text text-sm">&times;</button>
              </div>
              {topValues.length === 0 ? (
                <p className="text-xs text-cosmos-muted/50">Values emerge as you make decisions.</p>
              ) : (
                <div className="space-y-3">
                  {topValues.map((v) => (
                    <div key={v.id} className="p-3 bg-cosmos-bg/50 rounded-lg border border-cosmos-border/30">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-cosmos-text">{v.label}</span>
                        <span className="text-[10px] text-cosmos-muted">{Math.round(v.strength * 100)}%</span>
                      </div>
                      <div className="w-full h-1 bg-cosmos-border/40 rounded-full overflow-hidden mb-1.5">
                        <div className="h-full bg-cosmos-glow rounded-full" style={{ width: `${v.strength * 100}%` }} />
                      </div>
                      <p className="text-[11px] text-cosmos-muted leading-relaxed">{v.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <GuidePanel />
    </div>
  );
}

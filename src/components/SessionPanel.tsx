"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Clock, Trash2, ArrowRight, GitBranch } from "lucide-react";
import { useStore, SavedSession } from "@/store/useStore";

function formatTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
}

function SessionCard({
  session,
  isCurrent,
}: {
  session: SavedSession;
  isCurrent: boolean;
}) {
  const { loadSession, deleteSession } = useStore();

  const nodeCount = Object.keys(session.nodes).length;
  const judgmentCount = Object.values(session.nodes).filter(
    (n) => n.type === "resolved"
  ).length;
  const pendingCount = Object.values(session.nodes).filter(
    (n) => n.type === "judgment" && n.status === "conflict"
  ).length;

  return (
    <div
      className={`p-4 rounded-lg border transition-all ${
        isCurrent
          ? "border-cosmos-glow/40 bg-cosmos-glow/5"
          : "border-cosmos-border bg-cosmos-bg hover:border-cosmos-glow/20"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="text-sm font-medium text-cosmos-text line-clamp-2 flex-1">
          {session.goalText}
        </h3>
        {isCurrent && (
          <span className="text-[10px] px-2 py-0.5 bg-cosmos-glow/20 text-cosmos-glow rounded-full shrink-0">
            Current
          </span>
        )}
      </div>

      <div className="flex items-center gap-3 text-[11px] text-cosmos-muted/60 mb-3">
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatTime(session.savedAt)}
        </span>
        <span>{nodeCount} nodes</span>
        <span>{judgmentCount} resolved</span>
        {pendingCount > 0 && (
          <span className="text-cosmos-judgment/70">{pendingCount} pending</span>
        )}
      </div>

      {/* Value pills */}
      {session.values.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {session.values.slice(0, 4).map((v) => (
            <span
              key={v.id}
              className="text-[10px] px-2 py-0.5 bg-cosmos-glow/10 border border-cosmos-glow/15 rounded-full text-cosmos-glow/70"
            >
              {v.label}
            </span>
          ))}
          {session.values.length > 4 && (
            <span className="text-[10px] text-cosmos-muted/40">
              +{session.values.length - 4} more
            </span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2">
        {!isCurrent && (
          <button
            onClick={() => loadSession(session.id)}
            className="flex-1 py-2 text-xs bg-cosmos-glow/10 border border-cosmos-glow/20 rounded-lg text-cosmos-glow hover:bg-cosmos-glow/20 transition-all flex items-center justify-center gap-1.5"
          >
            Resume
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
        <button
          onClick={() => deleteSession(session.id)}
          className="py-2 px-3 text-xs border border-cosmos-border rounded-lg text-cosmos-muted hover:text-cosmos-conflict hover:border-cosmos-conflict/30 transition-all"
          title="Delete session"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

export default function SessionPanel() {
  const { savedSessions, currentSessionId, toggleSessionPanel } = useStore();

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: -400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -400, opacity: 0 }}
        className="absolute top-0 left-0 h-full w-[360px] bg-cosmos-surface/95 backdrop-blur-md border-r border-cosmos-glow/20 z-50 overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-medium text-cosmos-text flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-cosmos-glow" />
                Saved Sessions
              </h2>
              <p className="text-xs text-cosmos-muted mt-1">
                Your previous deliberations
              </p>
            </div>
            <button
              onClick={toggleSessionPanel}
              className="text-cosmos-muted hover:text-cosmos-text transition-colors text-lg"
            >
              &times;
            </button>
          </div>

          {savedSessions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-3xl mb-3 opacity-30">
                <GitBranch className="w-8 h-8 mx-auto text-cosmos-muted/30" />
              </div>
              <p className="text-sm text-cosmos-muted">No saved sessions yet.</p>
              <p className="text-xs text-cosmos-muted/50 mt-2">
                Sessions auto-save when you start a new goal.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {savedSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  isCurrent={session.id === currentSessionId}
                />
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

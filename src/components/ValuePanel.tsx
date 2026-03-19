"use client";

import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";

export default function ValuePanel() {
  const { values, toggleValuePanel } = useStore();

  return (
    <motion.div
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -400, opacity: 0 }}
      className="absolute top-0 left-0 h-full w-[360px] bg-cosmos-surface/95 backdrop-blur-md border-r border-cosmos-glow/20 z-50 overflow-y-auto"
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium text-cosmos-text">Values Mirror</h2>
            <p className="text-xs text-cosmos-muted mt-1">
              Built from your choices, not your words
            </p>
          </div>
          <button
            onClick={toggleValuePanel}
            className="text-cosmos-muted hover:text-cosmos-text transition-colors"
          >
            &#10005;
          </button>
        </div>

        {values.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-3xl mb-3 opacity-30">&#9826;</div>
            <p className="text-sm text-cosmos-muted">
              Your values will emerge as you make judgment calls.
            </p>
            <p className="text-xs text-cosmos-muted/50 mt-2">
              This mirror reflects what your choices reveal about your priorities.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {values
              .sort((a, b) => b.strength - a.strength)
              .map((value) => (
                <div
                  key={value.id}
                  className="p-4 bg-cosmos-bg rounded-lg border border-cosmos-border"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-cosmos-text">{value.label}</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-cosmos-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-cosmos-glow rounded-full transition-all duration-500"
                          style={{ width: `${value.strength * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-cosmos-muted">
                        {Math.round(value.strength * 100)}%
                      </span>
                    </div>
                  </div>
                  <p className="text-xs text-cosmos-muted">{value.description}</p>

                  {value.contradictions && value.contradictions.length > 0 && (
                    <div className="mt-2 p-2 bg-cosmos-conflict/10 border border-cosmos-conflict/20 rounded">
                      <div className="text-xs text-cosmos-conflict">
                        Potential contradiction:
                      </div>
                      {value.contradictions.map((c, i) => (
                        <p key={i} className="text-xs text-cosmos-muted mt-0.5">
                          {c}
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 text-xs text-cosmos-muted/50">
                    Revealed by {value.sourceNodeIds.length} decision
                    {value.sourceNodeIds.length !== 1 ? "s" : ""}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

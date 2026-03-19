"use client";

import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";

export default function GoalInput() {
  const [text, setText] = useState("");
  const { setGoalText, setHasStarted, setIsDecomposing, addNodes, addValues, setCritique } =
    useStore();

  const handleSubmit = useCallback(async () => {
    if (!text.trim()) return;
    setGoalText(text);
    setHasStarted(true);
    setIsDecomposing(true);

    // Add the root goal node immediately
    addNodes([
      {
        id: "goal-root",
        type: "goal",
        label: text.length > 60 ? text.slice(0, 57) + "..." : text,
        description: text,
        parentId: null,
        children: [],
        status: "active",
      },
    ]);

    try {
      const res = await fetch("/api/decompose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal: text }),
      });
      const data = await res.json();

      if (data.error) {
        console.error("API error:", data.error);
        setIsDecomposing(false);
        return;
      }

      // Ensure all nodes have goal-root as ancestor
      const nodes = (data.nodes || []).map(
        (n: { parentId: string | null; [key: string]: unknown }) => ({
          ...n,
          parentId: n.parentId || "goal-root",
        })
      );

      addNodes(nodes);
      if (data.values) addValues(data.values);
      if (data.critique) setCritique(data.critique);
    } catch (err) {
      console.error("Failed to decompose:", err);
    } finally {
      setIsDecomposing(false);
    }
  }, [text, setGoalText, setHasStarted, setIsDecomposing, addNodes, addValues, setCritique]);

  return (
    <motion.div
      className="flex items-center justify-center min-h-screen"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1 }}
    >
      <div className="w-full max-w-2xl px-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-light tracking-wide text-cosmos-text mb-2">Reckoning</h1>
          <p className="text-cosmos-muted text-sm">
            The AI reckons. You judge. Every consequential fork is yours.
          </p>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <div className="relative glow-input rounded-xl">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="What do you want to accomplish?"
              className="w-full bg-cosmos-surface border border-cosmos-border rounded-xl px-6 py-5 text-lg text-cosmos-text placeholder:text-cosmos-muted/50 focus:outline-none focus:border-cosmos-glow/50 resize-none transition-all duration-300"
              rows={3}
              autoFocus
            />
            <button
              onClick={handleSubmit}
              disabled={!text.trim()}
              className="absolute bottom-4 right-4 px-4 py-2 bg-cosmos-glow/20 border border-cosmos-glow/30 rounded-lg text-cosmos-glow text-sm hover:bg-cosmos-glow/30 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Begin Reckoning
            </button>
          </div>

          <div className="mt-8 flex gap-3 justify-center">
            {[
              "I want to build an educational game online",
              "I want to make tuition free at MIT",
              "Should I sell my house and relocate?",
            ].map((example) => (
              <button
                key={example}
                onClick={() => setText(example)}
                className="px-3 py-1.5 text-xs text-cosmos-muted border border-cosmos-border rounded-lg hover:border-cosmos-glow/30 hover:text-cosmos-glow transition-all"
              >
                {example}
              </button>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

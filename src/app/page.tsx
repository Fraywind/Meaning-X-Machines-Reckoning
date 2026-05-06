"use client";

import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import GoalInput from "@/components/GoalInput";
import DecisionTreeView from "@/components/DecisionTreeView";
import NotebookView from "@/components/NotebookView";
import ChatView from "@/components/ChatView";
import NarrativeView from "@/components/NarrativeView";
import { applyTheme, getTheme } from "@/lib/themes";

export default function Home() {
  const hasStarted = useStore((s) => s.hasStarted);
  const theme = useStore((s) => s.theme);
  const viewMode = useStore((s) => s.viewMode);

  // Apply theme on mount and when it changes
  useEffect(() => {
    applyTheme(getTheme(theme));
  }, [theme]);

  // Initialize theme and view mode from localStorage on mount
  useEffect(() => {
    try {
      // Hard one-time theme reset: on next load, everyone (including
      // existing users who previously picked any theme) gets reset to
      // nature, regardless of what was persisted. The migration flag
      // (-v3) prevents re-running so subsequent theme picks stick.
      const migrated = localStorage.getItem("reckoning-theme-migrated-v3");
      const stored = localStorage.getItem("reckoning-theme");
      if (!migrated) {
        localStorage.setItem("reckoning-theme", "nature");
        localStorage.setItem("reckoning-theme-migrated-v3", "1");
        useStore.getState().setTheme("nature");
      } else if (stored === "starfield" || stored === "cybernetics" || stored === "light" || stored === "cute" || stored === "nature") {
        useStore.getState().setTheme(stored);
      }
      const storedMode = localStorage.getItem("reckoning-view-mode");
      if (
        storedMode === "tree" ||
        storedMode === "journey" ||
        storedMode === "notebook" ||
        storedMode === "chat"
      ) {
        useStore.getState().setViewMode(storedMode);
      }
    } catch {}
  }, []);

  const renderView = () => {
    if (!hasStarted) return <GoalInput />;
    switch (viewMode) {
      case "journey":
        // Journey mode renders the second-person narrative as the primary
        // post-deliberation surface. NarrativeView's onClose returns to
        // the tree view so the user always has a path back to the
        // structured artifact.
        return <NarrativeView onClose={() => useStore.getState().setViewMode("tree")} />;
      case "notebook":
        return <NotebookView />;
      case "chat":
        return <ChatView />;
      case "tree":
      default:
        return <DecisionTreeView />;
    }
  };

  return <main className="h-screen bg-cosmos-bg">{renderView()}</main>;
}

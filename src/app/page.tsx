"use client";

import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import GoalInput from "@/components/GoalInput";
import DecisionTreeView from "@/components/DecisionTreeView";
import NotebookView from "@/components/NotebookView";
import ChatView from "@/components/ChatView";
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
      const stored = localStorage.getItem("reckoning-theme");
      if (stored === "starfield" || stored === "cybernetics" || stored === "light" || stored === "cute" || stored === "nature") {
        useStore.getState().setTheme(stored);
      }
      const storedMode = localStorage.getItem("reckoning-view-mode");
      if (storedMode === "tree" || storedMode === "notebook" || storedMode === "chat") {
        useStore.getState().setViewMode(storedMode);
      }
    } catch {}
  }, []);

  const renderView = () => {
    if (!hasStarted) return <GoalInput />;
    switch (viewMode) {
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

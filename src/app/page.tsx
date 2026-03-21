"use client";

import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import GoalInput from "@/components/GoalInput";
import DecisionTreeView from "@/components/DecisionTreeView";
import { applyTheme, getTheme } from "@/lib/themes";

export default function Home() {
  const hasStarted = useStore((s) => s.hasStarted);
  const theme = useStore((s) => s.theme);

  // Apply theme on mount and when it changes
  useEffect(() => {
    applyTheme(getTheme(theme));
  }, [theme]);

  // Initialize theme from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("reckoning-theme");
      if (stored === "starfield" || stored === "cybernetics" || stored === "light" || stored === "cute") {
        useStore.getState().setTheme(stored);
      }
    } catch {}
  }, []);

  return <main className="h-screen bg-cosmos-bg">{hasStarted ? <DecisionTreeView /> : <GoalInput />}</main>;
}

"use client";

import { useStore } from "@/store/useStore";
import GoalInput from "@/components/GoalInput";
import DecisionTreeView from "@/components/DecisionTreeView";

export default function Home() {
  const hasStarted = useStore((s) => s.hasStarted);

  return <main className="h-screen bg-cosmos-bg">{hasStarted ? <DecisionTreeView /> : <GoalInput />}</main>;
}

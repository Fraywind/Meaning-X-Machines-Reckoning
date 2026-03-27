"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Award, Compass, Users, Lightbulb, Zap } from "lucide-react";
import { Achievement, AchievementCategory } from "@/types";

const categoryIcons: Record<AchievementCategory, typeof Award> = {
  depth: Compass,
  consistency: Zap,
  community: Users,
  insight: Lightbulb,
};

const categoryColors: Record<AchievementCategory, string> = {
  depth: "text-cosmos-glow",
  consistency: "text-cosmos-resolved",
  community: "text-purple-400",
  insight: "text-cosmos-judgment",
};

const categoryBg: Record<AchievementCategory, string> = {
  depth: "bg-cosmos-glow/10 border-cosmos-glow/30",
  consistency: "bg-cosmos-resolved/10 border-cosmos-resolved/30",
  community: "bg-purple-500/10 border-purple-500/30",
  insight: "bg-cosmos-judgment/10 border-cosmos-judgment/30",
};

export default function AchievementToast({
  achievement,
  onDismiss,
}: {
  achievement: Achievement | null;
  onDismiss: () => void;
}) {
  const Icon = achievement
    ? categoryIcons[achievement.category]
    : Award;

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: "spring", duration: 0.5 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100]"
        >
          <div
            className={`flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-md shadow-xl ${categoryBg[achievement.category]}`}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center ${categoryBg[achievement.category]}`}
            >
              <Icon className={`w-5 h-5 ${categoryColors[achievement.category]}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-semibold ${categoryColors[achievement.category]}`}>
                  {achievement.label}
                </span>
                <span className="text-[9px] uppercase tracking-wider text-cosmos-muted/50">
                  unlocked
                </span>
              </div>
              <p className="text-[11px] text-cosmos-muted mt-0.5">
                {achievement.description}
              </p>
            </div>
            <button
              onClick={onDismiss}
              className="ml-2 text-cosmos-muted/30 hover:text-cosmos-muted transition-colors text-sm"
            >
              &times;
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

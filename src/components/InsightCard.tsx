"use client";

import { motion } from "framer-motion";
import { Lightbulb, X } from "lucide-react";
import { InsightCard as InsightCardType } from "@/store/useStore";

interface Props {
  card: InsightCardType;
  onDismiss: () => void;
}

export default function InsightCard({ card, onDismiss }: Props) {
  if (card.dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.3, type: "spring" }}
      className="p-3.5 bg-cosmos-glow/5 border-l-2 border-cosmos-glow/40 rounded-r-lg rounded-l-sm"
    >
      <div className="flex items-start gap-2">
        <Lightbulb className="w-3.5 h-3.5 text-cosmos-glow/60 mt-0.5 shrink-0" />
        <p className="text-xs text-cosmos-muted leading-relaxed flex-1">
          {card.content}
        </p>
        <button
          onClick={onDismiss}
          className="text-cosmos-muted/30 hover:text-cosmos-muted transition-colors shrink-0"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );
}

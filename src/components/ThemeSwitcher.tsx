"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Palette } from "lucide-react";
import { useStore } from "@/store/useStore";
import { themes, ThemeId, applyTheme, getTheme } from "@/lib/themes";

const themeList: ThemeId[] = ["starfield", "cybernetics", "light"];

const themeIcons: Record<ThemeId, string> = {
  starfield: "\u2728",   // sparkles
  cybernetics: "\u2699",  // gear
  light: "\u2600",        // sun
};

export default function ThemeSwitcher() {
  const { theme, setTheme } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const handleSelect = (id: ThemeId) => {
    setTheme(id);
    applyTheme(getTheme(id));
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
          open
            ? "bg-cosmos-glow/20 border-cosmos-glow/50 text-cosmos-glow"
            : "bg-cosmos-surface border-cosmos-border text-cosmos-muted hover:border-cosmos-glow/30"
        }`}
        title="Switch theme"
      >
        <Palette className="w-3.5 h-3.5" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-52 bg-cosmos-surface border border-cosmos-border rounded-xl overflow-hidden shadow-lg z-[100]"
          >
            <div className="p-2 space-y-1">
              {themeList.map((id) => {
                const t = themes[id];
                const isActive = theme === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleSelect(id)}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                      isActive
                        ? "bg-cosmos-glow/15 border border-cosmos-glow/30"
                        : "hover:bg-cosmos-border/30 border border-transparent"
                    }`}
                  >
                    <span className="text-base">{themeIcons[id]}</span>
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-medium ${isActive ? "text-cosmos-glow" : "text-cosmos-text"}`}>
                        {t.name}
                      </div>
                      <div className="text-[10px] text-cosmos-muted truncate">{t.description}</div>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-cosmos-glow shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

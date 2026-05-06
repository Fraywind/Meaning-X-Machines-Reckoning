"use client";

import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import { getPersonaColors } from "@/lib/personaColors";

interface Props {
  activeId: string;
}

/* ----- Mini portrait avatars (~32x32) per archetype ------------------------ */

function hashHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h % 360;
}

function MiniSetup() {
  return (
    <svg viewBox="0 0 40 40" className="w-full h-full">
      {/* Hood */}
      <path d="M 8 15 Q 20 5 32 15 L 32 19 Q 20 10 8 19 Z" fill="#5d4a7a" stroke="#2a1f3d" strokeWidth="0.8" />
      {/* Face */}
      <ellipse cx="20" cy="22" rx="9" ry="10" fill="#f3d3b0" stroke="#2a1f3d" strokeWidth="0.8" />
      {/* Hair tuft */}
      <path d="M 13 15 Q 20 11 27 15 Q 23 13 20 14 Q 17 13 13 15 Z" fill="#3b2519" />
      {/* Eyes */}
      <ellipse cx="17" cy="22" rx="0.9" ry="1.3" fill="#1a1218" />
      <ellipse cx="23" cy="22" rx="0.9" ry="1.3" fill="#1a1218" />
      {/* Mouth */}
      <path d="M 17.5 27 Q 20 28.5 22.5 27" stroke="#2a1f3d" strokeWidth="0.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function MiniSkeptic() {
  return (
    <svg viewBox="0 0 40 40" className="w-full h-full">
      {/* Face */}
      <ellipse cx="20" cy="20" rx="11" ry="12" fill="#f3d3b0" stroke="#1a1218" strokeWidth="0.8" />
      {/* Hair slicked back */}
      <path d="M 9 14 Q 20 6 31 14 Q 27 12 20 13 Q 13 12 9 14 Z" fill="#1f2233" stroke="#1a1218" strokeWidth="0.6" />
      {/* Glasses */}
      <rect x="11" y="18" width="7" height="5" rx="0.8" fill="#a8b0c2" fillOpacity="0.2" stroke="#1a1218" strokeWidth="0.7" />
      <rect x="22" y="18" width="7" height="5" rx="0.8" fill="#a8b0c2" fillOpacity="0.2" stroke="#1a1218" strokeWidth="0.7" />
      <line x1="18" y1="20.5" x2="22" y2="20.5" stroke="#1a1218" strokeWidth="0.7" />
      {/* Eyes */}
      <circle cx="14.5" cy="20.5" r="0.9" fill="#1a1218" />
      <circle cx="25.5" cy="20.5" r="0.9" fill="#1a1218" />
      {/* Raised right eyebrow */}
      <path d="M 11 16 L 18 16" stroke="#1f2233" strokeWidth="1" strokeLinecap="round" />
      <path d="M 22 14 L 29 16" stroke="#1f2233" strokeWidth="1" strokeLinecap="round" />
      {/* Mouth flat */}
      <line x1="17" y1="27" x2="23" y2="26.5" stroke="#1a1218" strokeWidth="0.9" strokeLinecap="round" />
    </svg>
  );
}

function MiniPragmatist() {
  return (
    <svg viewBox="0 0 40 40" className="w-full h-full">
      {/* Face */}
      <ellipse cx="20" cy="20" rx="10.5" ry="11.5" fill="#f3d3b0" stroke="#1a1d28" strokeWidth="0.8" />
      {/* Short hair */}
      <path d="M 10 14 Q 20 7 30 14 Q 26 11 20 12 Q 14 11 10 14 Z" fill="#3d2f1f" stroke="#1a1d28" strokeWidth="0.6" />
      {/* Hair tuft */}
      <path d="M 18 9 L 20 6 L 22 9 Z" fill="#3d2f1f" />
      {/* Eyes */}
      <ellipse cx="16" cy="21" rx="1" ry="1.3" fill="#1a1d28" />
      <ellipse cx="24" cy="21" rx="1" ry="1.3" fill="#1a1d28" />
      {/* Eyebrows straight */}
      <line x1="13" y1="17" x2="18" y2="17" stroke="#3d2f1f" strokeWidth="1" strokeLinecap="round" />
      <line x1="22" y1="17" x2="27" y2="17" stroke="#3d2f1f" strokeWidth="1" strokeLinecap="round" />
      {/* Mouth neutral */}
      <line x1="17" y1="27" x2="23" y2="27" stroke="#1a1d28" strokeWidth="0.9" strokeLinecap="round" />
      {/* Collar V hint at bottom */}
      <path d="M 14 33 L 20 36 L 26 33" stroke="#3a4a5e" strokeWidth="1.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function MiniStressTest() {
  return (
    <svg viewBox="0 0 40 40" className="w-full h-full">
      {/* Face */}
      <ellipse cx="20" cy="20" rx="11" ry="12" fill="#f3d3b0" stroke="#1a1218" strokeWidth="0.8" />
      {/* Tousled hair */}
      <path d="M 9 14 Q 20 6 31 14 Q 28 10 24 12 Q 20 7 16 12 Q 12 10 9 14 Z" fill="#5a3e2a" stroke="#1a1218" strokeWidth="0.6" />
      {/* Stray tuft */}
      <path d="M 12 10 L 14 5 L 16 10 Z" fill="#5a3e2a" />
      {/* Cheek flush */}
      <ellipse cx="13" cy="24" rx="2" ry="1.5" fill="#d6713a" opacity="0.25" />
      <ellipse cx="27" cy="24" rx="2" ry="1.5" fill="#d6713a" opacity="0.25" />
      {/* Wide eyes */}
      <ellipse cx="16" cy="21" rx="1.6" ry="1.8" fill="#fff" stroke="#1a1218" strokeWidth="0.6" />
      <ellipse cx="24" cy="21" rx="1.6" ry="1.8" fill="#fff" stroke="#1a1218" strokeWidth="0.6" />
      <circle cx="16" cy="21.3" r="0.8" fill="#1a1218" />
      <circle cx="24" cy="21.3" r="0.8" fill="#1a1218" />
      {/* Worried eyebrows (angled up in middle) */}
      <line x1="12" y1="17.5" x2="18" y2="15.5" stroke="#5a3e2a" strokeWidth="1" strokeLinecap="round" />
      <line x1="22" y1="15.5" x2="28" y2="17.5" stroke="#5a3e2a" strokeWidth="1" strokeLinecap="round" />
      {/* Sweat drop */}
      <path d="M 31 16 Q 30 18.5 31 20 Q 32 18.5 31 16 Z" fill="#5fa8d6" stroke="#1a1218" strokeWidth="0.4" />
      {/* Mouth slight grimace */}
      <path d="M 17 27 Q 20 28.5 23 27" stroke="#1a1218" strokeWidth="0.9" fill="none" strokeLinecap="round" />
    </svg>
  );
}

function MiniExpert({ seed }: { seed: string }) {
  const hue = hashHue(seed);
  const primary = `hsl(${hue} 35% 38%)`;
  const collar = `hsl(${hue} 50% 55%)`;
  return (
    <svg viewBox="0 0 40 40" className="w-full h-full">
      {/* Face */}
      <ellipse cx="20" cy="20" rx="10.5" ry="11.5" fill="#f3d3b0" stroke="#1a1218" strokeWidth="0.8" />
      {/* Hair */}
      <path d="M 10 14 Q 20 6 30 14 Q 26 12 20 13 Q 14 12 10 14 Z" fill="#2f2419" stroke="#1a1218" strokeWidth="0.6" />
      {/* Eyes */}
      <ellipse cx="16" cy="21" rx="1" ry="1.3" fill="#1a1218" />
      <ellipse cx="24" cy="21" rx="1" ry="1.3" fill="#1a1218" />
      {/* Eyebrows */}
      <path d="M 12.5 17 Q 16 16 19.5 17" stroke="#2f2419" strokeWidth="1" fill="none" strokeLinecap="round" />
      <path d="M 20.5 17 Q 24 16 27.5 17" stroke="#2f2419" strokeWidth="1" fill="none" strokeLinecap="round" />
      {/* Mouth composed */}
      <path d="M 17 27 Q 20 28 23 27" stroke="#1a1218" strokeWidth="0.9" fill="none" strokeLinecap="round" />
      {/* Collar V — accent colored to distinguish experts */}
      <path d="M 12 33 L 20 39 L 28 33 L 27 35 L 20 40.5 L 13 35 Z" fill={collar} stroke="#1a1218" strokeWidth="0.6" />
      <path d="M 7 36 Q 7 33 13 32 L 27 32 Q 33 33 33 36 L 33 40 L 7 40 Z" fill={primary} stroke="#1a1218" strokeWidth="0.6" />
    </svg>
  );
}

function MiniAvatar({ archetype, seed }: { archetype: string; seed: string }) {
  if (archetype === "skeptic") return <MiniSkeptic />;
  if (archetype === "pragmatist") return <MiniPragmatist />;
  if (archetype === "stress-test") return <MiniStressTest />;
  if (archetype === "setup") return <MiniSetup />;
  return <MiniExpert seed={seed} />;
}

/* ----- Main component ------------------------------------------------------ */

interface DisplayPersona {
  id: string;
  name: string;
  archetype: string;
}

export default function PersonaStrip({ activeId }: Props) {
  const {
    briefMessages,
    visitedCastPersonas,
    recommendedPersonas,
    setCurrentCastPersona,
    pendingCrossCheck,
    clearPendingCrossCheck,
  } = useStore();

  const hasSetup = briefMessages.length > 0;

  // Build display list: Setup first (if started), then visited cast personas, in order.
  const displayList: DisplayPersona[] = [];
  if (hasSetup) {
    displayList.push({ id: "setup", name: "Setup", archetype: "setup" });
  }

  for (const visited of visitedCastPersonas) {
    if (visited === "setup") continue;
    const rec = recommendedPersonas.find((p) => p.id === visited);
    displayList.push({
      id: visited,
      name: rec?.name || visited,
      archetype: rec?.archetype || "expert",
    });
  }

  // If a cross-check is pending and the target isn't yet visited, append it
  // as a "suggested" entry so the glow has somewhere to land.
  if (pendingCrossCheck) {
    const target = pendingCrossCheck.targetPersonaId;
    const alreadyShown = displayList.some((d) => d.id === target);
    if (!alreadyShown) {
      const rec = recommendedPersonas.find((p) => p.id === target);
      if (rec) {
        displayList.push({ id: target, name: rec.name, archetype: rec.archetype });
      }
    }
  }

  if (displayList.length < 2) return null;

  const handleClick = (id: string) => {
    if (pendingCrossCheck && id === pendingCrossCheck.targetPersonaId) {
      clearPendingCrossCheck();
    }
    if (id === "setup") setCurrentCastPersona(null);
    else setCurrentCastPersona(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-3 left-3 z-50 flex items-center gap-2 px-2.5 py-2 bg-cosmos-surface/80 backdrop-blur-md border border-cosmos-border/40 rounded-2xl shadow-lg"
    >
      <span className="text-[9px] text-cosmos-muted/50 uppercase tracking-wider px-1.5 hidden md:inline">
        Personas
      </span>
      {/* The first un-talked-to recommended persona gets a soft vibrate to
          telegraph "start here." Cross-check glow takes priority if active. */}
      {displayList.map((p) => {
        const isActive = p.id === activeId;
        const c = getPersonaColors(p.archetype);
        const isCrossCheckTarget =
          !!pendingCrossCheck &&
          pendingCrossCheck.targetPersonaId === p.id &&
          p.id !== activeId;
        const isFirstRecommendation =
          !isCrossCheckTarget &&
          !isActive &&
          recommendedPersonas.length > 0 &&
          p.id === recommendedPersonas[0].id &&
          !visitedCastPersonas.includes(p.id);
        return (
          <div key={p.id} className="relative">
            <button
              onClick={() => handleClick(p.id)}
              className={`flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-xl border transition-all ${
                isActive
                  ? `${c.activeBg} ${c.activeBorder} ${c.activeText} scale-105`
                  : `bg-cosmos-bg/30 ${c.idleBorder} ${c.idleText} hover:scale-105 hover:brightness-125`
              } ${isCrossCheckTarget ? `${c.activeBorder} ring-2 ring-offset-0 animate-pulse-glow` : ""} ${isFirstRecommendation ? "animate-pulse-glow" : ""}`}
              title={isCrossCheckTarget ? pendingCrossCheck!.oneLineTake : p.name}
            >
              <span
                className={`block w-11 h-11 rounded-full overflow-hidden border-2 ${
                  isActive || isCrossCheckTarget ? c.activeBorder : "border-cosmos-border/30"
                } bg-cosmos-bg/60 shadow-sm`}
              >
                <MiniAvatar archetype={p.archetype} seed={p.name} />
              </span>
              <span className="text-[12px] font-medium leading-tight">{p.name}</span>
            </button>
            {isCrossCheckTarget && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className={`absolute left-0 top-full mt-2 w-[20rem] max-w-[22rem] rounded-xl bg-cosmos-surface backdrop-blur-md border-2 ${c.activeBorder} shadow-2xl z-50 overflow-hidden`}
              >
                {/* Header bar with pulsing dot, persona name, and "ringing" status */}
                <div className={`flex items-center gap-2 px-3.5 py-2 ${c.activeBg} border-b ${c.activeBorder}`}>
                  <motion.svg
                    viewBox="0 0 8 8"
                    className={`w-2 h-2 ${c.activeText}`}
                    animate={{ scale: [1, 1.4, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <circle cx="4" cy="4" r="3" fill="currentColor" />
                  </motion.svg>
                  <span className={`text-[10px] uppercase tracking-[0.2em] ${c.activeText} font-bold`}>
                    {p.name} is ringing in
                  </span>
                </div>
                {/* The take itself, prominent and readable */}
                <div className="px-4 py-3.5">
                  <p className="text-[14px] text-cosmos-text leading-relaxed font-medium">
                    {pendingCrossCheck!.oneLineTake}
                  </p>
                </div>
                {/* CTA: stop propagation so click goes here, not to the
                    underlying button. handleClick still fires below to
                    switch personas and clear the pending state. */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClick(p.id);
                  }}
                  className={`w-full px-4 py-2.5 ${c.activeBg} ${c.activeText} text-[12px] font-semibold border-t ${c.activeBorder} hover:brightness-110 active:brightness-95 transition-all flex items-center justify-center gap-2`}
                >
                  Take the call from {p.name}
                  <span className="text-[10px]">→</span>
                </button>
              </motion.div>
            )}
          </div>
        );
      })}
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { useStore } from "@/store/useStore";
import SkepticCharacter from "./personas/SkepticCharacter";
import PragmatistCharacter from "./personas/PragmatistCharacter";
import StressTestCharacter from "./personas/StressTestCharacter";
import ExpertCharacter from "./personas/ExpertCharacter";
import { getPersonaColors } from "@/lib/personaColors";

/**
 * Curtain call: shows the entire cast that pushed the user, lined up
 * waving. Renders at the top of the journey view as a closing beat.
 * Each character does a brief wave (rotation cycle) staggered by index
 * so they wave in sequence rather than all at once.
 */

interface PersonaRec {
  id: string;
  name: string;
  role: string;
  archetype: string;
  accessory?: string;
}

function pickCharacter(rec: PersonaRec): React.ReactElement {
  switch (rec.archetype) {
    case "skeptic":
      return <SkepticCharacter thinking={false} />;
    case "pragmatist":
      return <PragmatistCharacter thinking={false} />;
    case "stress-test":
      return <StressTestCharacter thinking={false} />;
    case "anchor":
      return <ExpertCharacter thinking={false} accentSeed="anchor" accessory="clipboard" />;
    default:
      return <ExpertCharacter thinking={false} accentSeed={rec.name} accessory={rec.accessory} />;
  }
}

export default function CastCurtainCall() {
  const recommendedPersonas = useStore((s) => s.recommendedPersonas);

  if (!recommendedPersonas || recommendedPersonas.length === 0) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="relative my-10"
    >
      <div className="text-center mb-2">
        <div className="text-[10px] uppercase tracking-[0.4em] text-cosmos-muted/60">
          Your cast
        </div>
        <div className="font-display text-2xl md:text-3xl text-cosmos-text font-medium mt-2">
          Thanks for the conversation.
        </div>
        <p className="text-[13px] text-cosmos-muted/60 mt-1.5 max-w-md mx-auto leading-relaxed">
          Everyone who pushed your thinking, taking a bow.
        </p>
      </div>

      <div className="flex flex-wrap items-end justify-center gap-3 md:gap-5 mt-6 px-4">
        {recommendedPersonas.map((p, i) => {
          const colors = getPersonaColors(p.archetype);
          // Stagger the wave so each character bows after the prior.
          const waveDelay = 0.35 + i * 0.18;
          return (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 24, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{
                duration: 0.5,
                delay: i * 0.12,
                ease: [0.34, 1.56, 0.64, 1],
              }}
              className="flex flex-col items-center"
            >
              {/* Character is rendered at full size (w-72) and scaled down
                  via CSS transform inside a fixed-size frame. Overflow
                  hidden keeps the absolute backdrop circles contained. */}
              <motion.div
                className={`relative w-28 h-28 md:w-32 md:h-32 overflow-hidden rounded-full ${colors.bubbleBg} border ${colors.bubbleBorder}`}
                animate={{ rotate: [0, 8, -4, 6, -2, 0] }}
                transition={{
                  duration: 1.4,
                  delay: waveDelay,
                  repeat: Infinity,
                  repeatDelay: 4 + i * 0.5,
                  ease: "easeInOut",
                }}
                style={{ transformOrigin: "center bottom" }}
              >
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ transform: "scale(0.42)", transformOrigin: "center" }}
                >
                  {pickCharacter(p as PersonaRec)}
                </div>
              </motion.div>
              <div className={`mt-2 text-[11px] font-medium ${colors.activeText} text-center max-w-[110px] leading-tight`}>
                {p.name}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.section>
  );
}

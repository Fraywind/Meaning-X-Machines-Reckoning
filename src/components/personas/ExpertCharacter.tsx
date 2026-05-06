"use client";

import { motion } from "framer-motion";
import { Accessory } from "./accessories";

/**
 * Expert — generic domain-specific persona character. Used as a fallback for
 * AI-generated personas (zookeeper, lawyer, teacher, etc.). The accent color
 * is derived from the persona name so each domain expert looks slightly
 * distinct, and an optional accessory (chef-hat, glasses, stethoscope, etc.)
 * adds a role-specific visual cue based on Setup's dossier.
 */
function hashColor(seed: string): { primary: string; primaryShade: string; collar: string } {
  // Tiny deterministic hash → hue rotation
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return {
    primary: `hsl(${hue} 35% 38%)`,
    primaryShade: `hsl(${hue} 40% 28%)`,
    collar: `hsl(${hue} 50% 55%)`,
  };
}

interface Props {
  thinking: boolean;
  /** Accent color seed — typically the persona name, so each expert reads as distinct */
  accentSeed?: string;
  /** Optional accessory key (e.g. "chef-hat", "glasses", "stethoscope") */
  accessory?: string;
}

export default function ExpertCharacter({ thinking, accentSeed = "expert", accessory }: Props) {
  const { primary, primaryShade, collar } = hashColor(accentSeed);
  const skin = "#f3d3b0";
  const skinShade = "#cfa789";
  const hair = "#2f2419";
  const ink = "#1a1218";

  return (
    <>
      <motion.div
        className="absolute rounded-full pointer-events-none blur-3xl"
        style={{ width: 380, height: 380, backgroundColor: primary, opacity: 0.08 }}
        animate={{
          scale: thinking ? [1, 1.06, 1] : [1, 1.02, 1],
          opacity: thinking ? [0.06, 0.12, 0.06] : [0.04, 0.08, 0.04],
        }}
        transition={{ duration: thinking ? 1.6 : 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-b from-cosmos-surface/40 to-cosmos-bg/60 border border-cosmos-border/40" />

      <motion.svg
        viewBox="0 0 220 240"
        className="relative w-72 h-72"
        animate={{
          y: thinking ? [0, -2, 0] : [0, -1.5, 0],
          rotate: thinking ? [-0.5, 0.5, -0.5] : [-0.3, 0.3, -0.3],
        }}
        transition={{ duration: thinking ? 2 : 4, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "110px 220px" }}
      >
        {/* Jacket / professional attire shoulders */}
        <path
          d="M 30 240 Q 30 168 80 162 L 140 162 Q 190 168 190 240 Z"
          fill={primary}
          stroke={ink}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Lapel detail */}
        <path d="M 80 162 L 110 200 L 140 162 L 138 174 L 110 208 L 82 174 Z" fill={primaryShade} stroke={ink} strokeWidth="1.4" />
        {/* Collar V — accent-colored */}
        <path d="M 96 170 L 110 188 L 124 170 L 124 178 L 110 196 L 96 178 Z" fill={collar} stroke={ink} strokeWidth="1.2" />

        {/* Hands resting (subtle) */}
        <ellipse cx="68" cy="230" rx="8" ry="5" fill={skin} stroke={ink} strokeWidth="1.4" opacity="0.7" />
        <ellipse cx="152" cy="230" rx="8" ry="5" fill={skin} stroke={ink} strokeWidth="1.4" opacity="0.7" />

        {/* Neck */}
        <rect x="98" y="138" width="24" height="22" fill={skin} stroke={ink} strokeWidth="1.5" />

        {/* Head */}
        <ellipse cx="110" cy="96" rx="40" ry="44" fill={skin} stroke={ink} strokeWidth="2" />

        {/* Cheek shading */}
        <ellipse cx="83" cy="113" rx="6" ry="4" fill={skinShade} opacity="0.4" />
        <ellipse cx="137" cy="113" rx="6" ry="4" fill={skinShade} opacity="0.4" />

        {/* Hair — neat, professional */}
        <path
          d="M 72 76 Q 80 50 110 48 Q 140 50 148 76 Q 142 62 132 60 Q 120 68 110 62 Q 100 68 88 60 Q 78 62 72 76 Z"
          fill={hair}
          stroke={ink}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Eyes */}
        <motion.g
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 0.18, times: [0, 0.5, 1], repeat: Infinity, repeatDelay: 4.6, ease: "easeInOut" }}
          style={{ transformOrigin: "110px 100px" }}
        >
          <motion.g
            animate={{ x: [0, 1.5, 0, -1.2, 0, 0] }}
            transition={{ duration: 6.5, times: [0, 0.08, 0.18, 0.3, 0.42, 1], repeat: Infinity, ease: "easeInOut" }}
          >
            <ellipse cx="93" cy="100" rx="3" ry="3.4" fill={ink} />
            <ellipse cx="127" cy="100" rx="3" ry="3.4" fill={ink} />
            <circle cx="94" cy="99" r="1" fill="#fff" opacity="0.9" />
            <circle cx="128" cy="99" r="1" fill="#fff" opacity="0.9" />
          </motion.g>
        </motion.g>

        {/* Eyebrows */}
        <motion.path
          d="M 84 88 Q 93 86 102 88"
          stroke={hair}
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
          animate={{ y: thinking ? -0.5 : 0 }}
          transition={{ duration: 0.4 }}
        />
        <motion.path
          d="M 118 88 Q 127 86 136 88"
          stroke={hair}
          strokeWidth="2.2"
          fill="none"
          strokeLinecap="round"
          animate={{ y: thinking ? -0.5 : 0 }}
          transition={{ duration: 0.4 }}
        />

        {/* Nose */}
        <path d="M 110 108 Q 109 117 112 119" stroke={skinShade} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.6" />

        {/* Mouth — composed, talks when thinking */}
        <motion.path
          stroke={ink}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          animate={{
            d: thinking
              ? [
                  "M 102 130 Q 110 131 118 130",
                  "M 100 132 Q 110 137 120 132",
                  "M 102 130 Q 110 132 118 130",
                  "M 100 131 Q 110 136 120 131",
                ]
              : "M 102 130 Q 110 132 118 130",
          }}
          transition={{ duration: thinking ? 1.5 : 0.5, repeat: thinking ? Infinity : 0, ease: "easeInOut" }}
        />

        {/* Role-specific accessory layered on top of the portrait so it
            telegraphs the persona's domain at a glance. */}
        <Accessory kind={accessory} />
      </motion.svg>
    </>
  );
}

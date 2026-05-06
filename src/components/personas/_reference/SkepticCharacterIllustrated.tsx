"use client";

import { motion } from "framer-motion";

/** Skeptic — bust portrait, charcoal/grey palette, raised eyebrow + glasses + chin-stroking gesture */
export default function SkepticCharacter({ thinking }: { thinking: boolean }) {
  const skin = "#f3d3b0";
  const skinShade = "#cfa789";
  const hair = "#1f2233";
  const hairShade = "#3a3e52";
  const vest = "#2a2c3a";
  const shirt = "#5b6275";
  const accent = "#8b3a3a";
  const ink = "#11121c";
  const glass = "#a8b0c2";

  return (
    <>
      {/* Glow halo */}
      <motion.div
        className="absolute rounded-full bg-cosmos-judgment/8 blur-3xl pointer-events-none"
        style={{ width: 380, height: 380 }}
        animate={{
          scale: thinking ? [1, 1.06, 1] : [1, 1.02, 1],
          opacity: thinking ? [0.5, 0.8, 0.5] : [0.3, 0.5, 0.3],
        }}
        transition={{ duration: thinking ? 1.6 : 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Background portrait disc */}
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-b from-cosmos-surface/40 to-cosmos-bg/60 border border-cosmos-judgment/15" />

      <motion.svg
        viewBox="0 0 220 240"
        className="relative w-72 h-72"
        animate={{ y: thinking ? [0, -2, 0] : [0, -1.5, 0] }}
        transition={{ duration: thinking ? 2 : 3.6, repeat: Infinity, ease: "easeInOut" }}
      >
        {/* Vest / suit shoulders */}
        <path
          d="M 30 240 Q 30 168 80 162 L 140 162 Q 190 168 190 240 Z"
          fill={vest}
          stroke={ink}
          strokeWidth="2"
          strokeLinejoin="round"
        />

        {/* Shirt collar */}
        <path
          d="M 88 165 L 110 192 L 132 165 L 132 178 L 110 198 L 88 178 Z"
          fill={shirt}
          stroke={ink}
          strokeWidth="1.6"
          strokeLinejoin="round"
        />

        {/* Pocket-square accent */}
        <rect x="148" y="190" width="14" height="8" fill={accent} stroke={ink} strokeWidth="1.4" />

        {/* Chin-stroking hand at bottom right */}
        <motion.g
          animate={{
            x: thinking ? [0, 0.5, 0, 0.5, 0] : 0,
            rotate: thinking ? [0, 2, 0, 2, 0] : 0,
          }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "138px 162px" }}
        >
          <ellipse cx="138" cy="162" rx="11" ry="8" fill={skin} stroke={ink} strokeWidth="1.6" />
          {/* Fingers */}
          <line x1="132" y1="160" x2="124" y2="152" stroke={ink} strokeWidth="1.3" strokeLinecap="round" />
          <line x1="135" y1="158" x2="128" y2="148" stroke={ink} strokeWidth="1.3" strokeLinecap="round" />
          <line x1="138" y1="156" x2="132" y2="146" stroke={ink} strokeWidth="1.3" strokeLinecap="round" />
        </motion.g>

        {/* Neck */}
        <rect x="98" y="138" width="24" height="22" fill={skin} stroke={ink} strokeWidth="1.5" />
        <ellipse cx="110" cy="158" rx="14" ry="3" fill={skinShade} opacity="0.45" />

        {/* Head */}
        <ellipse cx="110" cy="96" rx="42" ry="46" fill={skin} stroke={ink} strokeWidth="2" />

        {/* Cheek shading */}
        <ellipse cx="82" cy="115" rx="6" ry="4" fill={skinShade} opacity="0.4" />
        <ellipse cx="138" cy="115" rx="6" ry="4" fill={skinShade} opacity="0.4" />

        {/* Hair — slicked back, sharp temples */}
        <path
          d="M 70 80 Q 78 52 110 48 Q 142 52 150 80 Q 144 60 134 56 Q 128 70 110 64 Q 92 70 86 56 Q 76 60 70 80 Z"
          fill={hair}
          stroke={ink}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Hair highlight */}
        <path d="M 90 64 Q 105 56 120 64" stroke={hairShade} strokeWidth="1.2" fill="none" opacity="0.7" />

        {/* Five-o'clock shadow */}
        <ellipse cx="110" cy="128" rx="20" ry="6" fill={hair} opacity="0.18" />

        {/* Glasses — rectangular frames */}
        <g>
          <rect x="80" y="93" width="22" height="14" rx="2" fill={glass} fillOpacity="0.18" stroke={ink} strokeWidth="1.6" />
          <rect x="118" y="93" width="22" height="14" rx="2" fill={glass} fillOpacity="0.18" stroke={ink} strokeWidth="1.6" />
          <line x1="102" y1="100" x2="118" y2="100" stroke={ink} strokeWidth="1.6" />
          {/* Temple arms */}
          <line x1="80" y1="100" x2="70" y2="98" stroke={ink} strokeWidth="1.6" />
          <line x1="140" y1="100" x2="150" y2="98" stroke={ink} strokeWidth="1.6" />
        </g>

        {/* Eyes — narrowed slightly. Behind glasses. */}
        <motion.g
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 0.18, times: [0, 0.5, 1], repeat: Infinity, repeatDelay: 5, ease: "easeInOut" }}
          style={{ transformOrigin: "110px 100px" }}
        >
          <ellipse cx="91" cy="100" rx="3" ry="3" fill={ink} />
          <ellipse cx="129" cy="100" rx="3" ry="3" fill={ink} />
        </motion.g>

        {/* Eyebrows — asymmetric, right one raised (skeptical) */}
        <motion.path
          d="M 82 88 L 100 86"
          stroke={hair}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          animate={{ y: thinking ? -0.5 : 0 }}
          transition={{ duration: 0.4 }}
        />
        <motion.path
          stroke={hair}
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          animate={{
            d: thinking ? "M 120 80 L 138 84" : "M 120 82 L 138 86",
          }}
          transition={{ duration: 0.4 }}
        />

        {/* Nose — slightly more defined */}
        <path
          d="M 110 108 Q 108 118 113 122"
          stroke={skinShade}
          strokeWidth="1.6"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
        />

        {/* Mouth — flat, slightly downturned. Pursed when thinking. */}
        <motion.path
          stroke={ink}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          animate={{
            d: thinking ? "M 100 132 Q 110 130 120 132" : "M 100 132 L 120 130",
          }}
          transition={{ duration: 0.5 }}
        />
      </motion.svg>
    </>
  );
}

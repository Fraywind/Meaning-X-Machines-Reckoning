"use client";

import { motion } from "framer-motion";

/** Pragmatist — bust portrait, blue-grey palette, rolled sleeves, holding clipboard with checklist */
export default function PragmatistCharacter({ thinking }: { thinking: boolean }) {
  const skin = "#f3d3b0";
  const skinShade = "#cfa789";
  const hair = "#3d2f1f";
  const shirt = "#3a4a5e";
  const shirtShade = "#2a3848";
  const accent = "#6b8aa8"; // cool blue-grey
  const board = "#3a3025";
  const paper = "#f0e6d2";
  const ink = "#1a1d28";
  const check = "#4a8a3a"; // green check

  return (
    <>
      <motion.div
        className="absolute rounded-full bg-cosmos-reckoning/8 blur-3xl pointer-events-none"
        style={{ width: 380, height: 380 }}
        animate={{
          scale: thinking ? [1, 1.06, 1] : [1, 1.02, 1],
          opacity: thinking ? [0.5, 0.8, 0.5] : [0.3, 0.5, 0.3],
        }}
        transition={{ duration: thinking ? 1.6 : 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-b from-cosmos-surface/40 to-cosmos-bg/60 border border-cosmos-reckoning/15" />

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
        {/* Shirt shoulders */}
        <path
          d="M 30 240 Q 30 168 80 162 L 140 162 Q 190 168 190 240 Z"
          fill={shirt}
          stroke={ink}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Rolled sleeve hint */}
        <path d="M 38 200 L 42 180 L 60 178 L 56 200 Z" fill={shirtShade} stroke={ink} strokeWidth="1.4" />
        <path d="M 182 200 L 178 180 L 160 178 L 164 200 Z" fill={shirtShade} stroke={ink} strokeWidth="1.4" />

        {/* Clipboard in front */}
        <rect x="58" y="174" width="92" height="62" rx="3" fill={board} stroke={ink} strokeWidth="2" />
        {/* Paper */}
        <rect x="62" y="180" width="84" height="52" rx="2" fill={paper} stroke={ink} strokeWidth="1.4" />
        {/* Clip at top */}
        <rect x="98" y="170" width="16" height="8" rx="1.5" fill={accent} stroke={ink} strokeWidth="1.4" />
        {/* Checklist items */}
        <line x1="70" y1="190" x2="80" y2="190" stroke={ink} strokeWidth="1.5" />
        <path d="M 73 188 L 76 191 L 80 186" stroke={check} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <line x1="84" y1="190" x2="138" y2="190" stroke={ink} strokeWidth="1" opacity="0.5" />

        <line x1="70" y1="200" x2="80" y2="200" stroke={ink} strokeWidth="1.5" />
        <path d="M 73 198 L 76 201 L 80 196" stroke={check} strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <line x1="84" y1="200" x2="135" y2="200" stroke={ink} strokeWidth="1" opacity="0.5" />

        <rect x="70" y="208" width="6" height="6" rx="1" fill="none" stroke={ink} strokeWidth="1.4" />
        <line x1="80" y1="211" x2="130" y2="211" stroke={ink} strokeWidth="1" opacity="0.5" />

        <rect x="70" y="218" width="6" height="6" rx="1" fill="none" stroke={ink} strokeWidth="1.4" />
        <line x1="80" y1="221" x2="125" y2="221" stroke={ink} strokeWidth="1" opacity="0.5" />

        {/* Hands holding clipboard */}
        <ellipse cx="58" cy="200" rx="8" ry="6" fill={skin} stroke={ink} strokeWidth="1.5" />
        <ellipse cx="150" cy="200" rx="8" ry="6" fill={skin} stroke={ink} strokeWidth="1.5" />

        {/* Neck */}
        <rect x="98" y="138" width="24" height="22" fill={skin} stroke={ink} strokeWidth="1.5" />
        {/* Shirt collar V */}
        <path d="M 90 162 L 110 178 L 130 162 L 130 168 L 110 184 L 90 168 Z" fill={shirtShade} stroke={ink} strokeWidth="1.4" />

        {/* Head */}
        <ellipse cx="110" cy="96" rx="40" ry="44" fill={skin} stroke={ink} strokeWidth="2" />

        {/* Cheek shading */}
        <ellipse cx="83" cy="113" rx="6" ry="4" fill={skinShade} opacity="0.4" />
        <ellipse cx="137" cy="113" rx="6" ry="4" fill={skinShade} opacity="0.4" />

        {/* Hair — short, practical, slight bedhead */}
        <path
          d="M 72 76 Q 80 50 110 50 Q 140 50 148 76 Q 144 64 130 62 Q 122 70 110 64 Q 98 70 90 62 Q 76 64 72 76 Z"
          fill={hair}
          stroke={ink}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Hair tuft sticking up */}
        <path d="M 96 52 L 100 44 L 104 52 Z" fill={hair} stroke={ink} strokeWidth="1.2" />

        {/* Eyes — focused, alert */}
        <motion.g
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 0.18, times: [0, 0.5, 1], repeat: Infinity, repeatDelay: 4.5, ease: "easeInOut" }}
          style={{ transformOrigin: "110px 100px" }}
        >
          <motion.g
            animate={{ x: [0, 1.2, 0, -1, 0, 0] }}
            transition={{ duration: 6, times: [0, 0.08, 0.18, 0.3, 0.42, 1], repeat: Infinity, ease: "easeInOut" }}
          >
            <ellipse cx="93" cy="100" rx="3" ry="3.5" fill={ink} />
            <ellipse cx="127" cy="100" rx="3" ry="3.5" fill={ink} />
            <circle cx="94" cy="99" r="1" fill="#fff" opacity="0.9" />
            <circle cx="128" cy="99" r="1" fill="#fff" opacity="0.9" />
          </motion.g>
        </motion.g>

        {/* Eyebrows — straight, focused */}
        <motion.path
          d="M 84 88 L 102 87"
          stroke={hair}
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
          animate={{ y: thinking ? -0.5 : 0 }}
          transition={{ duration: 0.4 }}
        />
        <motion.path
          d="M 118 87 L 136 88"
          stroke={hair}
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
          animate={{ y: thinking ? -0.5 : 0 }}
          transition={{ duration: 0.4 }}
        />

        {/* Nose */}
        <path d="M 110 108 Q 109 117 112 119" stroke={skinShade} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.65" />

        {/* Mouth — neutral set, talks when thinking */}
        <motion.path
          stroke={ink}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          animate={{
            d: thinking
              ? [
                  "M 102 130 Q 110 132 118 130",
                  "M 100 132 Q 110 138 120 132",
                  "M 102 130 Q 110 131 118 130",
                  "M 100 131 Q 110 137 120 131",
                ]
              : "M 102 130 L 118 130",
          }}
          transition={{ duration: thinking ? 1.5 : 0.5, repeat: thinking ? Infinity : 0, ease: "easeInOut" }}
        />
      </motion.svg>
    </>
  );
}

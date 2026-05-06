"use client";

import { motion } from "framer-motion";

/** Stress Test — bust portrait, warm orange/red caution palette, worried but curious expression */
export default function StressTestCharacter({ thinking }: { thinking: boolean }) {
  const skin = "#f3d3b0";
  const skinShade = "#cfa789";
  const hair = "#5a3e2a";
  const sweater = "#7a4530"; // warm rust
  const sweaterShade = "#5d2f1f";
  const accent = "#d6713a"; // orange
  const ink = "#1a1218";
  const sweat = "#5fa8d6"; // light blue sweat drop

  return (
    <>
      <motion.div
        className="absolute rounded-full bg-cosmos-conflict/8 blur-3xl pointer-events-none"
        style={{ width: 380, height: 380 }}
        animate={{
          scale: thinking ? [1, 1.06, 1] : [1, 1.02, 1],
          opacity: thinking ? [0.5, 0.8, 0.5] : [0.3, 0.5, 0.3],
        }}
        transition={{ duration: thinking ? 1.6 : 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-b from-cosmos-surface/40 to-cosmos-bg/60 border border-cosmos-conflict/15" />

      <motion.svg
        viewBox="0 0 220 240"
        className="relative w-72 h-72"
        animate={{
          y: thinking ? [0, -2.5, 0] : [0, -1.8, 0],
          rotate: thinking ? [-0.7, 0.7, -0.7] : [-0.4, 0.4, -0.4],
        }}
        transition={{ duration: thinking ? 1.7 : 3.8, repeat: Infinity, ease: "easeInOut" }}
        style={{ transformOrigin: "110px 220px" }}
      >
        {/* Sweater shoulders */}
        <path
          d="M 30 240 Q 30 170 80 164 L 140 164 Q 190 170 190 240 Z"
          fill={sweater}
          stroke={ink}
          strokeWidth="2"
          strokeLinejoin="round"
        />
        {/* Sweater knit texture lines */}
        <line x1="60" y1="180" x2="60" y2="240" stroke={sweaterShade} strokeWidth="1" opacity="0.5" />
        <line x1="80" y1="170" x2="80" y2="240" stroke={sweaterShade} strokeWidth="1" opacity="0.5" />
        <line x1="140" y1="170" x2="140" y2="240" stroke={sweaterShade} strokeWidth="1" opacity="0.5" />
        <line x1="160" y1="180" x2="160" y2="240" stroke={sweaterShade} strokeWidth="1" opacity="0.5" />

        {/* Hands wringing in front (anxious gesture) */}
        <ellipse cx="100" cy="195" rx="10" ry="7" fill={skin} stroke={ink} strokeWidth="1.6" />
        <ellipse cx="120" cy="195" rx="10" ry="7" fill={skin} stroke={ink} strokeWidth="1.6" />
        {/* Knuckle line */}
        <line x1="103" y1="192" x2="117" y2="192" stroke={ink} strokeWidth="1" opacity="0.6" />

        {/* Sweater turtleneck */}
        <path d="M 90 164 Q 110 158 130 164 L 130 174 Q 110 168 90 174 Z" fill={sweaterShade} stroke={ink} strokeWidth="1.6" />

        {/* Neck */}
        <rect x="98" y="142" width="24" height="22" fill={skin} stroke={ink} strokeWidth="1.5" />

        {/* Head */}
        <ellipse cx="110" cy="98" rx="42" ry="46" fill={skin} stroke={ink} strokeWidth="2" />

        {/* Cheek shading — slightly flushed */}
        <ellipse cx="82" cy="115" rx="7" ry="5" fill={accent} opacity="0.18" />
        <ellipse cx="138" cy="115" rx="7" ry="5" fill={accent} opacity="0.18" />

        {/* Hair — tousled, slightly disheveled */}
        <path
          d="M 70 80 Q 76 48 110 46 Q 144 48 150 80 Q 144 60 134 58 Q 124 72 112 60 Q 96 72 88 60 Q 76 60 70 80 Z"
          fill={hair}
          stroke={ink}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* Stray hair tufts */}
        <path d="M 78 50 L 82 42 L 84 50 Z" fill={hair} stroke={ink} strokeWidth="1.2" />
        <path d="M 138 48 L 142 40 L 146 50 Z" fill={hair} stroke={ink} strokeWidth="1.2" />

        {/* Sweat drop on temple — animated */}
        <motion.g
          animate={{
            opacity: thinking ? [0, 1, 1, 0] : 0,
            y: thinking ? [0, 3, 6, 9] : 0,
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <path d="M 152 78 Q 150 84 152 88 Q 154 84 152 78 Z" fill={sweat} stroke={ink} strokeWidth="0.8" />
        </motion.g>

        {/* Eyes — wider, slightly worried */}
        <motion.g
          animate={{ scaleY: [1, 0.1, 1] }}
          transition={{ duration: 0.18, times: [0, 0.5, 1], repeat: Infinity, repeatDelay: 3.8, ease: "easeInOut" }}
          style={{ transformOrigin: "110px 100px" }}
        >
          {/* Eye whites bigger */}
          <ellipse cx="93" cy="100" rx="6" ry="6.5" fill="#ffffff" stroke={ink} strokeWidth="1.5" />
          <ellipse cx="127" cy="100" rx="6" ry="6.5" fill="#ffffff" stroke={ink} strokeWidth="1.5" />
          <motion.g
            animate={{ x: [0, 2, 0, -2, 0, 0] }}
            transition={{ duration: 5, times: [0, 0.06, 0.14, 0.22, 0.32, 1], repeat: Infinity, ease: "easeInOut" }}
          >
            <ellipse cx="93" cy="101" rx="2.5" ry="3.2" fill={ink} />
            <ellipse cx="127" cy="101" rx="2.5" ry="3.2" fill={ink} />
            <circle cx="94" cy="99" r="1" fill="#fff" opacity="0.95" />
            <circle cx="128" cy="99" r="1" fill="#fff" opacity="0.95" />
          </motion.g>
        </motion.g>

        {/* Eyebrows — angled up in middle (worried) */}
        <motion.path
          d="M 80 88 L 100 84"
          stroke={hair}
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
          animate={{ y: thinking ? -0.5 : 0 }}
          transition={{ duration: 0.4 }}
        />
        <motion.path
          d="M 120 84 L 140 88"
          stroke={hair}
          strokeWidth="2.4"
          fill="none"
          strokeLinecap="round"
          animate={{ y: thinking ? -0.5 : 0 }}
          transition={{ duration: 0.4 }}
        />

        {/* Nose */}
        <path d="M 110 108 Q 108 118 112 121" stroke={skinShade} strokeWidth="1.5" fill="none" strokeLinecap="round" opacity="0.65" />

        {/* Mouth — slight grimace; talks when thinking */}
        <motion.path
          stroke={ink}
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          animate={{
            d: thinking
              ? [
                  "M 100 130 Q 110 133 120 130",
                  "M 99 132 Q 110 138 121 132",
                  "M 100 130 Q 110 131 120 130",
                  "M 99 131 Q 110 136 121 131",
                ]
              : "M 100 130 Q 110 134 120 130",
          }}
          transition={{ duration: thinking ? 1.5 : 0.5, repeat: thinking ? Infinity : 0, ease: "easeInOut" }}
        />
      </motion.svg>
    </>
  );
}

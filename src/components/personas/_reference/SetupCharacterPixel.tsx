"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

/**
 * Pixel-art Setup character — proof-of-concept Stardew-Valley-esque sprite.
 * Each cell of the sprite array is rendered as a 1x1 SVG <rect>.
 * Animation is frame-based: idle / blink / talk frames swap on a timer.
 *
 * Sprite is 32 wide × 40 tall. Scale via outer wrapper.
 */

const W = 32;
const H = 40;

const COLORS: Record<string, string> = {
  ".": "transparent",
  o: "#1a1218", // outline (very dark plum-black)
  D: "#3d2c5a", // hood shadow
  H: "#5d4575", // hood
  L: "#7a5f93", // hood highlight
  h: "#3d2515", // hair dark
  i: "#5a3825", // hair highlight
  S: "#d8a87f", // skin shade
  s: "#f3d3b0", // skin
  e: "#1a1218", // eye dark (same as outline)
  w: "#fff4e0", // eye / paper highlight
  n: "#c9956b", // nose shadow
  m: "#7a2820", // mouth
  R: "#251c3a", // robe shadow
  r: "#3a2f55", // robe
  q: "#544479", // robe highlight
  P: "#e8d8b8", // paper
  l: "#9a8050", // paper line
  g: "#d6a85a", // pencil gold
  k: "#5a3a18", // pencil dark
};

// Each string is one row; must be exactly W=32 chars long.
// `.` = transparent. Other chars index COLORS above.
const FRAME_IDLE = [
  "................................", // 0
  "................................", // 1
  "............oooooooo............", // 2
  "..........ooDDHHHHDDoo..........", // 3
  "........ooDHHHHHHHHHHDoo........", // 4
  ".......oDHHHHHHHHHHHHHHDo.......", // 5
  "......oDHHLLHHHHHHHHHHHHDo......", // 6
  "......oDHHLLhhhhhhhhhhHHDo......", // 7
  ".....oDHHhhhhhhhhhhhhhHHDo......", // 8
  ".....oDHhhhiiihhhhhiiihhhDo.....", // 9
  ".....oDHhhssssssssssssshhDo.....", // 10
  "....oDHhsssssssssssssssshhDo....", // 11
  "....oDHsssssssssssssssssshDo....", // 12
  "....oDsssssssssssssssssssshDo...", // 13
  "....oDssssseeswsssssseeswsshDo..", // 14  eyes (e=eye, w=highlight)
  "....oDsssseesssssssseesssssDo...", // 15
  "....oDsssssssssssnnssssssssDo...", // 16  nose
  "....oDssssssssssnsssssssssshD...", // 17
  "....oDsssssssssssssssssssssshD..", // 18
  ".....oDssssssssmmmmmmsssssshD...", // 19  mouth
  ".....oDsssssssssmmmmsssssshD....", // 20
  "......oDssssssssssssssssshD.....", // 21
  ".......oDDsssssssssssssshD......", // 22  jaw curve
  "........ooDDsssssssssssDD.......", // 23
  "..........ooDDDsssssDDD.........", // 24
  ".............oossssDD...........", // 25  neck
  "............oosssssoo...........", // 26  neck
  "...........oRRRRRRRRRRo.........", // 27  collar
  ".........oRRrrrrrrrrrrrRRo......", // 28  shoulders
  "........oRrrrrrrrrrrrrrrrRo.....", // 29
  ".......oRrrrrrPPPPPPPPrrrrrRo...", // 30  notepad top
  ".......oRrrrPwlllllllllPrrrrRo..", // 31
  ".......oRrrrPllllllllllllPrrrRo.", // 32
  ".......oRrrrPlllllllllglPrrrrRo.", // 33  pencil gold
  ".......oRrrrPllllllllglkPrrrrRo.", // 34  pencil with dark tip
  ".......oRrrrPlllllllllllPrrrrRo.", // 35
  ".......oRrrrPPPPPPPPPPPPPrrrrRo.", // 36  notepad bottom
  ".......oRrrrrrrrrrrrrrrrrrrrrRo.", // 37
  "........oRRrrrrrrrrrrrrrrrrrRo..", // 38
  ".........oooRRRRRRRRRRRRRRoo....", // 39
];

// Blink frame: eyes closed (replace 'e' rows with closed-eye lines)
const FRAME_BLINK = FRAME_IDLE.map((row, y) => {
  if (y === 14) return "....oDsssss--swsssssss--swsshDo..";
  if (y === 15) return "....oDsssss--sssssssss--sssssDo...";
  return row;
});

// Talk frame: mouth slightly open
const FRAME_TALK = FRAME_IDLE.map((row, y) => {
  if (y === 19) return ".....oDsssssssmmwwmmsssssshD....";
  if (y === 20) return ".....oDssssssmmmwwwmmsssssshD...";
  return row;
});

// "-" maps to outline color so closed eyes look like a single dark line
COLORS["-"] = "#1a1218";

function ensureWidth(rows: string[]): string[] {
  return rows.map((r, i) => {
    if (r.length === W) return r;
    if (r.length < W) return r + ".".repeat(W - r.length);
    return r.slice(0, W);
  });
}

function renderFrame(rows: string[]) {
  const safe = ensureWidth(rows);
  const rects: React.ReactElement[] = [];
  for (let y = 0; y < safe.length; y++) {
    const row = safe[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch === "." || !COLORS[ch]) continue;
      rects.push(
        <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={COLORS[ch]} />,
      );
    }
  }
  return rects;
}

export default function SetupCharacterPixel({ thinking }: { thinking: boolean }) {
  // Drive blink + talk frame switching
  const [frame, setFrame] = useState<"idle" | "blink" | "talk">("idle");

  useEffect(() => {
    let blinkTimeout: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      const wait = 3500 + Math.random() * 2500;
      blinkTimeout = setTimeout(() => {
        setFrame((prev) => (prev === "talk" ? prev : "blink"));
        setTimeout(() => {
          setFrame((prev) => (prev === "talk" ? prev : "idle"));
          scheduleBlink();
        }, 130);
      }, wait);
    };
    scheduleBlink();
    return () => clearTimeout(blinkTimeout);
  }, []);

  // While thinking, alternate idle/talk to suggest speaking/scribbling
  useEffect(() => {
    if (!thinking) {
      setFrame((prev) => (prev === "talk" ? "idle" : prev));
      return;
    }
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setFrame(i % 2 === 0 ? "talk" : "idle");
    }, 250);
    return () => clearInterval(interval);
  }, [thinking]);

  const rows = frame === "blink" ? FRAME_BLINK : frame === "talk" ? FRAME_TALK : FRAME_IDLE;

  return (
    <>
      {/* Glow halo */}
      <motion.div
        className="absolute rounded-full bg-cosmos-glow/8 blur-3xl pointer-events-none"
        style={{ width: 380, height: 380 }}
        animate={{
          scale: thinking ? [1, 1.06, 1] : [1, 1.02, 1],
          opacity: thinking ? [0.5, 0.8, 0.5] : [0.3, 0.5, 0.3],
        }}
        transition={{ duration: thinking ? 1.6 : 4, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Portrait frame disc */}
      <div className="absolute w-72 h-72 rounded-full bg-gradient-to-b from-cosmos-surface/40 to-cosmos-bg/60 border border-cosmos-glow/15" />

      {/* Pixel-art sprite — bobs subtly */}
      <motion.svg
        viewBox={`0 0 ${W} ${H}`}
        width={288}
        height={360}
        shapeRendering="crispEdges"
        style={{ imageRendering: "pixelated" }}
        className="relative"
        animate={{ y: thinking ? [0, -1, 0] : [0, -0.8, 0] }}
        transition={{ duration: thinking ? 1.6 : 3.6, repeat: Infinity, ease: "easeInOut" }}
      >
        {renderFrame(rows)}
      </motion.svg>
    </>
  );
}

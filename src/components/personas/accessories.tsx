"use client";

import React from "react";

/**
 * Accessory library for the dynamic ExpertCharacter. Each accessory is a
 * small SVG snippet positioned to overlay the bust portrait (viewBox 0 0
 * 220 240). The character head is centered at (110, 96) with rx=40 ry=44,
 * so accessories layer on top of the existing portrait without
 * compositing into it.
 *
 * Accessory keys are emitted by Setup as part of the persona dossier.
 * The full list of supported keys is exported as ACCESSORY_KEYS so the
 * Setup prompt can constrain the LLM to a known enum.
 */

export const ACCESSORY_KEYS = [
  "chef-hat",
  "glasses",
  "stethoscope",
  "clipboard",
  "book",
  "briefcase",
  "mortarboard",
  "headphones",
  "lab-coat",
  "hard-hat",
  "paintbrush",
  "none",
] as const;

export type AccessoryKey = (typeof ACCESSORY_KEYS)[number];

const ink = "#1a1218";

function ChefHat() {
  return (
    <g>
      {/* Hat band */}
      <ellipse cx="110" cy="56" rx="44" ry="8" fill="#ffffff" stroke={ink} strokeWidth="1.6" />
      {/* Pleated puff body */}
      <path
        d="M 70 56 Q 60 40 76 34 Q 86 18 100 22 Q 110 12 120 22 Q 134 18 144 34 Q 160 40 150 56 Z"
        fill="#ffffff"
        stroke={ink}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Three pleated mounds */}
      <ellipse cx="82" cy="34" rx="10" ry="8" fill="#ffffff" stroke={ink} strokeWidth="1.2" />
      <ellipse cx="110" cy="22" rx="13" ry="11" fill="#ffffff" stroke={ink} strokeWidth="1.2" />
      <ellipse cx="138" cy="34" rx="10" ry="8" fill="#ffffff" stroke={ink} strokeWidth="1.2" />
      {/* Subtle shading for depth */}
      <path d="M 70 56 Q 90 50 110 56" stroke={ink} strokeWidth="0.6" fill="none" opacity="0.3" />
      <path d="M 110 56 Q 130 50 150 56" stroke={ink} strokeWidth="0.6" fill="none" opacity="0.3" />
    </g>
  );
}

function Glasses() {
  return (
    <g>
      <circle cx="93" cy="100" r="12" fill="none" stroke={ink} strokeWidth="2" />
      <circle cx="127" cy="100" r="12" fill="none" stroke={ink} strokeWidth="2" />
      <line x1="105" y1="100" x2="115" y2="100" stroke={ink} strokeWidth="2" />
      {/* Earpieces */}
      <line x1="81" y1="100" x2="73" y2="98" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
      <line x1="139" y1="100" x2="147" y2="98" stroke={ink} strokeWidth="1.6" strokeLinecap="round" />
      {/* Light reflection */}
      <path d="M 86 95 L 90 92" stroke="#fff" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
      <path d="M 120 95 L 124 92" stroke="#fff" strokeWidth="1" strokeLinecap="round" opacity="0.7" />
    </g>
  );
}

function Stethoscope() {
  return (
    <g>
      {/* Y-tubing draped around neck */}
      <path d="M 92 158 Q 78 178 86 200" stroke="#2a4a6a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 128 158 Q 142 178 134 200" stroke="#2a4a6a" strokeWidth="3" fill="none" strokeLinecap="round" />
      {/* Earpieces (small caps where tubing meets neck) */}
      <circle cx="92" cy="158" r="3" fill="#aaa" stroke={ink} strokeWidth="1" />
      <circle cx="128" cy="158" r="3" fill="#aaa" stroke={ink} strokeWidth="1" />
      {/* Bell at the bottom */}
      <path d="M 86 200 Q 96 210 110 215" stroke="#2a4a6a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M 134 200 Q 124 210 110 215" stroke="#2a4a6a" strokeWidth="3" fill="none" strokeLinecap="round" />
      <circle cx="110" cy="218" r="9" fill="#888" stroke={ink} strokeWidth="1.6" />
      <circle cx="110" cy="218" r="5" fill="#666" />
    </g>
  );
}

function Clipboard() {
  return (
    <g>
      {/* Held in right hand */}
      <rect x="158" y="194" width="34" height="42" rx="2" fill="#c89a6a" stroke={ink} strokeWidth="1.5" />
      {/* Top metal clip */}
      <rect x="167" y="188" width="16" height="9" rx="1" fill="#888" stroke={ink} strokeWidth="1.2" />
      {/* Paper */}
      <rect x="162" y="200" width="26" height="32" fill="#fafafa" stroke={ink} strokeWidth="0.8" />
      {/* Lines on paper */}
      <line x1="166" y1="208" x2="184" y2="208" stroke="#aaa" strokeWidth="0.8" />
      <line x1="166" y1="214" x2="180" y2="214" stroke="#aaa" strokeWidth="0.8" />
      <line x1="166" y1="220" x2="184" y2="220" stroke="#aaa" strokeWidth="0.8" />
      <line x1="166" y1="226" x2="178" y2="226" stroke="#aaa" strokeWidth="0.8" />
    </g>
  );
}

function Book() {
  return (
    <g>
      {/* Book held in right hand */}
      <rect x="156" y="202" width="36" height="38" fill="#8b3a3a" stroke={ink} strokeWidth="1.6" rx="1" />
      {/* Spine highlight */}
      <rect x="156" y="202" width="4" height="38" fill="#5a2222" />
      {/* Pages edge */}
      <line x1="190" y1="206" x2="190" y2="236" stroke="#f5e6c8" strokeWidth="1.5" />
      {/* Title bar */}
      <rect x="164" y="212" width="22" height="2" fill="#d4a012" />
      <rect x="166" y="218" width="18" height="1.5" fill="#d4a012" opacity="0.7" />
    </g>
  );
}

function Briefcase() {
  return (
    <g>
      {/* Body */}
      <rect x="148" y="208" width="44" height="30" fill="#5a3a2a" stroke={ink} strokeWidth="1.5" rx="2" />
      {/* Handle */}
      <path d="M 160 208 L 160 202 Q 160 198 165 198 L 175 198 Q 180 198 180 202 L 180 208" fill="none" stroke={ink} strokeWidth="1.5" />
      {/* Latch */}
      <rect x="167" y="216" width="6" height="4" fill="#aa8855" stroke={ink} strokeWidth="0.8" />
      {/* Divider line */}
      <line x1="148" y1="220" x2="192" y2="220" stroke="#3a2410" strokeWidth="1" />
    </g>
  );
}

function Mortarboard() {
  return (
    <g>
      {/* Cap top (square) */}
      <path d="M 56 50 L 110 28 L 164 50 L 110 72 Z" fill="#1a1a3a" stroke={ink} strokeWidth="1.6" strokeLinejoin="round" />
      {/* Cap rim */}
      <path d="M 78 60 Q 110 76 142 60" fill="none" stroke={ink} strokeWidth="1.4" />
      {/* Tassel */}
      <line x1="110" y1="28" x2="156" y2="58" stroke="#d4a012" strokeWidth="1.6" />
      <circle cx="156" cy="58" r="3" fill="#d4a012" />
      <path d="M 154 60 L 152 66 M 156 60 L 156 66 M 158 60 L 160 66" stroke="#d4a012" strokeWidth="1" strokeLinecap="round" />
    </g>
  );
}

function Headphones() {
  return (
    <g>
      {/* Headband arc */}
      <path
        d="M 68 86 Q 68 52 110 50 Q 152 52 152 86"
        stroke="#2a2a2a"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Left earcup */}
      <ellipse cx="68" cy="100" rx="9" ry="14" fill="#3a3a3a" stroke={ink} strokeWidth="1.5" />
      <ellipse cx="68" cy="100" rx="5" ry="9" fill="#666" />
      {/* Right earcup */}
      <ellipse cx="152" cy="100" rx="9" ry="14" fill="#3a3a3a" stroke={ink} strokeWidth="1.5" />
      <ellipse cx="152" cy="100" rx="5" ry="9" fill="#666" />
    </g>
  );
}

function LabCoat() {
  return (
    <g>
      {/* White overlay on the jacket area, leaves the existing collar/lapel showing */}
      <path
        d="M 30 240 Q 30 168 80 162 L 140 162 Q 190 168 190 240 Z"
        fill="#ffffff"
        stroke={ink}
        strokeWidth="1.8"
        strokeLinejoin="round"
        opacity="0.94"
      />
      {/* Lapel detail */}
      <path d="M 80 162 L 110 200 L 140 162 L 138 174 L 110 208 L 82 174 Z" fill="#e8e8e8" stroke={ink} strokeWidth="1.2" />
      {/* Pocket */}
      <rect x="142" y="200" width="22" height="18" fill="none" stroke={ink} strokeWidth="1" rx="1" />
      {/* Buttons */}
      <circle cx="110" cy="216" r="1.6" fill={ink} />
      <circle cx="110" cy="228" r="1.6" fill={ink} />
    </g>
  );
}

function HardHat() {
  return (
    <g>
      {/* Hat dome */}
      <path
        d="M 64 60 Q 64 30 110 28 Q 156 30 156 60 L 64 60 Z"
        fill="#f5b800"
        stroke={ink}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      {/* Brim */}
      <path d="M 56 60 L 164 60 L 158 66 L 62 66 Z" fill="#d49d00" stroke={ink} strokeWidth="1.4" />
      {/* Center ridge */}
      <line x1="110" y1="32" x2="110" y2="60" stroke={ink} strokeWidth="1" opacity="0.6" />
      {/* Side ridges */}
      <path d="M 80 38 Q 95 50 95 60" stroke={ink} strokeWidth="0.8" fill="none" opacity="0.4" />
      <path d="M 140 38 Q 125 50 125 60" stroke={ink} strokeWidth="0.8" fill="none" opacity="0.4" />
    </g>
  );
}

function Paintbrush() {
  return (
    <g>
      {/* Brush handle */}
      <rect x="170" y="180" width="6" height="40" fill="#a06030" stroke={ink} strokeWidth="1.2" rx="1" transform="rotate(20 173 200)" />
      {/* Ferrule */}
      <rect x="167" y="216" width="12" height="6" fill="#888" stroke={ink} strokeWidth="1" transform="rotate(20 173 219)" />
      {/* Bristles */}
      <path d="M 165 222 L 181 222 L 178 236 L 168 236 Z" fill="#5a3a2a" stroke={ink} strokeWidth="1" transform="rotate(20 173 229)" />
      {/* Paint dot */}
      <circle cx="180" cy="240" r="2.5" fill="#cc4444" opacity="0.85" />
    </g>
  );
}

const ACCESSORY_MAP: Record<AccessoryKey, () => React.ReactElement | null> = {
  "chef-hat": ChefHat,
  glasses: Glasses,
  stethoscope: Stethoscope,
  clipboard: Clipboard,
  book: Book,
  briefcase: Briefcase,
  mortarboard: Mortarboard,
  headphones: Headphones,
  "lab-coat": LabCoat,
  "hard-hat": HardHat,
  paintbrush: Paintbrush,
  none: () => null,
};

export function Accessory({ kind }: { kind?: string }) {
  if (!kind) return null;
  const safe = (ACCESSORY_KEYS as readonly string[]).includes(kind) ? (kind as AccessoryKey) : "none";
  const Comp = ACCESSORY_MAP[safe];
  return <Comp />;
}

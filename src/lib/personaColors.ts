/**
 * Centralized per-archetype color palette for persona UI surfaces.
 * Tailwind requires class strings to be statically present; we hand-roll
 * full sets per archetype rather than building classes dynamically.
 */

export interface PersonaColorSet {
  // Strip avatar (used by PersonaStrip)
  activeBg: string;
  activeBorder: string;
  activeText: string;
  idleBorder: string;
  idleText: string;
  // Conversation surfaces (used by CastPersonaPanel)
  bubbleBg: string;
  bubbleBorder: string;
  inputFocusBorder: string;
  sendBg: string;
  sendBorder: string;
  sendText: string;
  sendHoverBg: string;
  surfacedBg: string;
  surfacedBorder: string;
  surfacedLabel: string;
  characterGradientFrom: string;
  characterGradientTo: string;
  chipBg: string;
  chipBorder: string;
  chipText: string;
  chipHoverBg: string;
  chipHoverBorder: string;
  chipPrimaryBg: string;
  chipPrimaryBorder: string;
  chipPrimaryText: string;
  chipPrimaryHoverBg: string;
  chipPrimaryHoverBorder: string;
}

const SETUP: PersonaColorSet = {
  activeBg: "bg-cosmos-glow/20",
  activeBorder: "border-cosmos-glow/55",
  activeText: "text-cosmos-glow",
  idleBorder: "border-cosmos-border/40",
  idleText: "text-cosmos-muted",
  bubbleBg: "bg-cosmos-glow/8",
  bubbleBorder: "border-cosmos-glow/20",
  inputFocusBorder: "focus:border-cosmos-glow/40",
  sendBg: "bg-cosmos-glow/15",
  sendBorder: "border-cosmos-glow/25",
  sendText: "text-cosmos-glow",
  sendHoverBg: "hover:bg-cosmos-glow/25",
  surfacedBg: "bg-cosmos-glow/5",
  surfacedBorder: "border-cosmos-glow/20",
  surfacedLabel: "text-cosmos-glow/60",
  characterGradientFrom: "from-cosmos-bg",
  characterGradientTo: "to-cosmos-glow/10",
  chipBg: "bg-transparent",
  chipBorder: "border-cosmos-border/40",
  chipText: "text-cosmos-muted/70",
  chipHoverBg: "hover:bg-cosmos-glow/5",
  chipHoverBorder: "hover:border-cosmos-glow/30",
  chipPrimaryBg: "bg-cosmos-glow/15",
  chipPrimaryBorder: "border-cosmos-glow/45",
  chipPrimaryText: "text-cosmos-glow",
  chipPrimaryHoverBg: "hover:bg-cosmos-glow/25",
  chipPrimaryHoverBorder: "hover:border-cosmos-glow/60",
};

const SKEPTIC: PersonaColorSet = {
  activeBg: "bg-cosmos-judgment/20",
  activeBorder: "border-cosmos-judgment/55",
  activeText: "text-cosmos-judgment",
  idleBorder: "border-cosmos-border/40",
  idleText: "text-cosmos-muted",
  bubbleBg: "bg-cosmos-judgment/8",
  bubbleBorder: "border-cosmos-judgment/20",
  inputFocusBorder: "focus:border-cosmos-judgment/40",
  sendBg: "bg-cosmos-judgment/15",
  sendBorder: "border-cosmos-judgment/25",
  sendText: "text-cosmos-judgment",
  sendHoverBg: "hover:bg-cosmos-judgment/25",
  surfacedBg: "bg-cosmos-judgment/5",
  surfacedBorder: "border-cosmos-judgment/20",
  surfacedLabel: "text-cosmos-judgment/60",
  characterGradientFrom: "from-cosmos-bg",
  characterGradientTo: "to-cosmos-judgment/10",
  chipBg: "bg-transparent",
  chipBorder: "border-cosmos-border/40",
  chipText: "text-cosmos-muted/70",
  chipHoverBg: "hover:bg-cosmos-judgment/5",
  chipHoverBorder: "hover:border-cosmos-judgment/30",
  chipPrimaryBg: "bg-cosmos-judgment/15",
  chipPrimaryBorder: "border-cosmos-judgment/45",
  chipPrimaryText: "text-cosmos-judgment",
  chipPrimaryHoverBg: "hover:bg-cosmos-judgment/25",
  chipPrimaryHoverBorder: "hover:border-cosmos-judgment/60",
};

const PRAGMATIST: PersonaColorSet = {
  activeBg: "bg-cosmos-reckoning/20",
  activeBorder: "border-cosmos-reckoning/55",
  activeText: "text-cosmos-reckoning",
  idleBorder: "border-cosmos-border/40",
  idleText: "text-cosmos-muted",
  bubbleBg: "bg-cosmos-reckoning/8",
  bubbleBorder: "border-cosmos-reckoning/20",
  inputFocusBorder: "focus:border-cosmos-reckoning/40",
  sendBg: "bg-cosmos-reckoning/15",
  sendBorder: "border-cosmos-reckoning/25",
  sendText: "text-cosmos-reckoning",
  sendHoverBg: "hover:bg-cosmos-reckoning/25",
  surfacedBg: "bg-cosmos-reckoning/5",
  surfacedBorder: "border-cosmos-reckoning/20",
  surfacedLabel: "text-cosmos-reckoning/60",
  characterGradientFrom: "from-cosmos-bg",
  characterGradientTo: "to-cosmos-reckoning/10",
  chipBg: "bg-transparent",
  chipBorder: "border-cosmos-border/40",
  chipText: "text-cosmos-muted/70",
  chipHoverBg: "hover:bg-cosmos-reckoning/5",
  chipHoverBorder: "hover:border-cosmos-reckoning/30",
  chipPrimaryBg: "bg-cosmos-reckoning/15",
  chipPrimaryBorder: "border-cosmos-reckoning/45",
  chipPrimaryText: "text-cosmos-reckoning",
  chipPrimaryHoverBg: "hover:bg-cosmos-reckoning/25",
  chipPrimaryHoverBorder: "hover:border-cosmos-reckoning/60",
};

const STRESS_TEST: PersonaColorSet = {
  activeBg: "bg-cosmos-conflict/20",
  activeBorder: "border-cosmos-conflict/55",
  activeText: "text-cosmos-conflict",
  idleBorder: "border-cosmos-border/40",
  idleText: "text-cosmos-muted",
  bubbleBg: "bg-cosmos-conflict/8",
  bubbleBorder: "border-cosmos-conflict/20",
  inputFocusBorder: "focus:border-cosmos-conflict/40",
  sendBg: "bg-cosmos-conflict/15",
  sendBorder: "border-cosmos-conflict/25",
  sendText: "text-cosmos-conflict",
  sendHoverBg: "hover:bg-cosmos-conflict/25",
  surfacedBg: "bg-cosmos-conflict/5",
  surfacedBorder: "border-cosmos-conflict/20",
  surfacedLabel: "text-cosmos-conflict/60",
  characterGradientFrom: "from-cosmos-bg",
  characterGradientTo: "to-cosmos-conflict/10",
  chipBg: "bg-transparent",
  chipBorder: "border-cosmos-border/40",
  chipText: "text-cosmos-muted/70",
  chipHoverBg: "hover:bg-cosmos-conflict/5",
  chipHoverBorder: "hover:border-cosmos-conflict/30",
  chipPrimaryBg: "bg-cosmos-conflict/15",
  chipPrimaryBorder: "border-cosmos-conflict/45",
  chipPrimaryText: "text-cosmos-conflict",
  chipPrimaryHoverBg: "hover:bg-cosmos-conflict/25",
  chipPrimaryHoverBorder: "hover:border-cosmos-conflict/60",
};

const ANCHOR: PersonaColorSet = {
  activeBg: "bg-cosmos-resolved/20",
  activeBorder: "border-cosmos-resolved/55",
  activeText: "text-cosmos-resolved",
  idleBorder: "border-cosmos-border/40",
  idleText: "text-cosmos-muted",
  bubbleBg: "bg-cosmos-resolved/10",
  bubbleBorder: "border-cosmos-resolved/25",
  inputFocusBorder: "focus:border-cosmos-resolved/40",
  sendBg: "bg-cosmos-resolved/15",
  sendBorder: "border-cosmos-resolved/30",
  sendText: "text-cosmos-resolved",
  sendHoverBg: "hover:bg-cosmos-resolved/25",
  surfacedBg: "bg-cosmos-resolved/8",
  surfacedBorder: "border-cosmos-resolved/30",
  surfacedLabel: "text-cosmos-resolved/70",
  characterGradientFrom: "from-cosmos-bg",
  characterGradientTo: "to-cosmos-resolved/12",
  chipBg: "bg-transparent",
  chipBorder: "border-cosmos-border/40",
  chipText: "text-cosmos-muted/70",
  chipHoverBg: "hover:bg-cosmos-resolved/8",
  chipHoverBorder: "hover:border-cosmos-resolved/35",
  chipPrimaryBg: "bg-cosmos-resolved/15",
  chipPrimaryBorder: "border-cosmos-resolved/45",
  chipPrimaryText: "text-cosmos-resolved",
  chipPrimaryHoverBg: "hover:bg-cosmos-resolved/25",
  chipPrimaryHoverBorder: "hover:border-cosmos-resolved/60",
};

const EXPERT: PersonaColorSet = {
  activeBg: "bg-cosmos-resolved/15",
  activeBorder: "border-cosmos-resolved/45",
  activeText: "text-cosmos-resolved",
  idleBorder: "border-cosmos-border/40",
  idleText: "text-cosmos-muted",
  bubbleBg: "bg-cosmos-resolved/8",
  bubbleBorder: "border-cosmos-resolved/20",
  inputFocusBorder: "focus:border-cosmos-resolved/40",
  sendBg: "bg-cosmos-resolved/15",
  sendBorder: "border-cosmos-resolved/25",
  sendText: "text-cosmos-resolved",
  sendHoverBg: "hover:bg-cosmos-resolved/25",
  surfacedBg: "bg-cosmos-resolved/5",
  surfacedBorder: "border-cosmos-resolved/20",
  surfacedLabel: "text-cosmos-resolved/60",
  characterGradientFrom: "from-cosmos-bg",
  characterGradientTo: "to-cosmos-resolved/10",
  chipBg: "bg-transparent",
  chipBorder: "border-cosmos-border/40",
  chipText: "text-cosmos-muted/70",
  chipHoverBg: "hover:bg-cosmos-resolved/5",
  chipHoverBorder: "hover:border-cosmos-resolved/30",
  chipPrimaryBg: "bg-cosmos-resolved/15",
  chipPrimaryBorder: "border-cosmos-resolved/45",
  chipPrimaryText: "text-cosmos-resolved",
  chipPrimaryHoverBg: "hover:bg-cosmos-resolved/25",
  chipPrimaryHoverBorder: "hover:border-cosmos-resolved/60",
};

export const PERSONA_COLORS: Record<string, PersonaColorSet> = {
  setup: SETUP,
  skeptic: SKEPTIC,
  pragmatist: PRAGMATIST,
  "stress-test": STRESS_TEST,
  anchor: ANCHOR,
  expert: EXPERT,
};

export function getPersonaColors(archetype: string): PersonaColorSet {
  return PERSONA_COLORS[archetype] || PERSONA_COLORS.expert;
}

export type ThemeId = "starfield" | "cybernetics" | "light";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  colors: {
    bg: string;
    surface: string;
    border: string;
    muted: string;
    text: string;
    glow: string;
    judgment: string;
    conflict: string;
    resolved: string;
    reckoning: string;
  };
  starfield: {
    colors: [number, number, number][];
    density: number; // pixels per star (lower = more dense)
    speed: number;
    glowIntensity: number;
  };
  // Extra CSS variables for fine-tuning
  edgeDim: string; // edge color for non-special edges
  scrollbarHover: string;
}

export const themes: Record<ThemeId, ThemeConfig> = {
  starfield: {
    id: "starfield",
    name: "Starfield",
    description: "Deep cosmos with twinkling stars",
    colors: {
      bg: "#0a0a0f",
      surface: "#12121a",
      border: "#1e1e2e",
      muted: "#6b7280",
      text: "#e2e8f0",
      glow: "#818cf8",
      judgment: "#f59e0b",
      conflict: "#ef4444",
      resolved: "#10b981",
      reckoning: "#6366f1",
    },
    starfield: {
      colors: [
        [129, 140, 248], // indigo
        [167, 139, 250], // purple
        [99, 102, 241],  // deeper indigo
        [196, 181, 253], // light lavender
        [224, 231, 255], // near-white blue
      ],
      density: 5000,
      speed: 1,
      glowIntensity: 0.3,
    },
    edgeDim: "#3b3b5c",
    scrollbarHover: "#2e2e4e",
  },
  cybernetics: {
    id: "cybernetics",
    name: "Cybernetics",
    description: "Neon circuitry and data streams",
    colors: {
      bg: "#030a06",
      surface: "#081410",
      border: "#0f2a1a",
      muted: "#4a7a5a",
      text: "#d0f0d8",
      glow: "#00e87b",
      judgment: "#ffb020",
      conflict: "#ff4040",
      resolved: "#00e87b",
      reckoning: "#00c8ff",
    },
    starfield: {
      colors: [
        [0, 232, 123],   // neon green
        [0, 200, 255],   // cyan
        [0, 255, 160],   // bright green
        [100, 255, 200], // light teal
        [0, 180, 120],   // medium green
      ],
      density: 3000, // denser for "data rain" feel
      speed: 2.5,    // faster falling
      glowIntensity: 0.5,
    },
    edgeDim: "#0f3f2a",
    scrollbarHover: "#1a3f2a",
  },
  light: {
    id: "light",
    name: "Aurora",
    description: "Clean and bright with soft gradients",
    colors: {
      bg: "#f5f7fb",
      surface: "#ffffff",
      border: "#e2e5eb",
      muted: "#6b7280",
      text: "#1a1a2e",
      glow: "#6366f1",
      judgment: "#d97706",
      conflict: "#dc2626",
      resolved: "#059669",
      reckoning: "#4f46e5",
    },
    starfield: {
      colors: [
        [99, 102, 241],  // indigo
        [139, 92, 246],  // purple
        [168, 162, 255], // soft violet
        [196, 181, 253], // lavender
        [129, 140, 248], // light indigo
      ],
      density: 8000, // sparser, more subtle
      speed: 0.5,    // very slow, dreamy
      glowIntensity: 0.15,
    },
    edgeDim: "#c8cdd4",
    scrollbarHover: "#d0d5dc",
  },
};

export function getTheme(id: ThemeId): ThemeConfig {
  return themes[id] || themes.starfield;
}

/** Apply theme CSS variables to the document root */
export function applyTheme(theme: ThemeConfig) {
  const root = document.documentElement;
  const { colors } = theme;

  root.style.setProperty("--bg", colors.bg);
  root.style.setProperty("--surface", colors.surface);
  root.style.setProperty("--border", colors.border);
  root.style.setProperty("--muted", colors.muted);
  root.style.setProperty("--text", colors.text);
  root.style.setProperty("--glow", colors.glow);
  root.style.setProperty("--judgment", colors.judgment);
  root.style.setProperty("--conflict", colors.conflict);
  root.style.setProperty("--resolved", colors.resolved);
  root.style.setProperty("--reckoning", colors.reckoning);
  root.style.setProperty("--edge-dim", theme.edgeDim);
  root.style.setProperty("--scrollbar-hover", theme.scrollbarHover);

  // Set a data attribute for conditional CSS
  root.setAttribute("data-theme", theme.id);
}

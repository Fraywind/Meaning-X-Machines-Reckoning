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
    density: number;
    speed: number;
    glowIntensity: number;
  };
  edgeDim: string;
  scrollbarHover: string;
}

/** Convert hex to "r g b" for Tailwind alpha support */
function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r} ${g} ${b}`;
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
        [129, 140, 248],
        [167, 139, 250],
        [99, 102, 241],
        [196, 181, 253],
        [224, 231, 255],
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
        [0, 232, 123],
        [0, 200, 255],
        [0, 255, 160],
        [100, 255, 200],
        [0, 180, 120],
      ],
      density: 3000,
      speed: 2.5,
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
        [99, 102, 241],
        [139, 92, 246],
        [168, 162, 255],
        [196, 181, 253],
        [129, 140, 248],
      ],
      density: 8000,
      speed: 0.5,
      glowIntensity: 0.15,
    },
    edgeDim: "#c8cdd4",
    scrollbarHover: "#d0d5dc",
  },
};

export function getTheme(id: ThemeId): ThemeConfig {
  return themes[id] || themes.starfield;
}

/** Apply theme CSS variables to the document root as space-separated RGB */
export function applyTheme(theme: ThemeConfig) {
  const root = document.documentElement;
  const { colors } = theme;

  root.style.setProperty("--bg", hexToRgb(colors.bg));
  root.style.setProperty("--surface", hexToRgb(colors.surface));
  root.style.setProperty("--border", hexToRgb(colors.border));
  root.style.setProperty("--muted", hexToRgb(colors.muted));
  root.style.setProperty("--text", hexToRgb(colors.text));
  root.style.setProperty("--glow", hexToRgb(colors.glow));
  root.style.setProperty("--judgment", hexToRgb(colors.judgment));
  root.style.setProperty("--conflict", hexToRgb(colors.conflict));
  root.style.setProperty("--resolved", hexToRgb(colors.resolved));
  root.style.setProperty("--reckoning", hexToRgb(colors.reckoning));
  root.style.setProperty("--edge-dim", theme.edgeDim);
  root.style.setProperty("--scrollbar-hover", theme.scrollbarHover);

  root.setAttribute("data-theme", theme.id);
}

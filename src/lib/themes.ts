export type ThemeId = "starfield" | "cybernetics" | "light" | "cute" | "nature";

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
      bg: "#e8ecf4",
      surface: "#f0f2f8",
      border: "#c5cad6",
      muted: "#4b5563",
      text: "#111827",
      glow: "#4f46e5",
      judgment: "#b45309",
      conflict: "#b91c1c",
      resolved: "#047857",
      reckoning: "#3730a3",
    },
    starfield: {
      colors: [
        [99, 102, 241],
        [139, 92, 246],
        [168, 162, 255],
        [196, 181, 253],
        [129, 140, 248],
      ],
      density: 5500,
      speed: 1.2,
      glowIntensity: 0.25,
    },
    edgeDim: "#c8cdd4",
    scrollbarHover: "#d0d5dc",
  },
  cute: {
    id: "cute",
    name: "Candy",
    description: "Soft pastels and bubbly vibes",
    colors: {
      bg: "#fff0f5",
      surface: "#fff8fa",
      border: "#f5c6d8",
      muted: "#b07a8f",
      text: "#5c2340",
      glow: "#f472b6",
      judgment: "#f59e0b",
      conflict: "#fb7185",
      resolved: "#34d399",
      reckoning: "#c084fc",
    },
    starfield: {
      colors: [
        [244, 114, 182], // pink
        [192, 132, 252], // purple
        [251, 113, 133], // rose
        [253, 186, 116], // peach
        [196, 181, 253], // lavender
      ],
      density: 4000,
      speed: 0.6,
      glowIntensity: 0.35,
    },
    edgeDim: "#f0c0d4",
    scrollbarHover: "#f5d0e0",
  },
  nature: {
    id: "nature",
    name: "Nature",
    description: "Sunlit canopy with drifting leaves",
    colors: {
      bg: "#e8eeea",
      surface: "#f2f6f3",
      border: "#c4d4c8",
      muted: "#5a7360",
      text: "#1a2e1e",
      glow: "#3a8a50",
      judgment: "#b45309",
      conflict: "#b91c1c",
      resolved: "#1a7a3a",
      reckoning: "#2d6a4f",
    },
    starfield: {
      colors: [
        [140, 180, 160], // sage
        [170, 200, 190], // mist
        [160, 195, 210], // sky blue
        [190, 210, 200], // pale green
        [175, 195, 215], // light blue
      ],
      density: 8000,
      speed: 0.6,
      glowIntensity: 0.15,
    },
    edgeDim: "#a0b8a8",
    scrollbarHover: "#b8ccbe",
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

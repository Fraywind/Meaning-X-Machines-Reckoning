import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Space Grotesk", "system-ui", "sans-serif"],
      },
      colors: {
        cosmos: {
          bg: "var(--bg)",
          surface: "var(--surface)",
          border: "var(--border)",
          muted: "var(--muted)",
          text: "var(--text)",
          glow: "var(--glow)",
          judgment: "var(--judgment)",
          conflict: "var(--conflict)",
          resolved: "var(--resolved)",
          reckoning: "var(--reckoning)",
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "node-bloom": "node-bloom 0.6s ease-out",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 15px color-mix(in srgb, var(--glow) 30%, transparent)" },
          "50%": { boxShadow: "0 0 30px color-mix(in srgb, var(--glow) 60%, transparent)" },
        },
        "node-bloom": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

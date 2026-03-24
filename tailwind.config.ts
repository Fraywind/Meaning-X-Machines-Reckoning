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
          bg: "rgb(var(--bg) / <alpha-value>)",
          surface: "rgb(var(--surface) / <alpha-value>)",
          border: "rgb(var(--border) / <alpha-value>)",
          muted: "rgb(var(--muted) / <alpha-value>)",
          text: "rgb(var(--text) / <alpha-value>)",
          glow: "rgb(var(--glow) / <alpha-value>)",
          judgment: "rgb(var(--judgment) / <alpha-value>)",
          conflict: "rgb(var(--conflict) / <alpha-value>)",
          resolved: "rgb(var(--resolved) / <alpha-value>)",
          reckoning: "rgb(var(--reckoning) / <alpha-value>)",
        },
      },
      animation: {
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "node-bloom": "node-bloom 0.6s ease-out",
        "resolve-burst": "resolve-burst 0.7s ease-out",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 15px rgb(var(--glow) / 0.3)" },
          "50%": { boxShadow: "0 0 30px rgb(var(--glow) / 0.6)" },
        },
        "node-bloom": {
          "0%": { transform: "scale(0)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "resolve-burst": {
          "0%": { boxShadow: "0 0 0px rgb(var(--resolved) / 0)", transform: "scale(1)" },
          "30%": { boxShadow: "0 0 30px rgb(var(--resolved) / 0.6), 0 0 60px rgb(var(--resolved) / 0.3)", transform: "scale(1.05)" },
          "100%": { boxShadow: "0 0 15px rgb(var(--resolved) / 0.3)", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;

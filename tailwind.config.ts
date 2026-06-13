import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Source Sans 3", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Lexend", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        brand: {
          teal: "#005D4C",
          tealDark: "#004D40",
          ink: "#0F172A",
          cta: "#0369A1",
        },
      },
      keyframes: {
        pulseGlow: {
          "0%, 100%": { transform: "scale(1)", opacity: "0.8" },
          "50%": { transform: "scale(1.3)", opacity: "1", boxShadow: "0 0 12px rgba(16,185,129,0.8)" },
        },
      },
      animation: {
        pulseGlow: "pulseGlow 2s infinite ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;

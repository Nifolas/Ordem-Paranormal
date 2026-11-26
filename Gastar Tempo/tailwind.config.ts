import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        obsidian: {
          base: "#09090B",
          panel: "#101014",
          elevated: "#16161C",
          line: "#22222A",
          lineStrong: "#32323E",
        },
        element: {
          sangue: "#DC2626",
          morte: "#A1A1AA",
          conhecimento: "#EAB308",
          energia: "#9333EA",
          medo: "#E2E8F0",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "system-ui", "sans-serif"],
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        typewriter: ["var(--font-typewriter)", "Courier New", "monospace"],
        handwriting: ["var(--font-handwriting)", "cursive"],
      },
      keyframes: {
        "slide-up-fade": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "disaster-shake": {
          "0%, 100%": { transform: "translateX(0)" },
          "25%": { transform: "translateX(-3px)" },
          "75%": { transform: "translateX(3px)" },
        },
      },
      animation: {
        "slide-up-fade": "slide-up-fade 0.18s cubic-bezier(0.16, 1, 0.3, 1)",
        "disaster-shake": "disaster-shake 0.3s ease-in-out",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // backward-compat
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Fluxo brand tokens
        "accent-blue": "var(--accent-blue)",
        "accent-blue-foreground": "var(--accent-blue-foreground)",
        "accent-sky": "var(--accent-sky)",
        "bg-dark": "var(--bg-dark)",
        "bg-dark-soft": "var(--bg-dark-soft)",
        "bg-light": "var(--bg-light)",
        "surface-gray": "var(--surface-gray)",
        "text-muted": "var(--text-muted)",
        "fg-dark": "var(--foreground-dark)",
      },
      fontFamily: {
        sans: [
          "var(--font-satoshi)",
          "var(--font-geist-sans)",
          "system-ui",
          "sans-serif",
        ],
        display: ["var(--font-satoshi)", "var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "20px",
        pill: "9999px",
      },
      boxShadow: {
        float: "0 24px 60px -20px rgba(0, 0, 0, 0.25)",
        "float-blue": "0 24px 60px -20px rgba(0, 107, 228, 0.35)",
        "glass-light": "0 12px 40px -12px rgba(0, 49, 104, 0.18)",
      },
      backgroundImage: {
        "gradient-brand": "var(--gradient-brand)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "float-1": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "25%": { transform: "translate3d(14px, -18px, 0) scale(1.04)" },
          "50%": { transform: "translate3d(-8px, -10px, 0) scale(0.97)" },
          "75%": { transform: "translate3d(-16px, 8px, 0) scale(1.02)" },
        },
        "float-2": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "30%": { transform: "translate3d(-16px, 12px, 0) scale(0.96)" },
          "60%": { transform: "translate3d(12px, 18px, 0) scale(1.04)" },
          "85%": { transform: "translate3d(16px, -8px, 0) scale(1)" },
        },
        "float-3": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "20%": { transform: "translate3d(10px, 14px, 0) scale(1.03)" },
          "55%": { transform: "translate3d(-14px, -6px, 0) scale(0.97)" },
          "80%": { transform: "translate3d(6px, -16px, 0) scale(1.02)" },
        },
        "float-4": {
          "0%, 100%": { transform: "translate3d(0, 0, 0) scale(1)" },
          "35%": { transform: "translate3d(-10px, -16px, 0) scale(1.04)" },
          "65%": { transform: "translate3d(16px, 6px, 0) scale(0.96)" },
          "90%": { transform: "translate3d(-6px, 14px, 0) scale(1.01)" },
        },
        rain: {
          "0%": { transform: "translateY(-10%)", opacity: "0" },
          "10%": { opacity: "0.9" },
          "100%": { transform: "translateY(110%)", opacity: "0" },
        },
        bob: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(8px)" },
        },
        "fade-up": {
          "0%": { transform: "translateY(24px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "spin-slow": {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        "coin-spin": {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(360deg)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-1": "float-1 9s ease-in-out infinite",
        "float-2": "float-2 10.5s ease-in-out infinite",
        "float-3": "float-3 8s ease-in-out infinite",
        "float-4": "float-4 11s ease-in-out infinite",
        rain: "rain linear infinite",
        bob: "bob 2s ease-in-out infinite",
        "fade-up": "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "spin-slow": "spin-slow 28s linear infinite",
        "coin-spin": "coin-spin 1.2s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;

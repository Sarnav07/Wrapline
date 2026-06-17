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
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        rain: "rain linear infinite",
        bob: "bob 2s ease-in-out infinite",
        "fade-up": "fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both",
        "spin-slow": "spin-slow 28s linear infinite",
      },
    },
  },
  plugins: [],
};
export default config;

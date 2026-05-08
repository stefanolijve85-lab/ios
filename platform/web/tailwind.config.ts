import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f6f7f9", 100: "#eceef2", 200: "#d4d8e0", 300: "#a9b0bf",
          400: "#7d8699", 500: "#525c75", 600: "#3a4361", 700: "#2a3050",
          800: "#1c2140", 900: "#0f1330", 950: "#070a1c",
        },
        accent: {
          50: "#eef9f4", 100: "#d6f1e5", 200: "#a9e1c9", 300: "#73cda6",
          400: "#3eb480", 500: "#1f9764", 600: "#147853", 700: "#125f44",
          800: "#114b38", 900: "#0e3d2e",
        },
        warn: { 500: "#e4a300" },
        danger: { 500: "#e15050", 600: "#bf3737" },
      },
      fontFamily: {
        sans: ['"Inter"', '"Helvetica Neue"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(7, 10, 28, 0.06), 0 8px 24px -12px rgba(7, 10, 28, 0.18)",
      },
      backgroundImage: {
        "trust-grid":
          "radial-gradient(circle at 20% 0%, rgba(31,151,100,0.18), transparent 40%), radial-gradient(circle at 80% 100%, rgba(58,67,97,0.25), transparent 50%)",
      },
    },
  },
  plugins: [],
};

export default config;

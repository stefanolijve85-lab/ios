import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        room: { DEFAULT: "#F6EFE3", deep: "#EEE3D0", paper: "#FBF7F0" },
        olive: { DEFAULT: "#3D4A2B", deep: "#262E1B", soft: "#5D6B45" },
        bordeaux: { DEFAULT: "#7B2533", soft: "#9A3B49" },
        honey: { DEFAULT: "#D6A23C", soft: "#E9C77D" },
        wood: { DEFAULT: "#A5673A", soft: "#C8925F" },
        ink: { DEFAULT: "#2A241D", soft: "#5A5046" },
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        script: ["var(--font-script)", "cursive"],
        hand: ["var(--font-hand)", "cursive"],
      },
      maxWidth: { page: "84rem" },
      transitionTimingFunction: { soft: "cubic-bezier(.22,.8,.24,1)" },
    },
  },
  plugins: [],
};
export default config;

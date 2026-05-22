import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Night-edition broadsheet
        ink: "#13110D", // page background, warm near-black
        ink2: "#1A1712", // panels / inset blocks
        paper: "#ECE7DB", // primary text, warm off-white
        dim: "#A39C8C", // secondary text
        faint: "#6E6757", // tertiary / muted labels
        rule: "#2C2922", // hairline rule color (solid)
        red: "#E2483D", // alarm / rupiah weakening / accent
        green: "#5FB98A", // rupiah strengthening
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        kicker: "0.22em",
      },
    },
  },
  plugins: [],
};

export default config;

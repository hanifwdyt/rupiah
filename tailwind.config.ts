import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "var(--color-paper)",
        paper2: "var(--color-paper-2)",
        paper3: "var(--color-paper-3)",
        rule: "var(--color-rule)",
        rule2: "var(--color-rule-2)",
        muted: "var(--color-muted)",
        neutral: "var(--color-neutral)",
        ink2: "var(--color-ink-2)",
        ink: "var(--color-ink)",
        accent: "var(--color-accent)",
        accentink: "var(--color-accent-ink)",
        focusring: "var(--color-focus)",
        up: "var(--color-up)",
        down: "var(--color-down)",
      },
      fontFamily: {
        display: ["var(--font-display)"],
        sans: ["var(--font-body)"],
        mono: ["var(--font-mono)"],
      },
      fontSize: {
        stat: "var(--text-stat)",
        display: "var(--text-display)",
        "display-s": "var(--text-display-s)",
      },
      letterSpacing: {
        label: "var(--tracking-label)",
        display: "var(--tracking-display)",
      },
      transitionTimingFunction: {
        out: "var(--ease-out)",
        in: "var(--ease-in)",
        "in-out": "var(--ease-in-out)",
      },
      borderRadius: {
        card: "var(--radius-card)",
        pill: "var(--radius-pill)",
        input: "var(--radius-input)",
      },
      maxWidth: {
        page: "var(--page-max)",
      },
    },
  },
  plugins: [],
};

export default config;

import type { Config } from "tailwindcss";

// Every colour, radius, shadow and blur below maps to a design token CSS
// variable (src/app/tokens.css, generated from design/system). Never add raw
// hex here. Layout and spacing use Tailwind's default scale.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // "dt" (desktop) is a lower, more forgiving desktop cutoff than the
      // app-wide "xl" (1280px) — used only by the signed-out marketing
      // landing page, which was showing the mobile layout on real laptops
      // whose effective CSS viewport sits under 1280px (very common with
      // any OS/browser zoom above 100%, e.g. Windows' default 125%/150%
      // scaling on a 1366-1920px-wide physical screen). Every other screen
      // in the app keeps using "xl" unchanged — this doesn't touch them.
      screens: {
        dt: "1024px",
      },
      colors: {
        page: "var(--surface-page)",
        card: "var(--surface-card)",
        elevated: "var(--surface-elevated)",
        input: "var(--surface-input)",
        tag: "var(--surface-tag)",
        scrim: "var(--surface-scrim)",

        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-press": "var(--accent-press)",
        "accent-deep": "var(--accent-deep)",
        "accent-tint": "var(--accent-tint)",
        "accent-tint-strong": "var(--accent-tint-strong)",

        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "text-disabled": "var(--text-disabled)",
        "on-accent": "var(--text-on-accent)",
        "on-light": "var(--text-on-light)",

        "brand-yellow": "var(--brand-yellow)",
        "brand-lime": "var(--brand-lime)",
        "brand-aqua": "var(--brand-aqua)",
        "brand-coral": "var(--brand-coral)",

        success: "var(--success)",
        "success-tint": "var(--success-tint)",
        warning: "var(--warning)",
        "warning-tint": "var(--warning-tint)",
        danger: "var(--danger)",
        "danger-tint": "var(--danger-tint)",
        info: "var(--info)",
        "info-tint": "var(--info-tint)",
        locked: "var(--locked)",
        "locked-veil": "var(--locked-veil)",
      },
      borderColor: {
        hairline: "var(--border-hairline)",
        strong: "var(--border-strong)",
        accent: "var(--border-accent)",
      },
      borderRadius: {
        chip: "var(--radius-chip)",
        button: "var(--radius-button)",
        input: "var(--radius-input)",
        card: "var(--radius-card)",
        media: "var(--radius-media)",
        sheet: "var(--radius-sheet)",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        float: "var(--shadow-float)",
        sheet: "var(--shadow-sheet)",
        accent: "var(--shadow-accent)",
      },
      backdropBlur: {
        veil: "var(--blur-veil)",
        chrome: "var(--blur-chrome)",
      },
      accentColor: {
        accent: "var(--accent)",
      },
    },
  },
  plugins: [],
};
export default config;
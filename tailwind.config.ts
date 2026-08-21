import type { Config } from "tailwindcss";

// Every colour, radius, shadow and blur below maps to a design token CSS
// variable (src/app/tokens.css, generated from design/system). Never add raw
// hex here. Layout and spacing use Tailwind's default scale.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      // Desktop starts at 1024px, everywhere.
      //
      // The landing page was moved to a 1024px cutoff ("dt") when it turned
      // out to be serving the mobile layout on real laptops, but the rest of
      // the app was left on Tailwind's default xl (1280px). That left a
      // 1024-1279px band — an ordinary laptop, or any screen at Windows'
      // default 125%/150% scaling — where the marketing page rendered as
      // desktop and every signed-in screen rendered as a stretched mobile
      // column. Overriding xl rather than rewriting 59 files keeps one cutoff
      // and one meaning. "lg" is unused in this codebase, so nothing collides.
      screens: {
        dt: "1024px",
        xl: "1024px",
      },
      colors: {
        page: "var(--surface-page)",
        card: "var(--surface-card)",
        elevated: "var(--surface-elevated)",
        input: "var(--surface-input)",
        tag: "var(--surface-tag)",
        scrim: "var(--surface-scrim)",

        // ACTION — the thing you press.
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        "accent-press": "var(--accent-press)",
        "accent-deep": "var(--accent-deep)",
        "accent-tint": "var(--accent-tint)",
        "accent-tint-strong": "var(--accent-tint-strong)",
        "accent-soft": "var(--accent-soft)",
        "accent-soft-tint": "var(--accent-soft-tint)",

        // SELECTION — you already chose it.
        "selected-tint": "var(--selected-tint)",
        "selected-tint-strong": "var(--selected-tint-strong)",
        "selected-text": "var(--selected-text)",

        // DECORATION — framing only. Neutral on purpose; see tokens.css.
        "decor-tint": "var(--decor-tint)",
        "decor-tint-strong": "var(--decor-tint-strong)",
        "decor-icon": "var(--decor-icon)",

        // INTERACTION STATE — neutral hover/press, theme-aware.
        "state-hover": "var(--state-hover)",
        "state-press": "var(--state-press)",
        "surface-hover": "var(--surface-hover)",
        "surface-press": "var(--surface-press)",

        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
        "text-disabled": "var(--text-disabled)",
        "on-accent": "var(--text-on-accent)",
        "on-light": "var(--text-on-light)",

        "brand-basket": "var(--brand-basket)",
        "brand-beauty": "var(--brand-beauty)",
        "brand-yellow": "var(--brand-yellow)",
        "brand-lime": "var(--brand-lime)",
        "brand-aqua": "var(--brand-aqua)",
        "brand-coral": "var(--brand-coral)",

        success: "var(--success)",
        "success-tint": "var(--success-tint)",
        warning: "var(--warning)",
        "warning-tint": "var(--warning-tint)",
        danger: "var(--danger)",
        "danger-hover": "var(--danger-hover)",
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
        selected: "var(--border-selected)",
        decor: "var(--border-decor)",
        info: "var(--border-info)",
        success: "var(--border-success)",
        warning: "var(--border-warning)",
        danger: "var(--border-danger)",
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
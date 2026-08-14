import type { Config } from "tailwindcss";

// Colour, radius and elevation come from design tokens (design/system) exposed as
// CSS variables in src/app/globals.css. Do not add hex values here.
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        page: "var(--surface-page)",
        card: "var(--surface-card)",
        elevated: "var(--surface-elevated)",
        input: "var(--surface-input)",
        tag: "var(--surface-tag)",
        accent: "var(--accent)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "text-muted": "var(--text-muted)",
      },
      borderColor: {
        hairline: "var(--border-hairline)",
        strong: "var(--border-strong)",
      },
    },
  },
  plugins: [],
};
export default config;

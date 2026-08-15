import { Icon, type IconName } from "./Icon";

export interface StatBlockProps {
  value: string;
  label: string;
  icon?: IconName;
  tone?: "default" | "accent" | "warning";
  align?: "start" | "center";
  size?: "sm" | "md";
}

const tones = {
  default: "var(--text-primary)",
  accent: "var(--accent)",
  warning: "var(--warning)",
} as const;

const fontSizes = { sm: 22, md: 26 } as const;

export function StatBlock({
  value,
  label,
  icon,
  tone = "default",
  align = "start",
  size = "md",
}: StatBlockProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        padding: "0 0",
        borderRadius: "var(--radius-card)",
        alignItems: align === "center" ? "center" : "flex-start",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {icon ? <Icon name={icon} size={14} stroke={2.2} color={tone === "default" ? "var(--text-muted)" : tones[tone]} /> : null}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
          }}
        >
          {label}
        </span>
      </div>
      <span
        style={{
          fontSize: fontSizes[size],
          fontWeight: 700,
          letterSpacing: "-0.025em",
          lineHeight: 1,
          color: tones[tone],
          fontFeatureSettings: "var(--font-feature-tabular)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

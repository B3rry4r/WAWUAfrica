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
      className="flex flex-col gap-[8px] py-0 px-0 rounded-[var(--radius-card)]" style={{alignItems: align === "center" ? "center" : "flex-start"}}
    >
      <div className="flex items-center gap-[8px]">
        {icon ? <Icon name={icon} size={14} stroke={2.2} color={tone === "default" ? "var(--text-muted)" : tones[tone]} /> : null}
        <span
          className="text-[11px] font-bold tracking-[0.06em] uppercase text-[var(--text-muted)]"
        >
          {label}
        </span>
      </div>
      <span
        className="font-bold tracking-[-0.025em] leading-[1]" style={{fontSize: fontSizes[size], color: tones[tone], fontFeatureSettings: "var(--font-feature-tabular)"}}
      >
        {value}
      </span>
    </div>
  );
}

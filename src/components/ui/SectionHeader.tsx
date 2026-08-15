import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export interface SectionHeaderProps {
  title: string;
  /** Eyebrow line above the title (the design file calls it "caption"). */
  caption?: string;
  eyebrow?: string;
  action?: ReactNode | string;
  onAction?: () => void;
  icon?: IconName;
}

export function SectionHeader({ title, caption, eyebrow, action, onAction, icon }: SectionHeaderProps) {
  const label = eyebrow ?? caption;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
      {icon ? (
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 34,
            height: 34,
            borderRadius: 10,
            background: "var(--accent-tint)",
            border: "1px solid var(--border-accent)",
            flexShrink: 0,
          }}
        >
          <Icon name={icon} size={16} stroke={2} color="var(--accent)" />
        </span>
      ) : null}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
        {label ? (
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
        ) : null}
        <h2
          style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            color: "var(--text-primary)",
          }}
        >
          {title}
        </h2>
      </div>
      {typeof action === "string" ? (
        <button
          type="button"
          onClick={onAction}
          style={{
            background: "none",
            border: "none",
            padding: 0,
            fontSize: 13.5,
            fontWeight: 600,
            color: "var(--accent)",
            fontFamily: "var(--font-sans)",
            cursor: "pointer",
          }}
        >
          {action}
        </button>
      ) : (
        action
      )}
    </div>
  );
}

import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

export interface ListRowProps {
  title: string;
  subtitle?: ReactNode;
  icon?: IconName;
  iconColor?: string;
  meta?: ReactNode;
  onClick?: () => void;
  showChevron?: boolean;
}

export function ListRow({
  title,
  subtitle,
  icon,
  iconColor = "var(--text-secondary)",
  meta,
  onClick,
  showChevron = false,
}: ListRowProps) {
  const row = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        background: "var(--surface-card)",
        border: "1px solid var(--border-hairline)",
        borderRadius: "var(--radius-card)",
      }}
    >
      {icon ? (
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 42,
            height: 42,
            borderRadius: 13,
            background: "var(--surface-tag)",
            border: "1px solid var(--border-hairline)",
            flexShrink: 0,
          }}
        >
          <Icon name={icon} size={18} stroke={2} color={iconColor} />
        </span>
      ) : null}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontSize: 14.5, fontWeight: 600, color: "var(--text-primary)", lineHeight: 1.3 }}>
          {title}
        </span>
        {subtitle ? (
          <span style={{ fontSize: 12.5, color: "var(--text-muted)", lineHeight: 1.4 }}>{subtitle}</span>
        ) : null}
      </div>
      {meta ? (
        <span style={{ fontSize: 13, fontWeight: 600, color: "var(--accent)", flexShrink: 0 }}>{meta}</span>
      ) : null}
      {showChevron ? <Icon name="ChevronRight" size={18} stroke={2} color="var(--text-muted)" /> : null}
    </div>
  );

  if (!onClick) return row;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "block",
        width: "100%",
        padding: 0,
        border: "none",
        background: "transparent",
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "var(--font-sans)",
      }}
    >
      {row}
    </button>
  );
}

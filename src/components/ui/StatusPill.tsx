import { Icon, type IconName } from "./Icon";

export type StatusKind = "success" | "warning" | "error" | "info" | "neutral";

const kinds: Record<StatusKind, { color: string; tint: string }> = {
  success: { color: "var(--success)", tint: "var(--success-tint)" },
  warning: { color: "var(--warning)", tint: "var(--warning-tint)" },
  error: { color: "var(--danger)", tint: "var(--danger-tint)" },
  info: { color: "var(--info)", tint: "var(--info-tint)" },
  neutral: { color: "var(--text-secondary)", tint: "var(--surface-tag)" },
};

export interface StatusPillProps {
  kind?: StatusKind;
  children: React.ReactNode;
  icon?: IconName;
  size?: "xs" | "sm" | "md";
}

const heights = { xs: 22, sm: 26, md: 32 } as const;

export function StatusPill({ kind = "neutral", children, icon, size = "sm" }: StatusPillProps) {
  const k = kinds[kind];
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: heights[size],
        padding: `0 ${size === "xs" ? 9 : 11}px`,
        borderRadius: 999,
        background: k.tint,
        color: k.color,
        fontSize: size === "xs" ? 10.5 : size === "sm" ? 11.5 : 12.5,
        fontWeight: 700,
        letterSpacing: 0.01,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {icon ? <Icon name={icon} size={size === "xs" ? 11 : 12.5} stroke={2.4} color={k.color} /> : null}
      {children}
    </span>
  );
}

export interface HandoffPillProps {
  label: string;
  external?: boolean;
}

/** Marks content owned by an external WAWU app (WAWUBasket / WAWUBeauty). Handoff only. */
export function HandoffPill({ label, external = true }: HandoffPillProps) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: 26,
        padding: "0 11px",
        borderRadius: 999,
        background: "var(--surface-tag)",
        border: "1px solid var(--border-hairline)",
        color: "var(--text-muted)",
        fontSize: 11.5,
        fontWeight: 600,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {label}
      {external ? <Icon name="ArrowUpRight" size={11} stroke={2.2} color="var(--text-muted)" /> : null}
    </span>
  );
}

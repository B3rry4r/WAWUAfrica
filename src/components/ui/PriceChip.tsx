import { formatNaira } from "@/lib/format";

export interface PriceChipProps {
  amount?: number;
  free?: boolean;
}

export function PriceChip({ amount = 0, free = false }: PriceChipProps) {
  const isFree = free || amount <= 0;
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 26,
        padding: "0 11px",
        borderRadius: 999,
        background: isFree ? "var(--success-tint)" : "var(--accent-tint)",
        border: isFree ? "1px solid var(--border-hairline)" : "1px solid var(--border-accent)",
        color: isFree ? "var(--success)" : "var(--accent)",
        fontSize: 12.5,
        fontWeight: 700,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {isFree ? "Free" : formatNaira(amount)}
    </span>
  );
}

export function ComingSoonPill() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
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
      Coming soon
    </span>
  );
}

export type AccessLevel = "free" | "paid" | "locked";

export interface AccessBadgeProps {
  level: AccessLevel;
}

export function AccessBadge({ level }: AccessBadgeProps) {
  if (level === "free") {
    return <PriceChip free />;
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 26,
        padding: "0 11px",
        borderRadius: 999,
        background: level === "locked" ? "var(--surface-tag)" : "var(--accent-tint)",
        border: level === "locked" ? "1px solid var(--border-hairline)" : "1px solid var(--border-accent)",
        color: level === "locked" ? "var(--text-muted)" : "var(--accent)",
        fontSize: 11.5,
        fontWeight: 700,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      {level === "locked" ? "Locked" : "Paid"}
    </span>
  );
}

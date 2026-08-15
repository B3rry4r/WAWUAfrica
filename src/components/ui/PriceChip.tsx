import { formatNaira } from "@/lib/format";

export interface PriceChipProps {
  amount?: number;
  free?: boolean;
}

export function PriceChip({ amount = 0, free = false }: PriceChipProps) {
  const isFree = free || amount <= 0;
  return (
    <span
      className="inline-flex items-center h-[26px] py-0 px-[11px] rounded-[999] text-[12.5px] font-bold leading-[1] whitespace-nowrap" style={{background: isFree ? "var(--success-tint)" : "var(--accent-tint)", border: isFree ? "1px solid var(--border-hairline)" : "1px solid var(--border-accent)", color: isFree ? "var(--success)" : "var(--accent)"}}
    >
      {isFree ? "Free" : formatNaira(amount)}
    </span>
  );
}

export function ComingSoonPill() {
  return (
    <span
      className="inline-flex items-center h-[26px] py-0 px-[11px] rounded-[999] bg-[var(--surface-tag)] border border-[var(--border-hairline)] text-[var(--text-muted)] text-[11.5px] font-semibold leading-[1] whitespace-nowrap"
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
      className="inline-flex items-center h-[26px] py-0 px-[11px] rounded-[999] text-[11.5px] font-bold leading-[1] whitespace-nowrap" style={{background: level === "locked" ? "var(--surface-tag)" : "var(--accent-tint)", border: level === "locked" ? "1px solid var(--border-hairline)" : "1px solid var(--border-accent)", color: level === "locked" ? "var(--text-muted)" : "var(--accent)"}}
    >
      {level === "locked" ? "Locked" : "Paid"}
    </span>
  );
}

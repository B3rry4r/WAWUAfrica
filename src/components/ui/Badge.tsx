import { cn } from "@/lib/cn";
import type { CreatorTier } from "@/types/account";

type Tone = "neutral" | "accent" | "success" | "warning" | "danger" | "info";

const TONE: Record<Tone, string> = {
  neutral: "bg-[var(--surface-tag)] text-[var(--text-secondary)]",
  accent: "bg-[var(--accent-tint)] text-[var(--accent)]",
  success: "bg-[var(--success-tint)] text-[var(--success)]",
  warning: "bg-[var(--warning-tint)] text-[var(--warning)]",
  danger: "bg-[var(--danger-tint)] text-[var(--danger)]",
  info: "bg-[var(--info-tint)] text-[var(--info)]",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-chip)] px-2 py-0.5",
        "text-[12px] font-medium leading-none",
        TONE[tone],
        className
      )}
    >
      {children}
    </span>
  );
}

/** Purple = Basic, Gold = Pro. Tier is a paid subscription, not a trust level. */
export function TierBadge({ tier }: { tier: CreatorTier }) {
  return (
    <Badge tone={tier === "pro" ? "warning" : "accent"}>
      {tier === "pro" ? "Pro" : "Basic"}
    </Badge>
  );
}

import type { CreatorTier } from "@/types/account";

interface TierBadgeProps {
  tier: CreatorTier;
}

/**
 * Basic = purple, Pro = gold, Pro Max = accent-deep.
 *
 * Pro Max needs its own treatment rather than sharing Pro's gold: the two
 * are adjacent plans at very different prices, and a badge that cannot tell
 * them apart is worse than no badge on a screen where somebody is deciding
 * between them.
 */
const TIER_STYLE: Record<CreatorTier, { label: string; className: string }> = {
  basic: {
    label: "Basic",
    className: "border border-accent bg-accent-tint text-accent-hover",
  },
  pro: {
    label: "Pro",
    className: "border border-warning bg-warning-tint text-brand-yellow",
  },
  pro_max: {
    label: "Pro Max",
    className:
      "border border-[var(--accent-deep)] bg-[var(--accent-tint-strong)] text-text-primary",
  },
};

export function TierBadge({ tier }: TierBadgeProps) {
  const style = TIER_STYLE[tier] ?? TIER_STYLE.basic;
  return (
    <span
      className={[
        "inline-flex h-[26px] items-center gap-1.5 rounded-full px-[11px] text-[11.5px] font-bold uppercase tracking-[0.04em]",
        style.className,
      ].join(" ")}
    >
      {style.label}
    </span>
  );
}
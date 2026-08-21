import type { CreatorTier } from "@/types/account";

interface TierBadgeProps {
  tier: CreatorTier;
}

/** Basic = purple badge, Pro = gold badge (docs/01_SPEC.md §4). */
export function TierBadge({ tier }: TierBadgeProps) {
  const isPro = tier === "pro";
  return (
    <span
      className={[
        "inline-flex h-[26px] items-center gap-1.5 rounded-full px-[11px] text-[11.5px] font-bold uppercase tracking-[0.04em]",
        isPro
          ? "border border-warning bg-warning-tint text-brand-yellow"
          : "border border-accent bg-accent-tint text-accent-hover",
      ].join(" ")}
    >
      {isPro ? "Pro" : "Basic"}
    </span>
  );
}
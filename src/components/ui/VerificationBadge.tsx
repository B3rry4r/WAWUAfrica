import { Check, BadgeCheck, ShieldCheck } from "lucide-react";
import type { VerificationLevel } from "@/types/account";

interface VerificationBadgeProps {
  tier: VerificationLevel;
  size?: number;
}

const colorByTier: Record<VerificationLevel, string> = {
  basic: "var(--text-disabled)",
  verified_user: "var(--info)",
  verified_business: "var(--success)",
  certified_professional: "var(--accent)",
  trusted_partner: "var(--brand-yellow)",
};

/**
 * Small credibility badge, separate from creator KYC and from paid tier
 * (docs/01_SPEC.md §6). `basic` renders nothing — no badge to show.
 */
export function VerificationBadge({ tier, size = 16 }: VerificationBadgeProps) {
  if (tier === "basic") return null;
  const color = colorByTier[tier];
  const Icon = tier === "trusted_partner" ? ShieldCheck : tier === "certified_professional" ? BadgeCheck : Check;
  return (
    <span
      className="inline-grid shrink-0 place-items-center rounded-full"
      style={{ width: size, height: size, color, background: "color-mix(in srgb, currentColor 12%, transparent)" }}
      title={tier.replaceAll("_", " ")}
      aria-label={`${tier.replaceAll("_", " ")} verified`}
    >
      <Icon width={size * 0.62} height={size * 0.62} strokeWidth={2.6} />
    </span>
  );
}
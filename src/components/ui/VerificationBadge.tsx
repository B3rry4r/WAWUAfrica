import { Check, BadgeCheck, ShieldCheck } from "lucide-react";
import type { VerificationLevel } from "@/types/account";

interface VerificationBadgeProps {
  tier: VerificationLevel;
  size?: number;
}

const colorClass: Record<VerificationLevel, string> = {
  basic: "text-text-disabled",
  verified_user: "text-info",
  verified_business: "text-success",
  certified_professional: "text-accent",
  trusted_partner: "text-brand-yellow",
};

/**
 * Small credibility badge, separate from creator KYC and from paid tier
 * (docs/01_SPEC.md §6). `basic` renders nothing — no badge to show.
 */
export function VerificationBadge({ tier, size = 16 }: VerificationBadgeProps) {
  if (tier === "basic") return null;
  const Icon = tier === "trusted_partner" ? ShieldCheck : tier === "certified_professional" ? BadgeCheck : Check;
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full ${colorClass[tier]} bg-[color-mix(in_srgb,currentColor_12%,transparent)]`}
      // Runtime pixel geometry from a numeric prop — Tailwind's JIT cannot see
      // `w-[${size}px]` as a class name, so this is the one legitimate use of
      // an inline style. CLAUDE.md's rule is about tokens (colour, spacing,
      // radius), all of which are still classes above.
      style={{ width: size, height: size }}
      title={tier.replaceAll("_", " ")}
      aria-label={`${tier.replaceAll("_", " ")} verified`}
    >
      <Icon width={size * 0.62} height={size * 0.62} strokeWidth={2.6} />
    </span>
  );
}
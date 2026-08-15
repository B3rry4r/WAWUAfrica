import type { CreatorTier } from "@/types/account";
import type { VerificationLevel } from "@/types/account";
import { Icon } from "./Icon";

export interface TierBadgeProps {
  tier: CreatorTier;
}

export function TierBadge({ tier }: TierBadgeProps) {
  const pro = tier === "pro";
  return (
    <span
      className="inline-flex items-center gap-[5px] h-[26px] py-0 px-[11px] rounded-[999] text-[11.5px] font-bold tracking-[0.04em] uppercase leading-[1] whitespace-nowrap" style={{background: pro ? "var(--accent-tint)" : "var(--surface-tag)", border: pro ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)", color: pro ? "var(--accent)" : "var(--text-secondary)"}}
    >
      {pro ? <Icon name="Crown" size={12} stroke={2.2} color="var(--accent)" /> : null}
      {tier}
    </span>
  );
}

const verifyLabels: Record<VerificationLevel, string> = {
  basic: "Unverified",
  verified_user: "Verified",
  verified_business: "Business",
  certified_professional: "Professional",
  trusted_partner: "Trusted partner",
};

const verifyColors: Record<Exclude<VerificationLevel, "basic">, string> = {
  verified_user: "var(--info)",
  verified_business: "var(--accent)",
  certified_professional: "var(--success)",
  trusted_partner: "var(--warning)",
};

export interface VerificationBadgeProps {
  level: VerificationLevel;
}

export function VerificationBadge({ level }: VerificationBadgeProps) {
  if (level === "basic") return null;
  return (
    <span
      className="inline-flex items-center gap-[5px] h-[24px] py-0 px-[10px] rounded-[999] bg-[var(--surface-tag)] border border-[var(--border-hairline)] text-[11px] font-bold leading-[1] whitespace-nowrap" style={{color: verifyColors[level]}}
    >
      <Icon name="ShieldCheck" size={12} stroke={2.4} color={verifyColors[level]} />
      {verifyLabels[level]}
    </span>
  );
}

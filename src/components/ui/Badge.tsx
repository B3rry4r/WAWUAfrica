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
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: 26,
        padding: "0 11px",
        borderRadius: 999,
        background: pro ? "var(--accent-tint)" : "var(--surface-tag)",
        border: pro ? "1px solid var(--border-accent)" : "1px solid var(--border-hairline)",
        color: pro ? "var(--accent)" : "var(--text-secondary)",
        fontSize: 11.5,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
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
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        height: 24,
        padding: "0 10px",
        borderRadius: 999,
        background: "var(--surface-tag)",
        border: "1px solid var(--border-hairline)",
        color: verifyColors[level],
        fontSize: 11,
        fontWeight: 700,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
    >
      <Icon name="ShieldCheck" size={12} stroke={2.4} color={verifyColors[level]} />
      {verifyLabels[level]}
    </span>
  );
}

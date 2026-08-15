import type { VerificationLevel, CreatorTier } from "@/types/account";
import { Avatar } from "./Avatar";
import { VerificationBadge } from "./Badge";
import { TierBadge } from "./Badge";
import { Button } from "./Button";
import { Icon } from "./Icon";

export interface ProfileStat {
  value: string;
  label: string;
}

export interface ProfileHeaderProps {
  name: string;
  handle?: string;
  bio?: string;
  avatarSrc?: string;
  /** Profile credibility level (the design file calls this prop "tier"). */
  tier?: VerificationLevel;
  plan?: CreatorTier;
  stats?: ProfileStat[];
  primaryAction?: string;
  onPrimary?: () => void;
  onShare?: () => void;
}

export function ProfileHeader({
  name,
  handle,
  bio,
  avatarSrc,
  tier = "basic",
  plan,
  stats = [],
  primaryAction,
  onPrimary,
  onShare,
}: ProfileHeaderProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "18px 20px 0" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
        <Avatar src={avatarSrc} initials={name.slice(0, 1).toUpperCase()} size={68} border />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h1
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--text-primary)",
              }}
            >
              {name}
            </h1>
            <VerificationBadge level={tier} />
            {plan ? <TierBadge tier={plan} /> : null}
          </div>
          {handle ? (
            <span style={{ fontSize: 13.5, color: "var(--text-muted)" }}>@{handle}</span>
          ) : null}
        </div>
      </div>

      {bio ? (
        <p style={{ margin: 0, fontSize: 14, lineHeight: 1.55, color: "var(--text-secondary)" }}>{bio}</p>
      ) : null}

      {stats.length > 0 ? (
        <div style={{ display: "flex", gap: 24 }}>
          {stats.map((s) => (
            <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <span
                style={{
                  fontSize: 16.5,
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  fontFeatureSettings: "var(--font-feature-tabular)",
                }}
              >
                {s.value}
              </span>
              <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{s.label}</span>
            </div>
          ))}
        </div>
      ) : null}

      {primaryAction ? (
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1, display: "flex" }}>
            <Button full variant="secondary" onClick={onPrimary} style={{ height: 48 }}>
              {primaryAction}
            </Button>
          </div>
          <div style={{ width: 48, display: "flex", flexShrink: 0 }}>
            <Button
              full
              variant="secondary"
              aria-label="Share"
              onClick={onShare}
              style={{ height: 48, padding: 0 }}
            >
              <Icon name="Share2" size={18} stroke={2} />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

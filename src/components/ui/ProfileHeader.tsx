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
    <div className="flex flex-col gap-[14px] pt-[18px] px-[20px] pb-0">
      <div className="flex items-start gap-[14px]">
        <Avatar src={avatarSrc} initials={name.slice(0, 1).toUpperCase()} size={68} border />
        <div className="flex-1 min-w-0 flex flex-col gap-[4px]">
          <div className="flex items-center gap-[8px] flex-wrap">
            <h1
              className="m-0 text-[20px] font-bold tracking-[-0.02em] text-[var(--text-primary)]"
            >
              {name}
            </h1>
            <VerificationBadge level={tier} />
            {plan ? <TierBadge tier={plan} /> : null}
          </div>
          {handle ? (
            <span className="text-[13.5px] text-[var(--text-muted)]">@{handle}</span>
          ) : null}
        </div>
      </div>

      {bio ? (
        <p className="m-0 text-[14px] leading-[1.55] text-[var(--text-secondary)]">{bio}</p>
      ) : null}

      {stats.length > 0 ? (
        <div className="flex gap-[24px]">
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col gap-[2px]">
              <span
                className="text-[16.5px] font-bold text-[var(--text-primary)]" style={{fontFeatureSettings: "var(--font-feature-tabular)"}}
              >
                {s.value}
              </span>
              <span className="text-[12px] text-[var(--text-muted)]">{s.label}</span>
            </div>
          ))}
        </div>
      ) : null}

      {primaryAction ? (
        <div className="flex gap-[8px]">
          <div className="flex-1 flex">
            <Button full variant="secondary" onClick={onPrimary} className="h-[48px]">
              {primaryAction}
            </Button>
          </div>
          <div className="w-[48px] flex shrink-0">
            <Button
              full
              variant="secondary"
              aria-label="Share"
              onClick={onShare}
              className="h-[48px] p-0"
            >
              <Icon name="Share2" size={18} stroke={2} />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

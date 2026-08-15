"use client";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { TierBadge } from "./TierBadge";
import { VerificationBadge } from "./VerificationBadge";
import { cn } from "@/lib/cn";
import type { CreatorTier, VerificationLevel } from "@/types/account";

export interface ProfileStat {
  label: string;
  value: string;
}

/**
 * Shared by the fan-facing creator profile and the user's own profile.
 * `tier` is the paid subscription (purple Basic / gold Pro), null for non-creators.
 * `verification` is the separate credibility ladder. Two different systems —
 * never collapse them.
 */
export function ProfileHeader({
  name,
  handle,
  bio,
  avatarUrl,
  coverUrl,
  verification = "basic",
  tier = null,
  stats = [],
  primaryLabel,
  onPrimary,
  onMessage,
  onShare,
  following = false,
  className,
}: {
  name: string;
  handle?: string;
  bio?: string;
  avatarUrl?: string | null;
  coverUrl?: string | null;
  verification?: VerificationLevel;
  tier?: CreatorTier | null;
  stats?: ProfileStat[];
  primaryLabel?: string;
  onPrimary?: () => void;
  onMessage?: () => void;
  onShare?: () => void;
  following?: boolean;
  className?: string;
}) {
  return (
    <header className={cn("border-b border-[var(--border-hairline)] bg-[var(--surface-card)]", className)}>
      <div className="relative h-[132px] bg-gradient-to-br from-[var(--accent-deep)] to-[var(--accent)]">
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--surface-page)]/90 to-transparent" />
      </div>

      <div className="relative -mt-[38px] px-[18px] pb-[18px]">
        <Avatar initial={(name || "?")[0]} size={84} />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="text-[21px] font-bold leading-[var(--leading-tight)] text-[var(--text-primary)]">
            {name}
          </h1>
          <VerificationBadge tier={verification} />
          {tier && <TierBadge tier={tier} />}
        </div>

        {handle && <p className="mt-0.5 text-[13px] text-[var(--text-muted)]">@{handle}</p>}
        {bio && (
          <p className="mt-2 text-[14px] leading-[var(--leading-body)] text-[var(--text-secondary)]">{bio}</p>
        )}

        {stats.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1">
            {stats.map((s) => (
              <span key={s.label} className="text-[13px] text-[var(--text-secondary)]">
                <strong className="font-semibold text-[var(--text-primary)] [font-variant-numeric:tabular-nums]">
                  {s.value}
                </strong>{" "}
                {s.label}
              </span>
            ))}
          </div>
        )}

        {(primaryLabel || onMessage || onShare) && (
          <div className="mt-4 flex items-center gap-2">
            {primaryLabel && (
              <Button variant={following ? "secondary" : "primary"} onClick={onPrimary} className="flex-1">
                {primaryLabel}
              </Button>
            )}
            {onMessage && (
              <Button variant="secondary" onClick={onMessage} aria-label="Message">
                <Icon name="MessageCircle" size={17}  />
              </Button>
            )}
            {onShare && (
              <Button variant="ghost" onClick={onShare} aria-label="Share">
                <Icon name="Share2" size={17}  />
              </Button>
            )}
          </div>
        )}
      </div>
    </header>
  );
}

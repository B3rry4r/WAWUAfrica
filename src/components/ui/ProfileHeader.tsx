"use client";
import { Avatar } from "./Avatar";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { VerificationBadge } from "./VerificationBadge";
import { cn } from "@/lib/cn";
import type { VerificationLevel } from "@/types/account";

export interface ProfileStat {
  label: string;
  value: string;
}

/**
 * Shared by the fan-facing creator profile and the user's own profile.
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
          // Absolutely positioned, not a plain in-flow block: a positioned
          // sibling (the scrim below) always paints after non-positioned
          // in-flow content regardless of DOM order, so a plain <img> here
          // would be permanently hidden under the scrim no matter which one
          // comes first in markup.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        {/*
          Not `from-[var(--surface-page)]/90`: Tailwind can only apply an
          opacity modifier to an arbitrary color when the token itself is
          raw RGB channels, and this one is a hex string. That combination
          silently fails to generate a utility at all, so `--tw-gradient-from`
          / `-to` were left unset here and this div was inheriting them from
          the cover's own `bg-gradient-to-br` sibling above, which just
          repainted the container's gradient over the photo instead of the
          intended fade. `color-mix` resolves the alpha without touching
          Tailwind's opacity-modifier machinery.
        */}
        <div className="absolute inset-0 bg-gradient-to-t from-[color-mix(in_srgb,var(--surface-page)_90%,transparent)] to-transparent" />
      </div>

      <div className="relative -mt-[38px] px-[18px] pb-[18px]">
        <Avatar
          src={avatarUrl}
          initial={(name || "?")[0]}
          size={84}
          className="ring-4 ring-[var(--surface-card)]"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="text-[21px] font-bold leading-[var(--leading-tight)] text-[var(--text-primary)]">
            {name}
          </h1>
          <VerificationBadge tier={verification} />
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

"use client";

import type { ReactNode } from "react";
import { PLANS } from "@/types/subscription";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { CreatorProfile, ProfileTab } from "@/types/profile";
import { getCreatorProfile, isFollowing, toggleFollowProfile } from "@/lib/api/profile";
import { ProfileHeader } from "@/components/ui/ProfileHeader";
import { Avatar } from "@/components/ui/Avatar";
import { CommunityImage } from "@/components/ui/CommunityImage";
import { PriceChip } from "@/components/ui/PriceChip";
import { StatusPill } from "@/components/ui/StatusPill";
import { StatBlock } from "@/components/ui/StatBlock";
import { TierBadge } from "@/components/ui/TierBadge";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { SocialIcon, type SocialName } from "@/components/ui/SocialIcon";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";
import { FollowButton } from "@/components/shared/FollowButton";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { ProfileActions } from "@/components/profile/ProfileActions";
import { CompactHeaderActions } from "@/components/profile/CompactHeaderActions";
import { DesktopProfileActions } from "@/components/profile/DesktopProfileActions";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { CommunityJoinButton } from "@/components/profile/CommunityJoinButton";
import { ShareButton } from "@/components/profile/ShareButton";
import { formatNaira } from "@/lib/format";
import { ContentThumb } from "@/components/ui/ContentThumb";

const VALID_TABS: ProfileTab[] = ["content", "community", "about"];

/**
 * Server Component here always 401'd (no session token exists during SSR)
 * and, after profile.ts's real-failure fix (no more catch-and-return-mock),
 * that surfaced as a scary thrown error instead of the signed-in viewer's
 * real view of this creator. Client Component + useEffect fetch, same
 * pattern as content/[id]/page.tsx and communities/page.tsx. useSearchParams
 * needs a Suspense boundary, hence the wrapper below.
 */
export default function FanProfilePage() {
  return (
    <Suspense>
      <FanProfilePageContent />
    </Suspense>
  );
}

function FanProfilePageContent() {
  const params = useParams<{ wawuId: string }>();
  const wawuId = String(params?.wawuId ?? "");
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const tab: ProfileTab = VALID_TABS.includes(tabParam as ProfileTab) ? (tabParam as ProfileTab) : "content";

  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [following, setFollowing] = useState(false);
  // The mobile profile's Follow button had no handler at all — the default
  // mobile view could not follow anyone.
  const [followBusy, setFollowBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleFollow = useCallback(async () => {
    if (followBusy) return;
    setFollowBusy(true);
    const previous = following;
    setFollowing(!previous);
    try {
      setFollowing(await toggleFollowProfile(wawuId));
    } catch {
      setFollowing(previous);
    } finally {
      setFollowBusy(false);
    }
  }, [wawuId, following, followBusy]);

  const load = useCallback(() => {
    let active = true;
    setError(null);
    setProfile(null);
    Promise.all([getCreatorProfile(wawuId), isFollowing(wawuId)])
      .then(([p, f]) => {
        if (!active) return;
        setProfile(p);
        setFollowing(f);
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "This profile doesn't exist or was removed.");
      });
    return () => {
      active = false;
    };
  }, [wawuId]);

  useEffect(load, [load]);

  if (error) {
    return (
      <div className="p-4">
        <ErrorState title="Creator not found" body={error} onRetry={load} />
      </div>
    );
  }

  if (!profile) {
    return <ProfileSkeleton />;
  }

  const isDeepTab = tab === "about";

  return (
    <div className="flex min-h-dvh flex-col xl:min-h-0 xl:flex-1 xl:overflow-hidden">
      {/* Mobile chrome — unchanged, hidden at xl where the wide identity row below takes over. */}
      <div className="xl:hidden">
        {isDeepTab ? (
          <CompactHeader profile={profile} following={following} onToggleFollow={toggleFollow} />
        ) : (
          <FullHeader profile={profile} following={following} onToggleFollow={toggleFollow} />
        )}
      </div>
      {/* Desktop chrome (design D16) — cover + one wide identity row on every tab, not just Content. */}
      <DesktopIdentity profile={profile} following={following} onToggleFollow={toggleFollow} />

      <ProfileTabs wawuId={wawuId} active={tab} compact={isDeepTab} />

      <div className="flex flex-1 flex-col px-4 pb-24 pt-3 xl:hidden">
        <TabBody profile={profile} tab={tab} following={following} />
      </div>

      <div className="hidden xl:flex xl:min-h-0 xl:flex-1 xl:gap-[26px] xl:overflow-y-auto xl:px-[26px] xl:pb-[26px] xl:pt-5">
        <div className="xl:min-w-0 xl:flex-1">
          <TabBody profile={profile} tab={tab} following={following} />
        </div>
        <DesktopRail profile={profile} />
      </div>
    </div>
  );
}

/**
 * Design D16's wide identity row: cover, avatar overlapping it, name/badges/
 * meta on one line, and the three paid actions (Follow, Ask, Tip) grouped
 * top-right — where a desktop reader looks for them, instead of stacked
 * under the header the way mobile's ProfileActions lays them out. Shown on
 * every tab (D16 doesn't collapse to a compact bar on desktop — that's a
 * mobile-scroll-driven affordance the wide rail doesn't need).
 */
function DesktopIdentity({ profile, following, onToggleFollow }: { profile: CreatorProfile; following: boolean; onToggleFollow: () => void }) {
  const metaParts = [profile.categories[0], profile.location, profile.replyTime].filter(Boolean) as string[];
  return (
    <div className="hidden xl:block">
      <div className="h-[180px] shrink-0 bg-[linear-gradient(160deg,var(--accent-deep),var(--surface-elevated))]" />
      <div className="-mt-[66px] flex items-end gap-5 border-b border-hairline px-[26px] pb-5">
        <div className="overflow-hidden rounded-full border-[3px] border-page">
          <Avatar initial={profile.name.charAt(0)} size={96} />
        </div>
        <div className="flex min-w-0 flex-1 items-end justify-between gap-5 pb-1.5">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex items-center gap-[9px]">
              <span className="text-[26px] font-bold tracking-[-0.025em] text-text-primary">{profile.name}</span>
              <VerificationBadge tier={profile.verification} size={20} />
              <TierBadge tier={profile.plan} />
            </div>
            {metaParts.length > 0 && <span className="text-[14px] text-text-secondary">{metaParts.join(" · ")}</span>}
          </div>
          <DesktopProfileActions
            creator={{ wawuId: profile.wawuId, name: profile.name, handle: profile.handle, dmPrice: profile.dmPrice, dmResponseHours: profile.dmResponseHours, verification: profile.verification }}
            dmEnabled={profile.dmEnabled}
            following={following}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Right rail (~360px, design D16): stats + about move here from the mobile
 * stack. D16's rail also carries a "Trust" card built on TrustMeter — that
 * component (and the trust-points model behind it: course completion +50,
 * fraud -200, tiers earned by points) is exactly what docs/04_DESIGN_SYSTEM.md
 * flags as a removed, out-of-scope system carried over stale from the old
 * repo ("Trust Score points... Not in scope. We use the verification ladder
 * + EVG-lite" — TrustMeter is explicitly on that file's do-not-port list).
 * This app already has no Trust-points concept anywhere in its types or
 * mocks; EVG is the real, current stat and it's already in the Stats card
 * below. Left out rather than silently reintroducing the banned system —
 * see PR notes.
 */
function DesktopRail({ profile }: { profile: CreatorProfile }) {
  return (
    <aside className="hidden w-[360px] shrink-0 flex-col gap-4 pt-5 xl:flex">
      <div className="flex gap-5 rounded-[var(--radius-card)] border border-hairline bg-card p-5">
        <StatBlock value={profile.stats.followers} label="Followers" align="start" size="sm" />
        <StatBlock value={String(profile.stats.pieces)} label={profile.stats.piecesLabel} align="start" size="sm" />
        <StatBlock value={profile.stats.evg.toLocaleString("en-NG")} label="EVG" align="start" size="sm" />
      </div>
      <div className="flex flex-col gap-[11px] rounded-[var(--radius-card)] border border-hairline bg-card p-5">
        <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">About</span>
        {profile.bio && <p className="m-0 text-[13.5px] leading-[1.55] text-text-secondary">{profile.bio}</p>}
        <div className="flex flex-col gap-2">
          {profile.location && <InfoRow icon="MapPin" text={profile.location} />}
          {profile.memberSince && <InfoRow icon="Calendar" text={`On WAWU since ${profile.memberSince}`} />}
          {profile.replyTime && <InfoRow icon="Clock" text={profile.replyTime} />}
        </div>
      </div>
    </aside>
  );
}

function FullHeader({ profile, following, onToggleFollow }: { profile: CreatorProfile; following: boolean; onToggleFollow: () => void }) {
  return (
    <div className="relative">
      <ProfileBackButton />
      <ProfileHeader
        name={profile.name}
        handle={profile.handle}
        bio={profile.bio}
        avatarUrl={profile.avatarUrl}
        coverUrl={profile.coverUrl}
        verification={profile.verification}
        tier={profile.plan}
        stats={[
          { value: profile.stats.followers, label: "Followers" },
          { value: String(profile.stats.pieces), label: profile.stats.piecesLabel },
          { value: profile.stats.evg.toLocaleString("en-NG"), label: "EVG" },
        ]}
        primaryLabel={following ? "Following" : "Follow"}
        following={following}
        onPrimary={onToggleFollow}
      />
      <ProfileActions
        creator={{ wawuId: profile.wawuId, name: profile.name, handle: profile.handle, dmPrice: profile.dmPrice, dmResponseHours: profile.dmResponseHours, verification: profile.verification }}
        dmEnabled={profile.dmEnabled}
      />
    </div>
  );
}

/** Collapsed sticky bar — the About tab keeps Follow, Message, Tip reachable. */
function CompactHeader({ profile, following, onToggleFollow }: { profile: CreatorProfile; following: boolean; onToggleFollow: () => void }) {
  return (
    <div
      className={[
        "sticky top-0 z-30 flex items-center gap-[10px] border-b border-hairline px-[14px] py-3",
        "bg-[rgba(19,19,22,0.86)] [backdrop-filter:var(--blur-chrome)]",
      ].join(" ")}
    >
      <ProfileBackButton compact />
      <Avatar src={profile.avatarUrl} initial={profile.name.charAt(0)} size={34} />
      <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-text-primary">
        {profile.name}
      </span>
      <div className="flex shrink-0 items-center gap-[7px]">
        <FollowButton wawuId={profile.wawuId} initial={following} size="sm" />
        <CompactHeaderActions
          creator={{ wawuId: profile.wawuId, name: profile.name, handle: profile.handle, dmPrice: profile.dmPrice, dmResponseHours: profile.dmResponseHours, verification: profile.verification }}
          dmEnabled={profile.dmEnabled}
        />
      </div>
    </div>
  );
}

function TabBody({ profile, tab, following }: { profile: CreatorProfile; tab: ProfileTab; following: boolean }) {
  switch (tab) {
    case "community":
      return <CommunityTab profile={profile} />;
    case "about":
      return <AboutTab profile={profile} />;
    default:
      return <ContentTab profile={profile} />;
  }
}

/* ---------------- Content ---------------- */

function ContentTab({ profile }: { profile: CreatorProfile }) {
  if (profile.content.length === 0) {
    return (
      <EmptyState
        icon="ImagePlus"
        title="Nothing published yet"
        caption={`Follow ${profile.name.split(" ")[0]} and their first piece reaches you when it lands.`}
        action="Find similar creators"
        actionHref="/explore/creators"
      />
    );
  }
  return (
    <div className="flex flex-col gap-[10px] xl:grid xl:grid-cols-3 xl:gap-[18px]">
      {profile.content.map((item) => (
        <ContentRow key={item.id} item={item} />
      ))}
    </div>
  );
}

/**
 * Mobile: a horizontal row (thumb, title/subtitle, price trailing). Desktop
 * (design D16, 3-across grid): the same data becomes a vertical card — wide
 * 16:9 media on top with the price/status chip overlaid, title and subtitle
 * below. One component, `xl:` classes reflow it into the other shape rather
 * than forking a second content-card component for the grid.
 */
function ContentRow({ item }: { item: CreatorProfile["content"][number] }) {
  const priceNode =
    item.status === "pending" ? (
      <StatusPill kind="warning">In review</StatusPill>
    ) : (
      <PriceChip amount={item.price} label="PPV" free={item.price === 0} tone="plain" size="sm" />
    );
  return (
    // Was a plain div: a creator's content could be seen but never opened or
    // bought from their profile.
    <Link
      href={`/content/${item.id}`}
      className="flex h-[82px] shrink-0 items-center gap-[13px] rounded-[var(--radius-card)] border border-hairline bg-card px-[14px] no-underline transition-colors hover:border-strong xl:h-auto xl:flex-col xl:items-stretch xl:gap-0 xl:overflow-hidden xl:px-0">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[12px] border border-hairline xl:aspect-video xl:h-auto xl:w-full xl:rounded-none xl:border-0 xl:border-b xl:border-hairline">
        {/* The creator's cover. A profile full of identical hatching told a
            visitor nothing about what the person actually makes. */}
        <ContentThumb
          src={item.previewAssetUrl}
          alt=""
          locked={item.locked}
          rounded="0"
          className="absolute inset-0 h-full w-full !border-0"
        />
        <span className="absolute right-2.5 top-2.5 hidden xl:flex">{priceNode}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1 xl:flex-none xl:gap-1.5 xl:px-[14px] xl:pb-[14px] xl:pt-3">
        <span className="truncate text-[15px] font-semibold text-text-primary">
          {item.title}
        </span>
        <span className="truncate text-[12.5px] text-text-muted">
          {item.kindLabel}
        </span>
      </div>
      <div className="flex shrink-0 xl:hidden">{priceNode}</div>
    </Link>
  );
}

/* ---------------- Community ---------------- */

function CommunityTab({ profile }: { profile: CreatorProfile }) {
  return (
    <div className="flex flex-col gap-3">
      {profile.communities.map((c) => (
        <CommunityRow key={c.id} profile={profile} community={c} />
      ))}
      <div className="flex items-start gap-[10px] rounded-[var(--radius-input)] border border-hairline bg-card px-[14px] py-[13px]">
        <Icon name="Ticket" size={15} color="var(--text-muted)" strokeWidth={2} className="mt-px" />
        <span className="flex-1 text-[12.5px] leading-[1.5] text-text-secondary">
          Reading costs nothing. Sending a message in an open community costs 1 credit.
        </span>
      </div>
    </div>
  );
}

function CommunityRow({ profile, community }: { profile: CreatorProfile; community: CreatorProfile["communities"][number] }) {
  const privateC = community.kind === "private";
  return (
    <div
      className={[
        "flex gap-[14px] rounded-[var(--radius-card)] border bg-card p-[14px]",
        privateC ? "border-[var(--border-decor)]" : "border-hairline",
      ].join(" ")}
    >
      {/* The room's picture where there is one; the striped tile stays as
          the fallback for the many rooms that have none. */}
      <CommunityImage
        src={community.imageUrl}
        icon={privateC ? "Lock" : "Users"}
        iconSize={19}
        className={[
          "h-[46px] w-[46px] rounded-[14px] border",
          privateC
            ? "border-[var(--border-selected)] bg-[var(--selected-tint)]"
            : "border-hairline [background-image:repeating-linear-gradient(135deg,var(--surface-tag)_0_12px,var(--surface-card)_12px_24px)]",
        ].join(" ")}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-[5px]">
        <span className="text-[15px] font-semibold text-text-primary">{community.name}</span>
        <span className="text-[12.5px] text-text-muted [font-feature-settings:var(--font-feature-tabular)]">
          {community.memberCount.toLocaleString("en-NG")} members · {community.kind}
        </span>
      </div>
      <CommunityJoinButton wawuId={profile.wawuId} communityId={community.id} initial={community.joined} kind={community.kind} />
    </div>
  );
}


/* ---------------- About ---------------- */

function AboutTab({ profile }: { profile: CreatorProfile }) {
  return (
    <div className="flex flex-col gap-[18px]">
      {profile.bio && <p className="m-0 text-[14.5px] leading-[1.6] text-text-secondary [text-wrap:pretty]">{profile.bio}</p>}

      {profile.categories.length > 0 && (
        <div className="flex flex-col gap-[10px]">
          <SectionLabel>Works in</SectionLabel>
          <div className="flex flex-wrap gap-2">
            {profile.categories.map((c) => (
              <span key={c} className="inline-flex h-8 items-center rounded-full border border-hairline bg-tag px-[13px] text-[12.5px] font-medium text-text-secondary">
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {(profile.location || profile.memberSince || profile.replyTime) && (
        <div className="flex flex-col gap-[11px] rounded-[var(--radius-card)] border border-hairline bg-card p-4">
          {profile.location && <InfoRow icon="MapPin" text={profile.location} />}
          {profile.memberSince && <InfoRow icon="Calendar" text={`On WAWU since ${profile.memberSince}`} />}
          {profile.replyTime && <InfoRow icon="Clock" text={profile.replyTime} />}
        </div>
      )}

      <div className="flex flex-col gap-[10px]">
        <SectionLabel>Verified as</SectionLabel>
        <div className="flex flex-col gap-[9px] rounded-[var(--radius-card)] border border-hairline bg-card px-4 py-[15px]">
          <BadgeRow icon={<Icon name="Award" size={18} color="var(--accent)" strokeWidth={2.2} />} text={VERIFY_LABELS[profile.verification]} />
          <BadgeRow icon={<Icon name="Crown" size={18} color="var(--brand-yellow)" strokeWidth={2.2} />} text={`${PLANS[profile.plan].name} creator`} />
        </div>
      </div>

      {Object.values(profile.socials).some(Boolean) && (
        <div className="flex flex-col gap-[10px]">
          <SectionLabel>Elsewhere</SectionLabel>
          {/*
            These were spans, so a profile listed where someone could be found
            and then gave you no way to go there. They are links now, opened in
            a new tab, with rel=noopener since they point off-platform.
          */}
          <div className="flex flex-nowrap gap-[10px] overflow-x-auto">
            {socialLinks(profile.socials).map((s) => (
              <SocialPill key={s.label} icon={s.icon} label={s.label} href={s.href} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

const VERIFY_LABELS: Record<string, string> = {
  basic: "Basic profile",
  verified_user: "Verified user",
  verified_business: "Verified business",
  certified_professional: "Certified professional",
  trusted_partner: "Trusted partner",
};

function SectionLabel({ children }: { children: string }) {
  return <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">{children}</span>;
}

function InfoRow({ icon, text }: { icon: IconName; text: string }) {
  return (
    <div className="flex items-center gap-[11px]">
      <Icon name={icon} size={15} color="var(--text-muted)" strokeWidth={2} />
      <span className="flex-1 text-[13.5px] text-text-secondary">{text}</span>
    </div>
  );
}

function BadgeRow({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-[11px]">
      {icon}
      <span className="flex-1 text-[13.5px] text-text-secondary">{text}</span>
    </div>
  );
}

/**
 * Turns stored handles into reachable links. Handles are stored bare, so the
 * platform prefix is added here; the link fields are already full URLs and are
 * used as given. A handle someone typed with a leading "@" still works.
 */
function socialLinks(socials: CreatorProfile["socials"]): { icon: SocialName; label: string; href: string }[] {
  const handle = (v: string) => v.trim().replace(/^@/, "");
  const url = (v: string) => (/^https?:\/\//i.test(v.trim()) ? v.trim() : `https://${v.trim()}`);
  const out: { icon: SocialName; label: string; href: string }[] = [];
  if (socials.instagram) out.push({ icon: "instagram", label: "Instagram", href: `https://instagram.com/${handle(socials.instagram)}` });
  if (socials.x) out.push({ icon: "x", label: "X", href: `https://x.com/${handle(socials.x)}` });
  if (socials.tiktok) out.push({ icon: "tiktok", label: "TikTok", href: `https://tiktok.com/@${handle(socials.tiktok)}` });
  if (socials.youtube) out.push({ icon: "youtube", label: "YouTube", href: url(socials.youtube) });
  if (socials.facebook) out.push({ icon: "facebook", label: "Facebook", href: url(socials.facebook) });
  if (socials.linkedin) out.push({ icon: "linkedin", label: "LinkedIn", href: url(socials.linkedin) });
  if (socials.whatsapp) out.push({ icon: "whatsapp", label: "WhatsApp", href: `https://wa.me/${socials.whatsapp.replace(/\D/g, "")}` });
  if (socials.website) out.push({ icon: "website", label: "Website", href: url(socials.website) });
  return out;
}

function SocialPill({ icon, label, href }: { icon: SocialName; label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-10 items-center gap-2 rounded-full border border-hairline bg-tag px-[14px] text-[13px] font-semibold text-text-secondary no-underline transition-colors hover:border-strong hover:text-text-primary"
    >
      <SocialIcon name={icon} size={15} brand />
      {label}
    </a>
  );
}

/* ---------------- Loading ---------------- */

function ProfileSkeleton() {
  return (
    <div className="flex min-h-dvh flex-col xl:min-h-0 xl:flex-1 xl:overflow-hidden">
      <div className="flex flex-col gap-4 px-4 pb-6 pt-4 xl:hidden">
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" className="h-9 w-9 shrink-0" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" className="h-[72px] w-[72px] shrink-0" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-[18px] w-[55%] rounded" />
            <Skeleton className="h-[13px] w-[35%] rounded" />
          </div>
        </div>
        <Skeleton className="h-[14px] w-full rounded" />
        <Skeleton className="h-[14px] w-[80%] rounded" />
        <div className="flex gap-5">
          <Skeleton className="h-[38px] w-[64px] rounded" />
          <Skeleton className="h-[38px] w-[64px] rounded" />
          <Skeleton className="h-[38px] w-[64px] rounded" />
        </div>
        <Skeleton className="h-11 w-full rounded-button" />
      </div>
      <div className="hidden xl:block">
        <Skeleton className="h-[180px] w-full rounded-none" />
        <div className="-mt-[66px] flex items-end gap-5 border-b border-hairline px-[26px] pb-5">
          <Skeleton variant="circle" className="h-[96px] w-[96px] shrink-0 border-[3px] border-page" />
          <div className="flex min-w-0 flex-1 flex-col gap-2 pb-1.5">
            <Skeleton className="h-[22px] w-[220px] rounded" />
            <Skeleton className="h-[14px] w-[160px] rounded" />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-3 px-4 py-4 xl:hidden">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} variant="row" className="h-[82px]" />
        ))}
      </div>
    </div>
  );
}

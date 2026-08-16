"use client";

import type { ReactNode } from "react";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import type { CreatorProfile, ProfileTab } from "@/types/profile";
import { getCreatorProfile, isFollowing } from "@/lib/api/profile";
import { ProfileHeader } from "@/components/ui/ProfileHeader";
import { Avatar } from "@/components/ui/Avatar";
import { PriceChip } from "@/components/ui/PriceChip";
import { HandoffPill } from "@/components/ui/HandoffPill";
import { StatusPill } from "@/components/ui/StatusPill";
import { StatBlock } from "@/components/ui/StatBlock";
import { TierBadge } from "@/components/ui/TierBadge";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
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

const VALID_TABS: ProfileTab[] = ["content", "community", "shop", "about"];

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
  const [error, setError] = useState<string | null>(null);

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

  const isDeepTab = tab === "shop" || tab === "about";

  return (
    <div className="flex min-h-dvh flex-col xl:min-h-0 xl:flex-1 xl:overflow-hidden">
      {/* Mobile chrome — unchanged, hidden at xl where the wide identity row below takes over. */}
      <div className="xl:hidden">
        {isDeepTab ? (
          <CompactHeader profile={profile} following={following} />
        ) : (
          <FullHeader profile={profile} following={following} />
        )}
      </div>
      {/* Desktop chrome (design D16) — cover + one wide identity row on every tab, not just Content. */}
      <DesktopIdentity profile={profile} following={following} />

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
function DesktopIdentity({ profile, following }: { profile: CreatorProfile; following: boolean }) {
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
            creator={{ wawuId: profile.wawuId, name: profile.name, handle: profile.handle, dmPrice: profile.dmPrice }}
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

function FullHeader({ profile, following }: { profile: CreatorProfile; following: boolean }) {
  return (
    <div className="relative">
      <ProfileBackButton />
      <ProfileHeader
        name={profile.name}
        handle={profile.handle}
        bio={profile.bio}
        verification={profile.verification}
        tier={profile.plan}
        stats={[
          { value: profile.stats.followers, label: "Followers" },
          { value: String(profile.stats.pieces), label: profile.stats.piecesLabel },
          { value: profile.stats.evg.toLocaleString("en-NG"), label: "EVG" },
        ]}
        primaryLabel={following ? "Following" : "Follow"}
        following={following}
      />
      <ProfileActions
        creator={{ wawuId: profile.wawuId, name: profile.name, handle: profile.handle, dmPrice: profile.dmPrice }}
        dmEnabled={profile.dmEnabled}
      />
    </div>
  );
}

/** Collapsed sticky bar — Shop and About tabs keep Follow, Message, Tip reachable. */
function CompactHeader({ profile, following }: { profile: CreatorProfile; following: boolean }) {
  return (
    <div
      className={[
        "sticky top-0 z-30 flex items-center gap-[10px] border-b border-hairline px-[14px] py-3",
        "bg-[rgba(19,19,22,0.86)] [backdrop-filter:var(--blur-chrome)]",
      ].join(" ")}
    >
      <ProfileBackButton compact />
      <Avatar initial={profile.name.charAt(0)} size={34} />
      <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold text-text-primary">
        {profile.name}
      </span>
      <div className="flex shrink-0 items-center gap-[7px]">
        <FollowButton wawuId={profile.wawuId} initial={following} size="sm" />
        <CompactHeaderActions
          creator={{ wawuId: profile.wawuId, name: profile.name, handle: profile.handle, dmPrice: profile.dmPrice }}
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
    case "shop":
      return <ShopTab profile={profile} />;
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
    <div className="flex h-[82px] shrink-0 items-center gap-[13px] rounded-[var(--radius-card)] border border-hairline bg-card px-[14px] xl:h-auto xl:flex-col xl:items-stretch xl:gap-0 xl:overflow-hidden xl:px-0">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[12px] border border-hairline [background-image:repeating-linear-gradient(135deg,var(--surface-tag)_0_12px,var(--surface-card)_12px_24px)] xl:aspect-video xl:h-auto xl:w-full xl:rounded-none xl:border-0 xl:border-b xl:border-hairline">
        {item.locked && (
          <div className="absolute inset-0 grid place-items-center bg-[var(--locked-veil)]">
            <Icon name="Lock" size={15} color="#fff" strokeWidth={2.2} />
          </div>
        )}
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
    </div>
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
          Reading is free. Sending a message in an open community costs 1 credit.
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
        privateC ? "border-[var(--border-accent)]" : "border-hairline",
      ].join(" ")}
    >
      <span
        className={[
          "grid h-[46px] w-[46px] shrink-0 place-items-center rounded-[14px] border",
          privateC
            ? "border-[var(--border-accent)] bg-[var(--accent-tint)]"
            : "border-hairline [background-image:repeating-linear-gradient(135deg,var(--surface-tag)_0_12px,var(--surface-card)_12px_24px)]",
        ].join(" ")}
      >
        <Icon name={privateC ? "Lock" : "Users"} size={19} color={privateC ? "var(--accent)" : "var(--text-secondary)"} strokeWidth={privateC ? 2 : 1.5} />
      </span>
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

/* ---------------- Shop ---------------- */

function ShopTab({ profile }: { profile: CreatorProfile }) {
  return (
    <div className="flex flex-col gap-[14px]">
      <div className="flex items-center gap-[10px] rounded-[var(--radius-input)] border border-hairline bg-card px-[14px] py-3">
        <Icon name="Info" size={15} color="var(--text-muted)" strokeWidth={2} />
        <span className="flex-1 text-[12.5px] leading-[1.45] text-text-secondary">
          Buying happens in Basket or Beauty, not here.
        </span>
      </div>
      {profile.products.length === 0 ? (
        <EmptyState icon="ShoppingBag" title="No shop yet" caption="This creator has not linked any products." />
      ) : (
        <div className="grid grid-cols-2 content-start items-start gap-x-3 gap-y-[18px] xl:grid-cols-3 xl:gap-x-[18px]">
          {profile.products.map((p) => (
            <Link key={p.id} href={`/marketplace/${p.platform}/${p.id}`} className="flex flex-col gap-[9px] no-underline">
              <div className="aspect-square rounded-[var(--radius-media)] border border-hairline [background-image:repeating-linear-gradient(135deg,var(--surface-tag)_0_12px,var(--surface-card)_12px_24px)]" />
              <span className="text-[14px] font-semibold leading-[1.3] text-text-primary">{p.name}</span>
              <div className="flex">
                <HandoffPill app={p.platform === "beauty" ? "WAWUBeauty" : "WAWUBasket"} />
              </div>
              <span className="text-[15px] font-bold text-text-primary [font-feature-settings:var(--font-feature-tabular)]">
                {formatNaira(p.price)}
              </span>
            </Link>
          ))}
        </div>
      )}
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

      <div className="flex flex-col gap-[11px] rounded-[var(--radius-card)] border border-hairline bg-card p-4">
        {profile.location && <InfoRow icon="MapPin" text={profile.location} />}
        {profile.memberSince && <InfoRow icon="Calendar" text={`On WAWU since ${profile.memberSince}`} />}
        {profile.replyTime && <InfoRow icon="Clock" text={profile.replyTime} />}
      </div>

      <div className="flex flex-col gap-[10px]">
        <SectionLabel>Verified as</SectionLabel>
        <div className="flex flex-col gap-[9px] rounded-[var(--radius-card)] border border-hairline bg-card px-4 py-[15px]">
          <BadgeRow icon={<Icon name="Award" size={18} color="var(--accent)" strokeWidth={2.2} />} text={VERIFY_LABELS[profile.verification]} />
          <BadgeRow icon={<Icon name="Crown" size={18} color="var(--brand-yellow)" strokeWidth={2.2} />} text={`${profile.plan === "pro" ? "Pro" : "Basic"} creator`} />
        </div>
      </div>

      {Object.values(profile.socials).some(Boolean) && (
        <div className="flex flex-col gap-[10px]">
          <SectionLabel>Elsewhere</SectionLabel>
          <div className="flex gap-[10px]">
            {profile.socials.instagram && <SocialPill icon="instagram" label="Instagram" />}
            {profile.socials.website && <SocialPill icon="Globe" label="Website" />}
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

function SocialPill({ icon, label }: { icon: string; label: string }) {
  return (
    <span className="inline-flex h-10 items-center gap-2 rounded-full border border-hairline bg-tag px-[14px] text-[13px] font-semibold text-text-secondary">
      <Icon name={icon as IconName} size={15} color="var(--text-secondary)" strokeWidth={2} />
      {label}
    </span>
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

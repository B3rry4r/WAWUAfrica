import type { ReactNode } from "react";
import type { CreatorProfile, ProfileTab } from "@/types/profile";
import { getCreatorProfile, isFollowing } from "@/lib/api/profile";
import { ProfileHeader } from "@/components/ui/ProfileHeader";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { PriceChip } from "@/components/ui/PriceChip";
import { HandoffPill } from "@/components/ui/HandoffPill";
import { StatusPill } from "@/components/ui/StatusPill";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { FollowButton } from "@/components/shared/FollowButton";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { ProfileActions } from "@/components/profile/ProfileActions";
import { ProfileTabs } from "@/components/profile/ProfileTabs";
import { CommunityJoinButton } from "@/components/profile/CommunityJoinButton";
import { ShareButton } from "@/components/profile/ShareButton";

const VALID_TABS: ProfileTab[] = ["content", "community", "shop", "about"];

interface FanProfilePageProps {
  params: { wawuId: string };
  searchParams: { tab?: string };
}

export default async function FanProfilePage({ params, searchParams }: FanProfilePageProps) {
  const { wawuId } = params;
  const tab: ProfileTab = VALID_TABS.includes(searchParams.tab as ProfileTab) ? (searchParams.tab as ProfileTab) : "content";

  let profile: CreatorProfile;
  let following = false;
  try {
    [profile, following] = await Promise.all([getCreatorProfile(wawuId), isFollowing(wawuId)]);
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState title="Creator not found" body={message ?? "This profile doesn't exist or was removed."} />;
  }

  const isDeepTab = tab === "shop" || tab === "about";

  return (
    <div className="flex min-h-dvh flex-col">
      {isDeepTab ? (
        <CompactHeader profile={profile} following={following} />
      ) : (
        <FullHeader profile={profile} following={following} />
      )}
      <ProfileTabs wawuId={wawuId} active={tab} />
      <div className="flex flex-1 flex-col px-4 pb-24 pt-3">
        <TabBody profile={profile} tab={tab} following={following} />
      </div>
    </div>
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
        <Button size="sm" variant="secondary" icon="MessageCircle" aria-label="Message" className="w-[38px] !px-0" />
        <Button size="sm" variant="secondary" icon="HandCoins" aria-label="Tip" className="w-[38px] !px-0" />
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
      />
    );
  }
  return (
    <div className="flex flex-col gap-[10px]">
      {profile.content.map((item) => (
        <ContentRow key={item.id} item={item} />
      ))}
    </div>
  );
}

function ContentRow({ item }: { item: CreatorProfile["content"][number] }) {
  return (
    <div className="flex h-[82px] shrink-0 items-center gap-[13px] rounded-[var(--radius-card)] border border-hairline bg-card px-[14px]">
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-[12px] border border-hairline [background-image:repeating-linear-gradient(135deg,var(--surface-tag)_0_12px,var(--surface-card)_12px_24px)]">
        {item.locked && (
          <div className="absolute inset-0 grid place-items-center bg-[var(--locked-veil)]">
            <Icon name="Lock" size={15} color="#fff" strokeWidth={2.2} />
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-[15px] font-semibold text-text-primary">
          {item.title}
        </span>
        <span className="truncate text-[12.5px] text-text-muted">
          {item.kindLabel}
        </span>
      </div>
      <div className="flex shrink-0">
        {item.status === "pending" ? (
          <StatusPill kind="warning">In review</StatusPill>
        ) : (
          <PriceChip amount={item.price} label="PPV" free={item.price === 0} tone="plain" size="sm" />
        )}
      </div>
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
        <div className="grid grid-cols-2 content-start items-start gap-x-3 gap-y-[18px]">
          {profile.products.map((p) => (
            <div key={p.id} className="flex flex-col gap-[9px]">
              <div className="aspect-square rounded-[var(--radius-media)] border border-hairline [background-image:repeating-linear-gradient(135deg,var(--surface-tag)_0_12px,var(--surface-card)_12px_24px)]" />
              <span className="text-[14px] font-semibold leading-[1.3] text-text-primary">{p.name}</span>
              <div className="flex">
                <HandoffPill app={p.platform === "beauty" ? "WAWUBeauty" : "WAWUBasket"} />
              </div>
              <span className="text-[15px] font-bold text-text-primary [font-feature-settings:var(--font-feature-tabular)]">
                ₦{p.price.toLocaleString("en-NG")}
              </span>
            </div>
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

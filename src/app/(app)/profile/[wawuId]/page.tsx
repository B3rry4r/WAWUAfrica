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
    return <ErrorState title="Creator not found" caption={message ?? "This profile doesn't exist or was removed."} />;
  }

  const isDeepTab = tab === "shop" || tab === "about";

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      {isDeepTab ? (
        <CompactHeader profile={profile} following={following} />
      ) : (
        <FullHeader profile={profile} following={following} />
      )}
      <ProfileTabs wawuId={wawuId} active={tab} />
      <div style={{ flex: 1, padding: "12px 16px 96px" }}>
        <TabBody profile={profile} tab={tab} following={following} />
      </div>
    </div>
  );
}

function FullHeader({ profile, following }: { profile: CreatorProfile; following: boolean }) {
  return (
    <div style={{ position: "relative" }}>
      <ProfileBackButton />
      <ProfileHeader
        name={profile.name}
        handle={profile.handle}
        bio={profile.bio}
        tier={profile.verification}
        plan={profile.plan}
        stats={[
          { value: profile.stats.followers, label: "Followers" },
          { value: String(profile.stats.pieces), label: profile.stats.piecesLabel },
          { value: profile.stats.evg.toLocaleString("en-NG"), label: "EVG" },
        ]}
        primary={<FollowButton wawuId={profile.wawuId} initial={following} size="md" />}
        secondary={<ShareButton />}
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
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px 14px",
        borderBottom: "1px solid var(--border-hairline)",
        background: "rgba(19,19,22,0.86)",
        backdropFilter: "var(--blur-chrome)",
        position: "sticky",
        top: 0,
        zIndex: 30,
      }}
    >
      <ProfileBackButton compact />
      <Avatar initial={profile.name.charAt(0)} size={34} />
      <span style={{ flex: 1, minWidth: 0, fontSize: 14.5, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-primary)" }}>
        {profile.name}
      </span>
      <div style={{ display: "flex", gap: 7, flexShrink: 0 }}>
        <FollowButton wawuId={profile.wawuId} initial={following} size="sm" />
        <div style={{ width: 38, display: "flex" }}>
          <Button full size="sm" variant="secondary" icon="MessageCircle" style={{ padding: 0 }} aria-label="Message" />
        </div>
        <div style={{ width: 38, display: "flex" }}>
          <Button full size="sm" variant="secondary" icon="HandCoins" style={{ padding: 0 }} aria-label="Tip" />
        </div>
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
        style={{ paddingTop: 8 }}
      />
    );
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {profile.content.map((item) => (
        <ContentRow key={item.id} item={item} />
      ))}
    </div>
  );
}

function ContentRow({ item }: { item: CreatorProfile["content"][number] }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 13,
        height: 82,
        flexShrink: 0,
        padding: "0 14px",
        borderRadius: "var(--radius-card)",
        background: "var(--surface-card)",
        border: "1px solid var(--border-hairline)",
      }}
    >
      <div
        style={{
          position: "relative",
          width: 56,
          height: 56,
          borderRadius: 12,
          flexShrink: 0,
          overflow: "hidden",
          background: "repeating-linear-gradient(135deg, var(--surface-tag) 0 12px, var(--surface-card) 12px 24px)",
          border: "1px solid var(--border-hairline)",
        }}
      >
        {item.locked && (
          <div style={{ position: "absolute", inset: 0, background: "var(--locked-veil)", display: "grid", placeItems: "center" }}>
            <Icon name="Lock" size={15} color="#fff" stroke={2.2} />
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontSize: 15, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "var(--text-primary)" }}>
          {item.title}
        </span>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {item.kindLabel}
        </span>
      </div>
      <div style={{ display: "flex", flexShrink: 0 }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {profile.communities.map((c) => (
        <CommunityRow key={c.id} profile={profile} community={c} />
      ))}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "13px 14px", borderRadius: "var(--radius-input)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
        <Icon name="Ticket" size={15} color="var(--text-muted)" style={{ marginTop: 1 }} />
        <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.5, color: "var(--text-secondary)" }}>
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
      style={{
        display: "flex",
        gap: 14,
        padding: 14,
        borderRadius: "var(--radius-card)",
        background: "var(--surface-card)",
        border: `1px solid ${privateC ? "var(--border-accent)" : "var(--border-hairline)"}`,
      }}
    >
      <span
        style={{
          display: "grid",
          placeItems: "center",
          width: 46,
          height: 46,
          borderRadius: 14,
          flexShrink: 0,
          background: privateC ? "var(--accent-tint)" : "repeating-linear-gradient(135deg, var(--surface-tag) 0 12px, var(--surface-card) 12px 24px)",
          border: `1px solid ${privateC ? "var(--border-accent)" : "var(--border-hairline)"}`,
        }}
      >
        <Icon name={privateC ? "Lock" : "Users"} size={19} color={privateC ? "var(--accent)" : "var(--text-secondary)"} stroke={privateC ? 2 : 1.5} />
      </span>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 5 }}>
        <span style={{ fontSize: 15, fontWeight: 600, color: "var(--text-primary)" }}>{community.name}</span>
        <span style={{ fontSize: 12.5, color: "var(--text-muted)", fontFeatureSettings: "var(--font-feature-tabular)" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", borderRadius: "var(--radius-input)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
        <Icon name="Info" size={15} color="var(--text-muted)" />
        <span style={{ flex: 1, fontSize: 12.5, lineHeight: 1.45, color: "var(--text-secondary)" }}>
          Buying happens in Basket or Beauty, not here.
        </span>
      </div>
      {profile.products.length === 0 ? (
        <EmptyState icon="ShoppingBag" title="No shop yet" caption="This creator has not linked any products." style={{ paddingTop: 8 }} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px 12px", alignContent: "start", alignItems: "start" }}>
          {profile.products.map((p) => (
            <div key={p.id} style={{ display: "flex", flexDirection: "column", gap: 9 }}>
              <div style={{ aspectRatio: "1 / 1", borderRadius: "var(--radius-media)", background: "repeating-linear-gradient(135deg, var(--surface-tag) 0 12px, var(--surface-card) 12px 24px)", border: "1px solid var(--border-hairline)" }} />
              <span style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.3, color: "var(--text-primary)" }}>{p.name}</span>
              <div style={{ display: "flex" }}>
                <HandoffPill app={p.platform === "beauty" ? "WAWUBeauty" : "WAWUBasket"} />
              </div>
              <span style={{ fontSize: 15, fontWeight: 700, fontFeatureSettings: "var(--font-feature-tabular)", color: "var(--text-primary)" }}>
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
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {profile.bio && <p style={{ margin: 0, fontSize: 14.5, lineHeight: 1.6, color: "var(--text-secondary)", textWrap: "pretty" }}>{profile.bio}</p>}

      {profile.categories.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SectionLabel>Works in</SectionLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {profile.categories.map((c) => (
              <span key={c} style={{ display: "inline-flex", alignItems: "center", height: 32, padding: "0 13px", borderRadius: 999, background: "var(--surface-tag)", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)", fontSize: 12.5, fontWeight: 500 }}>
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 11, padding: 16, borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
        {profile.location && <InfoRow icon="MapPin" text={profile.location} />}
        {profile.memberSince && <InfoRow icon="Calendar" text={`On WAWU since ${profile.memberSince}`} />}
        {profile.replyTime && <InfoRow icon="Clock" text={profile.replyTime} />}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <SectionLabel>Verified as</SectionLabel>
        <div style={{ display: "flex", flexDirection: "column", gap: 9, padding: "15px 16px", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
          <BadgeRow icon={<Icon name="Award" size={18} color="var(--accent)" stroke={2.2} />} text={VERIFY_LABELS[profile.verification]} />
          <BadgeRow icon={<Icon name="Crown" size={18} color="var(--brand-yellow)" stroke={2.2} />} text={`${profile.plan === "pro" ? "Pro" : "Basic"} creator`} />
        </div>
      </div>

      {Object.values(profile.socials).some(Boolean) && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <SectionLabel>Elsewhere</SectionLabel>
          <div style={{ display: "flex", gap: 10 }}>
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
  return <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)" }}>{children}</span>;
}

function InfoRow({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <Icon name={icon} size={15} color="var(--text-muted)" />
      <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-secondary)" }}>{text}</span>
    </div>
  );
}

function BadgeRow({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      {icon}
      <span style={{ flex: 1, fontSize: 13.5, color: "var(--text-secondary)" }}>{text}</span>
    </div>
  );
}

function SocialPill({ icon, label }: { icon: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, height: 40, padding: "0 14px", borderRadius: 999, background: "var(--surface-tag)", border: "1px solid var(--border-hairline)", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)" }}>
      <Icon name={icon} size={15} color="var(--text-secondary)" />
      {label}
    </span>
  );
}
import Link from "next/link";
import type { OwnProfile } from "@/types/verification";
import { getOwnProfile } from "@/lib/api/verification";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { TierBadge } from "@/components/ui/TierBadge";
import { StatBlock } from "@/components/ui/StatBlock";
import { ListRow } from "@/components/ui/ListRow";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";

const eyebrow = { fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--text-muted)", padding: "0 2px" } as const;

export default async function OwnProfilePage() {
  let profile: OwnProfile;
  try {
    profile = await getOwnProfile();
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState caption={message ?? "We couldn't load your profile."} />;
  }
  const isCreator = profile.accountType === "creator";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, padding: "16px 16px 96px" }}>
      <IdentityBlock profile={profile} />
      {isCreator ? <CreatorDashboardCard profile={profile} /> : <UserVerificationCard profile={profile} />}

      <section style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <span style={eyebrow}>Interests</span>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {profile.interests.map((i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", height: 32, padding: "0 13px", borderRadius: 999, background: "var(--surface-tag)", border: "1px solid var(--border-hairline)", color: "var(--text-secondary)", fontSize: 12.5, fontWeight: 500 }}>
              {i}
            </span>
          ))}
        </div>
      </section>

      <div style={{ display: "flex", flexDirection: "column", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)", padding: 4 }}>
        {isCreator ? (
          <>
            <ListRow title="My content" subtitle={`${profile.stats.published} published · ${profile.contentSlots?.published} of ${profile.contentSlots?.total} slots`} icon="Layers" href="/profile" />
            <ListRow title="My purchases" icon="Package" meta="2" href="/messages" />
            <ListRow title="Settings" icon="Settings" href="/settings" />
          </>
        ) : (
          <>
            <ListRow title="My purchases" subtitle="6 pieces unlocked" icon="Package" meta="6" />
            <ListRow title="Saved" icon="Bookmark" meta="14" href="/saved" />
            <ListRow title="Credits" subtitle="1 per community message" icon="Ticket" meta={String(profile.credits)} href="/communities" />
            <ListRow title="Settings" icon="Settings" href="/settings" />
          </>
        )}
      </div>
    </div>
  );
}

function IdentityBlock({ profile }: { profile: OwnProfile }) {
  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <Avatar initial={profile.name.charAt(0)} size={66} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
            <span style={{ fontSize: 20, fontWeight: 600, letterSpacing: "-0.02em", color: "var(--text-primary)" }}>{profile.name}</span>
            <VerificationBadge tier={profile.verification} size={17} />
          </div>
          <span style={{ fontSize: 13, color: "var(--text-muted)" }}>
            @{profile.handle}
            {profile.accountType === "creator" && (
              <>
                {" · "}
                <TierBadge tier={profile.plan} size="sm" />
              </>
            )}
          </span>
        </div>
        <Link href="/profile/edit" style={{ textDecoration: "none" }}>
          <Button size="sm" variant="secondary">
            Edit
          </Button>
        </Link>
      </div>
      {profile.bio && <p style={{ margin: 0, fontSize: 14, lineHeight: 1.5, color: "var(--text-secondary)" }}>{profile.bio}</p>}
      {profile.accountType === "creator" && (
        <div style={{ display: "flex", gap: 28, padding: "14px 0", borderTop: "1px solid var(--border-hairline)", borderBottom: "1px solid var(--border-hairline)" }}>
          <StatBlock value={String(profile.stats.published)} label="Published" align="start" size="sm" />
          <StatBlock value={String(profile.stats.sales)} label="Sales" align="start" size="sm" />
          <StatBlock value={profile.stats.followers} label="Followers" align="start" size="sm" />
        </div>
      )}
    </section>
  );
}

function CreatorDashboardCard({ profile }: { profile: OwnProfile }) {
  return (
    <Link href="/create" style={{ textDecoration: "none", display: "block" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 13, padding: 14, borderRadius: "var(--radius-card)", background: "var(--surface-elevated)", border: "1px solid var(--border-accent)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
          <span style={{ display: "grid", placeItems: "center", width: 38, height: 38, flexShrink: 0, borderRadius: 12, background: "var(--accent-tint)", border: "1px solid var(--border-accent)" }}>
            <Icon name="ChartNoAxesColumn" size={17} color="var(--accent)" stroke={2} />
          </span>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
            <span style={{ fontSize: 15.5, fontWeight: 600, color: "var(--text-primary)" }}>Creator dashboard</span>
            <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>Earnings, content, inbox, tier</span>
          </div>
          <Icon name="ChevronRight" size={17} color="var(--accent)" stroke={2.2} />
        </div>
        <div style={{ display: "flex", gap: 20, paddingTop: 12, borderTop: "1px solid var(--border-hairline)" }}>
          <StatBlock value={`₦${(profile.earningsThisMonth ?? 0).toLocaleString("en-NG")}`} label="This month" align="start" size="sm" />
          <StatBlock value={String(profile.toReply)} label="To reply" align="start" size="sm" />
        </div>
      </div>
    </Link>
  );
}

function UserVerificationCard({ profile }: { profile: OwnProfile }) {
  return (
    <Link href="/profile/verification" style={{ textDecoration: "none", display: "block" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 15px", borderRadius: "var(--radius-card)", background: "var(--surface-card)", border: "1px solid var(--border-hairline)" }}>
        <VerificationBadge tier={profile.verification} size={20} />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>
            {profile.verification === "basic" ? "Basic profile" : profile.verification.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
          <span style={{ fontSize: 12.5, color: "var(--text-secondary)" }}>
            {profile.verification === "basic" ? "Verify to show buyers you're real" : "Move up the ladder"}
          </span>
        </div>
        <Icon name="ChevronRight" size={17} color="var(--text-muted)" />
      </div>
    </Link>
  );
}
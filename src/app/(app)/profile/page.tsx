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

const eyebrowClass = "px-[2px] text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted";

export default async function OwnProfilePage() {
  let profile: OwnProfile;
  try {
    profile = await getOwnProfile();
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState title={message ?? "We couldn't load your profile."} />;
  }
  const isCreator = profile.accountType === "creator";

  return (
    <div className="flex flex-col gap-[18px] px-4 pb-24 pt-4">
      <IdentityBlock profile={profile} />
      {isCreator ? <CreatorDashboardCard profile={profile} /> : <UserVerificationCard profile={profile} />}

      <section className="flex flex-col gap-[10px]">
        <span className={eyebrowClass}>Interests</span>
        <div className="flex flex-wrap gap-2">
          {profile.interests.map((i) => (
            <span key={i} className="inline-flex h-8 items-center rounded-full border border-hairline bg-tag px-[13px] text-[12.5px] font-medium text-text-secondary">
              {i}
            </span>
          ))}
        </div>
      </section>

      <div className="flex flex-col rounded-[var(--radius-card)] border border-hairline bg-card p-1">
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
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <Avatar initial={profile.name.charAt(0)} size={66} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-[7px]">
            <span className="text-[20px] font-semibold tracking-[-0.02em] text-text-primary">{profile.name}</span>
            <VerificationBadge tier={profile.verification} size={17} />
          </div>
          <span className="text-[13px] text-text-muted">
            @{profile.handle}
            {profile.accountType === "creator" && (
              <>
                {" · "}
                <TierBadge tier={profile.plan} />
              </>
            )}
          </span>
        </div>
        <Link href="/profile/edit" className="no-underline">
          <Button size="sm" variant="secondary">
            Edit
          </Button>
        </Link>
      </div>
      {profile.bio && <p className="m-0 text-[14px] leading-[1.5] text-text-secondary">{profile.bio}</p>}
      {profile.accountType === "creator" && (
        <div className="flex gap-7 border-b border-t border-hairline py-[14px]">
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
    <Link href="/create" className="block no-underline">
      <div className="flex flex-col gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-accent)] bg-elevated p-[14px]">
        <div className="flex items-center gap-[11px]">
          <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[12px] border border-[var(--border-accent)] bg-[var(--accent-tint)]">
            <Icon name="ChartNoAxesColumn" size={17} color="var(--accent)" strokeWidth={2} />
          </span>
          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-[15.5px] font-semibold text-text-primary">Creator dashboard</span>
            <span className="text-[12.5px] text-text-secondary">Earnings, content, inbox, tier</span>
          </div>
          <Icon name="ChevronRight" size={17} color="var(--accent)" strokeWidth={2.2} />
        </div>
        <div className="flex gap-5 border-t border-hairline pt-3">
          <StatBlock value={`₦${(profile.earningsThisMonth ?? 0).toLocaleString("en-NG")}`} label="This month" align="start" size="sm" />
          <StatBlock value={String(profile.toReply)} label="To reply" align="start" size="sm" />
        </div>
      </div>
    </Link>
  );
}

function UserVerificationCard({ profile }: { profile: OwnProfile }) {
  return (
    <Link href="/profile/verification" className="block no-underline">
      <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-hairline bg-card px-[15px] py-[14px]">
        <VerificationBadge tier={profile.verification} size={20} />
        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <span className="text-[14px] font-semibold text-text-primary">
            {profile.verification === "basic" ? "Basic profile" : profile.verification.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
          <span className="text-[12.5px] text-text-secondary">
            {profile.verification === "basic" ? "Verify to show buyers you're real" : "Move up the ladder"}
          </span>
        </div>
        <Icon name="ChevronRight" size={17} color="var(--text-muted)" />
      </div>
    </Link>
  );
}

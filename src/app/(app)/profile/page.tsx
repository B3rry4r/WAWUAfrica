"use client";

import { useCallback, useEffect, useState } from "react";
import { ShareProfileButton } from "@/components/profile/ShareProfileButton";
import Link from "next/link";
import type { VerificationLevel } from "@/types/account";
import type { OwnProfile, VerificationLevelEntry } from "@/types/verification";
import { VERIFY_TIER_LABELS } from "@/types/verification";
import { getOwnProfile, getVerificationLadder } from "@/lib/api/verification";
import { getPurchases } from "@/lib/api/purchases";
import { getSavedItems } from "@/lib/api/settings";
import { formatNaira } from "@/lib/format";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { TierBadge } from "@/components/ui/TierBadge";
import { StatBlock } from "@/components/ui/StatBlock";
import { ListRow } from "@/components/ui/ListRow";
import { Icon } from "@/components/ui/Icon";
import { useSession } from "@/lib/auth/session-provider";
import { ErrorState } from "@/components/ui/ErrorState";
import { Skeleton } from "@/components/ui/Skeleton";

const eyebrowClass = "px-[2px] text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted";

export default function OwnProfilePage() {
  const { signOut } = useSession();
  const [profile, setProfile] = useState<OwnProfile | null>(null);
  const [ladder, setLadder] = useState<VerificationLevelEntry[]>([]);
  const [purchasesCount, setPurchasesCount] = useState<number | null>(null);
  const [purchasesError, setPurchasesError] = useState(false);
  const [savedCount, setSavedCount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    setProfile(null);
    // Purchases/saved counts are read independently of the profile/ladder —
    // a hiccup fetching either just means the count shows a skeleton a beat
    // longer, never blocks the identity block from rendering. A real
    // purchases-fetch failure still has to be visible, though — it surfaces
    // as an inline "—" + error subtitle on the row below rather than
    // silently showing no count at all.
    setPurchasesError(false);
    getPurchases()
      .then((res) => setPurchasesCount(res.items.length))
      .catch(() => {
        setPurchasesCount(null);
        setPurchasesError(true);
      });
    getSavedItems()
      .then((items) => setSavedCount(items.length))
      .catch(() => setSavedCount(null));
    Promise.all([getOwnProfile(), getVerificationLadder()])
      .then(([profileRes, ladderRes]) => {
        setProfile(profileRes);
        setLadder(ladderRes);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "We couldn't load your profile."));
  }, []);

  useEffect(load, [load]);

  if (error) {
    return <ErrorState title={error} onRetry={load} />;
  }

  if (!profile) {
    return (
      <div className="flex flex-col gap-[18px] px-4 pb-24 pt-4 xl:mx-auto xl:w-full xl:max-w-[760px] xl:gap-6 xl:px-0 xl:pb-16 xl:pt-8">
        <div className="flex items-center gap-3">
          <Skeleton variant="circle" className="h-[66px] w-[66px]" />
          <Skeleton variant="row" className="h-10 flex-1" />
        </div>
        <Skeleton variant="row" className="h-[70px]" />
        <Skeleton variant="row" className="h-[120px]" />
      </div>
    );
  }

  const isCreator = profile.accountType === "creator";
  const currentLevel = ladder.find((l) => l.status === "yours");
  const nextLevel = ladder.find((l) => l.status === "next");
  const purchasesMeta = purchasesError ? "N/A" : purchasesCount === null ? undefined : String(purchasesCount);
  const savedMeta = savedCount === null ? undefined : String(savedCount);

  return (
    <div className="flex flex-col gap-[18px] px-4 pb-24 pt-4 xl:mx-auto xl:w-full xl:max-w-[760px] xl:gap-6 xl:px-0 xl:pb-16 xl:pt-8">
      <IdentityBlock profile={profile} />
      {isCreator && <CreatorDashboardCard profile={profile} />}
      <VerificationProgressCard tier={currentLevel?.tier ?? profile.verification} nextTier={nextLevel?.tier} />

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

      <div className="flex flex-col rounded-[var(--radius-card)] border border-hairline bg-card p-1 xl:grid xl:grid-cols-2 xl:gap-1">
        {isCreator ? (
          <>
            <ListRow title="Creator dashboard" subtitle="Earnings, uploads, messages" icon="LayoutDashboard" href="/creator" />
            <ListRow title="My content" subtitle={`${profile.stats.published} published · ${profile.contentSlots?.published} of ${profile.contentSlots?.total} slots`} icon="Layers" href="/create/library" />
            <ListRow title="Earnings" icon="HandCoins" href="/earnings" />
            <ListRow title="Subscription" icon="BadgeCheck" href="/subscription" />
            <ListRow title="Verification" icon="ShieldCheck" href="/profile/verification" />
            <ListRow
              title="My purchases"
              subtitle={purchasesError ? "Could not load" : undefined}
              icon="Package"
              meta={purchasesMeta}
              href="/purchases"
            />
            <ListRow title="Saved" icon="Bookmark" meta={savedMeta} href="/saved" />
            <ListRow title="Settings" icon="Settings" href="/settings" />
          </>
        ) : (
          <>
            <ListRow
              title="My purchases"
              subtitle={purchasesError ? "Could not load" : purchasesCount === null ? undefined : `${purchasesCount} pieces unlocked`}
              icon="Package"
              meta={purchasesMeta}
              href="/purchases"
            />
            <ListRow title="Saved" icon="Bookmark" meta={savedMeta} href="/saved" />
            <ListRow title="Credits" subtitle="1 per community message" icon="Ticket" meta={String(profile.credits)} href="/communities" />
            <ListRow title="Become a creator" subtitle="Publish content, host communities, get paid" icon="Sparkles" href="/onboarding" />
            <ListRow title="Settings" icon="Settings" href="/settings" />
          </>
        )}
        {/*
          Signing out was only reachable at the bottom of Settings. Profile is
          where people look for it, so it lives here too.
        */}
        <button
          type="button"
          onClick={signOut}
          className="mt-[10px] flex h-[52px] w-full items-center gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] px-[15px] text-[15px] font-semibold text-[var(--text-secondary)]"
        >
          <Icon name="LogOut" size={19} color="var(--text-secondary)" strokeWidth={2} />
          Sign out
        </button>
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
        {/* Shares /profile/{handle}, the username they chose, not the id. */}
        <ShareProfileButton handle={profile.handle} compact />
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
          {profile.stats.sales !== undefined && (
            <StatBlock value={String(profile.stats.sales)} label="Sales" align="start" size="sm" />
          )}
          {profile.stats.followers !== undefined && (
            <StatBlock value={profile.stats.followers} label="Followers" align="start" size="sm" />
          )}
        </div>
      )}
    </section>
  );
}

function CreatorDashboardCard({ profile }: { profile: OwnProfile }) {
  return (
    <Link href="/creator" className="block no-underline">
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
          <StatBlock value={formatNaira(profile.earningsThisMonth ?? 0)} label="This month" align="start" size="sm" />
          {profile.toReply !== undefined && (
            <StatBlock value={String(profile.toReply)} label="To reply" align="start" size="sm" />
          )}
        </div>
      </div>
    </Link>
  );
}

function VerificationProgressCard({ tier, nextTier }: { tier: VerificationLevel; nextTier?: VerificationLevel }) {
  const label = tier === "basic" ? "Basic profile" : VERIFY_TIER_LABELS[tier];
  const subtitle =
    tier === "basic"
      ? "Verify to show buyers you're real"
      : nextTier
        ? `Apply to be a ${VERIFY_TIER_LABELS[nextTier]}`
        : "You're at the top of the ladder";
  return (
    <Link href="/profile/verification" className="block no-underline">
      <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-hairline bg-card px-[15px] py-[14px]">
        <VerificationBadge tier={tier} size={20} />
        <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
          <span className="text-[14px] font-semibold text-text-primary">{label}</span>
          <span className="text-[12.5px] text-text-secondary">{subtitle}</span>
        </div>
        <Icon name="ChevronRight" size={17} color="var(--text-muted)" />
      </div>
    </Link>
  );
}

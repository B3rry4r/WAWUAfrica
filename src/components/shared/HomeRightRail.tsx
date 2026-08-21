"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatBlock } from "@/components/ui/StatBlock";
import { FollowButton } from "@/components/shared/FollowButton";
import { useSession } from "@/lib/auth/session-provider";
import { getEvgScore } from "@/lib/api/profile";
import { creatorGates } from "@/lib/auth/gates";
import { useCreatorState } from "@/lib/auth/use-creator-state";
import type { CreatorState } from "@/types/auth";
import { getPopularSearches, getSuggestedCreators } from "@/lib/api/search";
import { messagingApi } from "@/lib/api/messaging";
import { earningsApi } from "@/lib/api/earnings";
import { formatNaira } from "@/lib/format";
import type { EarningsSummary } from "@/types/earnings";
import type { Thread } from "@/types/messaging";

/**
 * Desktop-only home feed right rail (design D1 · Shell, 320px, sticky).
 * Sidebar.tsx (batch 1) is the persistent LEFT nav only — it doesn't cover
 * this, feed-specific content that swaps by account type same as the feed
 * itself. Hidden below xl; render alongside HomeFeed's existing mobile JSX
 * unconditionally, no wrapper needed.
 */
export function HomeRightRail() {
  // Live creator state, not the session's sign-in-time accountType: that value
  // never changes after sign-in, so a creator who subscribed afterwards kept
  // getting the fan rail — "Become a creator" and all — on their own home
  // feed. Nothing renders on either side of the fork until the server has
  // actually answered; showing the fan rail "for now" IS the reported bug.
  const { creator, resolved } = useCreatorState();
  const isCreator = creatorGates({ creator }).isCreator;

  return (
    <aside className="hidden shrink-0 flex-col gap-4 xl:sticky xl:top-[22px] xl:flex xl:w-[320px] xl:self-start xl:py-[22px] xl:pr-[22px]">
      {!resolved ? (
        <RailCard eyebrow={<Skeleton className="h-[11px] w-[92px] rounded" />}>
          <Skeleton variant="row" className="h-[38px]" />
          <Skeleton variant="row" className="h-[38px]" />
        </RailCard>
      ) : isCreator ? (
        <CreatorRail creator={creator} />
      ) : (
        <UserRail />
      )}
      <TrendingCard />
      {resolved && !isCreator ? <UpsellCard /> : null}
    </aside>
  );
}

function RailCard({
  eyebrow,
  tone = "default",
  children,
}: {
  /** Node rather than string so the unresolved rail can shim it with a Skeleton. */
  eyebrow: React.ReactNode;
  tone?: "default" | "urgent";
  children: React.ReactNode;
}) {
  return (
    <div
      className={`flex flex-col gap-3 rounded-card border p-[18px] ${
        tone === "urgent" ? "border-[rgba(255,92,92,0.32)] bg-card" : "border-hairline bg-card"
      }`}
    >
      <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-text-muted">{eyebrow}</span>
      {children}
    </div>
  );
}

function UserRail() {
  const [creators, setCreators] = useState<Awaited<ReturnType<typeof getSuggestedCreators>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    getSuggestedCreators()
      .then((res) => {
        if (!cancelled) setCreators(res);
      })
      .catch(() => {
        if (!cancelled) setCreators([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (creators !== null && creators.length === 0) return null;

  return (
    <RailCard eyebrow="Creators to follow">
      {creators === null ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} variant="row" className="h-[38px]" />
          ))}
        </div>
      ) : (
        creators.slice(0, 2).map((c) => (
          // The identity block links to the public profile; FollowButton stays
          // OUTSIDE that link, or tapping Follow navigates instead of
          // following. Same structure as /explore/creators' CreatorRow.
          <div key={c.wawuId} className="relative flex items-center gap-[11px]">
            <Link
              href={`/profile/${c.wawuId}`}
              aria-label={`${c.fullName}, ${c.headline}`}
              className="absolute inset-0 rounded-card no-underline"
            />
            <Avatar initial={c.fullName} size={38} />
            <div className="pointer-events-none flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[13.5px] font-semibold">{c.fullName}</span>
              <span className="truncate text-[12px] text-text-muted">
                {c.headline}
                {c.location ? ` · ${c.location}` : ""}
              </span>
            </div>
            <div className="relative flex shrink-0">
              <FollowButton wawuId={c.wawuId} initial={false} size="sm" />
            </div>
          </div>
        ))
      )}
    </RailCard>
  );
}

function CreatorRail({ creator }: { creator: CreatorState | null }) {
  const { user } = useSession();
  const gates = creatorGates({ creator });
  const [evg, setEvg] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.wawuId) return;
    let cancelled = false;
    getEvgScore(user.wawuId).then((score) => {
      if (!cancelled) setEvg(score);
    });
    return () => {
      cancelled = true;
    };
  }, [user?.wawuId]);
  const [threads, setThreads] = useState<Thread[] | null>(null);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);

  useEffect(() => {
    let cancelled = false;
    messagingApi
      .getState()
      .then((state) => {
        if (!cancelled) setThreads(state.threads);
      })
      .catch(() => {
        if (!cancelled) setThreads([]);
      });
    earningsApi
      .getSummary()
      .then((s) => {
        if (!cancelled) setSummary(s);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const unopened = threads?.find((t) => !t.opened) ?? null;
  const earned = summary ? (gates.canEarn ? summary.payable + summary.held : summary.held) : null;

  return (
    <>
      {unopened ? (
        <RailCard eyebrow="Needs a reply" tone="urgent">
          <div className="flex items-center gap-[11px]">
            <Avatar initial={unopened.buyerInitials} size={38} />
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-[13.5px] font-semibold">{unopened.buyerName}</span>
              <span className="truncate text-[12px] text-danger">
                {unopened.expiresAt ? `${unopened.expiresAt} left · ${formatNaira(unopened.price)}` : formatNaira(unopened.price)}
              </span>
            </div>
          </div>
          <Button full size="sm" href="/messages">
            Reply now
          </Button>
        </RailCard>
      ) : null}

      <RailCard eyebrow="This month">
        {earned === null ? (
          <Skeleton variant="row" className="h-9" />
        ) : (
          <StatBlock value={formatNaira(earned)} label="Earned" align="start" size="md" />
        )}
        <div className="flex gap-[18px] border-t border-hairline pt-3">
          {/* GET /api/hub/content/mine has no units-sold/sales-count field
             (see the GAP note on mapToContentItem in creator-content.ts) --
             there is no Purchase aggregation wired into this resource. This
             used to show a hardcoded "34" from static mock library items
             directly beside the genuinely live "Earned" figure above, with
             nothing telling the creator one was real and the other wasn't.
             Showing "Soon" instead of a number is honest about the gap
             rather than inventing or silently reusing a fake count. */}
          <StatBlock value="Soon" label="Sales" align="start" size="sm" />
          {/* Real EVG from GET /creators/:wawuId/evg. This was a hardcoded
              "1,240" sitting beside the genuinely live figures above. */}
          <StatBlock value={evg !== null ? evg.toLocaleString("en-NG") : "—"} label="EVG" align="start" size="sm" />
        </div>
      </RailCard>
    </>
  );
}

function TrendingCard() {
  const [tags, setTags] = useState<string[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    getPopularSearches()
      .then((res) => {
        if (!cancelled) setTags(res);
      })
      .catch(() => {
        if (!cancelled) setTags([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (tags !== null && tags.length === 0) return null;

  return (
    <RailCard eyebrow="Trending now">
      {tags === null ? (
        <div className="flex flex-col gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[14px] w-[60%] rounded" />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-[9px]">
          {tags.slice(0, 4).map((tag) => (
            <Link key={tag} href={`/search?q=${encodeURIComponent(tag)}`} className="text-[13.5px] text-text-secondary hover:text-text-primary">
              {tag}
            </Link>
          ))}
        </div>
      )}
    </RailCard>
  );
}

function UpsellCard() {
  return (
    <div className="flex flex-col gap-[11px] rounded-card border border-decor bg-elevated p-[18px]">
      <span className="text-[14.5px] font-semibold">Sell what you know</span>
      <span className="text-[12.5px] leading-[1.45] text-text-secondary">
        Creators keep 85%, 90% on Pro. Your first upload is free.
      </span>
      <Button full size="sm" iconRight="ArrowRight" href="/onboarding">
        Become a creator
      </Button>
    </div>
  );
}

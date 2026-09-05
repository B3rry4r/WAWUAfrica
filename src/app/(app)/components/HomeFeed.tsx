"use client";

import { useEffect, useMemo, useState } from "react";
import { ContentCard } from "@/components/content/ContentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { HomeRightRail } from "@/components/shared/HomeRightRail";
import { getFeed } from "@/lib/api/content";
import { TgifDaily } from "@/components/tgif/TgifDaily";
import type { ContentPiece } from "@/types/content";

// "Trending" used to sit here as a third tab, but there is no distinct
// trending query on the real contract (ListContentQueryDto only accepts
// `scope: 'feed' | 'mine'` — no ranking/sort param) and no client-side signal
// to derive one from honestly. It rendered the exact same items as "For
// you" with nothing behind the label. Removed rather than left as a fake
// sort — see the "Following" doc comment below for the sibling fix.
/*
  TGIF LEADS, and it is what the tab opens on.

  That is the product owner's own ordering ("TGIF - For You- Following"), and
  it is the one tab whose value is spent by lunchtime: a devotional read at
  9pm has already missed its day, while the feed is the same whenever it is
  opened. Putting it anywhere else means most people meet it only by accident.
*/
const TABS = [
  { id: "tgif", label: "TGIF" },
  { id: "for-you", label: "For you" },
  { id: "following", label: "Following" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function HomeFeed() {
  const [items, setItems] = useState<ContentPiece[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("tgif");

  useEffect(() => {
    let active = true;
    getFeed()
      .then((res) => {
        if (active) setItems(res.items);
      })
      .catch(() => {
        if (active) setError("We could not load your feed right now.");
      });
    return () => {
      active = false;
    };
  }, []);

  const feed = useMemo(() => items ?? [], [items]);

  return (
    <div className="flex flex-col xl:flex-row xl:items-start">
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex gap-[26px] border-b border-hairline px-[18px] xl:px-[26px]">
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`relative pb-[12px] text-[14.5px] transition-colors xl:h-[54px] xl:pb-0 ${
                  active ? "font-semibold text-text-primary" : "font-medium text-text-muted hover:text-text-primary"
                }`}
              >
                {t.label}
                {active ? (
                  <span className="absolute bottom-[-1px] left-0 right-0 h-[2px] rounded-[2px] bg-accent" aria-hidden="true" />
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-4 px-4 pb-8 pt-4 xl:px-[26px] xl:pt-[22px]">
          {/*
            TGIF is checked BEFORE the feed's own loading and error states,
            because it does not need the feed. It reads a file that shipped
            with the app, so a feed that is slow, or down, or empty has nothing
            to do with whether today's reading can be shown. Ordering it after
            those checks would have hidden it behind an unrelated failure.
          */}
          {tab === "tgif" ? (
            <TgifDaily />
          ) : error ? (
            <EmptyState
              icon="WifiOff"
              title="Could not load your feed"
              caption={error}
              action="Try again"
              onAction={() => window.location.reload()}
            />
          ) : !items ? (
            <FeedSkeleton />
          ) : tab === "following" ? (
            // Real gap, not a wiring miss: there is no GET endpoint to list
            // who the signed-in user follows (follow-relationship.controller.ts
            // only exposes POST/DELETE .../follow) and no batch creator-profile
            // lookup to resolve one against the feed even if there were. This
            // tab used to always show the same "you haven't followed anyone"
            // empty state regardless of real follow state, which is a false
            // claim for anyone who actually follows creators. Labeling the
            // real limitation instead of implying "go follow someone and this
            // will populate" (it won't yet).
            <EmptyState
              icon="Clock"
              title="Following feed isn't ready yet"
              caption="We can't filter your feed by who you follow just yet, check 'For you' in the meantime."
            />
          ) : feed.length === 0 ? (
            <EmptyState
              icon="SearchX"
              title="Nothing here yet"
              caption="We have not curated anything in this format yet. Try another tab."
            />
          ) : (
            <div className="flex flex-col gap-4 xl:grid xl:grid-cols-2 xl:items-start xl:gap-[22px]">
              {feed.map((c) => (
                <ContentCard key={c.id} content={c} ratio="2 / 1" authorRow />
              ))}
            </div>
          )}
        </div>
      </div>

      <HomeRightRail />
    </div>
  );
}

function FeedSkeleton() {
  return (
    <div className="flex flex-col gap-4 xl:grid xl:grid-cols-2 xl:gap-[22px]">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex flex-col gap-2 overflow-hidden rounded-card border border-hairline bg-card">
          <div className="flex items-center gap-2.5 p-3 pb-2.5">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-4 w-[45%] rounded" />
          </div>
          <Skeleton className="aspect-[2/1] w-full rounded-none" />
          <div className="p-3">
            <Skeleton className="h-4 w-[92%] rounded" />
            <Skeleton className="mt-2 h-3 w-[40%] rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
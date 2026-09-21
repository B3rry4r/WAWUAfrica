"use client";

import { useEffect, useMemo, useState } from "react";
import { ContentCard } from "@/components/content/ContentCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { Skeleton } from "@/components/ui/Skeleton";
import { VerificationPrompt } from "@/components/ui/VerificationPrompt";
import { HomeRightRail } from "@/components/shared/HomeRightRail";
import { HomeOverview } from "@/components/home/HomeOverview";
import { getFeed } from "@/lib/api/content";
import { TgifDaily } from "@/components/tgif/TgifDaily";
import { isHidden as isTgifHidden, setHidden as setTgifHidden, subscribe as subscribeTgifHidden } from "@/lib/tgif-preference";
import type { ContentPiece } from "@/types/content";

/*
  This was `(app)/components/HomeFeed.tsx`, which was a feed with a devotional
  tab on the front of it. Build brief C9 makes Home a screen in its own right
  (refs/target-home-mobile.jpg), so the tab row gained a HOME tab and the feed
  became one of the things it holds rather than the thing it is. The feed
  panes below are the old file's, unchanged; nothing was copied, the file
  moved.
*/

// "Trending" used to sit here as a third tab, but there is no distinct
// trending query on the real contract (ListContentQueryDto only accepts
// `scope: 'feed' | 'mine'` — no ranking/sort param) and no client-side signal
// to derive one from honestly. It rendered the exact same items as "For
// you" with nothing behind the label. Removed rather than left as a fake
// sort — see the "Following" doc comment below for the sibling fix. It is
// also why C9's "Trending Activities" block is not built as drawn; see
// HomeOverview.tsx.
/*
  HOME LEADS, AND TGIF LEADS HOME.

  The product owner's ordering was "TGIF - For You - Following" and TGIF is
  still the first thing on the screen: it is the card at the top of the Home
  tab, which is the tab that opens. That is the reference's own arrangement
  and it serves the same reason the ordering was given for. TGIF is the one
  tab whose value is spent by lunchtime, so it cannot be somewhere people
  reach only by accident; putting the verse on the landing tab puts it in
  front of more readers than a tab beside it ever did, and "Reflect" opens
  the full reading.
*/
const TABS = [
  { id: "home", label: "Home" },
  { id: "tgif", label: "TGIF" },
  { id: "for-you", label: "For you" },
  { id: "following", label: "Following" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function HomeScreen() {
  const [items, setItems] = useState<ContentPiece[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("home");
  // Starts `false` (shown) so the server-rendered markup and the first client
  // paint agree, then syncs to the real, possibly-hidden preference on mount
  // — same reason `usePlaying()` in SoundToggle.tsx defers to an effect
  // rather than reading localStorage inside useState's initializer.
  const [tgifHidden, setTgifHiddenState] = useState(false);

  useEffect(() => {
    setTgifHiddenState(isTgifHidden());
    return subscribeTgifHidden(() => setTgifHiddenState(isTgifHidden()));
  }, []);

  // A hidden TGIF that was also the active tab has nothing to show — land on
  // Home instead of a blank pane. Home itself still has something to show
  // with the devotional off: the card is what goes, not the screen.
  useEffect(() => {
    if (tgifHidden && tab === "tgif") setTab("home");
  }, [tgifHidden, tab]);

  const visibleTabs = useMemo(() => TABS.filter((t) => t.id !== "tgif" || !tgifHidden), [tgifHidden]);

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
        <div className="flex items-center justify-between gap-[10px] border-b border-hairline px-[18px] xl:px-[26px]">
          <div className="flex gap-[26px]">
            {visibleTabs.map((t) => {
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
          {/*
            Desktop only. Mobile's answer to "where do I turn this off" is the
            TGIF row in Settings (TgifSetting, next to Sound) — a bare icon
            sitting in the tab row was the very thing reported as not where an
            account preference belongs. Desktop keeps this because desktop
            Settings has no slot to add one to: its category list is a closed
            set matching an approved design (SettingsDesktopShared.tsx), the
            same reason Sound's own settings row is mobile-only there and
            desktop gets SoundFab instead.
          */}
          <button
            type="button"
            onClick={() => setTgifHidden(!tgifHidden)}
            aria-pressed={!tgifHidden}
            title={tgifHidden ? "Show TGIF on Home" : "Hide TGIF from Home"}
            className="hidden shrink-0 rounded-full p-[6px] text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary active:bg-surface-press xl:grid"
          >
            <Icon name={tgifHidden ? "EyeOff" : "Eye"} size={16} strokeWidth={2} color="currentColor" />
            <span className="sr-only">{tgifHidden ? "Show TGIF on Home" : "Hide TGIF from Home"}</span>
          </button>
        </div>

        <div className="flex flex-col gap-4 px-4 pb-8 pt-4 xl:px-[26px] xl:pt-[22px]">
          {/*
            The verification ask, on the screen people open most. It has no
            dismiss on purpose (build brief B1 asks for a persistent,
            recurring prompt) and it removes itself the moment the tick is
            bought. It renders nothing for an account with nothing to buy,
            so a buyer never sees it.
          */}
          <VerificationPrompt />
          {/*
            Home and TGIF are both checked BEFORE the feed's own loading and
            error states, because neither needs the feed. The devotional reads
            a file that shipped with the app, so a feed that is slow, or down,
            or empty has nothing to do with whether today's reading can be
            shown. Ordering them after those checks would have hidden them
            behind an unrelated failure.
          */}
          {tab === "home" ? (
            <HomeOverview showTgif={!tgifHidden} onOpenTgif={() => setTab("tgif")} />
          ) : tab === "tgif" ? (
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

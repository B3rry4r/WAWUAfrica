"use client";

import { useEffect, useState } from "react";
import { EmptyState, ICON_GRID, Skeleton, TileCard } from "@/components/ui";
import { Rail } from "@/app/(app)/explore/_components/Rail";
import { CreatorGridCard } from "@/app/(app)/explore/_components/CreatorGridCard";
import { TgifHero } from "@/components/tgif/TgifHero";
import { getCreators } from "@/lib/api/explore";
import { orderedServices } from "@/lib/platform-services";
import type { CreatorDiscovery } from "@/types/explore";

/**
 * The Home tab, built to refs/target-home-mobile.jpg (build brief C9).
 *
 * THE REFERENCE, AND WHAT WAS DONE WITH IT. It is three stacked blocks: the
 * TGIF card, a row of actions under "What would you like to do today?", and a
 * titled row with a "See all" on the right. That order and those groupings
 * are kept exactly. The owner's note on the image was "I sent how the Home
 * Screen should look but with our icons and brand. NOT SO BUSY", so three
 * things about it are deliberately different:
 *
 *   1. The action row is WAWU's own commissioned service art on a bare icon
 *      grid, not ten multi-coloured blocks. A5 throws the colour-block tile
 *      out by name, and ICON_GRID is how a service entry point is drawn
 *      everywhere else in the app now.
 *   2. The reference's third block is a second row of the same shape (Music,
 *      Events, Products, Services, Learning) captioned "Trending", "Hot Right
 *      Now", "In Demand". Four of those five destinations are already in the
 *      row directly above it, and the captions are popularity claims with no
 *      ranking behind them: ListContentQueryDto takes `scope` and nothing
 *      else, so there is no trending query to answer them and no honest way
 *      to derive one. Printing them anyway is what the "Trending" feed tab was
 *      deleted for. The slot keeps its shape (a titled horizontal row with a
 *      "See all") and carries real creators instead, which is also what the
 *      third block of the six-screen mobile target holds.
 *   3. One solid button above the fold ("Reflect"), and no second emphasis
 *      under it.
 *
 * C10 is satisfied here rather than bolted on: bills payment, events, shop,
 * legal and the rest are all reachable from the action row, and the creator
 * rail opens real profiles. No block on this screen is a dead end.
 */
export function HomeOverview({ showTgif, onOpenTgif }: { showTgif: boolean; onOpenTgif: () => void }) {
  return (
    <div className="flex flex-col gap-[26px]">
      {showTgif ? <TgifHero onOpen={onOpenTgif} /> : null}

      <section className="flex flex-col gap-[14px]">
        <div className="flex flex-col gap-[3px]">
          <h2 className="m-0 text-[19px] font-bold tracking-[-0.02em] text-[var(--text-primary)] dt:text-[21px]">
            What would you like to do today?
          </h2>
          <p className="m-0 text-[12.5px] text-[var(--text-muted)]">One app. More possibilities.</p>
        </div>
        {/*
          The same list, the same art and the same grid as /services, /explore
          and the landing page. PLATFORM_SERVICES is the one place any of them
          is allowed to come from, so a service cannot appear on Home under a
          name or an icon it does not have anywhere else.
        */}
        <div className={ICON_GRID}>
          {orderedServices().map((s) => (
            <TileCard
              key={s.brand}
              layout="stacked"
              size="sm"
              title={s.brand}
              icon={s.icon}
              iconImageSrc={s.iconImageSrc}
              {...(s.soon || !s.href ? { disabled: true } : { href: s.href })}
            />
          ))}
        </div>
      </section>

      <CreatorsRail />
    </div>
  );
}

/**
 * The third block: real people, from `GET /api/hub/creators`.
 *
 * Same card and same rail as Explore's "Featured creators", imported rather
 * than copied. A second creator card is how two screens end up with two
 * corner radii and two ideas of what a verification tick looks like.
 */
function CreatorsRail() {
  const [creators, setCreators] = useState<CreatorDiscovery[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    getCreators()
      .then((rows) => alive && setCreators(rows))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);

  if (failed) {
    return (
      <EmptyState
        icon="WifiOff"
        title="Could not load creators"
        caption="Check your connection and try again."
        action="Try again"
        onAction={() => window.location.reload()}
      />
    );
  }

  if (!creators) {
    return (
      <section className="flex flex-col gap-[12px]">
        <Skeleton className="h-[22px] w-[180px] rounded" />
        <div className="flex gap-[12px] overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="media" className="h-[224px] w-[168px] shrink-0" />
          ))}
        </div>
      </section>
    );
  }

  if (creators.length === 0) {
    return (
      <section className="flex flex-col gap-[12px]">
        <h2 className="m-0 px-[2px] text-[19px] font-bold tracking-[-0.02em] text-[var(--text-primary)] dt:text-[21px]">
          Creators to discover
        </h2>
        <EmptyState
          icon="UserRoundSearch"
          title="No creators to show yet"
          caption="As people publish their first pieces they appear here. Be one of them."
          action="Start creating"
          actionHref="/create"
        />
      </section>
    );
  }

  return (
    <Rail
      title="Creators to discover"
      caption="Find someone new to follow."
      seeAllHref="/explore/creators"
    >
      {creators.map((creator) => (
        <CreatorGridCard key={creator.wawuId} creator={creator} />
      ))}
    </Rail>
  );
}

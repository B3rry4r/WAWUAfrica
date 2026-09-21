import Link from "next/link";
import { getCreators } from "@/lib/api/explore";
import { getCourses } from "@/lib/api/learn";
import { orderedServices } from "@/lib/platform-services";
import { EmptyState, ICON_GRID, TileCard } from "@/components/ui";
import { CategoryTiles } from "./_components/CategoryTiles";
import { CreatorGridCard } from "./_components/CreatorGridCard";
import { Rail } from "./_components/Rail";
import { ExploreEvents } from "./_components/ExploreEvents";
import { ExploreHero } from "./_components/ExploreHero";
import { FeaturedThisWeek } from "./_components/FeaturedThisWeek";
import { LearningRail } from "./_components/LearningRail";
import { ProfessionalsRail } from "./_components/ProfessionalsRail";

const seeAll = "shrink-0 text-[12.5px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary" as const;

/**
 * Read live data, so it is rendered per request rather than prerendered.
 *
 * Without this Next tries to fetch the Hub API during `next build`, which
 * fails the build outright wherever the API is not already running - and
 * where it IS running, it bakes that moment's catalogue into the bundle and
 * serves it until the next deploy. Neither is what these screens are for.
 */
export const dynamic = "force-dynamic";

/**
 * Explore, rebuilt to build brief C4.
 *
 * WHAT IT WAS. Flat text rows: two "Browse" tiles, then Professionals,
 * Services, Events and Learn as four identical two-row link lists. The owner's
 * words on it were "this what we have is boring"
 * (refs/reject-explore-mobile.jpg). Nothing on the page showed a person, a
 * price, a date or a picture - it was a table of contents for the app, and you
 * had to leave it to see anything.
 *
 * WHAT IT IS NOW, in the order C4 sets:
 *   1. Hero carousel          - featured events, the B1 paid placement
 *   2. Category chips         - browse, not a wall of cards
 *   3. Service icon grid      - the same eight services as the landing page
 *   4. Featured Creators      - real people, on every breakpoint
 *   5. Featured This Week     - creators, professionals, events and services
 *   6. Upcoming Events
 *   7. Professional Services  - real practitioners with what they charge
 *   8. Learning and Growth    - the real course catalogue
 *
 * REMOVED, as C4 asks: "People You May Like" (redundant against Featured This
 * Week) and "Travel & Hotels" from the service grid - the latter was never in
 * PLATFORM_SERVICES, so nothing had to be taken out for it, and nothing may be
 * added back.
 *
 * Every person on this page opens their full profile. That is C4's own rule
 * and it is satisfied by the cards rather than by a convention: CreatorGridCard
 * and both rails link to /profile/:wawuId and /professionals/:id.
 */
export default async function ExplorePage() {
  /*
    Settled, not all-or-nothing.

    `Promise.all` in a server component means any one of these rejecting
    takes the whole route down with a Server Components render error, which
    is what /explore did when the course catalogue could not be read: the
    browse screen for the entire app 500'd because a list of courses was
    unavailable. Each read now degrades its own section.
  */
  const [coursesRes, creatorsRes] = await Promise.allSettled([
    getCourses(),
    getCreators(),
  ]);
  const learnCourses = coursesRes.status === "fulfilled" ? coursesRes.value : [];
  const creators = creatorsRes.status === "fulfilled" ? creatorsRes.value : [];

  const services = orderedServices();

  return (
    // One column, full width. There used to be a permanent left-hand aside
    // listing all twenty-five categories beside this; the reference puts the
    // categories in a single row of tiles at the top and gives every section
    // the whole width, which is the only way a five-card slider fits.
    <div className="flex flex-col gap-[22px] p-[14px_16px_96px] xl:gap-7 xl:p-[26px]">
      <ExploreHero />

      <CategoryTiles />

      {/*
        The service grid, C4 item 3: "icon tiles, restrained palette,
        responsive grid, NOT full-width stacked rows". Same list and same
        treatment as /services and the landing page: one list, three surfaces.
      */}
      <section className="flex flex-col gap-[12px]">
        <div className="flex items-end justify-between gap-3 px-[2px]">
          <h2 className="m-0 text-[18px] font-bold tracking-[-0.02em] text-[var(--text-primary)] dt:text-[21px]">
            Everything WAWU can do
          </h2>
          <Link href="/services" className={seeAll}>
            See all
          </Link>
        </div>
        <div className={ICON_GRID}>
          {services.map((s) => (
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

      {/*
        Featured Creators, C4 item 4: a SLIDER, as the reference draws it,
        not a 2x2 grid. It was also `hidden xl:flex` before this rebuild, so
        on a phone Explore showed no creators at all.
      */}
      {creators.length > 0 ? (
        <Rail
          title="Featured creators"
          caption="Discover amazing talent across Africa and beyond"
          seeAllHref="/explore/creators"
        >
          {creators.map((creator) => (
            <CreatorGridCard key={creator.wawuId} creator={creator} />
          ))}
        </Rail>
      ) : (
        <section className="flex flex-col gap-[12px]">
          <h2 className="m-0 px-[2px] text-[18px] font-bold tracking-[-0.02em] text-[var(--text-primary)] dt:text-[21px]">
            Featured creators
          </h2>
          {/*
            A real empty state, not a hidden section. Hiding it meant a
            deployment with no creators showed an Explore page with a hole in
            it and no explanation, which reads as a broken screen.
          */}
          <EmptyState
            icon="UserRoundSearch"
            title="No creators to feature yet"
            caption="As people publish their first pieces they appear here. Be one of them."
            action="Start creating"
            actionHref="/create"
          />
        </section>
      )}

      <FeaturedThisWeek />

      {/* Events lives here, not in the nav. The bottom bar is locked at five
          slots for everyone and Create is a creator-only FAB - an event is
          neither, so Explore is its home, the same way Services reaches its
          own sub-tree from here on mobile. */}
      <ExploreEvents />

      <ProfessionalsRail />

      {learnCourses.length > 0 ? <LearningRail courses={learnCourses} /> : null}

      {/*
        Shop is pulled off the live surface for now (product-owner
        instruction, 12 Sep 2026). It is not missing from this page: it is in
        the service grid above, dimmed and unclickable like every other
        service that is not open, which is the treatment C10 needs anyway -
        the entry point is visible from here whether or not it is open today.
      */}
    </div>
  );
}

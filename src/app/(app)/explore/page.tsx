import Link from "next/link";
import { getCategories, getCreators } from "@/lib/api/explore";
import { getCourses, getGuides } from "@/lib/api/learn";
import { formatNaira } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { ListRow } from "@/components/ui/ListRow";
import { CategoryFilterAside } from "./_components/CategoryFilterAside";
import { CreatorGridCard } from "./_components/CreatorGridCard";
import { ExploreEvents } from "./_components/ExploreEvents";

const eyebrow = "px-[2px] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]" as const;
const seeAll = "text-[12.5px] font-semibold text-[var(--accent)] hover:text-text-primary" as const;

/**
 * Read live data, so it is rendered per request rather than prerendered.
 *
 * Without this Next tries to fetch the Hub API during `next build`, which
 * fails the build outright wherever the API is not already running — and
 * where it IS running, it bakes that moment's catalogue into the bundle and
 * serves it until the next deploy. Neither is what these screens are for.
 */
export const dynamic = "force-dynamic";

export default async function ExplorePage() {
  const [categories, learnCourses, learnGuides, creators] = await Promise.all([
    getCategories(),
    getCourses(),
    getGuides(),
    getCreators(),
  ]);
  const countryGuideCount = learnGuides.filter((g) => g.kind === "country").length;

  return (
    // Below xl: unchanged single-column mobile stack. At xl (design D10): the
    // eleven categories move into a permanent content-area filter aside next
    // to this main column — a second aside, not the app Sidebar.
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px] xl:flex-row xl:items-start xl:gap-10 xl:p-[26px]">
      <CategoryFilterAside />

      <div className="flex min-w-0 flex-1 flex-col gap-[18px] xl:gap-6">
        <section className="flex flex-col gap-[11px]">
          <span className={eyebrow}>Browse</span>
          <div className="grid grid-cols-2 gap-[12px]">
            <Link href="/explore/categories" className={tileLink}>
              <IconTile icon="LayoutGrid" />
              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className={tileTitle}>Categories</span>
                <span className={tileSub}>All {categories.length}</span>
              </div>
            </Link>
            <Link href="/explore/creators" className={tileLink}>
              <IconTile icon="UserRoundSearch" />
              <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
                <span className={tileTitle}>Creators</span>
                <span className={tileSub}>By field</span>
              </div>
            </Link>
          </div>
        </section>

        {/*
          Professionals, promoted up from the bottom of the page. It used to
          sit last, below Learn and Shop, which read as "not surfaced at all"
          when the only way to find it was scrolling past everything else —
          right after Browse is the first thing most people see.
        */}
        <section className="flex flex-col gap-[11px]">
          <div className="flex items-center gap-[10px] px-[2px]">
            <span className="flex-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">Professionals</span>
            <Link href="/professionals" className={seeAll}>See all</Link>
          </div>
          <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[4px]">
            <ListRow title="Find a professional" subtitle="Lawyers, accountants, doctors and more. Vetted before they are listed" icon="BriefcaseBusiness" href="/professionals" />
            <ListRow title="Offer your own services" subtitle="Get listed in your field and be paid for your time" icon="IdCard" href="/professionals/apply" />
          </div>
        </section>

        {/*
          Services is not a bottom-bar slot (locked at five, CLAUDE.md), so
          mobile's only path to it is this row. It was silently dropped from
          this page at some point, leaving the ExploreEvents comment below
          claiming a route that no longer existed anywhere, and the whole
          /services sub-tree (Bills Payment, Legal, Loans, Pensions) unreachable
          on mobile.
        */}
        <section className="flex flex-col gap-[11px]">
          <div className="flex items-center gap-[10px] px-[2px]">
            <span className="flex-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">Services</span>
            <Link href="/services" className={seeAll}>See all</Link>
          </div>
          <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[4px]">
            <ListRow title="Bills Payment" subtitle="Airtime, data, electricity and cable" icon="Zap" href="/services/pay" />
            <ListRow title="Legal" subtitle="Register a business or book a lawyer" icon="Scale" href="/services/legal" />
          </div>
        </section>

        {/* Creator discovery — design D10's "Creators to watch" row. Desktop
            only: below xl this content lives on /explore/creators instead. */}
        <section className="hidden flex-col gap-[14px] xl:flex">
          <div className="flex items-end justify-between gap-3">
            <div className="flex flex-col gap-1">
              <span className={eyebrow}>Earning on WAWU now</span>
              <h2 className="text-[20px] font-semibold leading-snug tracking-[-0.015em] text-[var(--text-primary)]">
                Creators to watch
              </h2>
            </div>
            <Link href="/explore/creators" className={seeAll}>See all</Link>
          </div>
          <div className="grid grid-cols-4 gap-[18px]">
            {creators.slice(0, 4).map((creator) => (
              <CreatorGridCard key={creator.wawuId} creator={creator} />
            ))}
          </div>
        </section>

        {/* Events lives here, not in the nav. The bottom bar is locked at five
            slots for everyone and Create is a creator-only FAB — an event is
            neither, so Explore is its home, the same way Services reaches its
            own sub-tree from here on mobile. */}
        <ExploreEvents />

        <section className="flex flex-col gap-[11px]">
          <div className="flex items-center gap-[10px] px-[2px]">
            <span className="flex-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">Learn</span>
            <Link href="/learn" className={seeAll}>See all</Link>
          </div>
          <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[4px]">
            <ListRow title="Business Playbook" subtitle="96 pages · download anytime" icon="BookOpen" href="/learn" />
            <ListRow
              title="Courses and guides"
              subtitle={`${learnCourses.length} courses · ${countryGuideCount} country guides`}
              icon="GraduationCap"
              href="/learn"
            />
          </div>
        </section>

        {/*
          Shop is pulled off the live surface for now (product-owner
          instruction, 12 Sep 2026) — same reason it's `soon` on the landing
          page's services grid and ShopLayout gates the routes themselves.
          Held back entirely rather than shown disabled: this section is a
          list of links, and there is no "disabled row" treatment established
          anywhere else in the app to reuse for one (unlike the services grid's
          TileCard, which already has one). Restore this section, in place,
          when Shop reopens.
        */}

      </div>
    </div>
  );
}

const tileLink =
  "flex h-[72px] items-center gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] px-[14px] no-underline text-inherit hover:border-strong hover:bg-surface-hover active:bg-surface-press" as const;
const tileTitle = "whitespace-nowrap text-[14.5px] font-semibold text-[var(--text-primary)]" as const;
const tileSub = "whitespace-nowrap text-[12px] text-[var(--text-muted)]" as const;

function IconTile({ icon }: { icon: IconName }) {
  return (
    <span className="grid h-[40px] w-[40px] shrink-0 place-items-center rounded-[12px] border border-[var(--border-decor)] bg-[var(--decor-tint)]">
      <Icon name={icon} size={18} color="var(--accent)" />
    </span>
  );
}




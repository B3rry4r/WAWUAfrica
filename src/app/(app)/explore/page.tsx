import Link from "next/link";
import { getCategories, getCreators } from "@/lib/api/explore";
import { getCourses, getGuides } from "@/lib/api/learn";
import { formatNaira } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { HandoffPill } from "@/components/ui/HandoffPill";
import { ListRow } from "@/components/ui/ListRow";
import { CategoryFilterAside } from "./_components/CategoryFilterAside";
import { CreatorGridCard } from "./_components/CreatorGridCard";

const eyebrow = "px-[2px] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]" as const;
const seeAll = "text-[12.5px] font-semibold text-[var(--accent)]" as const;

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

        <section className="flex flex-col gap-[11px]">
          <span className={eyebrow}>Buy and sell</span>
          <div className="grid grid-cols-2 items-stretch gap-[12px] xl:gap-5">
            <ShopCard id="basket" />
            <ShopCard id="beauty" />
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

        <section className="flex flex-col gap-[11px]">
          <div className="flex items-center gap-[10px] px-[2px]">
            <span className="flex-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">Learn</span>
            <Link href="/learn" className={seeAll}>See all</Link>
          </div>
          <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[4px]">
            <ListRow title="Business Playbook" subtitle="96 pages · free to download" icon="BookOpen" href="/learn" />
            <ListRow
              title="Courses and guides"
              subtitle={`${learnCourses.length} courses · ${countryGuideCount} country guides`}
              icon="GraduationCap"
              href="/learn"
            />
          </div>
        </section>

        <section className="flex flex-col gap-[11px]">
          <div className="flex items-center gap-[10px] px-[2px]">
            <span className="flex-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">Services</span>
            <Link href="/services" className={seeAll}>See all</Link>
          </div>
          <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[4px]">
            <ListRow title="Bills Payment" subtitle="Airtime, data, electricity and cable" icon="Zap" href="/services/pay" />
            <ListRow title="Legal" subtitle="Register a business or book a lawyer" icon="Scale" href="/services/legal" />
            <ListRow title="CAC, NEPC, mentors and more" subtitle="Everything else WAWU can do for you" icon="Briefcase" href="/services" />
          </div>
        </section>
      </div>
    </div>
  );
}

const tileLink =
  "flex h-[72px] items-center gap-[12px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] px-[14px] no-underline text-inherit" as const;
const tileTitle = "whitespace-nowrap text-[14.5px] font-semibold text-[var(--text-primary)]" as const;
const tileSub = "whitespace-nowrap text-[12px] text-[var(--text-muted)]" as const;

function IconTile({ icon }: { icon: IconName }) {
  return (
    <span className="grid h-[40px] w-[40px] shrink-0 place-items-center rounded-[12px] border border-[var(--border-accent)] bg-[var(--accent-tint)]">
      <Icon name={icon} size={18} color="var(--accent)" />
    </span>
  );
}

/**
 * The two external storefronts.
 *
 * Categories are taken from each app's own catalogue — Basket's from its
 * category assets, Beauty's from Oja-Ewa's CategorySeeder — rather than the
 * invented taglines that were here before ("Fashion, food, art" for a grocery
 * app). Hardcoded for now because neither backend is running yet.
 *
 * SEAM: replace with GET /api/hub/marketplace/{shop}/categories once
 * WAWUBasket and WAWUBeauty are deployed.
 */
const SHOPS = {
  basket: {
    name: "WAWUBasket",
    logo: "/wawubasket-logo.png",
    tint: "#A9D636",
    tagline: "Food, groceries and fresh market",
    categories: ["Fresh Market", "Groceries", "Farm Produce", "Restaurants", "Drinks", "Snacks"],
  },
  beauty: {
    name: "WAWUBeauty",
    logo: "/wawubeauty-logo.png",
    tint: "#FF0084",
    tagline: "Beauty, textiles, shoes and art",
    categories: ["Afro Beauty Products", "Afro Beauty Services", "Textiles", "Shoes & Bags", "Art", "Sustainability"],
  },
} as const;

function ShopCard({ id }: { id: keyof typeof SHOPS }) {
  const shop = SHOPS[id];
  return (
    <Link
      href={`/marketplace/${id}`}
      className="flex flex-col gap-[11px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] no-underline xl:gap-[14px] xl:p-[22px]"
    >
      {/* The real mark, not a generic icon: these are separate products. */}
      <img src={shop.logo} alt={shop.name} className="h-[26px] w-auto self-start object-contain xl:h-[30px]" />
      <span className="text-[12.5px] leading-[1.4] text-[var(--text-secondary)]">{shop.tagline}</span>
      <div className="flex flex-wrap gap-[6px]">
        {shop.categories.slice(0, 4).map((c) => (
          <span
            key={c}
            className="inline-flex h-[24px] items-center rounded-[var(--radius-chip)] border px-[9px] text-[11.5px] text-[var(--text-secondary)]"
            style={{
              borderColor: `color-mix(in srgb, ${shop.tint} 35%, transparent)`,
              backgroundColor: `color-mix(in srgb, ${shop.tint} 12%, transparent)`,
            }}
          >
            {c}
          </span>
        ))}
      </div>
      <div className="mt-auto flex pt-[2px]">
        <HandoffPill app={shop.name} />
      </div>
    </Link>
  );
}


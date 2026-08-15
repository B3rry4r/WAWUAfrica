import Link from "next/link";
import { getCategories } from "@/lib/api/explore";
import { formatNaira } from "@/lib/format";
import { Icon } from "@/components/ui/Icon";
import type { IconName } from "@/components/ui/Icon";
import { HandoffPill } from "@/components/ui/HandoffPill";
import { ListRow } from "@/components/ui/ListRow";

const eyebrow = "px-[2px] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]" as const;
const seeAll = "text-[12.5px] font-semibold text-[var(--accent)]" as const;

export default async function ExplorePage() {
  const categories = await getCategories();

  return (
    <div className="flex flex-col gap-[18px]">
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
        <div className="grid grid-cols-2 items-stretch gap-[12px]">
          <ShopCard id="basket" />
          <ShopCard id="beauty" />
        </div>
      </section>

      <section className="flex flex-col gap-[11px]">
        <div className="flex items-center gap-[10px] px-[2px]">
          <span className="flex-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">Learn</span>
          <Link href="/learn" className={seeAll}>See all</Link>
        </div>
        <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[4px]">
          <ListRow title="Business Playbook" subtitle="96 pages · free to download" icon="BookOpen" href="/learn" />
          <ListRow title="Courses and guides" subtitle="24 courses · 12 country guides" icon="GraduationCap" href="/learn" />
        </div>
      </section>

      <section className="flex flex-col gap-[11px]">
        <div className="flex items-center gap-[10px] px-[2px]">
          <span className="flex-1 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">Services</span>
          <Link href="/services" className={seeAll}>See all</Link>
        </div>
        <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[4px]">
          <ListRow title="CAC registration" subtitle={`From ${formatNaira(25000)} · 7 to 14 days`} icon="Stamp" href="/services" />
          <ListRow title="NEPC, mentors and more" subtitle="3 open · 4 coming with Pro" icon="Briefcase" href="/services" />
        </div>
      </section>
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

const SHOPS = {
  basket: { name: "WAWUBasket", tagline: "Fashion, food, art", stat: "4,120 items", icon: "ShoppingBag" },
  beauty: { name: "WAWUBeauty", tagline: "Hair, nails, skin", stat: "890 services", icon: "Scissors" },
} as const satisfies Record<string, { name: string; tagline: string; stat: string; icon: IconName }>;

function ShopCard({ id }: { id: keyof typeof SHOPS }) {
  const shop = SHOPS[id];
  return (
    <Link
      href={`/marketplace/${id}`}
      className="flex flex-col gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] no-underline"
    >
      <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[12px] border border-[var(--border-accent)] bg-[var(--accent-tint)]">
        <Icon name={shop.icon} size={18} color="var(--accent)" />
      </span>
      <span className="text-[15.5px] font-semibold text-[var(--text-primary)]">{shop.name}</span>
      <span className="flex-1 text-[12.5px] leading-[1.4] text-[var(--text-secondary)]">{shop.tagline}</span>
      <div className="flex">
        <HandoffPill app={shop.name} />
      </div>
      <span className="text-[11.5px] text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">{shop.stat}</span>
    </Link>
  );
}

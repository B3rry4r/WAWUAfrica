import Link from "next/link";
import type { ExploreCategoryId } from "@/types/explore";
import { EXPLORE_CATEGORIES } from "@/types/explore";

const rowBase = "rounded-[12px] px-[14px] py-[9px] text-[13.5px] capitalize no-underline transition-colors";
const rowOn = "bg-[var(--selected-tint)] font-semibold text-[var(--accent)]";
const rowOff = "font-medium text-[var(--text-secondary)] hover:bg-state-hover";

/**
 * Desktop-only (design D10) content-area category filter — a second, page-
 * level aside distinct from the app Sidebar (that one is frozen shell infra
 * and never carries categories). Shared by the Explore landing's xl layout
 * and /explore/creators' xl layout so the two stay pixel-identical without
 * forking the list. Hidden below xl — mobile keeps its existing tiles /
 * chip scroller / dedicated /explore/categories page untouched.
 */
export function CategoryFilterAside({ activeCategory }: { activeCategory?: ExploreCategoryId }) {
  return (
    <aside className="hidden xl:flex xl:w-[220px] xl:shrink-0 xl:flex-col xl:gap-[2px]">
      <span className="px-[14px] pb-[8px] text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
        Categories
      </span>
      <Link href="/explore/creators" className={`${rowBase} ${activeCategory ? rowOff : rowOn}`}>
        All creators
      </Link>
      {EXPLORE_CATEGORIES.map((category) => (
        <Link
          key={category.id}
          href={`/explore/creators?category=${category.id}`}
          className={`${rowBase} ${activeCategory === category.id ? rowOn : rowOff}`}
        >
          {category.name}
        </Link>
      ))}
      <Link
        href="/explore/categories"
        className="mt-2 px-[14px] py-[6px] text-[12.5px] font-semibold text-[var(--accent)] no-underline"
      >
        All {EXPLORE_CATEGORIES.length} categories
      </Link>
    </aside>
  );
}

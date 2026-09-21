import Link from "next/link";
import { Icon, type IconName } from "@/components/ui";
import { CATEGORIES_BY_ROLE } from "@/lib/taxonomy/taxonomy";

/**
 * The category row at the top of Explore, built to the reference
 * (refs/target-explore-desktop-structure.jpg).
 *
 * WHAT THE REFERENCE DRAWS. Eight tiles on ONE line, equal width, each a
 * bordered card with an icon above its label: All, Music, Film & Video, Art &
 * Design, Sports, Fashion, Writing, More. The eighth is "More" and it opens
 * the full index.
 *
 * WHERE THOSE NAMES COME FROM, which I had wrong. They are the C1 CREATOR
 * categories (Music & Audio, Film & Video, Art & Design, ...), not the
 * deprecated flat twenty-five the old explore list used. Driving the row off
 * the old list produced "Agriculture & Food", "Trade & Commerce", "Business &
 * Entrepreneurship" - names that wrap to two lines, do not match the
 * reference, and come from the taxonomy build brief C1 exists to replace.
 *
 * WHAT WAS THERE BEFORE THAT. A permanent left-hand aside listing all
 * twenty-five down the side of the desktop page, plus a separate scrolling
 * chip rail on mobile: two controls for one filter, neither of them the
 * reference, and the aside ate a third of the width of every section below.
 */

/** Six plus "All" plus "More" is the reference's eight across. */
const TILE_COUNT = 6;

/**
 * One glyph per creator category. Keyed by the taxonomy's stable id, never
 * by its label, which is copy and can be reworded.
 */
const CATEGORY_ICON: Record<string, IconName> = {
  "music-audio": "Music",
  "film-video": "Clapperboard",
  "art-design": "Palette",
  photography: "Camera",
  "fashion-beauty": "Shirt",
  "writing-publishing": "PenLine",
  "media-content": "Radio",
  "gaming-esports": "Gamepad2",
  "sports-fitness": "Dumbbell",
  "education-knowledge": "GraduationCap",
  "business-finance": "TrendingUp",
  technology: "Cpu",
  "food-lifestyle": "UtensilsCrossed",
  "travel-adventure": "Plane",
  "faith-spirituality": "Church",
};

export function CategoryTiles({ active }: { active?: string }) {
  const shown = CATEGORIES_BY_ROLE.creator.slice(0, TILE_COUNT);

  return (
    <div className="-mx-[16px] px-[16px] xl:mx-0 xl:px-0">
      <div className="wawu-no-scrollbar grid grid-flow-col auto-cols-[minmax(92px,1fr)] gap-[10px] overflow-x-auto pb-[2px] xl:auto-cols-auto xl:grid-flow-row xl:grid-cols-8">
        <Tile href="/explore/categories" icon="LayoutGrid" label="All" selected={!active} />
        {shown.map((c) => (
          <Tile
            key={c.id}
            href={`/explore/categories?category=${c.id}`}
            icon={CATEGORY_ICON[c.id] ?? "Tag"}
            label={c.label}
            selected={active === c.id}
          />
        ))}
        <Tile href="/explore/categories" icon="Ellipsis" label="More" selected={false} />
      </div>
    </div>
  );
}

function Tile({
  href,
  icon,
  label,
  selected,
}: {
  href: string;
  icon: IconName;
  label: string;
  selected: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={selected ? "page" : undefined}
      className={[
        "flex h-[84px] flex-col items-center justify-center gap-[7px] rounded-[var(--radius-card)] border px-[8px] text-center no-underline transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--surface-page)]",
        selected
          ? "border-[var(--border-selected)] bg-[var(--selected-tint)]"
          : "border-[var(--border-hairline)] bg-[var(--surface-card)] hover:border-strong hover:bg-surface-hover",
      ].join(" ")}
    >
      {/*
        One accent, not the reference's six hues. Build brief A5 is explicit
        that purple and lilac carry emphasis and the only other permitted
        colours are semantic, so the reference's per-tile colouring is the one
        thing here deliberately not copied. See DECISIONS.md D10.
      */}
      <Icon name={icon} size={20} color="var(--accent)" strokeWidth={1.9} />
      <span className="line-clamp-2 text-[11px] font-medium leading-tight text-[var(--text-primary)]">
        {label}
      </span>
    </Link>
  );
}

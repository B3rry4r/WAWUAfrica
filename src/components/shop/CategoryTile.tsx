"use client";

import Link from "next/link";
import {
  PRODUCT_CATEGORY_EMOJI,
  PRODUCT_CATEGORY_HUE,
  PRODUCT_CATEGORY_LABEL,
  type ProductCategory,
} from "@/types/shop";

/**
 * A big category tile.
 *
 * The brief asks for "big category cards, large imagery, minimal text" and the
 * first pass shipped the opposite — short text rows with a 22px emoji, where
 * "Computing & Creator Tech" wrapped onto two lines and every tile looked like
 * every other tile. This is the fix: a tall tile, an oversized glyph, one line
 * of text, and a colour that belongs to the aisle.
 *
 * ── THE COLOUR IS A GLOW, NOT A FILL ───────────────────────────────────────
 * Several of the brand hues (lemon, lime, yellow) are bright, so white label
 * text on a solid tile of them would fail contrast — and a per-category text
 * colour is a rule every future call site has to remember and one of them
 * will not. The hue lives in a radial glow behind a dark tile and in the
 * emoji's disc, so the label is white on dark every time while each aisle
 * still reads as its own.
 *
 * The glyph is `aria-hidden`: the label beside it already names the aisle, and
 * a screen reader does not need to be told there is a picture of a camera.
 */
export function CategoryTile({ category }: { category: ProductCategory }) {
  const hue = PRODUCT_CATEGORY_HUE[category];

  return (
    <Link
      href={`/shop/browse/${category}`}
      className={[
        "group relative flex flex-col justify-end overflow-hidden rounded-[var(--radius-card)]",
        "border border-[var(--border-hairline)] bg-[var(--surface-card)] no-underline",
        "transition-all duration-200 hover:-translate-y-[3px] hover:border-[var(--border-strong)]",
        "h-[128px] p-[13px] xl:h-[148px] xl:p-[15px]",
      ].join(" ")}
    >
      {/* The aisle's colour. Sits behind everything and lifts on hover. */}
      <span
        aria-hidden
        className={`pointer-events-none absolute -right-[18%] -top-[46%] h-[135%] w-[85%] rounded-full opacity-[0.30] blur-[30px] transition-opacity duration-200 group-hover:opacity-[0.46] ${hue}`}
      />

      <span
        aria-hidden
        className={[
          "relative mb-auto grid place-items-center rounded-full",
          "h-[42px] w-[42px] text-[22px] xl:h-[46px] xl:w-[46px] xl:text-[24px]",
          hue,
        ].join(" ")}
      >
        {PRODUCT_CATEGORY_EMOJI[category]}
      </span>

      <span
        className="relative text-[13.5px] font-bold leading-[1.2] tracking-[-0.01em] text-[var(--text-primary)] xl:text-[15px]" 
      >
        {PRODUCT_CATEGORY_LABEL[category]}
      </span>
    </Link>
  );
}

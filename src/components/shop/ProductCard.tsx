"use client";

import Link from "next/link";
import { formatNaira } from "@/lib/format";
import type { Product } from "@/types/shop";
import { Icon } from "@/components/ui";

/**
 * One product, as a card.
 *
 * ── WHAT WAS WRONG WITH THE FIRST VERSION ──────────────────────────────────
 * Two badges stacked on every image in clashing colours, a solid purple
 * full-width button on every card, and a dense brand/name/price/strikethrough
 * block underneath. Four of them in a grid was a wall of purple bars, which is
 * the opposite of the "large imagery, minimal text" the brief asks for.
 *
 * Now: ONE badge, a taller image, and an add button that is outlined at rest
 * and fills on hover — so the grid reads as photographs with prices, and the
 * accent colour means "the thing I am about to press" rather than appearing
 * eight times per screen.
 *
 * WAWU VERIFIED WINS when both apply. It is a claim about the item being
 * genuine, which is what somebody about to spend ₦4m needs; "WAWU pick" is an
 * editorial opinion and can wait for the product page. On the picks shelf the
 * pick badge is suppressed entirely by `hidePickBadge` — every card there is a
 * pick, so saying so on each one is noise.
 *
 * NO RATING IS RENDERED, because there is none. The brief's card shows
 * "⭐ 4.8"; there is no review system, so `ratingAvg` is null on every
 * product. Printing a plausible number would be inventing social proof on
 * somebody's biggest purchase of the year. The slot appears on its own the day
 * reviews exist.
 *
 * SOLD OUT IS ON THE IMAGE, not in a caption. People scan pictures, and
 * finding out at the cart is worse than finding out here.
 *
 * The image is a plain <img>: URLs are admin-supplied and arbitrary, and
 * next/image would need every possible host allow-listed before it rendered.
 */
export function ProductCard({
  product,
  onAdd,
  busy,
  hidePickBadge,
}: {
  product: Product;
  /** Omitted on surfaces where adding is not offered. */
  onAdd?: (product: Product) => void;
  busy?: boolean;
  /** True on the picks shelf, where "WAWU pick" is tautological. */
  hidePickBadge?: boolean;
}) {
  const image = product.images[0] ?? null;
  const badge = product.wawuVerified
    ? ("verified" as const)
    : product.wawuPick && !hidePickBadge
      ? ("pick" as const)
      : null;

  return (
    <article className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] transition-all duration-200 hover:-translate-y-[3px] hover:border-[var(--border-strong)]">
      <Link
        href={`/shop/product/${product.slug}`}
        className="relative block aspect-[4/5] overflow-hidden bg-[var(--surface-page)]"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.05]"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <Icon name="Image" size={30} color="var(--text-muted)" />
          </span>
        )}

        {!product.inStock ? (
          <span className="absolute inset-0 flex items-center justify-center bg-[var(--surface-scrim)]">
            <span className="rounded-full bg-[var(--surface-card)] px-[14px] py-[7px] text-[11.5px] font-bold uppercase tracking-[0.06em] text-[var(--text-primary)]">
              Sold out
            </span>
          </span>
        ) : null}

        {/* One badge. See the note above on which wins. */}
        {badge === "verified" ? (
          <span className="absolute left-[9px] top-[9px] inline-flex items-center gap-[4px] rounded-full bg-[var(--surface-chrome)] px-[8px] py-[4px] text-[10px] font-bold uppercase tracking-[0.04em] text-[var(--text-primary)] backdrop-blur">
            <Icon name="BadgeCheck" size={11} color="var(--accent-soft)" strokeWidth={2.6} />
            Verified
          </span>
        ) : badge === "pick" ? (
          <span className="absolute left-[9px] top-[9px] rounded-full bg-[var(--surface-chrome)] px-[8px] py-[4px] text-[10px] font-bold uppercase tracking-[0.04em] text-[var(--accent-soft)] backdrop-blur">
            WAWU pick
          </span>
        ) : null}

      </Link>

      <div className="flex flex-1 flex-col gap-[9px] p-[12px]">
        <Link
          href={`/shop/product/${product.slug}`}
          className="line-clamp-2 text-[13.5px] font-semibold leading-[1.35] text-[var(--text-primary)] no-underline hover:text-[var(--accent-soft)]"
        >
          {product.name}
        </Link>

        {/*
          The rating slot from the brief. Renders only when a real average
          exists — see the component note. Today that is never.
        */}
        {product.ratingAvg !== null ? (
          <span className="flex items-center gap-[5px] text-[12px] text-[var(--text-secondary)]">
            <Icon name="Star" size={13} color="var(--warning)" />
            {product.ratingAvg.toFixed(1)}
            <span className="text-[var(--text-muted)]">({product.ratingCount})</span>
          </span>
        ) : null}

        <div className="mt-auto flex flex-col gap-[9px]">
          {/*
            The saving sits HERE, beside the number it modifies, and not as a
            second pill on the image. Two badges in opposite corners of a
            165px-wide card on a phone overlap and clip each other — which is
            exactly what the first version did.
          */}
          <div className="flex flex-wrap items-baseline gap-[7px]">
            <span className="text-[15.5px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
              {formatNaira(product.priceNaira)}
            </span>
            {product.compareAtNaira ? (
              <>
                <span className="text-[12px] text-[var(--text-muted)] line-through">
                  {formatNaira(product.compareAtNaira)}
                </span>
                <span className="text-[11.5px] font-bold text-[var(--success)]">
                  Save {formatNaira(product.compareAtNaira - product.priceNaira)}
                </span>
              </>
            ) : null}
          </div>

          {product.lowStock && product.inStock ? (
            <span className="text-[11px] font-semibold text-[var(--warning)]">
              Only a few left
            </span>
          ) : null}

          {onAdd ? (
            <button
              type="button"
              disabled={!product.inStock || busy}
              onClick={() => onAdd(product)}
              className={[
                "flex h-[38px] w-full items-center justify-center gap-[6px] rounded-button border text-[12.5px] font-bold transition-all active:scale-[0.98]",
                product.inStock
                  ? // Outlined at rest, accent on hover. Eight solid purple bars
                    // on one screen is what made the first grid shout.
                    "border-[var(--border-strong)] bg-transparent text-[var(--text-primary)] hover:border-[var(--accent)] hover:bg-[var(--accent)] hover:text-[var(--text-on-accent)]"
                  : "cursor-not-allowed border-[var(--border-hairline)] bg-transparent text-[var(--text-muted)]",
              ].join(" ")}
            >
              {product.inStock ? (
                <>
                  <Icon name="ShoppingCart" size={14} color="currentColor" strokeWidth={2.3} />
                  {busy ? "Adding…" : "Add to WOW"}
                </>
              ) : (
                "Sold out"
              )}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}

"use client";

import Link from "next/link";
import { formatNaira } from "@/lib/format";
import type { Product } from "@/types/shop";
import { Icon, StatusPill } from "@/components/ui";

/**
 * One product, as a card.
 *
 * The brief asks for "large imagery, minimal text" and a card carrying: image,
 * WAWU VERIFIED, name, rating, price, ADD TO WOW. Four decisions in here are
 * not cosmetic.
 *
 * NO RATING IS RENDERED, because there is none. The brief's card shows
 * "⭐ 4.8"; there is no review system on this platform, so every product's
 * `ratingAvg` is null. Printing a plausible number would be inventing social
 * proof on an item somebody is about to spend six figures on. The slot simply
 * does not appear until reviews exist, at which point this renders it.
 *
 * SOLD OUT IS ON THE IMAGE, not in a corner. Somebody scanning a grid reads
 * pictures, not captions, and finding out at the cart is worse than finding
 * out here. The card stays a link — a sold-out product still has a page worth
 * reading — but its action changes.
 *
 * A "WAS" PRICE IS ONLY SHOWN WHEN IT IS REAL. `compareAtNaira` is guaranteed
 * by the backend to exceed the price, so this cannot render a discount that is
 * not one.
 *
 * THE IMAGE IS A PLAIN <img>. The URLs are admin-supplied and arbitrary, and
 * next/image would need every possible host allow-listed in next.config before
 * it would render at all.
 */
export function ProductCard({
  product,
  onAdd,
  busy,
}: {
  product: Product;
  /** Omitted on surfaces where adding is not offered. */
  onAdd?: (product: Product) => void;
  busy?: boolean;
}) {
  const image = product.images[0] ?? null;

  return (
    <article className="group flex flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] transition-colors hover:border-[var(--accent)]">
      <Link
        href={`/shop/product/${product.slug}`}
        className="relative block aspect-square overflow-hidden bg-[var(--surface-page)]"
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt=""
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center">
            <Icon name="Image" size={30} color="var(--text-muted)" />
          </span>
        )}

        {!product.inStock ? (
          <span className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.55)]">
            <span className="rounded-full bg-[var(--surface-card)] px-[14px] py-[7px] text-[12px] font-bold uppercase tracking-[0.06em] text-[var(--text-primary)]">
              Sold out
            </span>
          </span>
        ) : null}

        <span className="absolute left-[10px] top-[10px] flex flex-col gap-[6px]">
          {product.wawuVerified ? (
            <span className="inline-flex items-center gap-[5px] rounded-full bg-[var(--accent)] px-[9px] py-[4px] text-[10.5px] font-bold uppercase tracking-[0.04em] text-[var(--text-on-accent)]">
              <Icon name="BadgeCheck" size={12} color="currentColor" strokeWidth={2.4} />
              WAWU Verified
            </span>
          ) : null}
          {product.wawuPick ? (
            <StatusPill kind="info" size="xs">
              WAWU pick
            </StatusPill>
          ) : null}
        </span>
      </Link>

      <div className="flex flex-1 flex-col gap-[10px] p-[13px]">
        <div className="flex flex-col gap-[3px]">
          {product.brand ? (
            <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)]">
              {product.brand}
            </span>
          ) : null}
          <Link
            href={`/shop/product/${product.slug}`}
            className="line-clamp-2 text-[14px] font-semibold leading-[1.35] text-[var(--text-primary)] no-underline hover:text-[var(--accent)]"
          >
            {product.name}
          </Link>
        </div>

        {/*
          The rating slot from the brief. It renders only when a real average
          exists — see the component note. Today that is never.
        */}
        {product.ratingAvg !== null ? (
          <span className="flex items-center gap-[5px] text-[12px] text-[var(--text-secondary)]">
            <Icon name="Star" size={13} color="var(--warning)" />
            {product.ratingAvg.toFixed(1)}
            <span className="text-[var(--text-muted)]">({product.ratingCount})</span>
          </span>
        ) : null}

        <div className="mt-auto flex flex-col gap-[10px]">
          <div className="flex flex-wrap items-baseline gap-[8px]">
            <span className="text-[16px] font-bold tracking-[-0.01em] text-[var(--text-primary)]">
              {formatNaira(product.priceNaira)}
            </span>
            {product.compareAtNaira ? (
              <span className="text-[12.5px] text-[var(--text-muted)] line-through">
                {formatNaira(product.compareAtNaira)}
              </span>
            ) : null}
          </div>

          {product.lowStock && product.inStock ? (
            <span className="text-[11.5px] font-semibold text-[var(--warning)]">
              Only a few left
            </span>
          ) : null}

          {onAdd ? (
            <button
              type="button"
              disabled={!product.inStock || busy}
              onClick={() => onAdd(product)}
              className={[
                "flex h-[40px] w-full items-center justify-center gap-[7px] rounded-button text-[13px] font-bold transition-all active:scale-[0.98]",
                product.inStock
                  ? "bg-[var(--accent)] text-[var(--text-on-accent)] hover:bg-accent-hover"
                  : "cursor-not-allowed bg-[var(--surface-tag)] text-[var(--text-muted)]",
              ].join(" ")}
            >
              {product.inStock ? (
                <>
                  <Icon name="ShoppingCart" size={15} color="currentColor" strokeWidth={2.3} />
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

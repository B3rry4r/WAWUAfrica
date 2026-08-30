"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProduct, listProducts } from "@/lib/api/shop";
import { describeError } from "@/lib/api/errors";
import { formatNaira } from "@/lib/format";
import { useSession } from "@/lib/auth/session-provider";
import {
  MAX_QUANTITY_PER_LINE,
  PRODUCT_CATEGORY_LABEL,
  type Product,
} from "@/types/shop";
import { Button, Callout, ErrorState, Icon, Skeleton, StatusPill } from "@/components/ui";
import { ProductCard } from "./ProductCard";
import { ShopHeader } from "./ShopHeader";
import { useWowCart } from "./WowCartProvider";

/**
 * One product, in full.
 *
 * ── SIGNED OUT IS NOT AN ERROR ─────────────────────────────────────────────
 * Browsing is public, so a stranger reaches this page from a shared link. The
 * add button becomes a sign-in link rather than failing when pressed — the
 * page's job is to sell, and a dead button on a product page is a lost sale
 * with no explanation attached.
 *
 * ── NO FABRICATED RATING, NO FABRICATED SPEC TABLE ─────────────────────────
 * The only facts here are the ones the dashboard actually captured. A "4.8
 * from 132 reviews" or an invented specifications block would make the page
 * feel finished while stating things nobody entered.
 */
export function ProductDetail({ slug }: { slug: string }) {
  const { user, hydrated } = useSession();
  const signedIn = Boolean(user?.wawuId);
  const { add, addingId, cart } = useWowCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [related, setRelated] = useState<Product[]>([]);

  useEffect(() => {
    let active = true;
    setProduct(null);
    setError(null);
    setImageIndex(0);
    setQuantity(1);
    getProduct(slug)
      .then((p) => {
        if (!active) return;
        setProduct(p);
        return listProducts({ category: p.category, perPage: 5 }).then((page) => {
          if (!active) return;
          setRelated(page.products.filter((r) => r.id !== p.id).slice(0, 4));
        });
      })
      .catch((e) => active && setError(e));
    return () => {
      active = false;
    };
  }, [slug]);

  if (error) {
    return (
      <Shell>
        <ErrorState title="This product could not be loaded" error={error} />
      </Shell>
    );
  }

  if (!product) {
    return (
      <Shell>
        <div className="flex flex-col gap-[18px] xl:flex-row">
          <Skeleton className="aspect-square w-full rounded-card xl:w-[46%]" />
          <div className="flex flex-1 flex-col gap-[12px]">
            <Skeleton className="h-[30px] w-[70%]" />
            <Skeleton className="h-[22px] w-[40%]" />
            <Skeleton className="h-[120px] w-full" />
          </div>
        </div>
      </Shell>
    );
  }

  const inCart = cart?.items.find((i) => i.product.id === product.id)?.quantity ?? 0;

  return (
    <Shell>
      <ShopHeader title={PRODUCT_CATEGORY_LABEL[product.category]} />

      <div className="flex flex-col gap-[22px] xl:flex-row xl:items-start xl:gap-[36px]">
        {/* ---- gallery ---- */}
        <div className="flex w-full flex-col gap-[10px] xl:w-[46%] xl:shrink-0">
          <div className="relative aspect-square overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-page)]">
            {product.images[imageIndex] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.images[imageIndex]}
                alt={product.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center">
                <Icon name="Image" size={38} color="var(--text-muted)" />
              </span>
            )}
            {!product.inStock ? (
              <span className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.55)]">
                <span className="rounded-full bg-[var(--surface-card)] px-[16px] py-[8px] text-[13px] font-bold uppercase tracking-[0.06em] text-[var(--text-primary)]">
                  Sold out
                </span>
              </span>
            ) : null}
          </div>

          {product.images.length > 1 ? (
            <div className="flex gap-[8px]">
              {product.images.map((src, i) => (
                <button
                  key={src}
                  type="button"
                  aria-label={`Image ${i + 1}`}
                  onClick={() => setImageIndex(i)}
                  className={`h-[62px] w-[62px] overflow-hidden rounded-[var(--radius-input)] border-2 ${
                    i === imageIndex ? "border-[var(--accent)]" : "border-[var(--border-hairline)]"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {/* ---- the buy column ---- */}
        <div className="flex min-w-0 flex-1 flex-col gap-[16px]">
          <div className="flex flex-col gap-[8px]">
            <div className="flex flex-wrap items-center gap-[8px]">
              {product.wawuVerified ? (
                <span className="inline-flex items-center gap-[5px] rounded-full bg-[var(--accent)] px-[10px] py-[5px] text-[11px] font-bold uppercase tracking-[0.04em] text-[var(--text-on-accent)]">
                  <Icon name="BadgeCheck" size={13} color="currentColor" strokeWidth={2.4} />
                  WAWU Verified
                </span>
              ) : null}
              {product.wawuPick ? <StatusPill kind="info" size="sm">WAWU pick</StatusPill> : null}
              <Link
                href={`/shop/browse/${product.category}`}
                className="text-[12px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary"
              >
                {product.subcategory}
              </Link>
            </div>

            {product.brand ? (
              <span className="text-[12.5px] font-semibold uppercase tracking-[0.05em] text-[var(--text-muted)]">
                {product.brand}
              </span>
            ) : null}
            <h1 className="m-0 text-[23px] font-bold leading-[1.2] tracking-[-0.02em] text-[var(--text-primary)] xl:text-[30px]">
              {product.name}
            </h1>
          </div>

          <div className="flex flex-wrap items-baseline gap-[10px]">
            <span className="text-[26px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
              {formatNaira(product.priceNaira)}
            </span>
            {product.compareAtNaira ? (
              <>
                <span className="text-[15px] text-[var(--text-muted)] line-through">
                  {formatNaira(product.compareAtNaira)}
                </span>
                <StatusPill kind="success" size="sm">
                  Save {formatNaira(product.compareAtNaira - product.priceNaira)}
                </StatusPill>
              </>
            ) : null}
          </div>

          {product.lowStock && product.inStock ? (
            <Callout tone="warning" title="Only a few left" full>
              We are down to the last of these.
            </Callout>
          ) : null}

          {/* ---- add ---- */}
          {!hydrated ? null : !signedIn ? (
            <div className="flex flex-col gap-[10px]">
              <Button href={`/sign-in?next=/shop/product/${product.slug}`} full size="lg">
                Sign in to buy
              </Button>
              <p className="m-0 text-[12px] text-[var(--text-muted)]">
                Browsing is open to everyone. You need an account to add anything to your WOW.
              </p>
            </div>
          ) : product.inStock ? (
            <div className="flex flex-col gap-[12px]">
              <div className="flex items-center justify-between gap-[12px]">
                <span className="text-[13px] font-semibold text-[var(--text-secondary)]">How many</span>
                <div className="flex items-center gap-[10px]">
                  <button
                    type="button"
                    aria-label="One fewer"
                    disabled={quantity <= 1}
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface-input)] text-[var(--text-primary)] disabled:opacity-40"
                  >
                    <Icon name="Minus" size={15} color="currentColor" />
                  </button>
                  <span className="min-w-[26px] text-center text-[16px] font-semibold text-[var(--text-primary)]">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    aria-label="One more"
                    disabled={quantity >= MAX_QUANTITY_PER_LINE}
                    onClick={() => setQuantity((q) => Math.min(MAX_QUANTITY_PER_LINE, q + 1))}
                    className="flex h-[36px] w-[36px] items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface-input)] text-[var(--text-primary)] disabled:opacity-40"
                  >
                    <Icon name="Plus" size={15} color="currentColor" />
                  </button>
                </div>
              </div>

              <Button
                full
                size="lg"
                icon="ShoppingCart"
                loading={addingId === product.id}
                disabled={addingId === product.id}
                onClick={() => void add(product, quantity)}
              >
                Add to WOW
              </Button>

              {inCart > 0 ? (
                <Link
                  href="/shop/wow"
                  className="text-center text-[13px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary"
                >
                  {inCart} already in your WOW — view it
                </Link>
              ) : null}
            </div>
          ) : (
            <Callout tone="neutral" title="Sold out" full>
              This one has gone. Nothing has been reserved and you have not been charged.
            </Callout>
          )}

          <div className="flex flex-col gap-[8px]">
            <span className="text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
              About this
            </span>
            <p className="m-0 whitespace-pre-line text-[14.5px] leading-[1.6] text-[var(--text-secondary)]">
              {product.description}
            </p>
          </div>

          {/*
            Said plainly on the product page rather than discovered at
            checkout. Delivery is arranged by hand, so somebody buying a
            ₦3m camera should know that before they pay, not after.
          */}
          <div className="flex gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px]">
            <Icon name="Truck" size={19} color="var(--accent)" />
            <div className="flex min-w-0 flex-col gap-[2px]">
              <span className="text-[13.5px] font-semibold text-[var(--text-primary)]">
                Delivery is arranged with you
              </span>
              <span className="text-[12.5px] leading-[1.5] text-[var(--text-secondary)]">
                We get in touch after you order and sort delivery directly — nothing extra is
                charged at checkout.
              </span>
            </div>
          </div>
        </div>
      </div>

      {related.length > 0 ? (
        <section className="flex flex-col gap-[12px]">
          <h2 className="m-0 text-[16.5px] font-bold tracking-[-0.02em] text-[var(--text-primary)]">
            More in {PRODUCT_CATEGORY_LABEL[product.category]}
          </h2>
          <div className="grid grid-cols-2 gap-[12px] xl:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-[22px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[1180px] xl:p-[26px_28px_64px]">
      {children}
    </div>
  );
}

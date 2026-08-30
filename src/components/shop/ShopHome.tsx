"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listProducts } from "@/lib/api/shop";
import { describeError } from "@/lib/api/errors";
import { BUDGET_BANDS, PRODUCT_CATEGORIES, type Product } from "@/types/shop";
import { Callout, Skeleton } from "@/components/ui";
import { CategoryTile } from "./CategoryTile";
import { ProductCard } from "./ProductCard";
import { ShopHeader } from "./ShopHeader";
import { useWowCart } from "./WowCartProvider";

/**
 * The storefront front page.
 *
 * The brief's hero asks "WHAT ARE YOU CREATING?" and then recommends a setup
 * at three budgets. THE RECOMMENDER IS NOT BUILT — the product owner asked for
 * the storefront first and the specialisation later — so the question is kept
 * and answered by taking somebody to the right aisle, which is a real answer
 * rather than a placeholder for one. When "Build my setup" arrives it slots in
 * behind the same question.
 *
 * Budget is a CEILING, not a band: somebody with ₦150,000 wants to see
 * everything they can afford, not only the things near the top of it. A band
 * would hide the cheaper thing that is exactly right.
 */
export function ShopHome() {
  const { add, addingId } = useWowCart();
  const [picks, setPicks] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listProducts({ wawuPick: true, perPage: 10 })
      .then((page) => active && setPicks(page.products))
      .catch((e) => active && setError(describeError(e).body));
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="flex flex-col gap-[26px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[1180px] xl:p-[26px_28px_64px]">
      <div className="flex items-center gap-[12px]">
        <h1 className="m-0 flex-1 text-[20px] font-semibold tracking-[-0.02em] text-[var(--text-primary)] xl:text-[26px]">
          Shop
        </h1>
        <ShopHeader />
      </div>

      {/*
        The hero question, unboxed.
        It used to sit inside a bordered violet panel with the tiles crammed
        in beside it, which made the biggest thing on the page look like a
        notice. The question is now type on the page, and the tiles are the
        visual — which is the way round the brief asks for.
      */}
      <section className="flex flex-col gap-[18px]">
        <div className="flex flex-col gap-[8px]">
          <h2 className="m-0 max-w-[16ch] text-[30px] font-bold leading-[1.08] tracking-[-0.035em] text-[var(--text-primary)] xl:text-[46px]">
            What are you creating?
          </h2>
          <p className="m-0 max-w-[52ch] text-[14px] leading-[1.55] text-[var(--text-secondary)] xl:text-[16px]">
            Pick what you make. We will show you the kit for it — starter to pro.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-[11px] sm:grid-cols-3 xl:grid-cols-4">
          {/*
            One size, deliberately. Making the first two taller looked good in
            isolation and wrong in the grid: a CSS grid row is as tall as its
            tallest cell, so the short tiles beside them sat top-aligned with
            dead space underneath and the first row read as broken.
          */}
          {PRODUCT_CATEGORIES.map((category) => (
            <CategoryTile key={category} category={category} />
          ))}
        </div>
      </section>

      {/* ---- shop by budget ---- */}
      <section className="flex flex-col gap-[12px]">
        <SectionTitle
          title="Shop by budget"
          caption="Everything you can afford, not just the top of the range."
        />
        <div className="-mx-[16px] overflow-x-auto px-[16px] xl:mx-0 xl:overflow-visible xl:px-0">
          <div className="flex w-max gap-[10px] xl:w-full">
            {BUDGET_BANDS.map((band) => (
              <Link
                key={band.maxPriceNaira}
                href={`/shop/browse/all?max=${band.maxPriceNaira}`}
                className="flex h-[44px] shrink-0 items-center rounded-full border border-[var(--border-strong)] bg-transparent px-[20px] text-[13.5px] font-bold text-[var(--text-primary)] no-underline transition-all hover:border-[var(--accent)] hover:bg-[var(--accent-tint)] xl:flex-1 xl:justify-center"
              >
                {band.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ---- WAWU picks ---- */}
      <section className="flex flex-col gap-[12px]">
        <SectionTitle
          title="WAWU picks"
          caption="Kit we would put in our own studio."
          href="/shop/browse/all?picks=1"
        />
        {error ? (
          <Callout tone="warning" title="The shop could not be loaded">
            {error}
          </Callout>
        ) : picks === null ? (
          <div className="grid grid-cols-2 gap-[12px] sm:grid-cols-3 xl:grid-cols-5">
            {[0, 1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[300px] rounded-card" />
            ))}
          </div>
        ) : picks.length === 0 ? (
          <p className="m-0 text-[13.5px] text-[var(--text-muted)]">
            Nothing is picked out just yet. Browse the aisles above.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-[12px] sm:grid-cols-3 xl:grid-cols-5">
            {picks.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onAdd={(product) => void add(product)}
                busy={addingId === p.id}
                hidePickBadge
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function SectionTitle({
  title,
  caption,
  href,
}: {
  title: string;
  caption?: string;
  href?: string;
}) {
  return (
    <div className="flex items-end gap-[12px]">
      <div className="flex min-w-0 flex-1 flex-col gap-[2px]">
        <h2 className="m-0 text-[16.5px] font-bold tracking-[-0.02em] text-[var(--text-primary)] xl:text-[19px]">
          {title}
        </h2>
        {caption ? (
          <p className="m-0 text-[12.5px] text-[var(--text-muted)]">{caption}</p>
        ) : null}
      </div>
      {href ? (
        <Link
          href={href}
          className="shrink-0 text-[12.5px] font-semibold text-[var(--accent)] no-underline hover:text-text-primary"
        >
          See all
        </Link>
      ) : null}
    </div>
  );
}

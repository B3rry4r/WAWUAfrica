"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listProducts } from "@/lib/api/shop";
import { describeError } from "@/lib/api/errors";
import {
  BUDGET_BANDS,
  PRODUCT_CATEGORIES,
  PRODUCT_CATEGORY_EMOJI,
  PRODUCT_CATEGORY_LABEL,
  type Product,
} from "@/types/shop";
import { Callout, Icon, Skeleton } from "@/components/ui";
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
    listProducts({ wawuPick: true, perPage: 8 })
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

      {/* ---- the hero question ---- */}
      <section className="flex flex-col gap-[16px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--accent-tint)] p-[20px] xl:p-[30px]">
        <div className="flex flex-col gap-[6px]">
          <h2 className="m-0 text-[24px] font-bold leading-[1.15] tracking-[-0.03em] text-[var(--text-primary)] xl:text-[38px]">
            What are you creating?
          </h2>
          <p className="m-0 max-w-[54ch] text-[13.5px] leading-[1.55] text-[var(--text-secondary)] xl:text-[15px]">
            Pick what you make, and we will show you the kit for it — starter to pro.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-[10px] sm:grid-cols-3 xl:grid-cols-4">
          {PRODUCT_CATEGORIES.map((category) => (
            <Link
              key={category}
              href={`/shop/browse/${category}`}
              className="flex items-center gap-[10px] rounded-[var(--radius-input)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[13px_14px] no-underline transition-all hover:-translate-y-[2px] hover:border-[var(--accent)]"
            >
              {/*
                Decorative. Every card carries its name in text beside this, so
                a screen reader is not read a picture of a camera.
              */}
              <span aria-hidden className="text-[22px] leading-none">
                {PRODUCT_CATEGORY_EMOJI[category]}
              </span>
              <span className="min-w-0 text-[13px] font-semibold leading-[1.3] text-[var(--text-primary)]">
                {PRODUCT_CATEGORY_LABEL[category]}
              </span>
            </Link>
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
                className="flex h-[46px] shrink-0 items-center gap-[8px] rounded-full border border-[var(--border-hairline)] bg-[var(--surface-card)] px-[18px] text-[13.5px] font-bold text-[var(--text-primary)] no-underline transition-colors hover:border-[var(--accent)] xl:flex-1 xl:justify-center"
              >
                <Icon name="Wallet2" size={16} color="var(--accent)" />
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
          <div className="grid grid-cols-2 gap-[12px] xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[300px] rounded-card" />
            ))}
          </div>
        ) : picks.length === 0 ? (
          <p className="m-0 text-[13.5px] text-[var(--text-muted)]">
            Nothing is picked out just yet. Browse the aisles above.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-[12px] xl:grid-cols-4">
            {picks.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onAdd={(product) => void add(product)}
                busy={addingId === p.id}
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

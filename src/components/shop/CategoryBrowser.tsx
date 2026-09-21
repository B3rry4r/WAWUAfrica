"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { listProducts, listSubcategories } from "@/lib/api/shop";
import { describeError } from "@/lib/api/errors";
import {
  BUDGET_BANDS,
  PRODUCT_CATEGORY_LABEL,
  type Product,
  type ProductCategory,
} from "@/types/shop";
import { Button, EmptyState, ErrorState, Input, Skeleton } from "@/components/ui";
import { ProductCard } from "./ProductCard";
import { ShopHeader } from "./ShopHeader";
import { useWowCart } from "./WowCartProvider";

/**
 * One aisle, or everything.
 *
 * `category` is null for the "all" route, which is what the budget bands and
 * the picks shelf link into — the same grid, without an aisle filter.
 *
 * SUBCATEGORY CHIPS COME FROM STOCK, not from the brief's list. The brief
 * names twelve things under Audio & Music; offering a chip for a
 * subcategory with nothing behind it is a filter that returns an empty grid,
 * which reads as a broken shop rather than an empty shelf.
 */
export function CategoryBrowser({ category }: { category: ProductCategory | null }) {
  const params = useSearchParams();
  const initialMax = params.get("max");
  const picksOnly = params.get("picks") === "1";
  // The marketplace front page hands its search term over in the URL rather
  // than running a second product query of its own. Without this the field
  // there navigated here and the term was silently dropped.
  const initialSearch = params.get("search") ?? "";

  const { add, addingId } = useWowCart();
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [subcategory, setSubcategory] = useState<string | null>(null);
  const [maxPriceNaira, setMaxPriceNaira] = useState<number | null>(
    initialMax ? Number(initialMax) : null,
  );
  const [search, setSearch] = useState(initialSearch);
  const [term, setTerm] = useState(initialSearch);

  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!category) {
      setSubcategories([]);
      return;
    }
    let active = true;
    listSubcategories(category)
      .then((rows) => active && setSubcategories(rows))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [category]);

  useEffect(() => {
    let active = true;
    setProducts(null);
    setError(null);
    listProducts({
      ...(category ? { category } : {}),
      ...(subcategory ? { subcategory } : {}),
      ...(maxPriceNaira ? { maxPriceNaira } : {}),
      ...(picksOnly ? { wawuPick: true } : {}),
      ...(term ? { search: term } : {}),
      perPage: 24,
    })
      .then((page) => active && setProducts(page.products))
      .catch((e) => active && setError(e));
    return () => {
      active = false;
    };
  }, [category, subcategory, maxPriceNaira, picksOnly, term, reloadKey]);

  const heading = category
    ? PRODUCT_CATEGORY_LABEL[category]
    : picksOnly
      ? "WAWU picks"
      : "Everything";

  const runSearch = useCallback(() => setTerm(search.trim()), [search]);

  return (
    <div className="flex flex-col gap-[18px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[1180px] xl:p-[26px_28px_64px]">
      <ShopHeader title={heading} />

      <div className="flex flex-wrap items-center gap-[10px]">
        <div className="flex min-w-[220px] flex-1 gap-[8px] xl:max-w-[420px]">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") runSearch();
            }}
            placeholder="Search this aisle"
            className="flex-1"
          />
          <Button variant="secondary" onClick={runSearch}>
            Search
          </Button>
        </div>
      </div>

      {subcategories.length > 0 ? (
        <div className="-mx-[16px] overflow-x-auto px-[16px] xl:mx-0 xl:overflow-visible xl:px-0">
          <div className="flex w-max gap-[7px] xl:w-full xl:flex-wrap">
            <Chip active={subcategory === null} onClick={() => setSubcategory(null)}>
              Everything
            </Chip>
            {subcategories.map((s) => (
              <Chip key={s} active={subcategory === s} onClick={() => setSubcategory(s)}>
                {s}
              </Chip>
            ))}
          </div>
        </div>
      ) : null}

      <div className="-mx-[16px] overflow-x-auto px-[16px] xl:mx-0 xl:overflow-visible xl:px-0">
        <div className="flex w-max gap-[7px] xl:w-full xl:flex-wrap">
          <Chip active={maxPriceNaira === null} onClick={() => setMaxPriceNaira(null)}>
            Any price
          </Chip>
          {BUDGET_BANDS.map((b) => (
            <Chip
              key={b.maxPriceNaira}
              active={maxPriceNaira === b.maxPriceNaira}
              onClick={() => setMaxPriceNaira(b.maxPriceNaira)}
            >
              {b.label}
            </Chip>
          ))}
        </div>
      </div>

      {error ? (
        <ErrorState
          title="This aisle could not be loaded"
          error={error}
          onRetry={() => setReloadKey((k) => k + 1)}
        />
      ) : products === null ? (
        <div className="grid grid-cols-2 gap-[12px] sm:grid-cols-3 xl:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[300px] rounded-card" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState
          icon="PackageSearch"
          title="Nothing here yet"
          caption={
            term || subcategory || maxPriceNaira
              ? "Try a wider price, or clear the filters."
              : "We have not stocked this aisle yet. Try another."
          }
          action={
            <Button
              variant="secondary"
              onClick={() => {
                setSubcategory(null);
                setMaxPriceNaira(null);
                setSearch("");
                setTerm("");
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        /*
          Five columns at desktop, not four. On a 1180px content column four
          columns make each cell ~370px wide, so an aisle holding one product
          rendered a single 460px-tall slab that read as a broken page. Five
          gives an ordinary product-grid density and keeps a sparse aisle
          looking sparse rather than wrong.
        */
        <div className="grid grid-cols-2 gap-[12px] sm:grid-cols-3 xl:grid-cols-5">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onAdd={(product) => void add(product)}
              busy={addingId === p.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-[32px] shrink-0 rounded-full border px-[13px] text-[12.5px] font-semibold transition-colors ${
        active
          ? "border-[var(--accent)] bg-[var(--accent-tint)] text-[var(--accent)]"
          : "border-[var(--border-hairline)] bg-[var(--surface-card)] text-[var(--text-secondary)] hover:border-[var(--accent)]"
      }`}
    >
      {children}
    </button>
  );
}

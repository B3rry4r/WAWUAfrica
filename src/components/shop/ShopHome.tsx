"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { listProducts } from "@/lib/api/shop";
import { getServices } from "@/lib/api/services";
import { describeError } from "@/lib/api/errors";
import { PRODUCT_CATEGORIES, PRODUCT_CATEGORY_LABEL, type Product } from "@/types/shop";
import type { PartnerService } from "@/types/services";
import { Callout, ChoiceChips, CtaBanner, Icon, Input, SectionHeader, Skeleton } from "@/components/ui";
import type { IconName } from "@/components/ui";
import { ProductCard } from "./ProductCard";
import { ShopHeader } from "./ShopHeader";

/**
 * The marketplace front page, built to the approved mobile reference
 * (refs/mobile/ref-marketplace.png): a search field with a filter button, one
 * scrolling aisle rail, a featured-products shelf, a featured-services shelf,
 * and the "Sell on WAWU" banner.
 *
 * FEATURED MEANS `wawuPick`. It is the storefront's own editorial flag on the
 * product row, not a client-side guess at what looks good — so the shelf is
 * whatever the shop's operators have actually picked out, and it empties
 * honestly when they have picked nothing.
 *
 * THE SERVICES SHELF IS PARTNER SERVICES, because that is the only priced
 * service listing this product has. The reference draws creator-offered
 * services ("Cover Art Design, From ₦10,000"); no such entity exists on the
 * wire — a professional carries a list of service NAMES and a paid-DM price,
 * never a per-service "from" price — so this renders the real partner
 * catalogue and its real `priceFrom` string rather than inventing one.
 *
 * WHAT MOVED OFF THIS SCREEN. The eleven aisle tiles and the budget-band row
 * are now the aisle rail and the browse screen's own budget filter: the
 * reference puts one chip rail here, and keeping both would be two taxonomies
 * on one screen. Nothing became unreachable — /shop/browse/[category] still
 * carries the budget bands and the subcategory chips.
 */
/**
 * A shelf is three across on a phone, which is what the reference draws, and
 * five across on a desktop — at 1180px three cards are 380px wide and the
 * picture alone runs to 470px tall, which is a poster, not a shelf. The extra
 * two are rendered and hidden below xl rather than fetched twice.
 */
const MOBILE_SHELF = 3;
const DESKTOP_SHELF = 5;
const SHELF = "grid grid-cols-3 gap-[10px] xl:grid-cols-5 xl:gap-[16px]";

export function ShopHome() {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const [picks, setPicks] = useState<Product[] | null>(null);
  const [picksError, setPicksError] = useState<string | null>(null);
  const [services, setServices] = useState<PartnerService[] | null>(null);

  useEffect(() => {
    let active = true;
    listProducts({ wawuPick: true, perPage: 8 })
      .then((page) => active && setPicks(page.products))
      .catch((e) => active && setPicksError(describeError(e).body));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    getServices()
      .then((rows) => active && setServices(rows.filter((s) => s.status === "live")))
      // A partner catalogue that will not load is not a reason for the
      // storefront to fail: the shelf simply does not appear.
      .catch(() => active && setServices([]));
    return () => {
      active = false;
    };
  }, []);

  const runSearch = useCallback(() => {
    const term = search.trim();
    router.push(term ? `/shop/browse/all?search=${encodeURIComponent(term)}` : "/shop/browse/all");
  }, [router, search]);

  const aisleChips = [
    { value: "all", label: "All", href: "/shop/browse/all" },
    ...PRODUCT_CATEGORIES.map((c) => ({
      value: c,
      label: PRODUCT_CATEGORY_LABEL[c],
      href: `/shop/browse/${c}`,
    })),
  ];

  return (
    <div className="flex flex-col gap-[20px] p-[14px_16px_96px] xl:mx-auto xl:w-full xl:max-w-[1180px] xl:p-[26px_28px_64px]">
      <ShopHeader title="Marketplace" />

      <div className="flex items-center gap-[10px]">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") runSearch();
          }}
          icon="Search"
          shape="pill"
          placeholder="Search products, services"
          aria-label="Search the marketplace"
          className="min-w-0 flex-1"
        />
        {/* Not a dead filter icon: the aisle, subcategory and budget filters
            all live on the browse screen, so this opens them rather than
            duplicating a filter sheet here. */}
        <Link
          href="/shop/browse/all"
          aria-label="Filters"
          className="grid h-[52px] w-[52px] shrink-0 place-items-center rounded-[var(--radius-input)] border border-hairline bg-input text-text-primary no-underline transition-colors hover:border-[var(--accent)]"
        >
          <Icon name="SlidersHorizontal" size={19} color="currentColor" strokeWidth={2} />
        </Link>
      </div>

      <ChoiceChips options={aisleChips} value="all" ariaLabel="Browse by aisle" scroll fill />

      {/* ---- featured products ---- */}
      <section className="flex flex-col gap-[12px]">
        <SectionHeader title="Featured Products" actionHref="/shop/browse/all?picks=1" />
        {picksError ? (
          <Callout tone="warning" title="The shop could not be loaded">
            {picksError}
          </Callout>
        ) : picks === null ? (
          <div className={SHELF}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[240px] rounded-card" />
            ))}
          </div>
        ) : picks.length === 0 ? (
          <p className="m-0 text-[13px] text-[var(--text-muted)]">
            Nothing is picked out just yet. Open an aisle above.
          </p>
        ) : (
          <div className={SHELF}>
            {picks.slice(0, DESKTOP_SHELF).map((p, i) => (
              <div key={p.id} className={i >= MOBILE_SHELF ? "hidden h-full xl:block" : "h-full"}>
                <ProductCard product={p} showCategory hidePickBadge />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ---- featured services ---- */}
      {services === null ? (
        <section className="flex flex-col gap-[12px]">
          <SectionHeader title="Featured Services" actionHref="/services" />
          <div className={SHELF}>
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-[170px] rounded-card" />
            ))}
          </div>
        </section>
      ) : services.length > 0 ? (
        <section className="flex flex-col gap-[12px]">
          <SectionHeader title="Featured Services" actionHref="/services" />
          <div className={SHELF}>
            {services.slice(0, DESKTOP_SHELF).map((s, i) => (
              <div key={s.id} className={i >= MOBILE_SHELF ? "hidden h-full xl:block" : "h-full"}>
                <ServiceCard service={s} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <CtaBanner
        icon="Store"
        title="Sell on WAWU"
        body="Turn your creativity into income."
        href="/create"
        ctaLabel="Get Started"
      />
    </div>
  );
}

/**
 * A partner service as a picture-led card.
 *
 * `PartnerService` has no image column, only an `icon` name, so the media area
 * is the brand gradient with that icon on it rather than a stock photograph
 * this app does not have. `priceFrom` is rendered exactly as the catalogue
 * sends it ("Consultations from ₦25,000", "No added fee") instead of being
 * reshaped into "From ₦X", which would put a number under services that are
 * genuinely free to start.
 */
function ServiceCard({ service }: { service: PartnerService }) {
  return (
    <Link
      href={`/services/${service.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] no-underline transition-all duration-200 hover:-translate-y-[3px] hover:border-[var(--border-strong)]"
    >
      <span className="grid aspect-[4/3] w-full place-items-center bg-[linear-gradient(150deg,var(--accent-deep),var(--surface-elevated))]">
        {/* `PartnerService.icon` is a free-text backend column; Icon resolves
            kebab-case and aliases, and renders nothing it cannot resolve, so the
            gradient tile stands on its own rather than showing a broken glyph. */}
        <Icon name={service.icon as IconName} size={30} color="var(--text-on-accent)" strokeWidth={1.7} />
      </span>
      <span className="flex flex-1 flex-col gap-[5px] p-[11px]">
        {/* `break-words` because a service name can be one long unbroken token
            ("Loans/EasyBuy") and a 104px card on a phone clips it into a
            different word otherwise. An awkward wrap beats a wrong name. */}
        <span className="line-clamp-2 break-words text-[13.5px] font-semibold leading-[1.3] text-[var(--text-primary)]">
          {service.name}
        </span>
        {service.priceFrom ? (
          <span className="mt-auto text-[12.5px] font-bold text-[var(--text-primary)]">
            {service.priceFrom}
          </span>
        ) : (
          <span className="mt-auto line-clamp-2 text-[12px] text-[var(--text-muted)]">{service.tagline}</span>
        )}
      </span>
    </Link>
  );
}

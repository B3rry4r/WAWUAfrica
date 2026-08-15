import Link from "next/link";
import { notFound } from "next/navigation";
import type { MarketplaceItem, Shop, ShopId } from "@/types/marketplace";
import { getShop, getShopItems } from "@/lib/api/marketplace";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { HandoffPill } from "@/components/ui/HandoffPill";
import { Icon } from "@/components/ui/Icon";
import { formatNaira } from "@/lib/format";

const SHOP_IDS: ShopId[] = ["basket", "beauty"];

export default async function ShopPage({
  params,
  searchParams,
}: {
  params: Promise<{ shop: string }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const { shop: shopParam } = await params;
  const { category = "All" } = await searchParams;

  if (!SHOP_IDS.includes(shopParam as ShopId)) notFound();
  const shopId = shopParam as ShopId;

  let shop: Shop;
  let items: MarketplaceItem[];
  try {
    [shop, items] = await Promise.all([getShop(shopId), getShopItems(shopId, category)]);
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState title={message ?? "We couldn't load this shop."} />;
  }

  return (
    <>
      <div className="flex flex-col gap-3.5 p-[16px_16px_96px] xl:hidden">
        <div className="flex items-center gap-2.5">
          <ProfileBackButton compact />
          <span className="flex-1 text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            {shop.name}
          </span>
          <HandoffPill app={shop.name} />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5">
          {shop.categories.map((c) => {
            const active = c === category;
            return (
              <Link
                key={c}
                href={c === "All" ? `/marketplace/${shopId}` : `/marketplace/${shopId}?category=${c}`}
                className={`shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-medium no-underline ${
                  active
                    ? "border-[var(--border-accent)] bg-[var(--accent-tint)] text-[var(--accent)]"
                    : "border-[var(--border-hairline)] bg-[var(--surface-card)] text-[var(--text-secondary)]"
                }`}
              >
                {c}
              </Link>
            );
          })}
        </div>

        {items.length === 0 ? (
          <EmptyState
            icon="Search"
            title="Nothing in this category yet"
            caption="Try another category, or browse everything in this shop."
          />
        ) : (
          <div className="flex flex-col gap-2.5">
            {items.map((item) => (
              <Link
                key={item.id}
                href={`/marketplace/${shopId}/${item.id}`}
                className="flex items-center gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[13px] no-underline"
              >
                <span className="h-[54px] w-[54px] shrink-0 rounded-[10px] border border-[var(--border-hairline)] bg-[var(--surface-tag)]" />
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <span className="text-[15px] font-semibold leading-[1.3] tracking-[-0.01em] text-[var(--text-primary)]">
                    {item.title}
                  </span>
                  <span className="text-[12px] text-[var(--text-muted)]">
                    {item.seller}
                    {item.location ? ` · ${item.location}` : ""}
                  </span>
                </div>
                <span className="shrink-0 text-[14px] font-semibold text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">
                  {formatNaira(item.price)}
                </span>
              </Link>
            ))}
          </div>
        )}

        <p className="px-0.5 text-[12px] leading-[1.5] text-[var(--text-muted)]">
          {shop.name} handles payment and delivery. Your WAWU sign-in carries over.
        </p>
      </div>

      {/* D11-adjacent pattern: sticky shop header with a named back link, then the
          same item card reflowed into a multi-column grid instead of a mobile list. */}
      <div className="hidden xl:flex xl:h-full xl:min-h-0 xl:flex-1 xl:flex-col">
        <div
          className="sticky top-0 z-20 flex h-[68px] shrink-0 items-center gap-4 border-b border-hairline bg-[rgba(19,19,22,0.86)] px-[26px] backdrop-blur"
          style={{ backdropFilter: "var(--blur-chrome)" }}
        >
          <Link
            href="/marketplace"
            className="flex items-center gap-[9px] text-[14px] font-semibold text-[var(--text-secondary)] no-underline"
          >
            <Icon name="ArrowLeft" size={18} color="var(--text-secondary)" />
            {shop.name}
          </Link>
          <span className="flex-1" />
          <HandoffPill app={shop.name} />
        </div>

        <div className="flex flex-col gap-[22px] p-[26px]">
          <div className="flex flex-wrap gap-[8px]">
            {shop.categories.map((c) => {
              const active = c === category;
              return (
                <Link
                  key={c}
                  href={c === "All" ? `/marketplace/${shopId}` : `/marketplace/${shopId}?category=${c}`}
                  className={`shrink-0 rounded-full border px-[14px] py-[7px] text-[13px] font-medium no-underline ${
                    active
                      ? "border-[var(--border-accent)] bg-[var(--accent-tint)] text-[var(--accent)]"
                      : "border-[var(--border-hairline)] bg-[var(--surface-card)] text-[var(--text-secondary)]"
                  }`}
                >
                  {c}
                </Link>
              );
            })}
          </div>

          {items.length === 0 ? (
            <EmptyState
              icon="Search"
              title="Nothing in this category yet"
              caption="Try another category, or browse everything in this shop."
            />
          ) : (
            <div className="grid grid-cols-4 gap-[16px]">
              {items.map((item) => (
                <Link
                  key={item.id}
                  href={`/marketplace/${shopId}/${item.id}`}
                  className="flex flex-col gap-[10px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] no-underline"
                >
                  <span className="aspect-square w-full shrink-0 rounded-[10px] border border-[var(--border-hairline)] bg-[var(--surface-tag)]" />
                  <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
                    <span className="text-[14px] font-semibold leading-[1.3] tracking-[-0.01em] text-[var(--text-primary)]">
                      {item.title}
                    </span>
                    <span className="text-[12px] text-[var(--text-muted)]">
                      {item.seller}
                      {item.location ? ` · ${item.location}` : ""}
                    </span>
                    <span className="text-[14px] font-semibold text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">
                      {formatNaira(item.price)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <p className="px-0.5 text-[12.5px] leading-[1.5] text-[var(--text-muted)]">
            {shop.name} handles payment and delivery. Your WAWU sign-in carries over.
          </p>
        </div>
      </div>
    </>
  );
}

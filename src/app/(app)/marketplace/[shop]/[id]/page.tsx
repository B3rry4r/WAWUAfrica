import { notFound } from "next/navigation";
import type { MarketplaceProduct, ShopId } from "@/types/marketplace";
import { getProduct, getShop, shopHandoffUrl } from "@/lib/api/marketplace";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ErrorState } from "@/components/ui/ErrorState";
import { Icon } from "@/components/ui/Icon";
import { HandoffPill } from "@/components/ui/HandoffPill";
import { VerificationBadge } from "@/components/ui/VerificationBadge";
import { formatNaira } from "@/lib/format";
import { ProductActionsRow } from "./_components/ProductActionsRow";

const SHOP_IDS: ShopId[] = ["basket", "beauty"];

export default async function ProductPage({
  params,
}: {
  params: Promise<{ shop: string; id: string }>;
}) {
  const { shop: shopParam, id } = await params;
  if (!SHOP_IDS.includes(shopParam as ShopId)) notFound();
  const shopId = shopParam as ShopId;

  let product: MarketplaceProduct | undefined;
  let shopName: string;
  try {
    const [p, shop] = await Promise.all([getProduct(shopId, id), getShop(shopId)]);
    product = p;
    shopName = shop.name;
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState title={message ?? "We couldn't load this product."} />;
  }

  if (!product) notFound();

  return (
    <div className="flex flex-col gap-3.5 p-[16px_16px_96px] xl:gap-6 xl:p-[26px]">
      {/* Handoff mention #1 (near the header) — HandoffPill, unchanged at every width. */}
      <div className="flex items-center gap-2.5">
        <ProfileBackButton compact />
        <span className="flex-1 text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Product
        </span>
        <HandoffPill app={shopName} />
      </div>

      {/* Below xl: single stacked column, unchanged. At xl (design D11): a
          thumbnail gallery rail beside the main image, then a fixed-width
          detail column — grid-template-columns: 1fr 460px. */}
      <div className="flex flex-col gap-3.5 xl:flex-row xl:items-start xl:gap-8">
        <div className="aspect-[4/3] w-full rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-tag)] xl:hidden" />

        <div className="hidden xl:flex xl:min-w-0 xl:flex-1 xl:gap-4">
          <div className="flex w-[96px] shrink-0 flex-col gap-3">
            <div className="aspect-square rounded-[14px] border-[1.5px] border-[var(--accent)] bg-[var(--surface-elevated)]" />
            <div className="aspect-square rounded-[14px] border border-[var(--border-hairline)] bg-[var(--surface-elevated)]" />
            <div className="aspect-square rounded-[14px] border border-[var(--border-hairline)] bg-[var(--surface-elevated)]" />
            <div className="aspect-square rounded-[14px] border border-[var(--border-hairline)] bg-[var(--surface-elevated)]" />
          </div>
          <div className="flex-1 rounded-[var(--radius-media)] border border-[var(--border-hairline)] bg-[var(--surface-tag)]" />
        </div>

        <div className="flex flex-col gap-3.5 xl:w-[460px] xl:shrink-0 xl:gap-[18px]">
          <div className="flex flex-col gap-2">
            <span className="text-[19px] font-semibold leading-[1.25] tracking-[-0.02em] text-[var(--text-primary)] xl:text-[26px]">
              {product.title}
            </span>
            <span className="text-[20px] font-bold text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)] xl:text-[26px]">
              {formatNaira(product.price)}
            </span>
            <span className="text-[13px] font-medium text-[var(--text-secondary)]">
              {product.seller}
            </span>
            {product.deliveryNote ? (
              <span className="text-[12.5px] text-[var(--text-muted)]">{product.deliveryNote}</span>
            ) : null}
          </div>

          {/* Desktop-only seller card (design D11) — avatar, verification, role ·
              location · followers, Profile link. Mobile keeps the plain-text
              seller line above; that design has no equivalent card. */}
          {product.sellerDetail ? (
            <div className="hidden items-center gap-3 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-3 xl:flex">
              <Avatar initial={product.seller.charAt(0)} size={44} />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="truncate text-[14px] font-semibold text-[var(--text-primary)]">
                    {product.seller}
                  </span>
                  <VerificationBadge tier={product.sellerDetail.verification} size={16} />
                </div>
                <span className="truncate text-[12.5px] text-[var(--text-muted)]">
                  {[product.sellerDetail.role, product.location, `${product.sellerDetail.followers} followers`]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              {product.sellerDetail.wawuId ? (
                <Button href={`/profile/${product.sellerDetail.wawuId}`} size="sm" variant="secondary">
                  Profile
                </Button>
              ) : null}
            </div>
          ) : null}

          <p className="text-[14px] leading-[1.55] text-[var(--text-secondary)]">
            {product.description}
          </p>

          <div className="flex flex-col rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-1">
            {product.facts.map((fact) => (
              <span
                key={fact}
                className="flex items-center gap-2.5 px-3 py-2.5 text-[13px] text-[var(--text-secondary)]"
              >
                <Icon name="Check" size={15} color="var(--accent)" />
                {fact}
              </span>
            ))}
          </div>

          <a
            href={shopHandoffUrl(shopId, product.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-[50px] items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[15px] font-semibold text-[var(--text-on-accent)] no-underline xl:h-[52px]"
          >
            Buy in {shopName}
            <Icon name="ArrowUpRight" size={17} color="var(--text-on-accent)" />
          </a>

          {/* Handoff mention #2 (near the CTA) — the money leaves WAWU here,
              so this stays right under the button at every width. */}
          <p className="px-0.5 text-[12px] leading-[1.5] text-[var(--text-muted)]">
            {shopName} handles payment and delivery. Your WAWU sign-in carries over, and{" "}
            {shopName} returns you here when you are done.
          </p>

          <ProductActionsRow
            productTitle={product.title}
            seller={
              product.sellerDetail?.wawuId
                ? { wawuId: product.sellerDetail.wawuId, name: product.seller }
                : null
            }
          />
        </div>
      </div>
    </div>
  );
}

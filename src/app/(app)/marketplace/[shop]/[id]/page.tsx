import { notFound } from "next/navigation";
import type { MarketplaceProduct, ShopId } from "@/types/marketplace";
import { getProduct, getShop, shopHandoffUrl } from "@/lib/api/marketplace";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { ErrorState } from "@/components/ui/ErrorState";
import { Icon } from "@/components/ui/Icon";
import { HandoffPill } from "@/components/ui/HandoffPill";
import { formatNaira } from "@/lib/format";

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
    <div className="flex flex-col gap-3.5 p-[16px_16px_96px]">
      <div className="flex items-center gap-2.5">
        <ProfileBackButton compact />
        <span className="flex-1 text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Product
        </span>
        <HandoffPill app={shopName} />
      </div>

      <div className="aspect-[4/3] w-full rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-tag)]" />

      <div className="flex flex-col gap-2">
        <span className="text-[19px] font-semibold leading-[1.25] tracking-[-0.02em] text-[var(--text-primary)]">
          {product.title}
        </span>
        <span className="text-[20px] font-bold text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">
          {formatNaira(product.price)}
        </span>
        <span className="text-[13px] font-medium text-[var(--text-secondary)]">
          {product.seller}
        </span>
        {product.deliveryNote ? (
          <span className="text-[12.5px] text-[var(--text-muted)]">{product.deliveryNote}</span>
        ) : null}
      </div>

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
        className="flex h-[50px] items-center justify-center gap-2 rounded-[var(--radius-button)] bg-[var(--accent)] text-[15px] font-semibold text-[var(--text-on-accent)] no-underline"
      >
        Buy in {shopName}
        <Icon name="ArrowUpRight" size={17} color="var(--text-on-accent)" />
      </a>

      <p className="px-0.5 text-[12px] leading-[1.5] text-[var(--text-muted)]">
        {shopName} handles payment and delivery. Your WAWU sign-in carries over, and{" "}
        {shopName} returns you here when you are done.
      </p>
    </div>
  );
}

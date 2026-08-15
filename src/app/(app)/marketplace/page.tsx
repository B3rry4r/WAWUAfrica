import Link from "next/link";
import type { Shop } from "@/types/marketplace";
import { getShops } from "@/lib/api/marketplace";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";
import { HandoffPill } from "@/components/ui/HandoffPill";

export default async function MarketplacePage() {
  let shops: Shop[];
  try {
    shops = await getShops();
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState title={message ?? "We couldn't load the marketplace."} />;
  }

  return (
    <div className="flex flex-col gap-3.5 p-[16px_16px_96px]">
      <div className="flex items-center gap-2.5">
        <span className="flex-1 text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
          Marketplace
        </span>
        <Link
          href="/marketplace/search"
          aria-label="Search the marketplace"
          className="grid h-9 w-9 place-items-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface-card)]"
        >
          <Icon name="Search" size={16} color="var(--text-secondary)" />
        </Link>
      </div>

      <div className="flex flex-col gap-2.5">
        {shops.map((shop) => (
          <Link
            key={shop.id}
            href={`/marketplace/${shop.id}`}
            className="flex flex-col gap-2.5 rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[14px] no-underline"
          >
            <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[12px] border border-[var(--border-accent)] bg-[var(--accent-tint)]">
              <Icon
                name={shop.id === "basket" ? "ShoppingBasket" : "Sparkles"}
                size={18}
                color="var(--accent)"
              />
            </span>
            <span className="text-[15.5px] font-semibold text-[var(--text-primary)]">
              {shop.name}
            </span>
            <span className="text-[12.5px] leading-[1.4] text-[var(--text-secondary)]">
              {shop.tagline}
            </span>
            <div className="flex">
              <HandoffPill app={shop.name} />
            </div>
            <span className="text-[11.5px] text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">
              {shop.stat}
            </span>
          </Link>
        ))}
      </div>

      <p className="px-0.5 text-[12px] leading-[1.5] text-[var(--text-muted)]">
        Basket and Beauty are separate WAWU apps. Paying and delivery happen there.
      </p>
    </div>
  );
}

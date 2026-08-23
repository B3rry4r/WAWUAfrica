import Link from "next/link";
import type { Shop } from "@/types/marketplace";
import { getShops } from "@/lib/api/marketplace";
import { Icon } from "@/components/ui/Icon";
import { ErrorState } from "@/components/ui/ErrorState";
import { BackLink } from "@/components/ui/BackLink";
import { HandoffPill } from "@/components/ui/HandoffPill";
import { Callout } from "@/components/ui/Callout";
import { FlowHeader } from "@/components/layout/FlowHeader";

/**
 * Read live data, so it is rendered per request rather than prerendered.
 *
 * Without this Next tries to fetch the Hub API during `next build`, which
 * fails the build outright wherever the API is not already running — and
 * where it IS running, it bakes that moment's catalogue into the bundle and
 * serves it until the next deploy. Neither is what these screens are for.
 */
export const dynamic = "force-dynamic";

export default async function MarketplacePage() {
  let shops: Shop[];
  try {
    shops = await getShops();
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState title={message ?? "We couldn't load the marketplace."} />;
  }

  return (
    <>
      <div className="flex flex-col gap-3.5 p-[16px_16px_96px] xl:hidden">
        <BackLink />
        <div className="flex items-center gap-2.5">
          <span className="flex-1 text-[18px] font-semibold tracking-[-0.02em] text-[var(--text-primary)]">
            Marketplace
          </span>
          <Link
            href="/marketplace/search"
            aria-label="Search the marketplace"
            className="grid h-9 w-9 place-items-center rounded-full border border-[var(--border-hairline)] bg-[var(--surface-card)] hover:border-strong hover:bg-surface-hover active:bg-surface-press"
          >
            <Icon name="Search" size={16} color="var(--text-secondary)" />
          </Link>
        </div>

        <div className="flex flex-col gap-2.5">
          {shops.map((shop) => (
            <Link
              key={shop.id}
              href={`/marketplace/${shop.id}`}
              className="flex flex-col gap-[14px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[18px] no-underline hover:border-strong hover:bg-surface-hover active:bg-surface-press"
            >
              <span className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[12px] border border-[var(--border-decor)] bg-[var(--decor-tint)]">
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

        <Callout>Basket and Beauty are separate WAWU apps. Paying and delivery happen there.</Callout>
      </div>

      {/* D10 pattern: satellite shops sit side by side, each a card carrying its own handoff pill. */}
      <div className="hidden xl:flex xl:h-full xl:min-h-0 xl:flex-1 xl:flex-col">
        {/* The shared bar. This was a hand-written copy of it — one of four,
            each re-typing the same 68px/26px geometry and the same literal
            rgba chrome colour, which is why title left edges drifted apart. */}
        <FlowHeader
          title="Marketplace"
          back={false}
          sticky
          right={<span className="text-[13.5px] text-text-muted">Everything here carries a handoff pill</span>}
        />

        <div className="flex flex-col gap-[22px] p-[26px]">
          <div className="grid grid-cols-2 gap-[20px]">
            {shops.map((shop) => (
              <Link
                key={shop.id}
                href={`/marketplace/${shop.id}`}
                className="flex flex-col gap-[14px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[22px] no-underline hover:border-strong hover:bg-surface-hover active:bg-surface-press"
              >
                <div className="flex items-center gap-[12px]">
                  <span className="grid h-[44px] w-[44px] shrink-0 place-items-center rounded-[14px] border border-[var(--border-decor)] bg-[var(--decor-tint)]">
                    <Icon
                      name={shop.id === "basket" ? "ShoppingBasket" : "Sparkles"}
                      size={20}
                      color="var(--accent)"
                    />
                  </span>
                  <span className="text-[18px] font-semibold text-[var(--text-primary)]">{shop.name}</span>
                  <span className="ml-auto flex">
                    <HandoffPill app={shop.name} />
                  </span>
                </div>
                <span className="text-[13.5px] leading-[1.5] text-[var(--text-secondary)]">{shop.tagline}</span>
                <span className="text-[12.5px] text-[var(--text-muted)] [font-feature-settings:var(--font-feature-tabular)]">
                  {shop.stat}
                </span>
              </Link>
            ))}
          </div>

          <Callout>Basket and Beauty are separate WAWU apps. Paying and delivery happen there.</Callout>
        </div>
      </div>
    </>
  );
}

import Link from "next/link";
import type { MarketplaceItem, MarketplaceSearchResults } from "@/types/marketplace";
import { searchMarketplace } from "@/lib/api/marketplace";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { Icon } from "@/components/ui/Icon";
import { formatNaira } from "@/lib/format";

export default async function MarketplaceSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;

  let results: MarketplaceSearchResults;
  try {
    results = await searchMarketplace(q);
  } catch (e) {
    const message = e instanceof Error ? e.message : undefined;
    return <ErrorState title={message ?? "Search is unavailable right now."} />;
  }

  const total = results.basket.length + results.beauty.length;

  return (
    <div className="flex flex-col gap-3.5 p-[16px_16px_96px]">
      <div className="flex items-center gap-2.5">
        <ProfileBackButton compact />
        <form action="/marketplace/search" className="flex flex-1 items-center gap-2">
          <label htmlFor="q" className="sr-only">
            Search the marketplace
          </label>
          <input
            id="q"
            name="q"
            defaultValue={q}
            placeholder="Search Basket and Beauty"
            className="h-10 w-full rounded-full border border-[var(--border-hairline)] bg-[var(--surface-input)] px-4 text-[14px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)] focus:border-[var(--border-accent)]"
          />
        </form>
      </div>

      {!q ? (
        <EmptyState
          icon="Search"
          title="Search both shops"
          caption="Look across WAWUBasket and WAWUBeauty at once. Results from WAWU itself appear underneath."
        />
      ) : total === 0 ? (
        <EmptyState
          icon="Search"
          title={`Nothing for "${q}"`}
          caption="Try a different word, or browse the shops directly."
          action="Browse the marketplace"
          actionHref="/marketplace"
        />
      ) : (
        <>
          <div className="flex gap-1.5">
            <Pill label={`All ${total}`} active />
            <Pill label={`Basket ${results.basket.length}`} />
            <Pill label={`Beauty ${results.beauty.length}`} />
          </div>

          {results.basket.length > 0 ? (
            <ResultGroup title="WAWUBasket" shop="basket" items={results.basket} />
          ) : null}
          {results.beauty.length > 0 ? (
            <ResultGroup title="WAWUBeauty" shop="beauty" items={results.beauty} />
          ) : null}

          {results.alsoOnWawu.length > 0 ? (
            <div className="flex flex-col gap-2.5">
              <span className="px-0.5 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
                Also on WAWU
              </span>
              {results.alsoOnWawu.map((r) => (
                <Link
                  key={r.id}
                  href={r.href}
                  className="flex items-center gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[13px] no-underline"
                >
                  <span className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-[10px] border border-[var(--border-hairline)] bg-[var(--surface-tag)]">
                    <Icon name="GraduationCap" size={17} color="var(--accent)" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="text-[14.5px] font-semibold text-[var(--text-primary)]">
                      {r.title}
                    </span>
                    <span className="text-[12px] text-[var(--text-muted)]">{r.subtitle}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function Pill({ label, active }: { label: string; active?: boolean }) {
  return (
    <span
      className={`shrink-0 rounded-full border px-3 py-1.5 text-[12.5px] font-medium ${
        active
          ? "border-[var(--border-accent)] bg-[var(--accent-tint)] text-[var(--accent)]"
          : "border-[var(--border-hairline)] bg-[var(--surface-card)] text-[var(--text-secondary)]"
      }`}
    >
      {label}
    </span>
  );
}

function ResultGroup({
  title,
  shop,
  items,
}: {
  title: string;
  shop: string;
  items: MarketplaceItem[];
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <span className="px-0.5 text-[11px] font-bold uppercase tracking-[0.06em] text-[var(--text-muted)]">
        {title}
      </span>
      {items.map((item) => (
        <Link
          key={item.id}
          href={`/marketplace/${shop}/${item.id}`}
          className="flex items-center gap-[13px] rounded-[var(--radius-card)] border border-[var(--border-hairline)] bg-[var(--surface-card)] p-[13px] no-underline"
        >
          <span className="h-[46px] w-[46px] shrink-0 rounded-[10px] border border-[var(--border-hairline)] bg-[var(--surface-tag)]" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <span className="text-[14.5px] font-semibold text-[var(--text-primary)]">
              {item.title}
            </span>
            <span className="text-[12px] text-[var(--text-muted)]">
              {item.seller}
              {item.location ? ` · ${item.location}` : ""}
            </span>
          </div>
          <span className="shrink-0 text-[13.5px] font-semibold text-[var(--text-primary)] [font-feature-settings:var(--font-feature-tabular)]">
            {formatNaira(item.price)}
          </span>
        </Link>
      ))}
    </div>
  );
}

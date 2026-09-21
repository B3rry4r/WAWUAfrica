"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ProfileBackButton } from "@/components/profile/ProfileBackButton";
import { Icon } from "@/components/ui";
import { useWowCart } from "./WowCartProvider";

/**
 * The storefront's page header: back, title, and the WOW count, on ONE row.
 *
 * ── WHY THIS IS ONE ROW AND NOT TWO ────────────────────────────────────────
 * It used to render a text link ("← Keep shopping") on its own row with the
 * page's <h1> underneath. Every other screen in this app puts the back control
 * INLINE with the title — ProfileBackButton's 34px box is what makes a title
 * beside it land on the same axis as one in a FlowHeader bar, and its own doc
 * comment notes that drifting the two apart is what started the previous
 * round of alignment complaints. The shop had drifted.
 *
 * So the header owns the title now rather than each screen writing its own
 * <h1> under a link. One row, one axis, one component to keep in step.
 *
 * The count comes from the shared provider rather than its own fetch, so it
 * cannot disagree with the cart page, and renders nothing rather than "0" —
 * a zero badge is noise on every screen.
 */
export function ShopHeader({ title }: { title: string }) {
  const { cart } = useWowCart();
  const pathname = usePathname();
  const count = cart?.itemCount ?? 0;
  const onCart = pathname.startsWith("/shop/wow");

  return (
    <div className="flex items-center gap-[12px]">
      {/* Every screen in here, the front page included, carries the back
          control the approved reference draws. /shop is not a bottom-bar
          slot: people arrive from the services hub, a search result or a
          shared link, so "back" always has somewhere real to go. */}
      <ProfileBackButton compact />

      <h1 className="min-w-0 flex-1 truncate text-[20px] font-semibold tracking-[-0.02em] text-[var(--text-primary)] xl:text-[26px]">
        {title}
      </h1>

      <Link
        href="/shop/orders"
        className="hidden shrink-0 items-center gap-[7px] text-[13px] font-semibold text-[var(--text-secondary)] no-underline hover:text-text-primary xl:inline-flex"
      >
        <Icon name="Package" size={16} color="currentColor" />
        My orders
      </Link>

      {!onCart ? (
        <Link
          href="/shop/wow"
          aria-label={count > 0 ? `WOW cart, ${count} item${count === 1 ? "" : "s"}` : "WOW cart"}
          className="relative inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center gap-[7px] rounded-full border border-[var(--border-hairline)] bg-[var(--surface-card)] text-[13px] font-bold text-[var(--text-primary)] no-underline hover:border-[var(--accent)] xl:w-auto xl:px-[14px]"
        >
          <Icon name="ShoppingCart" size={17} color="currentColor" strokeWidth={2.3} />
          {/* The reference header carries a bare cart glyph; the name only
              earns its space where there is room for it. */}
          <span className="hidden xl:inline">WOW</span>
          {count > 0 ? (
            <span className="absolute -right-[3px] -top-[3px] grid h-[19px] min-w-[19px] place-items-center rounded-full bg-[var(--accent)] px-[5px] text-[11px] font-bold text-[var(--text-on-accent)] xl:static xl:right-auto xl:top-auto">
              {count}
            </span>
          ) : null}
        </Link>
      ) : null}
    </div>
  );
}

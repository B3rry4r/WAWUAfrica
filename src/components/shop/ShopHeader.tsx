"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui";
import { useWowCart } from "./WowCartProvider";

/**
 * The storefront's own header strip: back to the shop, search, and the WOW
 * count.
 *
 * The count comes from the shared provider rather than its own fetch, so it
 * cannot disagree with the cart page. It renders nothing rather than "0" when
 * the cart is empty — a badge showing zero is noise on every screen.
 */
export function ShopHeader({ title }: { title?: string }) {
  const { cart } = useWowCart();
  const pathname = usePathname();
  const count = cart?.itemCount ?? 0;
  const onCart = pathname.startsWith("/shop/wow");
  // On the shop's own front page the back-link would point at the page you are
  // already on — a control that looks like navigation and does nothing.
  const atRoot = pathname === "/shop";

  return (
    <div className="flex items-center gap-[12px]">
      {!atRoot ? (
        <Link
          href="/shop"
          className="inline-flex min-w-0 items-center gap-[8px] text-[13.5px] font-semibold text-[var(--text-secondary)] no-underline hover:text-text-primary"
        >
          <Icon name="ArrowLeft" size={17} color="currentColor" />
          <span className="truncate">{title ?? "Shop"}</span>
        </Link>
      ) : null}

      <span className="flex-1" />

      <Link
        href="/shop/orders"
        className="hidden items-center gap-[7px] text-[13px] font-semibold text-[var(--text-secondary)] no-underline hover:text-text-primary xl:inline-flex"
      >
        <Icon name="Package" size={16} color="currentColor" />
        My orders
      </Link>

      {!onCart ? (
        <Link
          href="/shop/wow"
          aria-label={count > 0 ? `WOW cart, ${count} item${count === 1 ? "" : "s"}` : "WOW cart"}
          className="relative inline-flex h-[38px] items-center gap-[7px] rounded-full border border-[var(--border-hairline)] bg-[var(--surface-card)] px-[14px] text-[13px] font-bold text-[var(--text-primary)] no-underline hover:border-[var(--accent)]"
        >
          <Icon name="ShoppingCart" size={16} color="currentColor" strokeWidth={2.3} />
          WOW
          {/* Nothing rather than a zero: a "0" badge is noise on every screen. */}
          {count > 0 ? (
            <span className="grid h-[19px] min-w-[19px] place-items-center rounded-full bg-[var(--accent)] px-[5px] text-[11px] font-bold text-[var(--text-on-accent)]">
              {count}
            </span>
          ) : null}
        </Link>
      ) : null}
    </div>
  );
}

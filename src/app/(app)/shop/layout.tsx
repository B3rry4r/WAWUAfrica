import { WowCartProvider } from "@/components/shop/WowCartProvider";

/**
 * Everything under /shop shares one cart.
 *
 * The provider lives at the layout so the WOW count in the header and the cart
 * page cannot disagree — two independent fetches drift the moment one goes
 * stale, and a badge that says "0" right after somebody added something is how
 * people stop trusting a checkout.
 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <WowCartProvider>{children}</WowCartProvider>;
}

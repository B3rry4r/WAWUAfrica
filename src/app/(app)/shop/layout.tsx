import { WowCartProvider } from "@/components/shop/WowCartProvider";
import { ServiceComingSoon } from "@/components/services/ServiceGate";

/**
 * Shop is pulled off the live surface for now (product-owner instruction,
 * 12 Sep 2026). Gated here, once, for every route under /shop — including
 * one somebody reaches by URL or an old bookmark rather than through a link
 * — rather than each page under here checking a flag of its own. Flip this
 * back to `true` to reopen it; nothing else needs to change.
 *
 * Not wired through ServiceGate's `useServiceLive`/services catalogue: that
 * mechanism is for a THIRD-PARTY partner integration whose live/not-live
 * status is a fact about the partner's own rollout (Bills Payment, Legal,
 * Care). Shop is this app's own feature with nothing external to poll, so a
 * plain constant is the honest gate rather than inventing a catalogue row
 * for a status that is really just "not today."
 */
const SHOP_LIVE = false;

/**
 * Everything under /shop shares one cart.
 *
 * The provider lives at the layout so the WOW count in the header and the cart
 * page cannot disagree — two independent fetches drift the moment one goes
 * stale, and a badge that says "0" right after somebody added something is how
 * people stop trusting a checkout.
 */
export default function ShopLayout({ children }: { children: React.ReactNode }) {
  if (!SHOP_LIVE) {
    return (
      <ServiceComingSoon
        name="Shop"
        icon="ShoppingBag"
        note="We are still preparing the shop. It opens here first, and nothing is charged until it does."
      />
    );
  }
  return <WowCartProvider>{children}</WowCartProvider>;
}

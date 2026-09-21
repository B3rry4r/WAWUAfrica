import type { IconName } from "@/components/ui/Icon";

/**
 * The platform services, as ONE list.
 *
 * This lived inline in LandingContent as `QUICK_SERVICES`, which meant the
 * landing page and /services disagreed about what WAWU offers: the landing
 * showed eight (Legal, Events, Shop, Bills Payment, Loans, BNPL, Pensions,
 * Telemedicine) with their commissioned art, while /services rendered
 * whatever the partner catalogue happened to return - five entries, different
 * names, lucide outlines, Events and Shop missing entirely. Product owner,
 * 21 Sep 2026: "services should carry only the services that shows in the
 * landing page".
 *
 * So this file is the list, and both surfaces render it. The catalogue is
 * still read on /services, but only for what it actually owns: whether a
 * service is OPEN, what it costs and how long it takes. What exists, what it
 * is called and what it looks like are decided here.
 *
 * `slug` is what joins the two: it matches PartnerService.slug where the
 * catalogue carries the service at all. Events and Shop are WAWU's own
 * surfaces rather than partner services, so they have no slug and never get a
 * catalogue status.
 */
/**
 * The filter groups the Services screen's chip rail is built from.
 *
 * The approved mobile design (refs/mobile/ref-services.png) draws a single
 * scrolling row of five chips. Its labels are Legal / Business / Creative /
 * Health, which describe a catalogue WAWU does not have: there is no business
 * support, design or tech-development service in this list, and there never
 * was one. Rather than draw four chips with nothing behind them, the rail is
 * derived from the services that DO exist, in the design's shape: "All" plus
 * one chip per group, one line, scrolling.
 *
 * Keep this in step with the list below. A group with no service in it is a
 * dead filter and the rail simply will not render it.
 */
export type ServiceGroup = "legal" | "money" | "health" | "lifestyle";

export const SERVICE_GROUP_LABEL: Record<ServiceGroup, string> = {
  legal: "Legal",
  money: "Money",
  health: "Health",
  lifestyle: "Lifestyle",
};

/** Chip order. Filtered down to the groups that actually carry a service. */
export const SERVICE_GROUP_ORDER: readonly ServiceGroup[] = Object.freeze([
  "legal",
  "money",
  "health",
  "lifestyle",
]);

export interface PlatformService {
  /** The name shown under the icon. */
  brand: string;
  /** A short line for surfaces that have room for one. */
  label: string;
  blurb: string;
  /** Which filter chip on /services shows it. */
  group: ServiceGroup;
  /** Catalogue join key. Absent for WAWU's own surfaces. */
  slug?: string;
  /** Commissioned art. The icon IS the control on every surface that lists these. */
  iconImageSrc: string;
  /** Fallback glyph, for a surface that cannot load the art. */
  icon: IconName;
  href?: string;
  /**
   * Not open yet. The catalogue overrides this for any service it carries;
   * it is the answer for the ones it does not, and the default before the
   * catalogue has loaded.
   */
  soon?: boolean;
}

export const PLATFORM_SERVICES: readonly PlatformService[] = Object.freeze([
  {
    brand: "Legal",
    group: "legal",
    label: "Filings and lawyers",
    blurb: "CAC filings, or book a lawyer.",
    slug: "legal",
    icon: "Scale",
    iconImageSrc: "/icons/services/legal.png",
    href: "/services/legal",
  },
  {
    brand: "Events",
    group: "lifestyle",
    label: "What's on",
    blurb: "Find one, or list your own.",
    icon: "CalendarDays",
    iconImageSrc: "/icons/services/events.png",
    href: "/events",
  },
  {
    brand: "Shop",
    group: "lifestyle",
    label: "Creator equipment",
    blurb: "Gear, checked before we stock it.",
    icon: "ShoppingBag",
    iconImageSrc: "/icons/services/shop.png",
    href: "/shop",
    // Not open (product-owner instruction, 12 Sep 2026). This is not a note
    // about something unbuilt: `soon` is the flag every surface reads to dim
    // the tile and drop its link, and ShopLayout gates the routes themselves
    // on the same decision.
    soon: true,
  },
  {
    brand: "Bills Payment",
    group: "money",
    label: "Airtime, power, cable",
    blurb: "Pay any bill in seconds.",
    slug: "pay",
    icon: "Zap",
    iconImageSrc: "/icons/services/bills-payment.png",
    href: "/services/pay",
  },
  {
    brand: "Loans",
    group: "money",
    label: "Borrow",
    blurb: "Credit against what you earn.",
    slug: "loans",
    icon: "Landmark",
    iconImageSrc: "/icons/services/loans.png",
    soon: true,
  },
  {
    // Split out of "Loans/EasyBuy" on the product owner's instruction (1 Sep
    // 2026) and renamed: BNPL and a loan are different products - one is
    // instalments on a purchase, the other is credit - and one slash was
    // making them read as a single service.
    brand: "BNPL",
    group: "money",
    label: "Buy now, pay later",
    blurb: "Pay for a purchase monthly.",
    icon: "Smartphone",
    iconImageSrc: "/icons/services/bnpl.png",
    soon: true,
  },
  {
    brand: "Pensions",
    group: "money",
    label: "Retirement",
    blurb: "Save on irregular income.",
    slug: "pension",
    icon: "PiggyBank",
    iconImageSrc: "/icons/services/pensions.png",
    soon: true,
  },
  {
    brand: "Telemedicine",
    group: "health",
    label: "Health cover",
    blurb: "See a doctor, get covered.",
    slug: "care",
    icon: "Stethoscope",
    iconImageSrc: "/icons/services/telemedicine.png",
    soon: true,
  },
]);

/**
 * Open services lead and closed ones trail - asked for once the grid stopped
 * captioning them and started just dimming them instead: a dimmed tile among
 * live ones needs its position to carry some of what the caption used to say.
 * `sort` is stable, so within each group the order above holds.
 */
export function orderedServices(
  isOpen: (s: PlatformService) => boolean = (s) => !s.soon,
): PlatformService[] {
  return [...PLATFORM_SERVICES].sort(
    (a, b) => Number(isOpen(b)) - Number(isOpen(a)),
  );
}

export function serviceIcon(slug: string | undefined | null): string | undefined {
  if (!slug) return undefined;
  const key = slug.toLowerCase();
  return PLATFORM_SERVICES.find((s) => s.slug === key)?.iconImageSrc;
}

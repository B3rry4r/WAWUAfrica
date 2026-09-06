import type { CreatorTier } from "./account";

/** Creator Subscription lifecycle (docs/01 §1 streams 7-8, docs/02 §2.5). */
export type SubscriptionState = "none" | "active" | "past_due" | "expired";

export interface Plan {
  tier: CreatorTier;
  /** "01", "02", "03" — the numbering the pricing page leads each card with. */
  index: string;
  name: string;
  price: number;
  /** The line under the price. */
  headline: string;
  /** Who the plan is for. Absent on Pro Max, whose headline says it. */
  pitch?: string;
  /** Upload slots included. */
  slots: number;
  /** How many of those are free by rule. */
  freeSlots: number;
  /** Revenue share the creator keeps, percent. */
  split: number;
  /** What the button says. */
  cta: string;
  /** The heading above the feature list. */
  featuresLabel: string;
  features: string[];
  /**
   * A named block of features sold as its own thing — Pro Max's Ditto music
   * distribution. Rendered as a titled group rather than mixed into the list,
   * because it is the reason the plan exists and burying it among twelve
   * bullets would hide what somebody is paying the extra ₦15,000 for.
   */
  highlight?: { title: string; note: string; items: string[] };
}

export interface Subscription {
  plan: Plan;
  state: SubscriptionState;
  renewsAt?: string;
  cancelsAt?: string;
  /** Last 4 digits of the card on file, as the backend actually returns it. */
  cardLast4?: string;
}

export const PLANS: Record<CreatorTier, Plan> = {
  basic: {
    tier: "basic",
    index: "01",
    name: "Basic",
    price: 5999,
    headline: "Start earning",
    pitch: "For someone ready to take their work seriously.",
    slots: 6,
    freeSlots: 1,
    split: 85,
    cta: "Start earning",
    featuresLabel: "Get:",
    features: [
      "2GB of storage",
      "Monetise audio, video, PDFs, art and digital works",
      "Paid consultations for professionals",
      "Unlimited messaging",
      "Join and host open communities",
      "Business Playbook",
      "Personal pension registration",
      "Events and ticket sales",
      "Creator opportunities",
      "Access to WAWU Commerce",
      "Access to legal services",
    ],
  },
  pro: {
    tier: "pro",
    index: "02",
    name: "Pro",
    price: 14999,
    headline: "Earn more. Do more.",
    pitch: "For creators and professionals actively building income.",
    slots: 12,
    freeSlots: 2,
    split: 90,
    cta: "Go Pro",
    featuresLabel: "Everything in Basic, plus:",
    features: [
      "2GB of storage",
      "Enhanced creator and professional profile",
      "Priority discovery and opportunities",
      "Open and private communities",
      "Up to 2 training courses",
      "Enhanced monetisation tools",
    ],
  },
  pro_max: {
    tier: "pro_max",
    index: "03",
    name: "Pro Max",
    price: 29999,
    headline: "Build your career. Build your business.",
    slots: 15,
    freeSlots: 2,
    split: 90,
    cta: "Go Pro Max",
    featuresLabel: "Everything in Pro, plus:",
    highlight: {
      title: "Music distribution",
      note: "Powered by Ditto Music",
      items: [
        "Unlimited music releases, 1 artist",
        "150+ global music platforms",
        "Pre-save Smartlinks",
        "In-depth analytics and fan data",
        "Automatic royalty splits",
        "Playlist submission",
        "Fast royalty payouts",
        "Ditto Perks",
      ],
    },
    features: [
      // Pro Max states its own storage rather than inheriting "everything in
      // Pro": the number goes UP here, so the inherited list would have the
      // plan silently advertising Pro's 2GB. It must match
      // STORAGE_ALLOWANCE_BY_TIER in the API, which is what actually refuses
      // an upload. The upload allowance is not listed here at all - see
      // planFeatures below.
      "5GB of storage",
      "Priority support",
      "Featured and recommended opportunities",
      "Advanced creator monetisation",
      "Creator equipment access",
      "Up to 3 training courses",
      /*
        "1 month health insurance" WAS SOLD HERE and is not built.

        Pro Max costs ₦29,999 a year and this line was rendered by
        planFeatures() with a tick beside it on six in-app surfaces. Searching
        the whole of src/ for it returns this one string: no screen, no API
        call, no partner, nothing that would ever deliver a policy to anybody
        who paid for it.

        The other entitlements in these lists were checked at the same time and
        are real, so this is not a sweep: "Personal pension registration" has
        the partner request flow in lib/api/lifestyle.ts (PartnerServiceKind
        'pension'), and "Creator equipment access" has the shop and
        /shop/orders behind it. Only this one had nothing.

        Removed rather than annotated, because a tick next to a promise nobody
        can keep is worse than a shorter list. Put it back the moment there is
        something behind it.
      */
    ],
  },
};

/**
 * The allowance sentence, derived from the plan rather than written out.
 *
 * It used to be typed into each plan's `features` AND generated by the
 * onboarding card, so the tier screen showed the same fact twice in two
 * different phrasings ("12 uploads, 2 included, 10 paid" directly above
 * "12 uploads a year - 2 included and 10 paid"). Worse, a hand-written line
 * can drift: the Pro card once advertised Pro MAX's 15 uploads next to Pro's
 * price. Every surface now asks for it here.
 */
export function uploadAllowanceLine(tier: CreatorTier): string {
  const { slots, freeSlots } = PLANS[tier];
  return `${slots} uploads a year, ${freeSlots} included and ${slots - freeSlots} paid`;
}

/** What a plan card lists: the derived allowance first, then the plan's own. */
export function planFeatures(tier: CreatorTier): string[] {
  return [uploadAllowanceLine(tier), ...PLANS[tier].features];
}

/** Cheapest first — the order the pricing page renders. */
export const PLAN_ORDER: CreatorTier[] = ["basic", "pro", "pro_max"];

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
      "6 uploads a year — 1 included and 5 paid",
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
      "12 uploads a year — 2 included and 10 paid",
      "Enhanced creator and professional profile",
      "Priority discovery and opportunities",
      "Open and private communities",
      "Up to 2 training courses",
      "EasyBuy and financing opportunities",
      "Enhanced monetisation tools",
    ],
  },
  pro_max: {
    tier: "pro_max",
    index: "03",
    name: "Pro Max",
    price: 29999,
    headline: "Build your career. Build your business.",
    slots: 12,
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
      "Priority support",
      "Featured and recommended opportunities",
      "Advanced creator monetisation",
      "Creator equipment access",
      "Up to 3 training courses",
      "1 month health insurance",
    ],
  },
};

/** Cheapest first — the order the pricing page renders. */
export const PLAN_ORDER: CreatorTier[] = ["basic", "pro", "pro_max"];

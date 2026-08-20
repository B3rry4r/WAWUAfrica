import type { CreatorTier } from "./account";

/** Creator Subscription lifecycle (docs/01 §1 streams 7-8, docs/02 §2.5). */
export type SubscriptionState = "none" | "active" | "past_due" | "expired";

export interface Plan {
  tier: CreatorTier;
  price: number;
  /** Upload slots included. */
  slots: number;
  /** How many of those are free by rule. */
  freeSlots: number;
  /** Revenue share the creator keeps, percent. */
  split: number;
  features: string[];
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
    price: 5999,
    slots: 6,
    freeSlots: 1,
    split: 85,
    features: [
      "6 uploads, 1 included and 5 paid",
      "Host open communities · 90% on credits",
      "1 course included, business playbook, purple badge",
    ],
  },
  pro: {
    tier: "pro",
    price: 18999,
    slots: 15,
    freeSlots: 2,
    split: 90,
    features: [
      "15 uploads instead of 6",
      "Keep 90% instead of 85%",
      "Private communities and 3 courses included",
    ],
  },
};

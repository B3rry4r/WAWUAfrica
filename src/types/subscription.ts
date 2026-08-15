import type { CreatorTier } from "./account";

/** Creator Subscription lifecycle (docs/02 §2.5). */
export type SubscriptionStatus = "active" | "past_due" | "cancelled" | "expired";

export interface CreatorSubscription {
  creatorWawuId: string;
  tier: CreatorTier;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
  /** 0.10 while tier is pro and active; read by purchase logic, not client copy. */
  commissionRateOverride?: number | null;
}

/** Locked yearly prices (docs/01 §1, streams 7–8). */
export const CREATOR_TIER_PRICES: Record<CreatorTier, number> = {
  basic: 5999,
  pro: 18999,
};

export const TIER_PERKS: Record<CreatorTier, string[]> = {
  basic: [
    "3 content uploads (1 free, 2 paid)",
    "Unlimited messages in open communities",
    "1 free selected course",
    "Free business playbook",
    "Personal pension registration",
    "Purple badge",
  ],
  pro: [
    "7 content uploads (2 free, 5 paid)",
    "Host private communities",
    "Gold badge",
    "Up to 3 free courses of your choice",
    "Priority admin support",
    "1 month free health insurance",
    "Personal pension registration",
    "Recommended Deals",
    "90/10 revenue split instead of 85/15",
  ],
};
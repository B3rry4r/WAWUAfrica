import { PLANS } from "@/types/subscription";
import type { Subscription } from "@/types/subscription";
import type { KycStatus, CreatorTier } from "@/types/account";
import { mockRequest } from "./client";

/** Basic ₦5,999/yr, Pro ₦18,999/yr. Yearly, paid up front. */
export const currentSubscription: Subscription = {
  plan: { tier: "pro", price: 18999, slots: 7, freeSlots: 2, split: 90, features: [] },
  state: "active",
  renewsAt: "2027-08-14T00:00:00.000Z",
};

export interface SubscriptionApi {
  getSubscription: () => Promise<Subscription>;
  /** First-time creator onboarding: pay for the chosen tier, Basic or Pro. */
  subscribe: (tier: CreatorTier) => Promise<Subscription>;
  upgradeToPro: () => Promise<Subscription>;
  /** Starts (or restarts, after expiry) the Basic tier at full price — no proration. */
  downgradeToBasic: () => Promise<Subscription>;
  /** Retries payment on the CURRENT tier — a past-due recovery, not an upgrade. */
  retryPayment: () => Promise<Subscription>;
  cancelPro: () => Promise<Subscription>;
  /** Swaps the card on file. No payment processor is wired up yet — this is a UI-only mock. */
  updateCard: (last4: string) => Promise<{ last4: string }>;
  getKycGate: () => Promise<KycStatus>;
}

export const subscriptionApi: SubscriptionApi = {
  // SEAM: replace with GET /api/hub/creator-subscription
  getSubscription: () => mockRequest({ ...currentSubscription }),

  subscribe: async (tier) => {
    currentSubscription.plan = { ...PLANS[tier] };
    currentSubscription.state = "active";
    // SEAM: replace with POST /api/hub/creator-subscription (tier=basic|pro)
    return mockRequest({ ...currentSubscription }, 700);
  },

  upgradeToPro: async () => {
    currentSubscription.plan = { ...PLANS.pro };
    currentSubscription.state = "active";
    currentSubscription.cancelsAt = undefined;
    // SEAM: replace with POST /api/hub/creator-subscription (tier=pro)
    return mockRequest({ ...currentSubscription }, 700);
  },

  downgradeToBasic: async () => {
    currentSubscription.plan = { ...PLANS.basic };
    currentSubscription.state = "active";
    currentSubscription.cancelsAt = undefined;
    // SEAM: replace with POST /api/hub/creator-subscription (tier=basic)
    return mockRequest({ ...currentSubscription }, 700);
  },

  retryPayment: async () => {
    currentSubscription.state = "active";
    // SEAM: replace with POST /api/hub/creator-subscription/retry
    return mockRequest({ ...currentSubscription }, 700);
  },

  cancelPro: async () => {
    currentSubscription.state = "active";
    currentSubscription.cancelsAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString();
    // SEAM: replace with DELETE /api/hub/creator-subscription
    return mockRequest({ ...currentSubscription }, 700);
  },

  updateCard: async (last4: string) => {
    // SEAM: replace with POST /api/hub/creator-subscription/card
    return mockRequest({ last4 }, 500);
  },

  // SEAM: replace with GET /api/hub/creator/kyc/status
  getKycGate: () => mockRequest("pending"),
};
